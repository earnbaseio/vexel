"""
Performance Monitoring Middleware
Advanced middleware for monitoring and tracking system performance
"""

import time
import logging
from typing import Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.services.performance_monitor import record_processing_performance

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive performance monitoring
    """
    
    def __init__(self, app, enable_detailed_logging: bool = True):
        super().__init__(app)
        self.enable_detailed_logging = enable_detailed_logging
        self.excluded_paths = {
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request and monitor performance"""
        start_time = time.time()
        
        # Skip monitoring for excluded paths
        if any(path in str(request.url.path) for path in self.excluded_paths):
            return await call_next(request)
        
        # Extract request information
        method = request.method
        path = str(request.url.path)
        user_agent = request.headers.get("user-agent", "unknown")
        content_length = request.headers.get("content-length", 0)
        
        try:
            content_length = int(content_length) if content_length else 0
        except (ValueError, TypeError):
            content_length = 0
        
        # Process request
        response = await call_next(request)
        
        # Calculate metrics
        process_time = time.time() - start_time
        status_code = response.status_code
        
        # Add performance headers
        response.headers["X-Process-Time"] = f"{process_time:.3f}"
        response.headers["X-Timestamp"] = str(int(start_time))
        
        # Log performance if enabled
        if settings.ENABLE_PERFORMANCE_MONITORING:
            await self._log_performance(
                method=method,
                path=path,
                status_code=status_code,
                process_time=process_time,
                content_length=content_length,
                user_agent=user_agent,
                request=request
            )
        
        return response
    
    async def _log_performance(
        self,
        method: str,
        path: str,
        status_code: int,
        process_time: float,
        content_length: int,
        user_agent: str,
        request: Request
    ):
        """Log performance metrics"""
        try:
            # Basic performance logging
            if self.enable_detailed_logging:
                logger.info(
                    f"API Performance: {method} {path} - {status_code} - {process_time:.3f}s",
                    extra={
                        "method": method,
                        "path": path,
                        "status_code": status_code,
                        "process_time": process_time,
                        "content_length": content_length,
                        "user_agent": user_agent,
                        "performance_monitoring": True
                    }
                )
            
            # Record specific metrics for knowledge endpoints
            if "/knowledge/" in path:
                await self._record_knowledge_metrics(
                    method, path, status_code, process_time, content_length, request
                )
            
            # Alert on slow requests
            if process_time > settings.PERFORMANCE_ALERT_THRESHOLD:
                logger.warning(
                    f"Slow request detected: {method} {path} took {process_time:.3f}s",
                    extra={
                        "alert_type": "slow_request",
                        "threshold": settings.PERFORMANCE_ALERT_THRESHOLD,
                        "actual_time": process_time
                    }
                )
            
        except Exception as e:
            logger.error(f"Performance logging failed: {str(e)}")
    
    async def _record_knowledge_metrics(
        self,
        method: str,
        path: str,
        status_code: int,
        process_time: float,
        content_length: int,
        request: Request
    ):
        """Record specific metrics for knowledge endpoints"""
        try:
            # Extract user information if available
            user_tier = "unknown"
            user_id = "unknown"
            
            # Try to get user from request state (if authentication middleware sets it)
            if hasattr(request.state, "user"):
                user = request.state.user
                user_tier = getattr(user, "tier", "unknown")
                user_id = str(getattr(user, "id", "unknown"))
            
            # Determine operation type
            operation_type = "unknown"
            if "/upload" in path:
                operation_type = "upload"
            elif "/analyze-content" in path:
                operation_type = "analysis"
            elif "/search" in path:
                operation_type = "search"
            elif "/performance-dashboard" in path:
                operation_type = "dashboard"
            
            # Record metrics for successful operations
            if status_code < 400:
                # For upload operations, we'll get more detailed metrics from the processing
                # For other operations, record basic API performance
                if operation_type != "upload":
                    record_processing_performance(
                        processing_time=process_time,
                        file_type="api_request",
                        chunking_strategy=operation_type,
                        user_tier=str(user_tier),
                        file_size_bytes=content_length,
                        chunk_count=1,
                        success=True,
                        additional_metadata={
                            "method": method,
                            "path": path,
                            "user_id": user_id,
                            "operation_type": operation_type
                        }
                    )
            else:
                # Record failed operations
                record_processing_performance(
                    processing_time=process_time,
                    file_type="api_request",
                    chunking_strategy=operation_type,
                    user_tier=str(user_tier),
                    file_size_bytes=content_length,
                    chunk_count=0,
                    success=False,
                    additional_metadata={
                        "method": method,
                        "path": path,
                        "status_code": status_code,
                        "user_id": user_id,
                        "operation_type": operation_type
                    }
                )
            
        except Exception as e:
            logger.error(f"Knowledge metrics recording failed: {str(e)}")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for request/response logging
    """
    
    def __init__(self, app, log_level: str = "INFO"):
        super().__init__(app)
        self.log_level = getattr(logging, log_level.upper(), logging.INFO)
        self.excluded_paths = {
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response details"""
        # Skip logging for excluded paths
        if any(path in str(request.url.path) for path in self.excluded_paths):
            return await call_next(request)
        
        # Log request
        logger.log(
            self.log_level,
            f"Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown"),
                "request_logging": True
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        logger.log(
            self.log_level,
            f"Response: {request.method} {request.url.path} - {response.status_code}",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "response_logging": True
            }
        )
        
        return response


# Utility functions for manual performance tracking
def track_operation_start() -> float:
    """Start tracking an operation"""
    return time.time()


def track_operation_end(
    start_time: float,
    operation_name: str,
    success: bool = True,
    metadata: Dict[str, Any] = None
) -> float:
    """End tracking an operation and log performance"""
    end_time = time.time()
    duration = end_time - start_time
    
    try:
        logger.info(
            f"Operation {operation_name} completed in {duration:.3f}s",
            extra={
                "operation": operation_name,
                "duration": duration,
                "success": success,
                "metadata": metadata or {},
                "operation_tracking": True
            }
        )
        
        # Alert on slow operations
        if duration > settings.PERFORMANCE_ALERT_THRESHOLD:
            logger.warning(
                f"Slow operation: {operation_name} took {duration:.3f}s",
                extra={
                    "alert_type": "slow_operation",
                    "operation": operation_name,
                    "threshold": settings.PERFORMANCE_ALERT_THRESHOLD,
                    "actual_time": duration
                }
            )
    
    except Exception as e:
        logger.error(f"Operation tracking failed: {str(e)}")
    
    return duration
