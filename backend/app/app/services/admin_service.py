"""
Vexel Admin Service
Provides administrative functions for user tier management, usage monitoring, and system administration
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum

from app.models.user import User, UserTier
from app.services.performance_monitor import performance_monitor
from app.core.config import settings

logger = logging.getLogger(__name__)


class AdminAction(str, Enum):
    """Admin action types for audit logging"""
    TIER_UPGRADE = "tier_upgrade"
    TIER_DOWNGRADE = "tier_downgrade"
    USAGE_RESET = "usage_reset"
    FEATURE_TOGGLE = "feature_toggle"
    SYSTEM_MAINTENANCE = "system_maintenance"


class VexelAdminService:
    """
    Service for administrative functions and user management
    """
    
    def __init__(self):
        """Initialize the admin service"""
        self.audit_log: List[Dict[str, Any]] = []
    
    def get_user_tier_summary(self) -> Dict[str, Any]:
        """Get summary of users by tier"""
        # In a real implementation, this would query the database
        # For now, return mock data structure
        return {
            "tier_distribution": {
                "free": {"count": 0, "percentage": 0.0},
                "premium": {"count": 0, "percentage": 0.0},
                "enterprise": {"count": 0, "percentage": 0.0}
            },
            "total_users": 0,
            "active_users_30d": 0,
            "new_users_7d": 0
        }
    
    def get_usage_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get usage analytics for the specified period"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get performance data
        performance_data = performance_monitor.get_performance_summary(time_window_hours=days * 24)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "upload_statistics": {
                "total_uploads": performance_data.get("total_operations", 0),
                "successful_uploads": performance_data.get("total_operations", 0) - 
                                    int(performance_data.get("error_rate", 0) * performance_data.get("total_operations", 0)),
                "failed_uploads": int(performance_data.get("error_rate", 0) * performance_data.get("total_operations", 0)),
                "average_file_size_mb": 2.5,  # Mock data
                "total_storage_gb": 150.0  # Mock data
            },
            "chunking_analytics": {
                "strategy_usage": {
                    "fixed": 30,
                    "recursive": 45,
                    "semantic": 20,
                    "agentic": 5
                },
                "average_processing_time": performance_data.get("processing_time", {}).get("mean", 0),
                "average_chunks_per_document": performance_data.get("chunk_count", {}).get("mean", 0)
            },
            "tier_usage": performance_monitor.get_user_tier_analysis(),
            "performance_metrics": performance_data
        }
    
    def upgrade_user_tier(self, user_id: str, new_tier: UserTier, admin_id: str, reason: str = "") -> Dict[str, Any]:
        """Upgrade user to a higher tier"""
        try:
            # In a real implementation, this would:
            # 1. Fetch user from database
            # 2. Validate tier upgrade is valid
            # 3. Update user tier and related fields
            # 4. Log the action
            
            action_log = {
                "action": AdminAction.TIER_UPGRADE,
                "user_id": user_id,
                "admin_id": admin_id,
                "old_tier": "free",  # Would fetch from database
                "new_tier": new_tier,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.audit_log.append(action_log)
            
            logger.info(f"User {user_id} upgraded to {new_tier} by admin {admin_id}")
            
            return {
                "success": True,
                "message": f"User upgraded to {new_tier} successfully",
                "action_log": action_log
            }
            
        except Exception as e:
            logger.error(f"Failed to upgrade user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def downgrade_user_tier(self, user_id: str, new_tier: UserTier, admin_id: str, reason: str = "") -> Dict[str, Any]:
        """Downgrade user to a lower tier"""
        try:
            # Similar to upgrade but with validation for downgrade
            action_log = {
                "action": AdminAction.TIER_DOWNGRADE,
                "user_id": user_id,
                "admin_id": admin_id,
                "old_tier": "premium",  # Would fetch from database
                "new_tier": new_tier,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.audit_log.append(action_log)
            
            logger.info(f"User {user_id} downgraded to {new_tier} by admin {admin_id}")
            
            return {
                "success": True,
                "message": f"User downgraded to {new_tier} successfully",
                "action_log": action_log,
                "warnings": [
                    "User may lose access to premium features",
                    "Existing documents will retain their chunking strategy"
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to downgrade user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def reset_user_usage(self, user_id: str, admin_id: str, reset_type: str = "monthly") -> Dict[str, Any]:
        """Reset user usage counters"""
        try:
            # In a real implementation, this would update the database
            action_log = {
                "action": AdminAction.USAGE_RESET,
                "user_id": user_id,
                "admin_id": admin_id,
                "reset_type": reset_type,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.audit_log.append(action_log)
            
            logger.info(f"User {user_id} usage reset ({reset_type}) by admin {admin_id}")
            
            return {
                "success": True,
                "message": f"User {reset_type} usage reset successfully",
                "action_log": action_log
            }
            
        except Exception as e:
            logger.error(f"Failed to reset usage for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def toggle_feature_access(self, user_id: str, feature: str, enabled: bool, admin_id: str) -> Dict[str, Any]:
        """Toggle specific feature access for a user"""
        try:
            valid_features = [
                "advanced_chunking_enabled",
                "parallel_processing_enabled", 
                "analytics_enabled"
            ]
            
            if feature not in valid_features:
                return {
                    "success": False,
                    "error": f"Invalid feature. Valid features: {valid_features}"
                }
            
            action_log = {
                "action": AdminAction.FEATURE_TOGGLE,
                "user_id": user_id,
                "admin_id": admin_id,
                "feature": feature,
                "enabled": enabled,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.audit_log.append(action_log)
            
            logger.info(f"Feature {feature} {'enabled' if enabled else 'disabled'} for user {user_id} by admin {admin_id}")
            
            return {
                "success": True,
                "message": f"Feature {feature} {'enabled' if enabled else 'disabled'} successfully",
                "action_log": action_log
            }
            
        except Exception as e:
            logger.error(f"Failed to toggle feature {feature} for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get system health and performance metrics"""
        try:
            # Get performance insights
            insights = performance_monitor.generate_insights()
            
            # Get recent performance data
            recent_performance = performance_monitor.get_performance_summary(time_window_hours=24)
            
            # Calculate health score
            health_score = self._calculate_health_score(recent_performance)
            
            return {
                "health_score": health_score,
                "status": self._get_health_status(health_score),
                "performance_summary": recent_performance,
                "recent_insights": [
                    {
                        "type": insight.insight_type,
                        "title": insight.title,
                        "description": insight.description,
                        "impact_level": insight.impact_level,
                        "confidence": insight.confidence
                    }
                    for insight in insights[-5:]  # Last 5 insights
                ],
                "system_metrics": {
                    "total_metrics_collected": len(performance_monitor.metrics),
                    "error_rate_24h": recent_performance.get("error_rate", 0),
                    "average_processing_time": recent_performance.get("processing_time", {}).get("mean", 0),
                    "throughput_ops_per_hour": recent_performance.get("throughput", {}).get("operations_per_hour", 0)
                },
                "feature_status": {
                    "semantic_chunking": settings.ENABLE_SEMANTIC_CHUNKING,
                    "agentic_chunking": settings.ENABLE_AGENTIC_CHUNKING,
                    "performance_monitoring": settings.ENABLE_PERFORMANCE_MONITORING,
                    "content_analysis": settings.ENABLE_CONTENT_ANALYSIS
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get system health: {str(e)}")
            return {
                "health_score": 0.0,
                "status": "error",
                "error": str(e)
            }
    
    def _calculate_health_score(self, performance_data: Dict[str, Any]) -> float:
        """Calculate system health score based on performance metrics"""
        try:
            # Base score
            score = 100.0
            
            # Deduct for high error rate
            error_rate = performance_data.get("error_rate", 0)
            if error_rate > 0.05:  # More than 5% error rate
                score -= min(50, error_rate * 1000)  # Max 50 point deduction
            
            # Deduct for slow processing
            avg_processing_time = performance_data.get("processing_time", {}).get("mean", 0)
            if avg_processing_time > 10:  # More than 10 seconds
                score -= min(30, (avg_processing_time - 10) * 2)  # Max 30 point deduction
            
            # Deduct for low throughput
            throughput = performance_data.get("throughput", {}).get("operations_per_hour", 0)
            if throughput < 10:  # Less than 10 operations per hour
                score -= 20
            
            return max(0.0, min(100.0, score))
            
        except Exception:
            return 50.0  # Default moderate health score
    
    def _get_health_status(self, health_score: float) -> str:
        """Get health status based on score"""
        if health_score >= 90:
            return "excellent"
        elif health_score >= 75:
            return "good"
        elif health_score >= 50:
            return "fair"
        elif health_score >= 25:
            return "poor"
        else:
            return "critical"
    
    def get_audit_log(self, limit: int = 100, action_type: Optional[AdminAction] = None) -> List[Dict[str, Any]]:
        """Get audit log of admin actions"""
        logs = self.audit_log
        
        if action_type:
            logs = [log for log in logs if log.get("action") == action_type]
        
        # Sort by timestamp (most recent first)
        logs = sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return logs[:limit]
    
    def generate_usage_report(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate comprehensive usage report for a date range"""
        try:
            days = (end_date - start_date).days
            usage_data = self.get_usage_analytics(days)
            
            report = {
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "duration_days": days
                },
                "executive_summary": {
                    "total_uploads": usage_data["upload_statistics"]["total_uploads"],
                    "success_rate": (usage_data["upload_statistics"]["successful_uploads"] / 
                                   max(usage_data["upload_statistics"]["total_uploads"], 1)) * 100,
                    "average_processing_time": usage_data["chunking_analytics"]["average_processing_time"],
                    "most_popular_strategy": max(
                        usage_data["chunking_analytics"]["strategy_usage"].items(),
                        key=lambda x: x[1]
                    )[0] if usage_data["chunking_analytics"]["strategy_usage"] else "N/A"
                },
                "detailed_analytics": usage_data,
                "recommendations": self._generate_recommendations(usage_data),
                "generated_at": datetime.utcnow().isoformat()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate usage report: {str(e)}")
            return {
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat()
            }
    
    def _generate_recommendations(self, usage_data: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on usage data"""
        recommendations = []
        
        # Check error rate
        upload_stats = usage_data.get("upload_statistics", {})
        total_uploads = upload_stats.get("total_uploads", 0)
        failed_uploads = upload_stats.get("failed_uploads", 0)
        
        if total_uploads > 0:
            error_rate = failed_uploads / total_uploads
            if error_rate > 0.05:
                recommendations.append(
                    f"High error rate detected ({error_rate:.1%}). Consider investigating common failure causes."
                )
        
        # Check processing time
        avg_processing_time = usage_data.get("chunking_analytics", {}).get("average_processing_time", 0)
        if avg_processing_time > 10:
            recommendations.append(
                f"Average processing time is high ({avg_processing_time:.1f}s). Consider optimizing chunking strategies."
            )
        
        # Check strategy distribution
        strategy_usage = usage_data.get("chunking_analytics", {}).get("strategy_usage", {})
        if strategy_usage:
            total_strategy_usage = sum(strategy_usage.values())
            fixed_percentage = (strategy_usage.get("fixed", 0) / total_strategy_usage) * 100
            
            if fixed_percentage > 70:
                recommendations.append(
                    "High usage of fixed chunking strategy. Consider promoting advanced strategies to improve performance."
                )
        
        if not recommendations:
            recommendations.append("System performance is within normal parameters.")
        
        return recommendations


# Global instance
admin_service = VexelAdminService()


def get_admin_dashboard() -> Dict[str, Any]:
    """Get comprehensive admin dashboard data"""
    return {
        "user_summary": admin_service.get_user_tier_summary(),
        "usage_analytics": admin_service.get_usage_analytics(30),
        "system_health": admin_service.get_system_health(),
        "recent_actions": admin_service.get_audit_log(20),
        "generated_at": datetime.utcnow().isoformat()
    }
