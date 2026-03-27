import { useTranslation } from 'react-i18next';
import type { WizardState } from '../../../types/wizard';
import { SUPPORTED_CURRENCIES } from '../../../types/wizard';

interface BasicInfoStepProps {
    value: Pick<WizardState, 'title' | 'currency' | 'totalAmount'>;
    onChange: (patch: Partial<WizardState>) => void;
    errors: Record<string, string>;
}

export const BasicInfoStep = ({ value, onChange, errors }: BasicInfoStepProps) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6" role="group" aria-labelledby="basic-info-heading">
            <div>
                <h2 id="basic-info-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('wizard.basicInfo.title')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('wizard.basicInfo.subtitle')}</p>
            </div>

            {/* Split Title */}
            <div className="space-y-1.5">
                <label 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300" 
                    htmlFor="split-title"
                >
                    {t('wizard.basicInfo.splitTitle')} 
                    <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only"> (required)</span>
                </label>
                <input
                    id="split-title"
                    type="text"
                    value={value.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder={t('wizard.basicInfo.splitTitlePlaceholder')}
                    aria-required="true"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'split-title-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl border text-gray-900 dark:text-gray-100 placeholder-gray-400 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow
                        ${errors.title ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                />
                {errors.title && (
                    <p id="split-title-error" className="text-xs text-red-500 mt-1" role="alert">
                        {errors.title}
                    </p>
                )}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
                <label 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300" 
                    htmlFor="currency"
                >
                    {t('wizard.basicInfo.currency')} 
                    <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only"> (required)</span>
                </label>
                <select
                    id="currency"
                    value={value.currency}
                    onChange={(e) => onChange({ currency: e.target.value })}
                    aria-required="true"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow appearance-none"
                >
                    {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                </select>
            </div>

            {/* Total Amount */}
            <div className="space-y-1.5">
                <label 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300" 
                    htmlFor="total-amount"
                >
                    {t('wizard.basicInfo.totalAmount')} 
                    <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only"> (required)</span>
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                        {value.currency}
                    </span>
                    <input
                        id="total-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.totalAmount === 0 ? '' : value.totalAmount}
                        onChange={(e) => onChange({ totalAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        aria-required="true"
                        aria-invalid={!!errors.totalAmount}
                        aria-describedby={errors.totalAmount ? 'total-amount-error' : undefined}
                        className={`w-full pl-14 pr-4 py-3 rounded-xl border text-gray-900 dark:text-gray-100 placeholder-gray-400 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow
                            ${errors.totalAmount ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                    />
                </div>
                {errors.totalAmount && (
                    <p id="total-amount-error" className="text-xs text-red-500 mt-1" role="alert">
                        {errors.totalAmount}
                    </p>
                )}
            </div>
        </div>
    );
};

