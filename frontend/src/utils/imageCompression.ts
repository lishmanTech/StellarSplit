/**
 * Image compression utility for receipt photos
 * Uses Canvas API to compress images while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
}

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1440;
const DEFAULT_QUALITY = 0.8;

/**
 * Compress an image file using Canvas API
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Promise<Blob> - Compressed image blob
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = DEFAULT_MAX_WIDTH,
      maxHeight = DEFAULT_MAX_HEIGHT,
      quality = DEFAULT_QUALITY,
    } = options;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target?.result as string;
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Convert blob to File object
 * @param blob - Blob to convert
 * @param fileName - Name for the file
 * @returns File object
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: 'image/jpeg' });
};

/**
 * Get file size in readable format
 * @param bytes - Number of bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate if file is a supported image type
 * @param file - File to validate
 * @returns boolean
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};
