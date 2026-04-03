import socketio
import asyncio
from app.config import settings
from app.utils import logger

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

socket_manager = SocketManager()
