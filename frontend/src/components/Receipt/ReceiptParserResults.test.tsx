import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptParserResults } from './ReceiptParserResults';
import type { ParsedItem } from './ParsedItemEditor';

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components
vi.mock('./ReceiptImageViewer', () => ({
  ReceiptImageViewer: () => <div data-testid="image-viewer">Image Viewer</div>,
}));

vi.mock('./ParsedItemEditor', () => ({
  ParsedItemEditor: () => (
    <div data-testid="item-editor">Item Editor</div>
  ),
}));

vi.mock('./TotalReconciliationBanner', () => ({
  TotalReconciliationBanner: () => <div data-testid="banner">Banner</div>,
}));

describe('ReceiptParserResults', () => {
  const mockImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const mockItems: ParsedItem[] = [
    {
      id: '1',
      name: 'Item 1',
      quantity: 1,
      price: 10,
      confidence: 95,
    },
  ];

  const mockOnAccept = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnReject.mockClear();
  });

  it('renders all major sections', () => {
    render(
      <ReceiptParserResults
        imageUrl={mockImageUrl}
        items={mockItems}
        receiptTotal={10}
        currency="USD"
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />
    );
    expect(screen.getByText('Review Receipt')).toBeDefined();
    expect(screen.getByTestId('banner')).toBeDefined();
    expect(screen.getByTestId('image-viewer')).toBeDefined();
    expect(screen.getByTestId('item-editor')).toBeDefined();
  });

  it('calls onReject when reject button is clicked', () => {
    render(
      <ReceiptParserResults
        imageUrl={mockImageUrl}
        items={mockItems}
        receiptTotal={10}
        currency="USD"
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />
    );
    const rejectBtn = screen.getByText('Reject');
    fireEvent.click(rejectBtn);
    expect(mockOnReject).toHaveBeenCalled();
  });

  it('calls onAccept when accept all button is clicked with high confidence items', () => {
    render(
      <ReceiptParserResults
        imageUrl={mockImageUrl}
        items={mockItems}
        receiptTotal={10}
        currency="USD"
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />
    );
    const acceptBtn = screen.getByText('Accept All');
    fireEvent.click(acceptBtn);
    expect(mockOnAccept).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(
      <ReceiptParserResults
        imageUrl={mockImageUrl}
        items={mockItems}
        receiptTotal={10}
        currency="USD"
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        isLoading={true}
      />
    );
    const rejectBtn = screen.getByText('Reject') as HTMLButtonElement;
    const acceptBtn = screen.getByText('Accept All') as HTMLButtonElement;
    expect(rejectBtn.disabled).toBe(true);
    expect(acceptBtn.disabled).toBe(true);
  });

  it('disables accept button when no items', () => {
    render(
      <ReceiptParserResults
        imageUrl={mockImageUrl}
        items={[]}
        receiptTotal={10}
        currency="USD"
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />
    );
    const acceptBtn = screen.getByText('Accept All') as HTMLButtonElement;
    expect(acceptBtn.disabled).toBe(true);
  });
});
