import { Server } from 'socket.io';
import jsonwebtoken from 'jsonwebtoken';
import { Session } from '../models/Session.js';

const getJWTSecret = () => {
  return process.env.JWT_SECRET || 'your_very_secure_jwt_secret_key_here_change_in_production';
};

// Alert priority mapping for consistent severity levels
const ALERT_PRIORITY = {
  'drowsy': 'high',
  'yawning': 'high',
  'hard_braking': 'high',
  'hard_acceleration': 'medium',
  'sharp_turn': 'medium',
  'distracted': 'medium',
  'speeding': 'high',
  'no_face': 'medium',
  'default': 'low'
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
        let decoded;
        
        // Try to verify as JWT first, if fails treat as ownerId directly
        try {
          decoded = jsonwebtoken.verify(token, JWT_SECRET);
        } catch (e) {
          // If JWT verification fails, treat token as ownerId (for web-app demo)
          decoded = { ownerId: token };
        }
        
        const ownerId = decoded.ownerId || decoded.id || token;
        socket.join(`owner:${ownerId}`);
        socket.ownerId = ownerId;
        
        console.log(`👤 Owner authenticated: ${ownerId} (Socket: ${socket.id}) joined room owner:${ownerId}`);
        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('❌ Socket auth failed:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Receive telemetry/sensor data from web app
    socket.on('telemetry_data', (data) => {
      try {
        const { driver_id, session_id, timestamp, metrics } = data;
        
        console.log(`📊 Received telemetry from driver ${driver_id}:`, {
          acceleration: metrics.acceleration,
          brake: metrics.brake,
          steering: metrics.steering,
          speed: metrics.speed
        });

        // Optionally store telemetry in database for later analysis
        // For now, just forward to owner if needed
      } catch (error) {
        console.error('❌ Error processing telemetry:', error.message);
      }
    });

    // Receive driver events (fatigue, rash driving) from web app
    socket.on('driver_event', async (data) => {
      try {
        const { driver_id, session_id, event_type, timestamp, severity, status, event, data: eventData } = data;
        
        if (!session_id) {
          return console.error('❌ Driver event missing session_id');
        }

        console.log(`🔔 Received ${event_type} event from driver ${driver_id}:`, event);

        // Find the session to identify the owner
        const session = await Session.findById(session_id);
        if (!session) {
          return console.error(`❌ Session not found for ID: ${session_id}`);
        }

        const ownerId = session.ownerId.toString();

        // Create alert with priority-based severity
        const alertSeverity = severity || ALERT_PRIORITY[event] || ALERT_PRIORITY['default'];
        
        const alertPayload = {
          type: event_type,
          event: event,
          severity: alertSeverity,
          status: status,
          timestamp: timestamp || new Date().toISOString(),
          driver_id: driver_id,
          session_id: session_id,
          driver_name: session.driverName,
          vehicle_number: session.vehicleNumber,
          data: eventData,
        };

        // Log alert based on severity
        const icon = alertSeverity === 'high' ? '🚨' : alertSeverity === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`${icon} Alert [${alertSeverity}] for owner ${ownerId}: ${event_type} - ${event}`);

        // Emit to the specific owner's room on the native app
        console.log(`📣 Forwarding ${alertSeverity} alert to owner room: owner:${ownerId}`);
        io.to(`owner:${ownerId}`).emit('new_alert', alertPayload);

      } catch (error) {
        console.error('❌ Error processing driver event:', error.message);
      }
    });

    // Receive combined analysis from web app
    socket.on('driver_analysis', (data) => {
      try {
        const { driver_id, session_id, timestamp, fatigue_status, rash_events, metrics } = data;
        
        console.log(`📈 Received combined analysis from driver ${driver_id}:`, {
          fatigue: fatigue_status,
          rash_events_count: rash_events?.length || 0
        });

        // You can store this for dashboard analytics
      } catch (error) {
        console.error('❌ Error processing analysis:', error.message);
      }
    });

    // Receive session end summary
    socket.on('session_end', async (data) => {
      try {
        const { driver_id, session_id, duration_seconds, distance_km, alerts_count, safety_score, events } = data;
        
        console.log(`🏁 Session ended for driver ${driver_id}:`, {
          duration: duration_seconds,
          distance: distance_km,
          alerts: alerts_count,
          safety_score: safety_score
        });

        // Find session and update with final stats
        if (session_id) {
          const session = await Session.findByIdAndUpdate(
            session_id,
            {
              'metadata.session_duration': duration_seconds,
              'metadata.distance': distance_km,
              'metadata.alertsCount': alerts_count,
              'metadata.safetyScore': safety_score,
              status: 'completed'
            },
            { new: true }
          );

          if (session) {
            const ownerId = session.ownerId.toString();
            
            // Emit session summary to owner
            io.to(`owner:${ownerId}`).emit('session_summary', {
              session_id,
              driver_id,
              duration: duration_seconds,
              distance: distance_km,
              alerts: alerts_count,
              safety_score: safety_score,
              events: events
            });

            console.log(`✅ Session summary sent to owner: ${ownerId}`);
          }
        }
      } catch (error) {
        console.error('❌ Error processing session end:', error.message);
      }
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
