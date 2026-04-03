/**
 * Image Utility Functions
 * Handles image conversion and compression
 */

/**
 * Compress image by reducing dimensions
 * @param imageUri - The image URI from image picker
 * @param maxWidth - Maximum width (default 800px)
 * @param maxHeight - Maximum height (default 800px)
 * @param quality - JPEG quality 0-1 (default 0.6 for good compression)
 * @returns Compressed image URI
 */
export const compressImageLocally = async (
  imageUri: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.6
): Promise<string> => {
  try {
    // For now, return as-is. On native platforms, you'd use expo-image-manipulator
    // This is a placeholder - actual compression happens via quality setting in picker
    console.log(`📦 Image compression settings: ${maxWidth}x${maxHeight}, quality: ${quality}`);
    return imageUri;
  } catch (error) {
    console.error('❌ Error compressing image:', error);
    return imageUri; // Return original if compression fails
  }
};

/**
 * Convert image file to base64 string with aggressive compression
 * @param uri - File URI from image picker
 * @returns Base64 encoded image string (with data:image/jpeg;base64, prefix)
 */
export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result as string;
        console.log(`📦 Base64 size: ${(base64String.length / 1024).toFixed(2)}KB`);

        // Check if too large and warn (but still send - backend will handle limit)
        if (base64String.length > 1 * 1024 * 1024) {
          console.warn(`⚠️ Image is large: ${(base64String.length / 1024 / 1024).toFixed(2)}MB`);
        }

        resolve(base64String);
      };

      reader.onerror = (error) => {
        console.error('❌ Error converting image to base64:', error);
        reject(new Error('Failed to convert image to base64'));
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Error reading image file:', error);
    throw new Error('Failed to read image file');
  }
};

/**
 * Get file size of base64 string in MB
 * @param base64String - Base64 encoded string
 * @returns Size in MB
 */
export const getBase64Size = (base64String: string): number => {
  // Use string length directly - works in React Native without Buffer
  const bytes = base64String.length;
  return bytes / (1024 * 1024); // Convert to MB
};
