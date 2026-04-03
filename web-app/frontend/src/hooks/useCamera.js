import { useEffect, useRef, useState } from 'react';
import { cameraUtils } from '../utils/utils.js';
import useAppStore from '../store/appStore.js';
import aiService from '../services/aiService.js';

export const useCamera = ({ driverId, sessionId }) => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef(null);
  const fatigueInFlightRef = useRef(false);
  const { setCameraStream, setFatigueStatus, addAlert, setCameraError } = useAppStore();

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await cameraUtils.requestCamera();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      const message = 'Camera access denied. Please enable camera permission and retry.';
      setCameraError(message);
      addAlert({ type: 'error', severity: 'high', message });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsStreaming(false);
    }
  };

  const startFatigueDetection = () => {
    if (!driverId || !sessionId || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !isStreaming || fatigueInFlightRef.current) return;

      try {
        fatigueInFlightRef.current = true;
        const frame = cameraUtils.captureFrame(videoRef.current, 0.5);
        const base64Frame = cameraUtils.dataURLToBase64(frame);
        const result = await aiService.detectFatigue({
          image: base64Frame,
          driverId,
          sessionId,
        });

        const fatigue = result?.fatigue;
        if (!fatigue) return;

        setFatigueStatus(fatigue.status || 'alert');
        if (fatigue.event) {
          addAlert({
            type: 'fatigue',
            severity: fatigue.status === 'drowsy' ? 'high' : 'medium',
            message: `Fatigue: ${fatigue.event.replace('_', ' ')}`,
          });
          if (fatigue.status === 'no_face') {
            addAlert({
              type: 'fatigue',
              severity: 'medium',
              message: 'No face detected in camera frame',
            });
          }
        }
      } catch (error) {
        console.error('Fatigue detection failed:', error);
      } finally {
        fatigueInFlightRef.current = false;
      }
    }, 1500);
  };

  const stopFatigueDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    fatigueInFlightRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopFatigueDetection();
    };
  }, []);

  return {
    videoRef,
    isStreaming,
    startCamera,
    stopCamera,
    startFatigueDetection,
    stopFatigueDetection,
  };
};