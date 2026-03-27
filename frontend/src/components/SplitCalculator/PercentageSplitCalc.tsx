import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, PieChart, AlertCircle } from 'lucide-react';
import type { Participant } from './SplitCalculator';

interface PercentageSplitCalcProps {
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

export function PercentageSplitCalc({
  participants,
  totalAmount,
  taxAmount,
  tipAmount,
  currency,
  onParticipantsChange,
  onTotalChange,
  onTaxChange,
  onTipChange,
}: PercentageSplitCalcProps) {
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const subtotal = totalAmount + taxAmount + tipAmount;

  const totalPercentage = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.percentage, 0);
  }, [participants]);

  const isValid = Math.abs(totalPercentage - 100) < 0.01;

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

  const calculateAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};
    
    participants.forEach(p => {
      if (isValid) {
        amounts[p.id] = Math.round((subtotal * p.percentage / 100) * 100) / 100;
      } else {
        amounts[p.id] = 0;
      }
    });

    return amounts;
  }, [participants, subtotal, isValid]);

  // Pie chart data
  const pieChartSegments = useMemo(() => {
    if (!isValid) return [];
    
    let currentAngle = 0;
    const colors = [
      '#6C63FF', '#8B85FF', '#FF6B6B', '#4ECDC4', 
      '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
    ];
    
    return participants.map((p, i) => {
      const angle = (p.percentage / 100) * 360;
      const segment = {
        id: p.id,
        name: p.name,
        percentage: p.percentage,
        color: colors[i % colors.length],
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      };
      currentAngle += angle;
      return segment;
    });
  }, [participants, isValid]);

  const describeArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians)),
    };
  };

  return (
    <div className="space-y-6">
      {/* Total Amount Input */}
      <div>
        <label 
          htmlFor="percentage-total" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('calculator.totalAmount')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {currencySymbol}
          </span>
          <input
            id="percentage-total"
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
            htmlFor="percentage-tax" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('calculator.tax')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {currencySymbol}
            </span>
            <input
              id="percentage-tax"
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
            htmlFor="percentage-tip" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('calculator.tip')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {currencySymbol}
            </span>
            <input
              id="percentage-tip"
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

      {/* Percentage Validation */}
      {!isValid && (
        <div 
          className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg"
          role="alert"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span className="text-sm">
            {t('calculator.percentageWarning')}: {totalPercentage.toFixed(1)}% (must equal 100%)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <PieChart size={20} aria-hidden="true" />
              {t('calculator.percentages')}
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
                <div 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: pieChartSegments[index]?.color || '#6C63FF' }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={participant.name}
                  onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                  placeholder={t('calculator.participantName')}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  aria-label={`${t('calculator.participant')} ${index + 1} name`}
                />
                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={participant.percentage || ''}
                    onChange={(e) => updateParticipant(participant.id, { percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    aria-label={`${participant.name} percentage`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    %
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

        {/* Pie Chart */}
        <div className="flex flex-col items-center justify-center">
          <svg 
            viewBox="0 0 200 200" 
            className="w-48 h-48"
            role="img"
            aria-label={t('calculator.pieChart')}
          >
            {pieChartSegments.length > 0 ? (
              pieChartSegments.map((segment) => (
                <path
                  key={segment.id}
                  d={describeArc(100, 100, 80, segment.startAngle, segment.endAngle)}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))
            ) : (
              <circle cx="100" cy="100" r="80" fill="#e5e7eb" />
            )}
          </svg>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {pieChartSegments.map((segment) => (
              <div key={segment.id} className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {segment.name}: {segment.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('calculator.breakdown')}
        </h4>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: pieChartSegments.find(s => s.id === participant.id)?.color }}
                  aria-hidden="true"
                />
                {participant.name} ({participant.percentage}%)
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {currencySymbol}{(calculateAmounts[participant.id] || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {t('calculator.total')}
            </span>
            <span className="font-bold text-[var(--color-primary)]">
              {currencySymbol}{subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
