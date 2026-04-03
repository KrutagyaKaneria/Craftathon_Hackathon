import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';
import { cameraUtils } from '../utils/utils.js';

const Verification = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const { selectedDriver, setVerifiedDriver } = useAppStore();

  useEffect(() => {
    if (!selectedDriver) {
      navigate('/');
    }
  }, [selectedDriver, navigate]);

  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const newStream = await cameraUtils.requestCamera();
      setStream(newStream);
      setIsCameraActive(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  // Attach stream when video element is ready
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageDataURL = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataURL);
  };

  const verifyDriver = async () => {
    if (!capturedImage || !selectedDriver) return;

    setIsVerifying(true);
    setError(null);

    try {
      const storedImage = selectedDriver.profilePhoto;
      const capturedImageBase64 = capturedImage.split(',')[1];

      // Call AI Service for face verification
      const result = await apiService.verifyDriver(
        storedImage,
        capturedImageBase64
      );

      console.log('🔍 Verification result:', result);

      if (result.verified) {
        setVerifiedDriver(selectedDriver);
        // Add a small delay for user to see success
        setTimeout(() => {
          navigate('/vehicle-selection');
        }, 1000);
      } else {
        setError(result.message || 'Face not matched. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Verification failed. Please ensure your face is clearly visible.');
    } finally {
      setIsVerifying(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  if (!selectedDriver) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Face Verification</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-6 mb-6">
            <img
              src={selectedDriver.profilePhoto || '/default-avatar.png'}
              alt={`${selectedDriver.firstName} ${selectedDriver.lastName}`}
              className="w-32 h-32 rounded-lg object-cover border-2 border-blue-500 shadow-lg"
            />
            <div>
              <h2 className="text-3xl font-bold text-blue-400">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
              <p className="text-gray-300 font-medium">Position your face clearly in the camera frame</p>
            </div>
          </div>

          <div className="space-y-4">
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start Camera
              </button>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              </>
            )}

            {capturedImage && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Captured Image:</h3>
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg"
                />
                <button
                  onClick={verifyDriver}
                  disabled={isVerifying}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Face'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-600 text-white rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default Verification;