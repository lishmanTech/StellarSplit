import { useState } from 'react';
import { Trash2, Plus, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import { ConfidenceIndicator } from './ConfidenceIndicator';

export interface ParsedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  confidence: number;
  receiptRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ParsedItemEditorProps {
  items: ParsedItem[];
  currency: string;
  onItemsChange: (items: ParsedItem[]) => void;
  onItemHover?: (itemId: string | null) => void;
}

export const ParsedItemEditor = ({
  items,
  currency,
  onItemsChange,
  onItemHover,
}: ParsedItemEditorProps) => {
  useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onItemsChange(updated);
  };

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ParsedItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      price: 0,
      confidence: 0,
    };
    onItemsChange([...items, newItem]);
    setEditingId(newItem.id);
  };

  const handleDuplicateItem = (item: ParsedItem) => {
    const newItem: ParsedItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    onItemsChange([...items, newItem]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Parsed Items</h3>
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            aria-label="Add new item"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No items parsed yet</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => onItemHover?.(item.id)}
              onMouseLeave={() => onItemHover?.(null)}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { name: e.target.value })
                    }
                    placeholder="Item name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={() => setEditingId(null)}
                    autoFocus
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      placeholder="Qty"
                      min="1"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Price"
                      step="0.01"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-center font-medium text-sm">
                      {formatCurrency(item.quantity * item.price, currency)}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingId(item.id)}
                  className="cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatCurrency(item.price, currency)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.quantity * item.price, currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <ConfidenceIndicator confidence={item.confidence} size="sm" />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateItem(item);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                        aria-label="Duplicate item"
                      >
                        <Copy size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        aria-label="Delete item"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer with Total */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
