# CameraCapture Integration Guide

This guide demonstrates how to integrate the CameraCapture component into your application.

## Quick Start

### 1. Basic Integration

```tsx
import { useState } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { toast } from 'react-hot-toast';

export function ReceiptUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const handleCapture = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadedImage(file);

      // Upload to your server
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success('Receipt uploaded successfully');
      // Handle success (e.g., redirect, refresh list)
    } catch (error) {
      toast.error('Failed to upload receipt');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('Camera error:', error);
    toast.error('Camera error: ' + error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Receipt
        </h1>
        <p className="text-gray-600 mb-8">
          Take a photo or upload an image of your receipt
        </p>

        {!uploadedImage ? (
          <CameraCapture
            onCapture={handleCapture}
            onError={handleError}
          />
        ) : (
          <div className="text-center py-8">
            <img
              src={URL.createObjectURL(uploadedImage)}
              alt="Uploaded receipt"
              className="max-w-md mx-auto rounded-lg shadow-lg mb-4"
            />
            <button
              onClick={() => setUploadedImage(null)}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Capture Another
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin mr-2">⏳</div>
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Modal Integration

```tsx
import { useState } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { X } from 'lucide-react';

export function ReceiptUploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Capture Receipt</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <CameraCapture
            onCapture={(file) => {
              onUpload(file);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

### 3. With Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { CameraCapture } from '@/components/CameraCapture';

interface PaymentFormData {
  amount: number;
  currency: string;
  receipt: File;
  description: string;
}

export function PaymentForm() {
  const { register, handleSubmit, setValue, watch } = useForm<PaymentFormData>();
  const receipt = watch('receipt');

  const handleCapture = (file: File) => {
    setValue('receipt', file);
  };

  return (
    <form onSubmit={handleSubmit(async (data) => {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('currency', data.currency);
      formData.append('receipt', data.receipt);
      formData.append('description', data.description);

      const response = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Handle success
      }
    })}>
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            {...register('amount', { required: 'Amount is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Currency Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            {...register('currency', { required: 'Currency is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        {/* Receipt Capture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt
          </label>
          {!receipt ? (
            <CameraCapture onCapture={handleCapture} />
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(receipt)}
                  alt="Receipt preview"
                  className="w-full h-auto"
                />
              </div>
              <button
                type="button"
                onClick={() => setValue('receipt', undefined as any)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Change Receipt
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Add any notes..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
        >
          Submit Payment
        </button>
      </div>
    </form>
  );
}
```

### 4. With State Management (Zustand)

```tsx
import { create } from 'zustand';
import { CameraCapture } from '@/components/CameraCapture';

interface ReceiptStore {
  capturedFiles: File[];
  addReceipt: (file: File) => void;
  removeReceipt: (index: number) => void;
  clearReceipts: () => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  capturedFiles: [],
  addReceipt: (file) =>
    set((state) => ({
      capturedFiles: [...state.capturedFiles, file],
    })),
  removeReceipt: (index) =>
    set((state) => ({
      capturedFiles: state.capturedFiles.filter((_, i) => i !== index),
    })),
  clearReceipts: () => set({ capturedFiles: [] }),
}));

export function ReceiptGallery() {
  const { capturedFiles, addReceipt, removeReceipt } = useReceiptStore();

  return (
    <div className="space-y-6">
      {/* Camera Capture */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Capture Receipts</h2>
        <CameraCapture onCapture={addReceipt} />
      </div>

      {/* Captured Receipts Gallery */}
      {capturedFiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Captured Receipts ({capturedFiles.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {capturedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Receipt ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={() => removeReceipt(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete receipt"
                >
                  ×
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. With Loading and Error States

```tsx
import { useState } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function ReceiptUploadWithStates() {
  const [state, setState] = useState<
    'idle' | 'capturing' | 'uploading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleCapture = async (file: File) => {
    setState('uploading');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadedFile(file);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  return (
    <div className="space-y-6">
      {state === 'idle' && (
        <CameraCapture
          onCapture={handleCapture}
          onError={(error) => {
            setError(error.message);
            setState('error');
          }}
        />
      )}

      {state === 'uploading' && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full" />
            </div>
            <p className="text-gray-600">Uploading receipt...</p>
          </div>
        </div>
      )}

      {state === 'success' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600 mr-2" size={24} />
            <p className="text-green-800">Receipt uploaded successfully!</p>
          </div>
          {uploadedFile && (
            <img
              src={URL.createObjectURL(uploadedFile)}
              alt="Uploaded receipt"
              className="w-full rounded-lg shadow-lg max-h-96 object-cover"
            />
          )}
          <button
            onClick={() => setState('idle')}
            className="w-full px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Upload Another Receipt
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="text-red-600 mr-2" size={24} />
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setState('idle')}
            className="w-full px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
```

## Integration Checklist

- [ ] Import CameraCapture component
- [ ] Implement `onCapture` callback to handle captured files
- [ ] (Optional) Implement `onError` callback for error handling
- [ ] Configure `maxFileSize` if needed (default 5MB)
- [ ] Configure `compressionQuality` if needed (default 0.8)
- [ ] Add loading/success/error states in parent component
- [ ] Test on iOS Safari and Android Chrome
- [ ] Ensure HTTPS is enabled (except localhost)
- [ ] Add camera permission explanation to users
- [ ] Test on multiple device types

## Environment Setup

### Development

```bash
# Install dependencies
npm install

# Run development server with HTTPS
npm run dev
```

Note: For local testing with camera on browsers, use `localhost` (HTTPS is required otherwise).

### Production

1. Ensure your domain uses HTTPS
2. Users will be prompted to allow camera access
3. Camera permissions are per-domain, so https://example.com and https://app.example.com are separate

## API Integration Example

```tsx
// api/receipts.ts
import axios from 'axios';

export const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await axios.post('/api/receipts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Usage in component
const handleCapture = async (file: File) => {
  try {
    const result = await uploadReceipt(file);
    toast.success('Receipt uploaded');
  } catch (error) {
    toast.error('Upload failed');
  }
};
```

## Styling Customization

The component uses Tailwind CSS classes. To customize styling, either:

1. **Modify component CSS classes directly** in `CameraCapture.tsx`
2. **Use CSS modules** by creating a `CameraCapture.module.css`
3. **Use styled-components** by updating the component

## Performance Tips

1. Use image compression with appropriate quality settings
2. Implement lazy loading for the component if not immediately visible
3. Cache permission checks to avoid repeated requests
4. Implement request debouncing for rapid captures
5. Clean up resources on unmount

## Debugging

Enable debug logging:

```tsx
<CameraCapture
  onCapture={(file) => {
    console.log('File captured:', file);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
  }}
  onError={(error) => {
    console.error('Full error object:', error);
  }}
/>
```

## Support

For issues or feature requests, please refer to the main project README or create an issue.
