import socketio
import asyncio
from app.config import settings
from app.utils import logger

# Global session tracking for AI-Service
_active_sessions = {}

class SocketManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SocketManager, cls).__new__(cls)
            cls._instance.sio = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=0, # Infinite reconnection
                reconnection_delay=1,
                reconnection_delay_max=5
            )
            cls._instance.is_connected = False
            cls._instance._setup_handlers()
        return cls._instance

    def _setup_handlers(self):
        @self.sio.event
        async def connect():
            self.is_connected = True
            logger.info(f"Connected to CRUD Backend Socket at {settings.SOCKET_URL}")

        @self.sio.event
        async def disconnect():
            self.is_connected = False
            logger.warning("Disconnected from CRUD Backend Socket")

        @self.sio.event
        async def connect_error(data):
            logger.error(f"Socket connection error: {data}")
        
        @self.sio.event
        async def session_started(data):
            """Handle new session from backend - critical for AI-Service to start monitoring."""
            try:
                session_id = data.get('session', {}).get('_id')
                driver_id = data.get('session', {}).get('driverId')
                session_data = data.get('session', {})
                
                if not session_id:
                    logger.error(f"⚠️ session_started event missing session._id: {data}")
                    return
                
                # Track active session
                _active_sessions[session_id] = {
                    'driver_id': driver_id,
                    'session_data': session_data,
                    'started_at': data.get('timestamp')
                }
                
                logger.info(f"✅ AI-Service learned of new session: {session_id} for driver {driver_id}")
                logger.info(f"   Session data: {session_data}")
                logger.info(f"   Active sessions now tracking: {list(_active_sessions.keys())}")
            except Exception as e:
                logger.error(f"❌ Error handling session_started event: {e}")
        
        @self.sio.event
        async def session_ended(data):
            """Handle session end - clean up tracking."""
            try:
                session_id = data.get('session', {}).get('_id')
                if session_id and session_id in _active_sessions:
                    logger.info(f"🛑 Session ended: {session_id}")
                    del _active_sessions[session_id]
            except Exception as e:
                logger.error(f"❌ Error handling session_ended event: {e}")

    async def connect(self):
        if not self.is_connected:
            try:
                # Use SOCKET_URL from settings
                url = getattr(settings, 'SOCKET_URL', 'http://localhost:5000')
                await self.sio.connect(url, wait_timeout=10)
            except Exception as e:
                logger.error(f"Could not connect to Socket server: {e}")

    async def emit_alert(self, alert_data: dict):
        """
        Emits a safety alert to the CRUD backend.
        """
        if not self.is_connected:
            # Try to connect if not connected
            await self.connect()
            
        if self.is_connected:
            try:
                await self.sio.emit('report_alert', alert_data)
                logger.info(f"Alert emitted via Socket: {alert_data.get('type')}:{alert_data.get('subtype')}")
            except Exception as e:
                logger.error(f"Error emitting socket alert: {e}")
        else:
            logger.warning("Socket not connected, could not emit alert.")
    
    def get_active_sessions(self):
        """Returns dict of currently tracked active sessions."""
        return _active_sessions.copy()
    
    def is_session_active(self, session_id: str) -> bool:
        """Check if a session is currently active."""
        return session_id in _active_sessions

socket_manager = SocketManager()
