import { useTranslation } from 'react-i18next';
import type { WizardState } from '../../../types/wizard';

interface TaxTipStepProps {
    value: Pick<WizardState, 'taxAmount' | 'tipAmount' | 'totalAmount' | 'currency'>;
    onChange: (patch: Partial<WizardState>) => void;
    errors: Record<string, string>;
}

const QUICK_TIP_PERCENTAGES = [10, 15, 18, 20, 25];

export const TaxTipStep = ({ value, onChange, errors }: TaxTipStepProps) => {
    const { t } = useTranslation();

    const applyTipPercent = (pct: number) => {
        onChange({ tipAmount: parseFloat(((value.totalAmount * pct) / 100).toFixed(2)) });
    };

    const grandTotal = value.totalAmount + value.taxAmount + value.tipAmount;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">{t('wizard.taxTip.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('wizard.taxTip.subtitle')}</p>
            </div>

            {/* Tax */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">{t('wizard.taxTip.taxLabel')}</h3>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {value.currency}
                    </span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.taxAmount === 0 ? '' : value.taxAmount}
                        onChange={(e) => onChange({ taxAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className={`w-full pl-14 pr-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow
                            ${errors.taxAmount ? 'border-red-400' : 'border-gray-200'}`}
                    />
                </div>
                {errors.taxAmount && (
                    <p className="text-xs text-red-500">{errors.taxAmount}</p>
                )}
            </div>

            {/* Tip */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">{t('wizard.taxTip.tipLabel')}</h3>

                {/* Quick-tip buttons */}
                <div className="flex gap-2 flex-wrap">
                    {QUICK_TIP_PERCENTAGES.map((pct) => {
                        const tipValue = parseFloat(((value.totalAmount * pct) / 100).toFixed(2));
                        const isActive = Math.abs(value.tipAmount - tipValue) < 0.01;
                        return (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => applyTipPercent(pct)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all min-h-[36px]
                                    ${isActive
                                        ? 'bg-purple-500 text-white border-purple-500'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                                    }`}
                            >
                                {pct}%
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => onChange({ tipAmount: 0 })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all min-h-[36px]"
                    >
                        {t('wizard.taxTip.noTip')}
                    </button>
                </div>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {value.currency}
                    </span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.tipAmount === 0 ? '' : value.tipAmount}
                        onChange={(e) => onChange({ tipAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow"
                    />
                </div>
            </div>

            {/* Grand total summary */}
            <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('wizard.taxTip.subtotal')}</span>
                    <span>{value.currency} {value.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('wizard.taxTip.taxLabel')}</span>
                    <span>+ {value.currency} {value.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('wizard.taxTip.tipLabel')}</span>
                    <span>+ {value.currency} {value.tipAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-purple-200">
                    <span>{t('wizard.taxTip.grandTotal')}</span>
                    <span>{value.currency} {grandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};
