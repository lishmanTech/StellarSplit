import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import type { Participant } from './SplitCalculator';

interface CustomSplitCalcProps {
  participants: Participant[];
  totalAmount: number;
  currency: string;
  onParticipantsChange: (participants: Participant[]) => void;
  onTotalChange: (total: number) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  XLM: 'XLM',
};

export function CustomSplitCalc({
  participants,
  totalAmount,
  currency,
  onParticipantsChange,
  onTotalChange,
}: CustomSplitCalcProps) {
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const participantTotal = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.amount, 0);
  }, [participants]);

  const difference = totalAmount - participantTotal;
  const isBalanced = Math.abs(difference) < 0.01;
  const isOver = difference < 0;

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

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    onParticipantsChange(
      participants.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  return (
    <div className="space-y-6">
      {/* Total Expected */}
      <div>
        <label 
          htmlFor="custom-total" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('calculator.expectedTotal')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {currencySymbol}
          </span>
          <input
            id="custom-total"
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

      {/* Balance Indicator */}
      <div 
        className={`flex items-center gap-3 p-4 rounded-lg ${
          isBalanced 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : isOver
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
        }`}
        role="status"
        aria-live="polite"
      >
        {isBalanced ? (
          <CheckCircle size={24} aria-hidden="true" />
        ) : (
          <AlertCircle size={24} aria-hidden="true" />
        )}
        <div className="flex-1">
          <p className="font-medium">
            {isBalanced 
              ? t('calculator.balanced')
              : isOver 
                ? t('calculator.overAllocated')
                : t('calculator.underAllocated')
            }
          </p>
          <p className="text-sm opacity-80">
            {t('calculator.runningTotal')}: {currencySymbol}{participantTotal.toFixed(2)} / {currencySymbol}{totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">
            {isOver ? '-' : '+'}{currencySymbol}{Math.abs(difference).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DollarSign size={20} aria-hidden="true" />
            {t('calculator.participants')}
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
                onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                placeholder={t('calculator.participantName')}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label={`${t('calculator.participant')} ${index + 1} name`}
              />
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={participant.amount || ''}
                  onChange={(e) => updateParticipant(participant.id, { amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  aria-label={`${participant.name} amount`}
                />
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

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            {t('calculator.allocated')}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {Math.min(100, (participantTotal / (totalAmount || 1)) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isBalanced 
                ? 'bg-green-500' 
                : isOver 
                  ? 'bg-red-500' 
                  : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, (participantTotal / (totalAmount || 1)) * 100)}%` }}
            role="progressbar"
            aria-valuenow={participantTotal}
            aria-valuemin={0}
            aria-valuemax={totalAmount || 100}
            aria-label={t('calculator.allocationProgress')}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                {participant.name}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {currencySymbol}{participant.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {t('calculator.runningTotal')}
            </span>
            <span className={`font-bold ${isBalanced ? 'text-green-600' : isOver ? 'text-red-600' : 'text-amber-600'}`}>
              {currencySymbol}{participantTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
