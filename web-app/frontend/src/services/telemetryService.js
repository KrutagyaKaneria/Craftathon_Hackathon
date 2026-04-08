/**
 * Telemetry Service
 * Handles sending real-time sensor and AI detection data to the backend via Socket.io
 */

class TelemetryService {
  constructor(socket = null) {
    this.socket = socket;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  /**
   * Send sensor telemetry data (acceleration, brake, steering)
   */
  sendSensorData(driverId, sessionId, sensorData) {
    // STRICT: Validate session context before sending
    if (!sessionId) {
      console.error('❌ CRITICAL: Cannot send sensor data without sessionId. Data dropped.');
      return;
    }

    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot send sensor data');
      return;
    }

    const payload = {
      driver_id: driverId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      metrics: {
        acceleration: sensorData.acceleration || 0,
        brake: sensorData.brake || 0,
        steering: sensorData.steering || 0,
        speed: sensorData.speed || 0,
      },
    };

    this.socket.emit('telemetry_data', payload);
    console.log('📊 Sent sensor telemetry:', payload);
  }

  /**
   * Send fatigue detection alert with priority
   */
  sendFatigueAlert(driverId, sessionId, fatigueData) {
    // STRICT: Validate session context before sending
    if (!sessionId) {
      console.error('❌ CRITICAL: Cannot send fatigue alert without sessionId. Alert dropped.');
      return;
    }

    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot send fatigue alert');
      return;
    }

    // Determine severity based on fatigue status
    const severityMap = {
      drowsy: 'high',
      yawning: 'high',
      distracted: 'medium',
      normal: 'low',
      no_face: 'medium',
    };

    const payload = {
      driver_id: driverId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      event_type: 'fatigue_detection',
      status: fatigueData.status || 'alert',
      severity: severityMap[fatigueData.status] || 'medium',
      data: {
        event: fatigueData.event,
        confidence: fatigueData.confidence || 0.85,
        blink_rate: fatigueData.blink_rate,
        eye_aspect_ratio: fatigueData.eye_aspect_ratio,
        head_pose: fatigueData.head_pose,
      },
    };

    this.socket.emit('driver_event', payload);
    console.log('😴 Sent fatigue alert:', payload);
  }

  /**
   * Send rash driving alert
   */
  sendRashDrivingAlert(driverId, sessionId, rashData) {
    // STRICT: Validate session context before sending
    if (!sessionId) {
      console.error('❌ CRITICAL: Cannot send rash driving alert without sessionId. Alert dropped.');
      return;
    }

    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot send rash driving alert');
      return;
    }

    const severityMap = {
      hard_acceleration: 'medium',
      hard_braking: 'high',
      sharp_turn: 'medium',
      speeding: 'high',
    };

    const payload = {
      driver_id: driverId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      event_type: 'rash_driving',
      event: rashData.event || 'rash_driving_detected',
      severity: severityMap[rashData.event] || 'medium',
      data: {
        acceleration: rashData.acceleration,
        brake: rashData.brake,
        steering: rashData.steering,
        confidence: rashData.confidence || 0.80,
      },
    };

    this.socket.emit('driver_event', payload);
    console.log('🚗 Sent rash driving alert:', payload);
  }

  /**
   * Send combined analysis (both sensor + AI data)
   */
  sendCombinedAnalysis(driverId, sessionId, analysisData) {
    // STRICT: Validate session context before sending
    if (!sessionId) {
      console.error('❌ CRITICAL: Cannot send analysis without sessionId. Data dropped.');
      return;
    }

    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot send analysis');
      return;
    }

    const payload = {
      driver_id: driverId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      type: 'combined_analysis',
      fatigue_status: analysisData.fatigueStatus,
      rash_events: analysisData.rashEvents || [],
      metrics: {
        acceleration: analysisData.acceleration,
        brake: analysisData.brake,
        steering: analysisData.steering,
      },
    };

    this.socket.emit('driver_analysis', payload);
    console.log('📈 Sent combined analysis:', payload);
  }

  /**
   * Send end of session summary
   */
  sendSessionSummary(driverId, sessionId, summaryData) {
    // STRICT: Validate session context before sending
    if (!sessionId) {
      console.error('❌ CRITICAL: Cannot send session summary without sessionId. Data dropped.');
      return;
    }

    if (!this.socket) {
      console.warn('⚠️ Socket not connected, cannot send session summary');
      return;
    }

    const payload = {
      driver_id: driverId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      type: 'session_summary',
      duration_seconds: summaryData.duration,
      distance_km: summaryData.distance,
      alerts_count: summaryData.alertsCount,
      safety_score: summaryData.safetyScore,
      events: summaryData.events || [],
    };

    this.socket.emit('session_end', payload);
    console.log('🏁 Sent session summary:', payload);
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService();
export default telemetryService;
