"""
AI-Service Memory & Persistence Management
Handles cleanup of alert state, TTL-based data removal, and retry logic
"""

import asyncio
from datetime import datetime, timedelta, timezone
from app.utils import logger

class AlertStateManager:
    """Manages alert state with automatic cleanup and TTL expiration"""
    
    def __init__(self, ttl_hours: int = 24):
        """
        Initialize alert state manager
        
        Args:
            ttl_hours: TTL for alert states (default 24 hours)
        """
        self.state = {}
        self.ttl_seconds = ttl_hours * 3600
        self.cleanup_task = None
        logger.info(f"🔧 AlertStateManager initialized with {ttl_hours}h TTL")
    
    def get_state(self, key: str) -> dict:
        """Get state for a key, returns empty dict if not found"""
        return self.state.get(key, {})
    
    def set_state(self, key: str, value: dict) -> None:
        """Set state for a key, adds timestamp for TTL tracking"""
        # Add/update the timestamp
        value["_state_timestamp"] = datetime.now(timezone.utc).isoformat()
        self.state[key] = value
    
    def remove_state(self, key: str) -> bool:
        """Remove state for a key. Returns True if key existed."""
        if key in self.state:
            del self.state[key]
            logger.info(f"🗑️  Removed alert state: {key}")
            return True
        return False
    
    def cleanup_session_states(self, session_id: str) -> int:
        """
        Remove all alert states for a specific session ID
        
        Args:
            session_id: Session ID to clean up
            
        Returns:
            Number of states removed
        """
        keys_to_remove = [
            key for key in self.state.keys()
            if f":{session_id}:" in key  # Format: driver_id:session_id:event_type:subtype
        ]
        
        for key in keys_to_remove:
            del self.state[key]
        
        if keys_to_remove:
            logger.info(f"🧹 Session cleanup: Removed {len(keys_to_remove)} alert state(s) for session {session_id}")
        
        return len(keys_to_remove)
    
    def cleanup_expired_states(self) -> int:
        """
        Remove all alert states that have exceeded TTL
        
        Returns:
            Number of states removed
        """
        now = datetime.now(timezone.utc)
        ttl_delta = timedelta(seconds=self.ttl_seconds)
        
        expired_keys = []
        for key, value in self.state.items():
            timestamp_str = value.get("_state_timestamp")
            if not timestamp_str:
                continue
            
            try:
                timestamp = datetime.fromisoformat(timestamp_str)
                if now - timestamp > ttl_delta:
                    expired_keys.append(key)
            except (ValueError, TypeError):
                # Invalid timestamp, mark for removal
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.state[key]
        
        if expired_keys:
            logger.info(f"⏳ TTL cleanup: Removed {len(expired_keys)} expired alert state(s)")
            logger.debug(f"   Expired keys: {expired_keys}")
        
        return len(expired_keys)
    
    async def start_cleanup_timer(self, interval_minutes: int = 30):
        """
        Start periodic TTL cleanup task
        
        Args:
            interval_minutes: Run cleanup every N minutes (default 30)
        """
        logger.info(f"⏰ Starting alert state cleanup timer (every {interval_minutes} minutes)")
        
        while True:
            try:
                await asyncio.sleep(interval_minutes * 60)
                
                # Run cleanup
                expired_count = self.cleanup_expired_states()
                current_count = len(self.state)
                
                logger.info(f"📊 Alert state status: {current_count} active, {expired_count} expired removed")
                
            except asyncio.CancelledError:
                logger.info("⏹️  Alert state cleanup timer cancelled")
                break
            except Exception as e:
                logger.error(f"❌ Error in alert state cleanup: {e}")
                await asyncio.sleep(60)  # Brief pause before retry
    
    def get_stats(self) -> dict:
        """Get current statistics about alert states"""
        return {
            "total_states": len(self.state),
            "oldest_state_age_seconds": self._get_oldest_age_seconds(),
            "ttl_seconds": self.ttl_seconds,
            "sample_keys": list(self.state.keys())[:5]  # First 5 for debugging
        }
    
    def _get_oldest_age_seconds(self) -> int:
        """Get age of oldest state in seconds"""
        if not self.state:
            return 0
        
        now = datetime.now(timezone.utc)
        ages = []
        
        for value in self.state.values():
            timestamp_str = value.get("_state_timestamp")
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str)
                    age = (now - timestamp).total_seconds()
                    ages.append(int(age))
                except (ValueError, TypeError):
                    pass
        
        return max(ages) if ages else 0


# Global instance
alert_state_manager = AlertStateManager(ttl_hours=24)


async def cleanup_on_session_end(session_id: str) -> None:
    """
    Called when a session ends to clean up all associated alert states
    
    Args:
        session_id: Session that ended
    """
    removed = alert_state_manager.cleanup_session_states(session_id)
    logger.info(f"🛑 Session {session_id} ended. Cleaned up {removed} alert state(s)")


def get_alert_state(key: str) -> dict:
    """Get current alert state for a key"""
    return alert_state_manager.get_state(key)


def set_alert_state(key: str, value: dict) -> None:
    """Set alert state for a key"""
    alert_state_manager.set_state(key, value)
