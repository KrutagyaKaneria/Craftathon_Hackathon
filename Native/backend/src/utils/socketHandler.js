import { Server } from 'socket.io';
import jsonwebtoken from 'jsonwebtoken';
import { Session } from '../models/Session.js';

const getJWTSecret = () => {
  return process.env.JWT_SECRET || 'your_very_secure_jwt_secret_key_here_change_in_production';
};

export let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:8081',
        'http://localhost:3000',
        'exp://localhost:8081',
        '*'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log('🔌 Socket.io initialized');

  io.on('connection', (socket) => {
    console.log('🤝 New client connected:', socket.id);

    // Authentication for Owners (Mobile App)
    socket.on('authenticate', (token) => {
      try {
        if (!token) {
          return socket.emit('error', { message: 'No token provided' });
        }

        const JWT_SECRET = getJWTSecret();
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        
        const ownerId = decoded.ownerId;
        socket.join(`owner:${ownerId}`);
        socket.ownerId = ownerId;
        
        console.log(`👤 Owner authenticated via Token: ${ownerId} (Socket: ${socket.id})`);
        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('❌ Socket auth failed:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Unauthenticated join for web-app demo
    socket.on('join_owner_room', (ownerId) => {
      if (!ownerId) return;
      socket.join(`owner:${ownerId}`);
      console.log(`👤 Web-App joined room: owner:${ownerId} (Socket: ${socket.id})`);
      socket.emit('joined_room', { ownerId });
    });

    // Alert reporting from AI Service (internal connection - no auth required as per user)
    socket.on('report_alert', async (data) => {
      try {
        const { session_id, type, subtype, severity, metrics, timestamp } = data;
        
        if (!session_id) {
          return console.error('❌ Alert missing session_id');
        }

        console.log(`🔔 Received alert from AI service for session: ${session_id}`);

        // Find the session to identify the owner
        const session = await Session.findById(session_id);
        if (!session) {
          return console.error(`❌ Session not found for ID: ${session_id}`);
        }

        const ownerId = session.ownerId.toString();
        const alertPayload = {
          type,
          subtype,
          severity,
          metrics,
          timestamp: timestamp || new Date().toISOString(),
          driverName: session.driverName,
          vehicleNumber: session.vehicleNumber,
          sessionId: session_id
        };

        // Emit to the specific owner's room
        console.log(`📣 Forwarding alert to owner room: owner:${ownerId}`);
        io.to(`owner:${ownerId}`).emit('new_alert', alertPayload);

      } catch (error) {
        console.error('❌ Error processing reported alert:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 Client disconnected:', socket.id);
    });
  });

  return io;
};
