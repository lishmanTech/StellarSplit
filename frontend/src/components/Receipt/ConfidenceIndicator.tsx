import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceIndicator = ({
  confidence,
  size = 'md',
}: ConfidenceIndicatorProps) => {
  const getColor = () => {
    if (confidence >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (confidence >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  };

  const getIcon = () => {
    if (confidence >= 80) return <CheckCircle size={16} />;
    if (confidence >= 50) return <AlertTriangle size={16} />;
    return <AlertCircle size={16} />;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const colors = getColor();

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      {getIcon()}
      <span className="font-medium">{confidence}%</span>
    </div>
  );
};
