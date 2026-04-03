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

  const startCamera = async () => {
    try {
      const stream = await cameraUtils.requestCamera();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

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
      const storedImageBase64 = selectedDriver.profile_image.includes(',')
        ? selectedDriver.profile_image.split(',')[1]
        : selectedDriver.profile_image;
      const capturedImageBase64 = capturedImage.split(',')[1];

      const result = await apiService.verifyDriver(
        selectedDriver.id,
        storedImageBase64,
        capturedImageBase64
      );

      if (result.verified) {
        setVerifiedDriver(selectedDriver);
        navigate('/vehicle-selection');
      } else {
        setError('Face verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
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
              src={selectedDriver.profile_image}
              alt="Stored"
              className="w-32 h-32 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-2xl font-semibold">{selectedDriver.name}</h2>
              <p className="text-gray-400">Please position your face in front of the camera</p>
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