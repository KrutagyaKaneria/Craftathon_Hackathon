// Camera utilities
export const cameraUtils = {
  requestCamera: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 960 },
          height: { ideal: 360, max: 540 },
          facingMode: 'user',
        },
      });
      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      throw error;
    }
  },

  captureFrame: (videoElement, scale = 0.55) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(videoElement.videoWidth * scale));
    canvas.height = Math.max(1, Math.floor(videoElement.videoHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  },

  dataURLToBase64: (dataURL) => {
    return dataURL.split(',')[1];
  },
};

export const utils = {
  formatTimestamp: (date) => {
    const value = date instanceof Date ? date : new Date(date);
    return value.toLocaleTimeString();
  },

  playAlertSound: () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  },

  flashScreen: () => {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    flash.style.zIndex = '9999';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);

    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash);
      }
    }, 500);
  },
};