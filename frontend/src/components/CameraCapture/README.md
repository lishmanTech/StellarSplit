# CameraCapture Component

A React component that allows users to capture photos of receipts on both mobile and desktop devices. The component provides a complete camera interface with image compression, preview, and permission handling.

## Features

✅ **Access device camera** using HTML5 Media Capture API (`navigator.mediaDevices.getUserMedia()`)
✅ **Live camera preview** with high-quality video stream
✅ **Capture button** with visual feedback and animations
✅ **Front/back camera switching** for mobile devices
✅ **Image preview** after capture with dimensions displayed
✅ **Retake option** to discard and recapture photos
✅ **Automatic image compression** using Canvas API
✅ **Graceful permission handling** with user-friendly error messages
✅ **iOS Safari & Android Chrome** fully supported
✅ **File upload fallback** for desktop users
✅ **Accessibility features** with ARIA labels and keyboard navigation
✅ **Comprehensive test coverage**

## Installation

The component is already included in the project. No additional dependencies are required beyond what's in the project's `package.json`.

## Usage

### Basic Example

```tsx
import { CameraCapture } from '@/components/CameraCapture';

function ReceiptUpload() {
  const handleCapture = (file: File) => {
    console.log('Captured image:', file);
    // Upload file to server
    uploadReceipt(file);
  };

  return (
    <div>
      <h2>Capture Receipt</h2>
      <CameraCapture onCapture={handleCapture} />
    </div>
  );
}
```

### With Error Handling

```tsx
import { CameraCapture } from '@/components/CameraCapture';

function ReceiptUpload() {
  const handleCapture = (file: File) => {
    console.log('Image captured and compressed:', file.name, file.size);
  };

  const handleError = (error: Error) => {
    console.error('Camera error:', error.message);
    // Show user-friendly error message
    toast.error('Unable to access camera');
  };

  return (
    <CameraCapture
      onCapture={handleCapture}
      onError={handleError}
      maxFileSize={5242880}
      compressionQuality={0.8}
    />
  );
}
```

### With Custom Compression Settings

```tsx
<CameraCapture
  onCapture={handleCapture}
  maxFileSize={3 * 1024 * 1024}  // 3MB
  compressionQuality={0.7}         // Lower quality for smaller files
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onCapture` | `(file: File) => void` | Required | Callback function called when image is successfully captured and compressed |
| `onError` | `(error: Error) => void` | Optional | Callback function called when an error occurs |
| `maxFileSize` | `number` | `5242880` (5MB) | Maximum file size in bytes after compression |
| `compressionQuality` | `number` | `0.8` | JPEG quality for compression (0-1) |

## API Reference

### CameraCapture Component

Main component for capturing receipt photos.

```tsx
interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // in bytes
  compressionQuality?: number; // 0-1
}
```

### Image Compression Utilities

Located in `src/utils/imageCompression.ts`:

#### `compressImage(file: File, options?: CompressionOptions): Promise<Blob>`

Compress an image file using Canvas API.

```tsx
import { compressImage } from '@/utils/imageCompression';

const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.8
});
```

#### `blobToFile(blob: Blob, fileName: string): File`

Convert a Blob to a File object.

```tsx
import { blobToFile } from '@/utils/imageCompression';

const file = blobToFile(blob, 'receipt.jpg');
```

#### `formatFileSize(bytes: number): string`

Format bytes to human-readable file size.

```tsx
formatFileSize(1024); // "1 KB"
formatFileSize(1024 * 1024); // "1 MB"
```

#### `isValidImageType(file: File): boolean`

Check if file is a supported image type (JPEG, PNG, WebP).

### Camera Permission Utilities

Located in `src/utils/cameraPermissions.ts`:

#### `requestCameraPermission(options?: MediaStreamConstraints): Promise<MediaStream>`

Request camera access from the user.

```tsx
import { requestCameraPermission } from '@/utils/cameraPermissions';

const stream = await requestCameraPermission({
  video: { facingMode: 'environment' },
  audio: false
});
```

#### `stopCameraStream(stream: MediaStream): void`

Stop all tracks in a media stream.

```tsx
import { stopCameraStream } from '@/utils/cameraPermissions';

stopCameraStream(mediaStream);
```

#### `checkCameraPermission(): Promise<PermissionStatus>`

Check the current camera permission status without requesting.

```tsx
import { checkCameraPermission } from '@/utils/cameraPermissions';

const status = await checkCameraPermission(); // 'granted' | 'denied' | 'prompt'
```

#### `getUserFriendlyErrorMessage(error: any): string`

Convert technical error to user-friendly message.

## Cross-Platform Compatibility

### iOS Safari

✅ **Supported**

- Works with iOS 11+
- Requires HTTPS connection
- Camera access permission must be granted through Settings → Safari
- Both front and back cameras supported
- Use `navigator.mediaDevices.getUserMedia()` for best compatibility

### Android Chrome

✅ **Supported**

- Works with Chrome 47+
- Requires HTTPS connection
- Camera permission must be granted through app settings
- Both front and back cameras supported
- Handles device orientation changes

### Desktop Browsers

✅ **Chrome** - Full support
✅ **Firefox** - Full support
✅ **Safari** - Full support (macOS 10.15+)
✅ **Edge** - Full support

**Note:** HTTPS is required on all platforms except localhost.

## Error Handling

The component handles various permission and access errors gracefully:

### Permission Denied
```
"Camera permission denied. Please allow access in your browser settings."
```

### No Camera Found
```
"No camera device found. Please check if your device has a camera."
```

### Not Secure (HTTP on non-localhost)
```
"Camera access requires a secure connection (HTTPS)"
```

### Browser Not Supported
```
"Camera API is not supported in this browser"
```

## Image Compression Details

The component automatically compresses images to:

- **Max dimensions:** 1920x1440 (default)
- **JPEG quality:** 0.8 (default, 0-1 scale)
- **Max file size:** 5MB (default)
- **Maintains aspect ratio**

If the compressed image exceeds the max file size, the component automatically retries with lower quality (0.2 reduction).

### Compression Algorithm

1. Load image from File using FileReader
2. Create new Image object from data URL
3. Calculate new dimensions maintaining aspect ratio
4. Draw image to Canvas with new dimensions
5. Convert canvas to JPEG blob with specified quality
6. Convert blob to File object

## Accessibility

The component includes several accessibility features:

- **ARIA Labels:** All buttons have descriptive `aria-label` attributes
- **Keyboard Navigation:** All controls are keyboard accessible
- **Focus Management:** Visual focus indicators on all interactive elements
- **Semantic HTML:** Proper use of HTML5 elements and attributes

## Testing

The component includes comprehensive test coverage with 30+ test cases.

### Run Tests

```bash
npm test
```

### Test Coverage

- ✅ Camera access and initialization
- ✅ Permission handling
- ✅ Image capture and preview
- ✅ Image compression
- ✅ Camera switching (front/back)
- ✅ Retake functionality
- ✅ File upload fallback
- ✅ Error scenarios
- ✅ Accessibility features

### Test Files

- `CameraCapture.spec.tsx` - Component tests
- `imageCompression.spec.ts` - Compression utility tests
- `cameraPermissions.spec.ts` - Permission utility tests

## Performance Considerations

1. **Lazy Loading:** Component requests camera only when mounted
2. **Stream Cleanup:** Properly stops all tracks on unmount
3. **Memory Management:** Revokes object URLs after use
4. **Canvas Optimization:** Uses efficient image drawing and compression
5. **File Size Optimization:** Automatically compresses to meet size constraints

## Browser Support Matrix

| Browser | Min Version | iOS | Android | Desktop |
|---------|-------------|-----|---------|---------|
| Chrome | 47 | - | ✅ | ✅ |
| Firefox | 52 | - | ✅ | ✅ |
| Safari | 11 | ✅ | - | ✅ (10.15+) |
| Edge | 79 | - | - | ✅ |

## Security Considerations

1. **HTTPS Only:** Camera access requires HTTPS (except localhost)
2. **User Permission:** Users must explicitly grant camera access
3. **No Data Transmission:** Image stays on device until explicitly uploaded
4. **File Validation:** Only JPEG, PNG, and WebP files accepted
5. **Local Processing:** All image compression happens client-side

## Troubleshooting

### Camera Not Showing

1. Check if HTTPS is enabled (except localhost)
2. Verify camera permission is granted in browser settings
3. Check if another app is using the camera
4. Try a different browser

### Blurry Images

1. Ensure good lighting
2. Hold device steady while capturing
3. Reduce compression quality setting
4. Check device camera resolution

### Permission Denied

1. Go to browser settings and allow camera access
2. Clear site data and reload
3. Try in a private/incognito window
4. Check OS-level camera permissions

### File Too Large

1. Reduce `compressionQuality` prop
2. Reduce `maxFileSize` and let component auto-compress
3. Try capturing in lower lighting (less detail to compress)

## Future Enhancements

- [ ] Multiple camera selection (if device has >2 cameras)
- [ ] Image filters and rotation
- [ ] Batch capture mode
- [ ] Document detection and auto-crop
- [ ] OCR integration for receipt parsing
- [ ] Upload progress tracking
- [ ] Retry mechanism for failed uploads
