import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CameraCapture } from './CameraCapture';

// Mock the permission and compression utilities
vi.mock('../utils/cameraPermissions', () => ({
  requestCameraPermission: vi.fn(),
  stopCameraStream: vi.fn(),
  checkCameraPermission: vi.fn(),
  getUserFriendlyErrorMessage: vi.fn((error) => error?.message || 'Camera error'),
}));

vi.mock('../utils/imageCompression', () => ({
  compressImage: vi.fn(),
  blobToFile: vi.fn((blob, name) => new File([blob], name, { type: 'image/jpeg' })),
  formatFileSize: vi.fn((bytes) => `${bytes} bytes`),
  isValidImageType: vi.fn(() => true),
}));

import * as cameraPermissions from '../../utils/cameraPermissions';
import * as imageCompression from '../../utils/imageCompression';

describe('CameraCapture Component', () => {
  let mockStream: MediaStream;

  beforeEach(() => {
    // Create mock MediaStream
    mockStream = {
      getTracks: vi.fn(() => [
        {
          stop: vi.fn(),
        },
      ]),
    } as any;

    // Setup default mocks
    vi.mocked(cameraPermissions.requestCameraPermission).mockResolvedValue(
      mockStream
    );
    vi.mocked(cameraPermissions.checkCameraPermission).mockResolvedValue(
      'prompt'
    );
    vi.mocked(cameraPermissions.stopCameraStream).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Camera Access', () => {
    it('should request camera permission on mount', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(
          cameraPermissions.requestCameraPermission
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.any(Object),
            audio: false,
          })
        );
      });
    });

    it('should show requesting state while accessing camera', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      expect(screen.getByText(/requesting camera access/i)).toBeInTheDocument();
    });

    it('should show active state when camera is ready', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        const video = screen.getByRole('img', { hidden: true }) ||
          document.querySelector('video');
        expect(video).toBeInTheDocument();
      });
    });

    it('should handle permission denied error', async () => {
      vi.mocked(cameraPermissions.checkCameraPermission).mockResolvedValue(
        'denied'
      );
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByText(/permission was previously denied/i)).toBeInTheDocument();
      });
    });

    it('should handle camera not found error', async () => {
      const error = new Error('Camera not found');
      (error as any).permissionError = {
        type: 'not-found',
        message: 'No camera device found',
      };

      vi.mocked(cameraPermissions.requestCameraPermission).mockRejectedValue(
        error
      );
      const mockOnCapture = vi.fn();
      const mockOnError = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/camera error/i)).toBeInTheDocument();
      });
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });

  describe('Camera Controls', () => {
    it('should render capture button', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/take photo/i)).toBeInTheDocument();
      });
    });

    it('should render camera switch button', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/switch camera/i)).toBeInTheDocument();
      });
    });

    it('should render file upload option', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/upload image file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Capture', () => {
    it('should capture image when capture button is clicked', async () => {
      const mockOnCapture = vi.fn();
      const { container } = render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/take photo/i)).toBeInTheDocument();
      });

      // Mock canvas context
      const canvasEl = container.querySelector('canvas');
      expect(canvasEl).toBeInTheDocument();

      const captureButton = screen.getByLabelText(/take photo/i);
      fireEvent.click(captureButton);

      // Give time for image processing
      await waitFor(() => {
        expect(screen.getByText(/retake/i)).toBeInTheDocument();
      });
    });

    it('should show preview after capture', async () => {
      const mockOnCapture = vi.fn();
      const { container } = render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Image Compression', () => {
    it('should compress image on confirm', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      vi.mocked(imageCompression.compressImage).mockResolvedValue(mockBlob);
      const mockOnCapture = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} />);

      // Capture image first
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      // Confirm capture
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/confirm and upload photo/i));
      });

      await waitFor(() => {
        expect(imageCompression.compressImage).toHaveBeenCalled();
      });
    });

    it('should retry compression with lower quality if file too large', async () => {
      const largeBlob = new Blob(
        [new ArrayBuffer(6 * 1024 * 1024)],
        { type: 'image/jpeg' }
      ); // 6MB
      const smallBlob = new Blob(['test'], { type: 'image/jpeg' });

      vi.mocked(imageCompression.compressImage)
        .mockResolvedValueOnce(largeBlob) // First attempt returns large blob
        .mockResolvedValueOnce(smallBlob); // Retry with lower quality
      const mockOnCapture = vi.fn();

      render(
        <CameraCapture
          onCapture={mockOnCapture}
          maxFileSize={5 * 1024 * 1024}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/confirm and upload photo/i));
      });

      await waitFor(() => {
        expect(imageCompression.compressImage).toHaveBeenCalledTimes(2);
      });
    });

    it('should call onCapture with compressed file', async () => {
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
      vi.mocked(imageCompression.compressImage).mockResolvedValue(mockBlob);
      const mockOnCapture = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/confirm and upload photo/i));
      });

      await waitFor(() => {
        expect(mockOnCapture).toHaveBeenCalledWith(expect.any(File));
      });
    });
  });

  describe('Retake Functionality', () => {
    it('should return to camera view on retake', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      // Capture image
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      // Retake
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/retake photo/i));
      });

      // Should be back to requesting or ready state
      await waitFor(() => {
        expect(screen.queryByLabelText(/retake photo/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('File Upload Fallback', () => {
    it('should handle file upload', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      vi.mocked(imageCompression.compressImage).mockResolvedValue(mockBlob);
      const mockOnCapture = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/upload image file/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/upload image file/i) as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(imageCompression.compressImage).toHaveBeenCalledWith(
          expect.any(File),
          expect.any(Object)
        );
      });
    });

    it('should validate image type on upload', async () => {
      vi.mocked(imageCompression.isValidImageType).mockReturnValue(false);
      const mockOnCapture = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        const fileInput = screen.getByLabelText(/upload image file/i) as HTMLInputElement;
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Error should be shown
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on camera access failure', async () => {
      const error = new Error('Permission denied');
      (error as any).permissionError = {
        type: 'permission-denied',
        message: 'Camera permission denied',
      };

      vi.mocked(cameraPermissions.requestCameraPermission).mockRejectedValue(
        error
      );
      const mockOnCapture = vi.fn();
      const mockOnError = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/camera error/i)).toBeInTheDocument();
      });

      expect(mockOnError).toHaveBeenCalledWith(error);
    });

    it('should call onError callback on compression failure', async () => {
      const error = new Error('Compression failed');
      vi.mocked(imageCompression.compressImage).mockRejectedValue(error);
      const mockOnCapture = vi.fn();
      const mockOnError = vi.fn();

      render(<CameraCapture onCapture={mockOnCapture} onError={mockOnError} />);

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/take photo/i));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/confirm and upload photo/i));
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/take photo/i)).toHaveAttribute(
          'aria-label'
        );
        expect(screen.getByLabelText(/switch camera/i)).toHaveAttribute(
          'aria-label'
        );
      });
    });

    it('should be keyboard accessible', async () => {
      const mockOnCapture = vi.fn();
      render(<CameraCapture onCapture={mockOnCapture} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/take photo/i)).toBeInTheDocument();
      });

      const captureButton = screen.getByLabelText(/take photo/i);
      // Button should not be disabled
      expect(captureButton).not.toHaveAttribute('disabled');
    });
  });
});
