import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReceiptImageViewer } from './ReceiptImageViewer';

describe('ReceiptImageViewer', () => {
  const mockImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('renders receipt image', () => {
    render(<ReceiptImageViewer imageUrl={mockImageUrl} />);
    const img = screen.getByAltText('Receipt');
    expect(img).toBeDefined();
  });

  it('displays zoom controls', () => {
    render(<ReceiptImageViewer imageUrl={mockImageUrl} />);
    expect(screen.getByLabelText('Zoom in')).toBeDefined();
    expect(screen.getByLabelText('Zoom out')).toBeDefined();
  });

  it('zooms in on button click', () => {
    render(<ReceiptImageViewer imageUrl={mockImageUrl} />);
    const zoomInBtn = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/120%/)).toBeDefined();
  });

  it('zooms out on button click', () => {
    render(<ReceiptImageViewer imageUrl={mockImageUrl} />);
    const zoomInBtn = screen.getByLabelText('Zoom in');
    const zoomOutBtn = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText(/100%/)).toBeDefined();
  });

  it('disables zoom out at minimum', () => {
    render(<ReceiptImageViewer imageUrl={mockImageUrl} />);
    const zoomOutBtn = screen.getByLabelText('Zoom out') as HTMLButtonElement;
    expect(zoomOutBtn.disabled).toBe(true);
  });

  it('highlights region when provided', () => {
    const { container } = render(
      <ReceiptImageViewer
        imageUrl={mockImageUrl}
        highlightRegion={{ x: 10, y: 20, width: 30, height: 40 }}
      />
    );
    const highlight = container.querySelector('[style*="border-2"]');
    expect(highlight).toBeDefined();
  });

  it('calls onRegionClick when image is clicked', () => {
    const onRegionClick = vi.fn();
    render(
      <ReceiptImageViewer imageUrl={mockImageUrl} onRegionClick={onRegionClick} />
    );
    const img = screen.getByAltText('Receipt');
    fireEvent.click(img);
    expect(onRegionClick).toHaveBeenCalled();
  });
});
