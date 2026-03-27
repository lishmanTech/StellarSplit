import { useEffect, useRef, useState } from 'react';
import { Camera, Repeat2, X, Check } from 'lucide-react';
import {
  requestCameraPermission,
  stopCameraStream,
  checkCameraPermission,
  getUserFriendlyErrorMessage,
} from '../../utils/cameraPermissions';
import {
  compressImage,
  blobToFile,
  formatFileSize,
  isValidImageType,
} from '../../utils/imageCompression';

export interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // in bytes
  compressionQuality?: number; // 0-1
}

interface CameraState {
  status: 'idle' | 'requesting' | 'active' | 'captured' | 'error';
  error?: string;
  isFrontCamera: boolean;
  originalFile?: File;
  compressedFile?: File;
  capturedImageUrl?: string;
}

/**
 * CameraCapture Component
 * Allows users to capture photos of receipts on mobile and desktop
 * Features:
 * - Access device camera using HTML5 API
 * - Show camera preview
 * - Capture button with visual feedback
 * - Switch between front/back camera (mobile)
 * - Image preview after capture
 * - Retake option
 * - Image compression before upload
 * - Graceful permission handling
 */
export const CameraCapture = ({
  onCapture,
  onError,
  maxFileSize = 5242880, // 5MB default
  compressionQuality = 0.8,
}: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    isFrontCamera: false,
  });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Initialize camera on mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const permissionStatus = await checkCameraPermission();
        if (permissionStatus === 'denied') {
          setCameraState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Camera permission was previously denied. Please enable it in browser settings.',
          }));
          return;
        }

        setCameraState((prev) => ({ ...prev, status: 'requesting' }));

        const mediaStream = await requestCameraPermission({
          video: {
            facingMode: cameraState.isFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });

        setStream(mediaStream);
        setCameraState((prev) => ({ ...prev, status: 'active', error: undefined }));

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        const err = error as Error;
        const errorMessage = getUserFriendlyErrorMessage(err);
        setCameraState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
        onError?.(err);
      }
    };

    initializeCamera();

    return () => {
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [cameraState.isFrontCamera, onError]);

  // Switch camera
  const handleSwitchCamera = async () => {
    if (stream) {
      stopCameraStream(stream);
      setStream(null);
    }

    setCameraState((prev) => ({
      ...prev,
      isFrontCamera: !prev.isFrontCamera,
      status: 'requesting',
      error: undefined,
    }));
  };

  // Capture image from camera
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to capture image');
        }

        try {
          const originalFile = new File([blob], 'receipt.jpg', {
            type: 'image/jpeg',
          });

          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);
          setCameraState((prev) => ({
            ...prev,
            status: 'captured',
            capturedImageUrl: previewUrl,
            originalFile,
          }));
        } catch (error) {
          const err = error as Error;
          setCameraState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Failed to capture image',
          }));
          onError?.(err);
        }
      }, 'image/jpeg');
    } catch (error) {
      const err = error as Error;
      setCameraState((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to capture image',
      }));
      onError?.(err);
    }
  };

  // Compress and submit image
  const handleConfirmCapture = async () => {
    if (!cameraState.originalFile) {
      return;
    }

    setIsCompressing(true);

    try {
      let fileToSubmit = cameraState.originalFile;
      let compressedBlob = await compressImage(cameraState.originalFile, {
        quality: compressionQuality,
      });

      // Check file size
      if (compressedBlob.size > maxFileSize) {
        // Try more aggressive compression
        compressedBlob = await compressImage(cameraState.originalFile, {
          quality: Math.max(0.5, compressionQuality - 0.2),
        });
      }

      fileToSubmit = blobToFile(compressedBlob, 'receipt.jpg');

      setCameraState((prev) => ({
        ...prev,
        compressedFile: fileToSubmit,
      }));

      onCapture(fileToSubmit);
    } catch (error) {
      const err = error as Error;
      setCameraState((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to compress image',
      }));
      onError?.(err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    if (cameraState.capturedImageUrl) {
      URL.revokeObjectURL(cameraState.capturedImageUrl);
    }

    setCameraState((prev) => ({
      ...prev,
      status: 'active',
      capturedImageUrl: undefined,
      originalFile: undefined,
      compressedFile: undefined,
      error: undefined,
    }));
  };

  // Upload from file (fallback for desktop)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageType(file)) {
      setCameraState((prev) => ({
        ...prev,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)',
      }));
      return;
    }

    try {
      setIsCompressing(true);
      const compressedBlob = await compressImage(file, {
        quality: compressionQuality,
      });

      if (compressedBlob.size > maxFileSize) {
        const moreCompressed = await compressImage(file, {
          quality: Math.max(0.5, compressionQuality - 0.2),
        });
        const compressedFile = blobToFile(moreCompressed, 'receipt.jpg');
        onCapture(compressedFile);
      } else {
        const compressedFile = blobToFile(compressedBlob, 'receipt.jpg');
        onCapture(compressedFile);
      }
    } catch (error) {
      const err = error as Error;
      setCameraState((prev) => ({
        ...prev,
        error: err.message || 'Failed to process image',
      }));
      onError?.(err);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Camera Preview or Captured Image */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
        {cameraState.status === 'active' ? (
          <>
            {/* Video Preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover"
            />

            {/* Camera Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Top - Camera Switch Button */}
              {cameraState.status === 'active' && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSwitchCamera}
                    aria-label="Switch camera"
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Repeat2 size={24} />
                  </button>
                </div>
              )}

              {/* Bottom - Capture Controls */}
              <div className="flex justify-center gap-4">
                {/* File Upload Fallback */}
                <label className="px-6 py-3 bg-gray-700/50 text-white rounded-full cursor-pointer hover:bg-gray-700 transition-colors flex items-center gap-2 focus-within:ring-2 focus-within:ring-purple-500">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    aria-label="Upload image file"
                  />
                  Upload
                </label>

                {/* Capture Button */}
                <button
                  onClick={handleCapture}
                  aria-label="Take photo"
                  className="p-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Camera size={28} />
                </button>
              </div>
            </div>
          </>
        ) : cameraState.status === 'captured' && cameraState.capturedImageUrl ? (
          <>
            {/* Captured Image Preview */}
            <img
              src={cameraState.capturedImageUrl}
              alt="Captured receipt"
              className="w-full aspect-video object-cover"
            />

            {/* Image Review Controls */}
            <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex gap-4">
                {/* Retake Button */}
                <button
                  onClick={handleRetake}
                  disabled={isCompressing}
                  aria-label="Retake photo"
                  className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2"
                >
                  <Repeat2 size={20} />
                  Retake
                </button>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmCapture}
                  disabled={isCompressing}
                  aria-label="Confirm and upload photo"
                  className="px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-2"
                >
                  {isCompressing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : cameraState.status === 'requesting' ? (
          <div className="w-full aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin mb-4">
                <Camera size={48} />
              </div>
              <p>Requesting camera access...</p>
            </div>
          </div>
        ) : cameraState.status === 'error' ? (
          <div className="w-full aspect-video flex items-center justify-center bg-red-900/20">
            <div className="text-center text-white p-4">
              <X size={48} className="mx-auto mb-4 text-red-400" />
              <p className="font-semibold mb-2">Camera Error</p>
              <p className="text-sm text-gray-300">{cameraState.error}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Hidden Canvas for Image Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File Size Info */}
      {cameraState.compressedFile && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p>
            Image compressed: {formatFileSize(cameraState.compressedFile.size)}
          </p>
        </div>
      )}

      {/* Error Message */}
      {cameraState.error && cameraState.status !== 'error' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-800 flex items-start gap-2">
          <X size={16} className="mt-0.5 flex-shrink-0" />
          <div>{cameraState.error}</div>
        </div>
      )}
    </div>
  );
};
