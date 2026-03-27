/**
 * Camera permission handler for cross-platform compatibility
 * Handles permission requests and errors gracefully
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PermissionError {
  type: 'permission-denied' | 'not-found' | 'not-secure' | 'unknown';
  message: string;
}

/**
 * Request camera permissions from the user
 * @param options - Camera constraint options
 * @returns Promise<MediaStream>
 */
export const requestCameraPermission = async (
  options: MediaStreamConstraints = {
    video: { facingMode: 'environment' },
    audio: false,
  }
): Promise<MediaStream> => {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw createPermissionError(
        'not-found',
        'Camera API is not supported in this browser'
      );
    }

    // Check if HTTPS is being used (required for getUserMedia)
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost'
    ) {
      throw createPermissionError(
        'not-secure',
        'Camera access requires HTTPS connection'
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia(options);
    return stream;
  } catch (error) {
    throw handleCameraError(error);
  }
};

/**
 * Stop camera stream and clean up tracks
 * @param stream - MediaStream to stop
 */
export const stopCameraStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

/**
 * Check current camera permission status
 * @returns Promise<PermissionStatus>
 */
export const checkCameraPermission = async (): Promise<PermissionStatus> => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    });
    return permissionStatus.state as PermissionStatus;
  } catch {
    return 'prompt';
  }
};

/**
 * Create a structured permission error
 * @param type - Error type
 * @param message - Error message
 * @returns PermissionError
 */
const createPermissionError = (
  type: PermissionError['type'],
  message: string
): Error & { permissionError: PermissionError } => {
  const error: any = new Error(message);
  error.permissionError = { type, message };
  return error;
};

/**
 * Handle camera permission errors
 * @param error - Raw error from getUserMedia
 * @returns Error with permission details
 */
const handleCameraError = (error: any): Error & { permissionError?: PermissionError } => {
  const result: any = new Error();

  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    result.permissionError = {
      type: 'permission-denied' as const,
      message:
        'Camera permission denied. Please allow access in your browser settings.',
    };
    result.message = result.permissionError.message;
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    result.permissionError = {
      type: 'not-found' as const,
      message:
        'No camera device found. Please check if your device has a camera.',
    };
    result.message = result.permissionError.message;
  } else if (error.name === 'NotSecureError') {
    result.permissionError = {
      type: 'not-secure' as const,
      message: 'Camera access requires a secure connection (HTTPS)',
    };
    result.message = result.permissionError.message;
  } else if (error.permissionError) {
    result.permissionError = error.permissionError;
    result.message = error.message;
  } else {
    result.permissionError = {
      type: 'unknown' as const,
      message: error.message || 'An unknown error occurred while accessing the camera',
    };
    result.message = result.permissionError.message;
  }

  return result;
};

/**
 * Get user-friendly error message
 * @param error - Error object
 * @returns User-friendly message
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (error?.permissionError?.message) {
    return error.permissionError.message;
  }
  return 'Unable to access camera. Please try again.';
};
