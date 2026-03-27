import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';

interface TotalReconciliationBannerProps {
  receiptTotal: number;
  parsedTotal: number;
  currency: string;
  tolerance?: number; // threshold for mismatch warning (default 0.01)
}

export const TotalReconciliationBanner = ({
  receiptTotal,
  parsedTotal,
  currency,
  tolerance = 0.01,
}: TotalReconciliationBannerProps) => {
  useTranslation();
  const difference = Math.abs(receiptTotal - parsedTotal);
  const isMatching = difference <= tolerance;

  if (isMatching) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
        <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
        <div className="flex-1">
          <p className="font-semibold text-green-900">Totals Match</p>
          <p className="text-sm text-green-700">
            Receipt total: {formatCurrency(receiptTotal, currency)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
      <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-semibold text-red-900">Total Mismatch</p>
        <p className="text-sm text-red-700">
          Receipt: {formatCurrency(receiptTotal, currency)} | Parsed:{' '}
          {formatCurrency(parsedTotal, currency)} | Difference:{' '}
          {formatCurrency(difference, currency)}
        </p>
      </div>
    </div>
  );
};
