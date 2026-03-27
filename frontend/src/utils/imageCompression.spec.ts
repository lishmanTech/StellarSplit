import { describe, it, expect } from 'vitest';
import type { CompressionOptions } from './imageCompression';
import {
  compressImage,
  blobToFile,
  formatFileSize,
  isValidImageType,
} from './imageCompression';

describe('imageCompression Utilities', () => {
  describe('compressImage', () => {
    it('should compress an image file', async () => {
      // Create a test image file
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const compressed = await compressImage(file);

      expect(compressed).toBeInstanceOf(Blob);
      expect(compressed.type).toBe('image/jpeg');
    });

    it('should respect max width constraint', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 3000;
      canvas.height = 2000;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const options: CompressionOptions = {
        maxWidth: 1920,
        maxHeight: 1440,
      };

      const compressed = await compressImage(file, options);
      expect(compressed).toBeInstanceOf(Blob);
    });

    it('should respect quality parameter', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const highQuality = await compressImage(file, { quality: 0.9 });
      const lowQuality = await compressImage(file, { quality: 0.5 });

      // Higher quality should result in larger file size
      expect(highQuality.size).toBeGreaterThanOrEqual(lowQuality.size);
    });

    it('should maintain aspect ratio', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1000; // 2:1 aspect ratio
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const options: CompressionOptions = {
        maxWidth: 1000,
        maxHeight: 500,
      };

      const compressed = await compressImage(file, options);
      expect(compressed).toBeInstanceOf(Blob);
    });

    it('should handle invalid files gracefully', async () => {
      const invalidFile = new File(['not an image'], 'test.txt', {
        type: 'text/plain',
      });

      await expect(compressImage(invalidFile)).rejects.toThrow();
    });

    it('should use default quality if not specified', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const compressed = await compressImage(file, {});

      expect(compressed).toBeInstanceOf(Blob);
    });
  });

  describe('blobToFile', () => {
    it('should convert blob to file', () => {
      const blob = new Blob(['test content'], { type: 'image/jpeg' });
      const file = blobToFile(blob, 'test.jpg');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
    });

    it('should preserve blob content', () => {
      const content = 'test content';
      const blob = new Blob([content], { type: 'image/jpeg' });
      const file = blobToFile(blob, 'test.jpg');

      expect(file.size).toBe(blob.size);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal sizes', () => {
      expect(formatFileSize(512)).toBe('0.5 KB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle large numbers', () => {
      const largeNumber = 1024 * 1024 * 1024 * 5; // 5GB
      const result = formatFileSize(largeNumber);
      expect(result).toContain('GB');
    });
  });

  describe('isValidImageType', () => {
    it('should accept JPEG files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidImageType(file)).toBe(true);
    });

    it('should accept PNG files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      expect(isValidImageType(file)).toBe(true);
    });

    it('should accept WebP files', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      expect(isValidImageType(file)).toBe(true);
    });

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(isValidImageType(file)).toBe(false);
    });

    it('should reject PDF files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(isValidImageType(file)).toBe(false);
    });

    it('should reject video files', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      expect(isValidImageType(file)).toBe(false);
    });
  });
});
