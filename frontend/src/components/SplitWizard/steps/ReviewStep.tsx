import { useTranslation } from 'react-i18next';
import { CheckCircle2, Users, Tag, Receipt, DollarSign } from 'lucide-react';
import type { WizardState } from '../../../types/wizard';

interface ReviewStepProps {
    value: WizardState;
}

const methodLabelKey: Record<WizardState['splitMethod'], string> = {
    equal: 'wizard.splitMethod.equal',
    itemized: 'wizard.splitMethod.itemized',
    percentage: 'wizard.splitMethod.percentage',
    custom: 'wizard.splitMethod.custom',
};

export const ReviewStep = ({ value }: ReviewStepProps) => {
    const { t } = useTranslation();

    const grandTotal = value.totalAmount + value.taxAmount + value.tipAmount;
    const equalShare =
        value.participants.length > 0
            ? grandTotal / value.participants.length
            : 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">{t('wizard.review.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('wizard.review.subtitle')}</p>
            </div>

            {/* Summary card */}
            <div className="bg-purple-50 rounded-xl border border-purple-100 p-5 space-y-1 text-center">
                <p className="text-xs text-purple-500 uppercase font-semibold tracking-wide">
                    {t('common.total')}
                </p>
                <p className="text-4xl font-black text-gray-900 tracking-tight">
                    {value.currency} {grandTotal.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">{value.title}</p>
            </div>

            {/* Basic info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <Receipt size={15} className="text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('wizard.review.basicInfo')}</span>
                </div>
                <div className="divide-y divide-gray-50">
                    <ReviewRow label={t('wizard.basicInfo.splitTitle')} value={value.title} />
                    <ReviewRow label={t('wizard.basicInfo.currency')} value={value.currency} />
                    <ReviewRow label={t('wizard.basicInfo.totalAmount')} value={`${value.currency} ${value.totalAmount.toFixed(2)}`} />
                    <ReviewRow label={t('wizard.taxTip.taxLabel')} value={`+ ${value.currency} ${value.taxAmount.toFixed(2)}`} />
                    <ReviewRow label={t('wizard.taxTip.tipLabel')} value={`+ ${value.currency} ${value.tipAmount.toFixed(2)}`} />
                </div>
            </div>

            {/* Split method */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <Tag size={15} className="text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('wizard.splitMethod.title')}</span>
                </div>
                <div className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {t(methodLabelKey[value.splitMethod])}
                </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <Users size={15} className="text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700">
                        {t('wizard.participants.title')} ({value.participants.length})
                    </span>
                </div>
                {value.participants.length === 0 ? (
                    <p className="text-sm text-gray-400 px-4 py-3 italic">{t('wizard.review.noParticipants')}</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {value.participants.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0">
                                        {p.name ? p.name.charAt(0).toUpperCase() : i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{p.name || `#${i + 1}`}</p>
                                        {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-700 shrink-0">
                                    {value.splitMethod === 'equal' && `${value.currency} ${equalShare.toFixed(2)}`}
                                    {value.splitMethod === 'percentage' && `${p.percentage ?? 0}%`}
                                    {value.splitMethod === 'custom' && `${value.currency} ${(p.customAmount ?? 0).toFixed(2)}`}
                                    {value.splitMethod === 'itemized' && '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Items (if itemized) */}
            {value.splitMethod === 'itemized' && value.items.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <DollarSign size={15} className="text-purple-500" />
                        <span className="text-sm font-semibold text-gray-700">
                            {t('wizard.items.title')} ({value.items.length})
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {value.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.name || '—'}</p>
                                    {item.assignedTo.length > 0 && (
                                        <p className="text-xs text-gray-400">
                                            {item.assignedTo
                                                .map((id) => {
                                                    const p = value.participants.find((pp) => pp.id === id);
                                                    return p?.name || id;
                                                })
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                    {value.currency} {item.price.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ready indicator */}
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700 font-medium">{t('wizard.review.readyToSubmit')}</p>
            </div>
        </div>
    );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
);
