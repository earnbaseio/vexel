"""
Vexel Performance Monitoring Service
Tracks chunking performance metrics and provides optimization insights
"""

import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

logger = logging.getLogger(__name__)


class MetricType(str, Enum):
    """Types of performance metrics"""
    PROCESSING_TIME = "processing_time"
    CHUNK_COUNT = "chunk_count"
    CHUNK_SIZE = "chunk_size"
    MEMORY_USAGE = "memory_usage"
    ERROR_RATE = "error_rate"
    USER_SATISFACTION = "user_satisfaction"


@dataclass
class PerformanceMetric:
    """Individual performance metric"""
    metric_type: MetricType
    value: float
    timestamp: datetime
    file_type: str
    chunking_strategy: str
    user_tier: str
    file_size_bytes: int
    chunk_count: int
    metadata: Dict[str, Any]


@dataclass
class PerformanceInsight:
    """Performance insight and recommendation"""
    insight_type: str
    title: str
    description: str
    recommendation: str
    confidence: float
    impact_level: str  # "low", "medium", "high"
    data_points: int
    created_at: datetime


class VexelPerformanceMonitor:
    """
    Service for monitoring and analyzing chunking performance
    """
    
    def __init__(self):
        """Initialize the performance monitor"""
        self.metrics: List[PerformanceMetric] = []
        self.insights: List[PerformanceInsight] = []
        self.max_metrics = 10000  # Keep last 10k metrics in memory
    
    def record_processing_metric(
        self,
        processing_time: float,
        file_type: str,
        chunking_strategy: str,
        user_tier: str,
        file_size_bytes: int,
        chunk_count: int,
        success: bool = True,
        additional_metadata: Optional[Dict[str, Any]] = None
    ):
        """Record a processing performance metric"""
        
        metadata = additional_metadata or {}
        metadata.update({
            "success": success,
            "processing_speed_bytes_per_second": file_size_bytes / max(processing_time, 0.001)
        })
        
        # Record processing time
        self._add_metric(
            MetricType.PROCESSING_TIME,
            processing_time,
            file_type,
            chunking_strategy,
            user_tier,
            file_size_bytes,
            chunk_count,
            metadata
        )
        
        # Record chunk count
        self._add_metric(
            MetricType.CHUNK_COUNT,
            chunk_count,
            file_type,
            chunking_strategy,
            user_tier,
            file_size_bytes,
            chunk_count,
            metadata
        )
        
        # Record average chunk size
        avg_chunk_size = file_size_bytes / max(chunk_count, 1)
        self._add_metric(
            MetricType.CHUNK_SIZE,
            avg_chunk_size,
            file_type,
            chunking_strategy,
            user_tier,
            file_size_bytes,
            chunk_count,
            metadata
        )
        
        # Record error if processing failed
        if not success:
            self._add_metric(
                MetricType.ERROR_RATE,
                1.0,
                file_type,
                chunking_strategy,
                user_tier,
                file_size_bytes,
                chunk_count,
                metadata
            )
    
    def _add_metric(
        self,
        metric_type: MetricType,
        value: float,
        file_type: str,
        chunking_strategy: str,
        user_tier: str,
        file_size_bytes: int,
        chunk_count: int,
        metadata: Dict[str, Any]
    ):
        """Add a metric to the collection"""
        metric = PerformanceMetric(
            metric_type=metric_type,
            value=value,
            timestamp=datetime.utcnow(),
            file_type=file_type,
            chunking_strategy=chunking_strategy,
            user_tier=user_tier,
            file_size_bytes=file_size_bytes,
            chunk_count=chunk_count,
            metadata=metadata
        )
        
        self.metrics.append(metric)
        
        # Keep only recent metrics
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics:]
    
    def get_performance_summary(
        self,
        time_window_hours: int = 24,
        file_type: Optional[str] = None,
        chunking_strategy: Optional[str] = None,
        user_tier: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get performance summary for specified criteria"""
        
        # Filter metrics by time window and criteria
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        filtered_metrics = [
            m for m in self.metrics 
            if m.timestamp >= cutoff_time
        ]
        
        if file_type:
            filtered_metrics = [m for m in filtered_metrics if m.file_type == file_type]
        if chunking_strategy:
            filtered_metrics = [m for m in filtered_metrics if m.chunking_strategy == chunking_strategy]
        if user_tier:
            filtered_metrics = [m for m in filtered_metrics if m.user_tier == user_tier]
        
        if not filtered_metrics:
            return {"message": "No metrics found for specified criteria"}
        
        # Calculate summary statistics
        processing_times = [m.value for m in filtered_metrics if m.metric_type == MetricType.PROCESSING_TIME]
        chunk_counts = [m.value for m in filtered_metrics if m.metric_type == MetricType.CHUNK_COUNT]
        chunk_sizes = [m.value for m in filtered_metrics if m.metric_type == MetricType.CHUNK_SIZE]
        error_count = len([m for m in filtered_metrics if m.metric_type == MetricType.ERROR_RATE])
        
        summary = {
            "time_window_hours": time_window_hours,
            "total_operations": len(processing_times),
            "filters": {
                "file_type": file_type,
                "chunking_strategy": chunking_strategy,
                "user_tier": user_tier
            },
            "processing_time": self._calculate_stats(processing_times, "seconds"),
            "chunk_count": self._calculate_stats(chunk_counts, "chunks"),
            "chunk_size": self._calculate_stats(chunk_sizes, "bytes"),
            "error_rate": error_count / max(len(processing_times), 1),
            "throughput": {
                "operations_per_hour": len(processing_times) / max(time_window_hours, 1),
                "avg_bytes_per_second": statistics.mean([
                    m.metadata.get("processing_speed_bytes_per_second", 0) 
                    for m in filtered_metrics 
                    if m.metric_type == MetricType.PROCESSING_TIME
                ]) if processing_times else 0
            }
        }
        
        return summary
    
    def _calculate_stats(self, values: List[float], unit: str) -> Dict[str, Any]:
        """Calculate statistical summary for a list of values"""
        if not values:
            return {"count": 0, "unit": unit}
        
        return {
            "count": len(values),
            "mean": round(statistics.mean(values), 3),
            "median": round(statistics.median(values), 3),
            "min": round(min(values), 3),
            "max": round(max(values), 3),
            "std_dev": round(statistics.stdev(values), 3) if len(values) > 1 else 0,
            "unit": unit
        }
    
    def get_strategy_comparison(self, file_type: Optional[str] = None) -> Dict[str, Any]:
        """Compare performance across different chunking strategies"""
        
        # Filter by file type if specified
        metrics = self.metrics
        if file_type:
            metrics = [m for m in metrics if m.file_type == file_type]
        
        # Group by strategy
        strategy_metrics = {}
        for metric in metrics:
            if metric.metric_type == MetricType.PROCESSING_TIME:
                strategy = metric.chunking_strategy
                if strategy not in strategy_metrics:
                    strategy_metrics[strategy] = []
                strategy_metrics[strategy].append(metric)
        
        # Calculate comparison
        comparison = {}
        for strategy, strategy_metrics_list in strategy_metrics.items():
            processing_times = [m.value for m in strategy_metrics_list]
            file_sizes = [m.file_size_bytes for m in strategy_metrics_list]
            chunk_counts = [m.chunk_count for m in strategy_metrics_list]
            
            if processing_times:
                comparison[strategy] = {
                    "operations": len(processing_times),
                    "avg_processing_time": round(statistics.mean(processing_times), 3),
                    "avg_file_size_mb": round(statistics.mean(file_sizes) / (1024 * 1024), 2),
                    "avg_chunks": round(statistics.mean(chunk_counts), 1),
                    "efficiency_score": self._calculate_efficiency_score(
                        processing_times, file_sizes, chunk_counts
                    )
                }
        
        return {
            "file_type": file_type or "all",
            "strategies": comparison,
            "best_strategy": max(comparison.keys(), key=lambda k: comparison[k]["efficiency_score"]) if comparison else None
        }
    
    def _calculate_efficiency_score(
        self, 
        processing_times: List[float], 
        file_sizes: List[int], 
        chunk_counts: List[int]
    ) -> float:
        """Calculate efficiency score for a strategy (higher is better)"""
        if not processing_times:
            return 0.0
        
        # Normalize metrics (lower processing time is better, reasonable chunk count is better)
        avg_time = statistics.mean(processing_times)
        avg_size = statistics.mean(file_sizes)
        avg_chunks = statistics.mean(chunk_counts)
        
        # Calculate throughput (bytes per second)
        throughput = avg_size / max(avg_time, 0.001)
        
        # Penalize extremely high or low chunk counts
        chunk_penalty = 1.0
        if avg_chunks < 1:
            chunk_penalty = 0.5
        elif avg_chunks > 100:
            chunk_penalty = 0.8
        
        # Efficiency score (higher is better)
        efficiency = (throughput / 1000000) * chunk_penalty  # Normalize to MB/s
        
        return round(efficiency, 3)
    
    def generate_insights(self) -> List[PerformanceInsight]:
        """Generate performance insights and recommendations"""
        insights = []
        
        # Insight 1: Strategy performance comparison
        strategy_comparison = self.get_strategy_comparison()
        if strategy_comparison["strategies"]:
            best_strategy = strategy_comparison["best_strategy"]
            worst_strategies = sorted(
                strategy_comparison["strategies"].items(),
                key=lambda x: x[1]["efficiency_score"]
            )[:2]
            
            if len(worst_strategies) > 0 and best_strategy:
                insights.append(PerformanceInsight(
                    insight_type="strategy_optimization",
                    title="Chunking Strategy Performance",
                    description=f"Strategy '{best_strategy}' shows best performance with efficiency score "
                               f"{strategy_comparison['strategies'][best_strategy]['efficiency_score']}",
                    recommendation=f"Consider using '{best_strategy}' strategy for better performance",
                    confidence=0.8,
                    impact_level="medium",
                    data_points=len(self.metrics),
                    created_at=datetime.utcnow()
                ))
        
        # Insight 2: Processing time trends
        recent_metrics = [
            m for m in self.metrics 
            if m.metric_type == MetricType.PROCESSING_TIME and 
               m.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ]
        
        if len(recent_metrics) > 10:
            processing_times = [m.value for m in recent_metrics]
            avg_time = statistics.mean(processing_times)
            
            if avg_time > 10:  # More than 10 seconds average
                insights.append(PerformanceInsight(
                    insight_type="performance_warning",
                    title="High Processing Times Detected",
                    description=f"Average processing time is {avg_time:.2f} seconds",
                    recommendation="Consider optimizing chunk sizes or using faster strategies for large files",
                    confidence=0.9,
                    impact_level="high",
                    data_points=len(recent_metrics),
                    created_at=datetime.utcnow()
                ))
        
        # Insight 3: Error rate analysis
        error_metrics = [
            m for m in self.metrics 
            if m.metric_type == MetricType.ERROR_RATE and 
               m.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ]
        
        if error_metrics:
            error_rate = len(error_metrics) / max(len(recent_metrics), 1)
            if error_rate > 0.05:  # More than 5% error rate
                insights.append(PerformanceInsight(
                    insight_type="reliability_warning",
                    title="High Error Rate Detected",
                    description=f"Error rate is {error_rate:.1%} in the last 24 hours",
                    recommendation="Review error logs and consider fallback strategies",
                    confidence=0.95,
                    impact_level="high",
                    data_points=len(error_metrics),
                    created_at=datetime.utcnow()
                ))
        
        self.insights.extend(insights)
        return insights
    
    def get_user_tier_analysis(self) -> Dict[str, Any]:
        """Analyze performance by user tier"""
        tier_metrics = {}
        
        for metric in self.metrics:
            if metric.metric_type == MetricType.PROCESSING_TIME:
                tier = metric.user_tier
                if tier not in tier_metrics:
                    tier_metrics[tier] = []
                tier_metrics[tier].append(metric)
        
        analysis = {}
        for tier, metrics in tier_metrics.items():
            processing_times = [m.value for m in metrics]
            strategies_used = list(set(m.chunking_strategy for m in metrics))
            
            analysis[tier] = {
                "operations": len(metrics),
                "avg_processing_time": round(statistics.mean(processing_times), 3) if processing_times else 0,
                "strategies_used": strategies_used,
                "most_common_strategy": max(
                    set(m.chunking_strategy for m in metrics),
                    key=lambda x: sum(1 for m in metrics if m.chunking_strategy == x)
                ) if metrics else None
            }
        
        return analysis


# Global instance for use across the application
performance_monitor = VexelPerformanceMonitor()


def record_processing_performance(
    processing_time: float,
    file_type: str,
    chunking_strategy: str,
    user_tier: str,
    file_size_bytes: int,
    chunk_count: int,
    success: bool = True,
    additional_metadata: Optional[Dict[str, Any]] = None
):
    """Convenience function to record processing performance"""
    performance_monitor.record_processing_metric(
        processing_time=processing_time,
        file_type=file_type,
        chunking_strategy=chunking_strategy,
        user_tier=user_tier,
        file_size_bytes=file_size_bytes,
        chunk_count=chunk_count,
        success=success,
        additional_metadata=additional_metadata
    )


def get_performance_dashboard() -> Dict[str, Any]:
    """Get comprehensive performance dashboard data"""
    return {
        "summary_24h": performance_monitor.get_performance_summary(24),
        "summary_7d": performance_monitor.get_performance_summary(168),  # 7 days
        "strategy_comparison": performance_monitor.get_strategy_comparison(),
        "user_tier_analysis": performance_monitor.get_user_tier_analysis(),
        "recent_insights": performance_monitor.generate_insights()[-5:],  # Last 5 insights
        "total_metrics": len(performance_monitor.metrics)
    }
