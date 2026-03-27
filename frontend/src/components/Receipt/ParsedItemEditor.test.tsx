import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParsedItemEditor, type ParsedItem } from './ParsedItemEditor';

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock formatCurrency
vi.mock('../../utils/format', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

describe('ParsedItemEditor', () => {
  const mockItems: ParsedItem[] = [
    {
      id: '1',
      name: 'Item 1',
      quantity: 2,
      price: 10,
      confidence: 95,
    },
    {
      id: '2',
      name: 'Item 2',
      quantity: 1,
      price: 5,
      confidence: 60,
    },
  ];

  const mockOnItemsChange = vi.fn();

  beforeEach(() => {
    mockOnItemsChange.mockClear();
  });

  it('renders all items', () => {
    render(
      <ParsedItemEditor
        items={mockItems}
        currency="USD"
        onItemsChange={mockOnItemsChange}
      />
    );
    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
  });

  it('displays total correctly', () => {
    render(
      <ParsedItemEditor
        items={mockItems}
        currency="USD"
        onItemsChange={mockOnItemsChange}
      />
    );
    // Total should be (2 * 10) + (1 * 5) = 25
    expect(screen.getByText('USD 25')).toBeDefined();
  });

  it('adds new item when Add Item button is clicked', () => {
    render(
      <ParsedItemEditor
        items={mockItems}
        currency="USD"
        onItemsChange={mockOnItemsChange}
      />
    );
    const addBtn = screen.getByLabelText('Add new item');
    fireEvent.click(addBtn);
    expect(mockOnItemsChange).toHaveBeenCalled();
    const newItems = mockOnItemsChange.mock.calls[0][0];
    expect(newItems.length).toBe(3);
  });

  it('deletes item when delete button is clicked', () => {
    render(
      <ParsedItemEditor
        items={mockItems}
        currency="USD"
        onItemsChange={mockOnItemsChange}
      />
    );
    const deleteButtons = screen.getAllByLabelText('Delete item');
    fireEvent.click(deleteButtons[0]);
    expect(mockOnItemsChange).toHaveBeenCalledWith([mockItems[1]]);
  });

  it('shows empty state when no items', () => {
    render(
      <ParsedItemEditor
        items={[]}
        currency="USD"
        onItemsChange={mockOnItemsChange}
      />
    );
    expect(screen.getByText('No items parsed yet')).toBeDefined();
  });

  it('calls onItemHover when hovering items', () => {
    const onItemHover = vi.fn();
    render(
      <ParsedItemEditor
        items={mockItems}
        currency="USD"
        onItemsChange={mockOnItemsChange}
        onItemHover={onItemHover}
      />
    );
    const itemElement = screen.getByText('Item 1').closest('div');
    fireEvent.mouseEnter(itemElement!.parentElement!);
    expect(onItemHover).toHaveBeenCalledWith('1');
    fireEvent.mouseLeave(itemElement!.parentElement!);
    expect(onItemHover).toHaveBeenCalledWith(null);
  });
});
