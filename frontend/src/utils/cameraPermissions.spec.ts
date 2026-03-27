import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PermissionStatus } from './cameraPermissions';
import {
  requestCameraPermission,
  stopCameraStream,
  checkCameraPermission,
  getUserFriendlyErrorMessage,
} from './cameraPermissions';

describe('cameraPermissions Utilities', () => {
  describe('requestCameraPermission', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should request camera permission with default options', async () => {
      const mockStream = { getTracks: () => [] } as any;
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
        mockStream
      );

      const stream = await requestCameraPermission();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.any(Object),
          audio: false,
        })
      );
      expect(stream).toBe(mockStream);
    });

    it('should use front camera when specified', async () => {
      const mockStream = { getTracks: () => [] } as any;
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
        mockStream
      );

      await requestCameraPermission({
        video: { facingMode: 'user' },
        audio: false,
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
        audio: false,
      });
    });

    it('should use back camera when specified', async () => {
      const mockStream = { getTracks: () => [] } as any;
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
        mockStream
      );

      await requestCameraPermission({
        video: { facingMode: 'environment' },
        audio: false,
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
        audio: false,
      });
    });

    it('should handle NotAllowedError (permission denied)', async () => {
      const error = new DOMException(
        'Permission denied',
        'NotAllowedError'
      );
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
        error
      );

      await expect(requestCameraPermission()).rejects.toThrow();
    });

    it('should handle NotFoundError (no camera)', async () => {
      const error = new DOMException('No camera found', 'NotFoundError');
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
        error
      );

      await expect(requestCameraPermission()).rejects.toThrow();
    });

    it('should throw error if getUserMedia is not available', async () => {
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      try {
        await requestCameraPermission();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('not supported');
      } finally {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: originalMediaDevices,
          writable: true,
        });
      }
    });

    it('should enforce HTTPS for non-localhost', async () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true,
      });

      try {
        await requestCameraPermission();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('HTTPS');
      } finally {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      }
    });

    it('should allow HTTP for localhost', async () => {
      const mockStream = { getTracks: () => [] } as any;
      const originalLocation = window.location;
      
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        writable: true,
      });

      try {
        vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
          mockStream
        );

        const stream = await requestCameraPermission();
        expect(stream).toBe(mockStream);
      } finally {
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      }
    });
  });

  describe('stopCameraStream', () => {
    it('should stop all tracks in a stream', () => {
      const mockTrack1 = { stop: vi.fn() };
      const mockTrack2 = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack1, mockTrack2],
      } as any;

      stopCameraStream(mockStream);

      expect(mockTrack1.stop).toHaveBeenCalled();
      expect(mockTrack2.stop).toHaveBeenCalled();
    });

    it('should handle stream with no tracks', () => {
      const mockStream = {
        getTracks: () => [],
      } as any;

      expect(() => stopCameraStream(mockStream)).not.toThrow();
    });
  });

  describe('checkCameraPermission', () => {
    it('should check camera permission status', async () => {
      const mockPermissionStatus = {
        state: 'granted' as PermissionStatus,
        onchange: null,
      };

      vi.spyOn(navigator.permissions, 'query').mockResolvedValue(
        mockPermissionStatus as any
      );

      const status = await checkCameraPermission();

      expect(status).toBe('granted');
      expect(navigator.permissions.query).toHaveBeenCalledWith({
        name: 'camera',
      });
    });

    it('should return prompt if permission status is unknown', async () => {
      vi.spyOn(navigator.permissions, 'query').mockRejectedValue(
        new Error('Not supported')
      );

      const status = await checkCameraPermission();

      expect(status).toBe('prompt');
    });

    it('should return denied status', async () => {
      const mockPermissionStatus = {
        state: 'denied' as PermissionStatus,
        onchange: null,
      };

      vi.spyOn(navigator.permissions, 'query').mockResolvedValue(
        mockPermissionStatus as any
      );

      const status = await checkCameraPermission();

      expect(status).toBe('denied');
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should format permission denied error', () => {
      const error: any = new Error();
      error.permissionError = {
        type: 'permission-denied',
        message: 'Camera permission denied',
      };

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Camera permission denied');
    });

    it('should format not found error', () => {
      const error: any = new Error();
      error.permissionError = {
        type: 'not-found',
        message: 'No camera device found',
      };

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('No camera device found');
    });

    it('should format not secure error', () => {
      const error: any = new Error();
      error.permissionError = {
        type: 'not-secure',
        message: 'Camera access requires HTTPS',
      };

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Camera access requires HTTPS');
    });

    it('should return default message for unknown error', () => {
      const error = new Error('Unknown error');

      const message = getUserFriendlyErrorMessage(error);

      expect(message).toBe('Unable to access camera. Please try again.');
    });

    it('should handle null or undefined errors', () => {
      const message = getUserFriendlyErrorMessage(null);

      expect(message).toBe('Unable to access camera. Please try again.');
    });
  });
});
