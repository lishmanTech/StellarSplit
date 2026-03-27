import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Users } from 'lucide-react';
import type { Participant } from './SplitCalculator';

interface EqualSplitCalcProps {
  participants: Participant[];
  totalAmount: number;
  taxAmount: number;
  tipAmount: number;
  currency: string;
  onParticipantsChange: (participants: Participant[]) => void;
  onTotalChange: (total: number) => void;
  onTaxChange: (tax: number) => void;
  onTipChange: (tip: number) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  XLM: 'XLM',
};

export function EqualSplitCalc({
  participants,
  totalAmount,
  taxAmount,
  tipAmount,
  currency,
  onParticipantsChange,
  onTotalChange,
  onTaxChange,
  onTipChange,
}: EqualSplitCalcProps) {
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const subtotal = totalAmount + taxAmount + tipAmount;

  const perPersonAmount = useMemo(() => {
    if (participants.length === 0) return 0;
    const base = subtotal / participants.length;
    return Math.round(base * 100) / 100;
  }, [subtotal, participants.length]);

  const addParticipant = () => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: `Person ${participants.length + 1}`,
      amount: 0,
      percentage: 0,
      items: [],
    };
    onParticipantsChange([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) return;
    onParticipantsChange(participants.filter(p => p.id !== id));
  };

  const updateParticipantName = (id: string, name: string) => {
    onParticipantsChange(
      participants.map(p => p.id === id ? { ...p, name } : p)
    );
  };

  return (
    <div className="space-y-6">
      {/* Total Amount Input */}
      <div>
        <label 
          htmlFor="equal-total" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('calculator.totalAmount')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {currencySymbol}
          </span>
          <input
            id="equal-total"
            type="number"
            min="0"
            step="0.01"
            value={totalAmount || ''}
            onChange={(e) => onTotalChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Tax and Tip */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="equal-tax" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('calculator.tax')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {currencySymbol}
            </span>
            <input
              id="equal-tax"
              type="number"
              min="0"
              step="0.01"
              value={taxAmount || ''}
              onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
        <div>
          <label 
            htmlFor="equal-tip" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('calculator.tip')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {currencySymbol}
            </span>
            <input
              id="equal-tip"
              type="number"
              min="0"
              step="0.01"
              value={tipAmount || ''}
              onChange={(e) => onTipChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users size={20} aria-hidden="true" />
            {t('calculator.participants')} ({participants.length})
          </h3>
          <button
            onClick={addParticipant}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
            aria-label={t('calculator.addParticipant')}
          >
            <Plus size={16} aria-hidden="true" />
            {t('calculator.add')}
          </button>
        </div>

        <div className="space-y-3">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
                {participant.name.charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                value={participant.name}
                onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                placeholder={t('calculator.participantName')}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label={`${t('calculator.participant')} ${index + 1} name`}
              />
              <div className="text-right min-w-[100px]">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currencySymbol}{perPersonAmount.toFixed(2)}
                </span>
              </div>
              {participants.length > 2 && (
                <button
                  onClick={() => removeParticipant(participant.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label={`${t('calculator.remove')} ${participant.name}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-[var(--color-primary)]/10 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t('calculator.perPerson')}
          </span>
          <span className="text-xl font-bold text-[var(--color-primary)]">
            {currencySymbol}{perPersonAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-600 dark:text-gray-400">
            {t('calculator.subtotal')}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {currencySymbol}{subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
