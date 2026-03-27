# CameraCapture Quick Reference

## Import

```tsx
import { CameraCapture } from '@/components/CameraCapture';
```

## Basic Usage

```tsx
<CameraCapture onCapture={(file) => console.log(file)} />
```

## With All Props

```tsx
<CameraCapture
  onCapture={(file) => handleUpload(file)}
  onError={(error) => handleError(error)}
  maxFileSize={3 * 1024 * 1024}  // 3MB
  compressionQuality={0.7}        // 0-1
/>
```

## Component States

| State | UI | Description |
|-------|----|----|
| `idle` | Initial state | Component ready to load camera |
| `requesting` | Loading spinner | Requesting camera permission |
| `active` | Camera preview | Camera stream active, ready to capture |
| `captured` | Image preview | Photo captured, ready to confirm |
| `error` | Error message | Camera/permission error occurred |

## Event Handlers

### onCapture(file: File)
Called when user confirms captured and compressed image.

```tsx
const handleCapture = (file: File) => {
  console.log(file.name);      // "receipt.jpg"
  console.log(file.type);      // "image/jpeg"
  console.log(file.size);      // bytes
};
```

### onError(error: Error)
Called when camera access or compression fails.

```tsx
const handleError = (error: Error) => {
  console.error(error.message);
  // Check error.permissionError for detailed error info
  if ((error as any).permissionError?.type === 'permission-denied') {
    // User denied permission
  }
};
```

## Utility Functions

### Image Compression

```tsx
import { compressImage, formatFileSize } from '@/utils/imageCompression';

const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.8
});

console.log(formatFileSize(compressed.size)); // "1.2 MB"
```

### Camera Permissions

```tsx
import {
  checkCameraPermission,
  requestCameraPermission,
  stopCameraStream
} from '@/utils/cameraPermissions';

// Check permission without requesting
const status = await checkCameraPermission(); // "granted" | "denied" | "prompt"

// Request camera access
const stream = await requestCameraPermission({
  video: { facingMode: 'environment' },
  audio: false
});

// Stop camera
stopCameraStream(stream);
```

## Common Patterns

### Upload to Server

```tsx
const handleCapture = async (file: File) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await fetch('/api/receipts', {
    method: 'POST',
    body: formData
  });
};
```

### Preview Before Upload

```tsx
const [preview, setPreview] = useState<string>('');

const handleCapture = (file: File) => {
  setPreview(URL.createObjectURL(file));
  // Show preview, let user confirm before upload
};
```

### With Error Toast

```tsx
import toast from 'react-hot-toast';

<CameraCapture
  onCapture={(file) => {
    toast.success('Receipt captured');
  }}
  onError={(error) => {
    toast.error(error.message);
  }}
/>
```

### Multiple Captures

```tsx
const [captures, setCaptures] = useState<File[]>([]);

<CameraCapture
  onCapture={(file) => {
    setCaptures([...captures, file]);
  }}
/>

{captures.map((file, idx) => (
  <img
    key={idx}
    src={URL.createObjectURL(file)}
    alt={`Receipt ${idx + 1}`}
  />
))}
```

## Mobile Testing

### iOS Safari
1. Open Safari on iOS device
2. Navigate to HTTPS URL
3. Allow camera permission when prompted
4. Component works with rear and front camera

### Android Chrome
1. Open Chrome on Android device
2. Navigate to HTTPS URL
3. Allow camera permission in app settings
4. Component works with rear and front camera

## Troubleshooting

### Camera not showing
```
✓ Check HTTPS is enabled
✓ Verify camera permission is granted
✓ Check if browser supports Camera API
✓ Try different browser
```

### Permission denied
```
✓ Go to browser/app settings
✓ Grant camera permission
✓ Reload page
✓ Try incognito/private window
```

### File too large
```
✓ Reduce compressionQuality prop
✓ Reduce maxFileSize prop
✓ Try better lighting (less detail)
```

### Blurry images
```
✓ Hold device steady
✓ Ensure good lighting
✓ Clean camera lens
✓ Reduce compressionQuality
```

## Props Reference

```typescript
interface CameraCaptureProps {
  /** 
   * Required callback when image is captured and compressed
   */
  onCapture: (file: File) => void;

  /** 
   * Optional error handler
   */
  onError?: (error: Error) => void;

  /** 
   * Max file size in bytes, default 5MB
   * If exceeded, automatically retries with lower quality
   */
  maxFileSize?: number;

  /** 
   * JPEG quality 0-1, default 0.8
   * Lower = smaller file but worse quality
   */
  compressionQuality?: number;
}
```

## File Details

### Component Location
- Main: `frontend/src/components/CameraCapture/CameraCapture.tsx`
- Exports: `frontend/src/components/CameraCapture/index.ts`

### Utilities Location
- Compression: `frontend/src/utils/imageCompression.ts`
- Permissions: `frontend/src/utils/cameraPermissions.ts`

### Tests Location
- Component: `frontend/src/components/CameraCapture/CameraCapture.spec.tsx`
- Image Compression: `frontend/src/utils/imageCompression.spec.ts`
- Permissions: `frontend/src/utils/cameraPermissions.spec.ts`

### Documentation Location
- Full docs: `frontend/src/components/CameraCapture/README.md`
- Integration examples: `frontend/src/components/CameraCapture/INTEGRATION_GUIDE.md`

## Browser Support

| Browser | Support | Min Version |
|---------|---------|------------|
| Chrome | ✅ Full | 47 |
| Firefox | ✅ Full | 52 |
| Safari | ✅ Full | 11 (iOS), 10.15 (Mac) |
| Edge | ✅ Full | 79 |

## Environment Requirements

- React 19+
- TypeScript 5.9+
- Tailwind CSS 4.1+
- HTTPS (except localhost)
- Modern browser with Camera API support

## Performance Tips

1. **Lazy load** - Only mount when needed
2. **Clean up** - Component auto-cleans on unmount
3. **Compress** - Automatic file optimization
4. **Cache** - Reuse compressed files if possible
5. **Monitor** - Check console for warnings

## Security Checklist

- ✅ HTTPS enforced (except localhost)
- ✅ User permission required
- ✅ No unauthorized access
- ✅ Local processing only
- ✅ Type validation on uploads

---

For complete documentation, see:
- **README.md** - Full feature documentation
- **INTEGRATION_GUIDE.md** - Integration patterns and examples
