import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Trash2, Percent, Sliders } from 'lucide-react';
import type { WizardParticipant, WizardState, SplitMethod } from '../../../types/wizard';

interface ParticipantsStepProps {
    value: Pick<WizardState, 'participants' | 'splitMethod' | 'totalAmount'>;
    onChange: (patch: Partial<WizardState>) => void;
    errors: Record<string, string>;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const emptyParticipant = (): WizardParticipant => ({
    id: generateId(),
    name: '',
    walletAddress: '',
    email: '',
    percentage: 0,
    customAmount: 0,
});

const showExtraField = (method: SplitMethod) =>
    method === 'percentage' || method === 'custom';

export const ParticipantsStep = ({ value, onChange, errors }: ParticipantsStepProps) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState<string | null>(null);

    const updateParticipant = (id: string, patch: Partial<WizardParticipant>) => {
        onChange({
            participants: value.participants.map((p) =>
                p.id === id ? { ...p, ...patch } : p
            ),
        });
    };

    const addParticipant = () => {
        const p = emptyParticipant();
        onChange({ participants: [...value.participants, p] });
        setExpanded(p.id);
    };

    const removeParticipant = (id: string) => {
        onChange({ participants: value.participants.filter((p) => p.id !== id) });
        if (expanded === id) setExpanded(null);
    };

    const totalPercentage = value.participants.reduce(
        (acc, p) => acc + (p.percentage ?? 0), 0
    );
    const totalCustom = value.participants.reduce(
        (acc, p) => acc + (p.customAmount ?? 0), 0
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">{t('wizard.participants.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('wizard.participants.subtitle')}</p>
            </div>

            {errors.participants && (
                <p className="text-xs text-red-500">{errors.participants}</p>
            )}

            {/* Participant cards */}
            <div className="space-y-3">
                {value.participants.map((p, index) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {/* Card header */}
                        <div
                            className="flex items-center gap-3 p-4 cursor-pointer select-none"
                            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                                {p.name ? p.name.charAt(0).toUpperCase() : index + 1}
                            </div>
                            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                                {p.name || t('wizard.participants.participantN', { n: index + 1 })}
                            </span>
                            {showExtraField(value.splitMethod) && (
                                <span className="text-xs font-semibold text-purple-600 shrink-0 mr-2">
                                    {value.splitMethod === 'percentage'
                                        ? `${p.percentage ?? 0}%`
                                        : `${value.splitMethod === 'custom' ? (p.customAmount ?? 0).toFixed(2) : ''}`}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeParticipant(p.id); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                aria-label={t('wizard.participants.remove')}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        {/* Expanded fields */}
                        {expanded === p.id && (
                            <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">
                                        {t('wizard.participants.name')} <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={p.name}
                                        onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                                        placeholder={t('wizard.participants.namePlaceholder')}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">
                                        {t('wizard.participants.walletAddress')}
                                    </label>
                                    <input
                                        type="text"
                                        value={p.walletAddress ?? ''}
                                        onChange={(e) => updateParticipant(p.id, { walletAddress: e.target.value })}
                                        placeholder={t('wizard.participants.walletPlaceholder')}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">
                                        {t('wizard.participants.email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={p.email ?? ''}
                                        onChange={(e) => updateParticipant(p.id, { email: e.target.value })}
                                        placeholder={t('wizard.participants.emailPlaceholder')}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                {value.splitMethod === 'percentage' && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
                                            <Percent size={11} /> {t('wizard.participants.percentage')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={p.percentage ?? 0}
                                            onChange={(e) =>
                                                updateParticipant(p.id, { percentage: parseFloat(e.target.value) || 0 })
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                )}

                                {value.splitMethod === 'custom' && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
                                            <Sliders size={11} /> {t('wizard.participants.customAmount')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={p.customAmount ?? 0}
                                            onChange={(e) =>
                                                updateParticipant(p.id, { customAmount: parseFloat(e.target.value) || 0 })
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Percentage / custom totals */}
            {value.splitMethod === 'percentage' && value.participants.length > 0 && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${totalPercentage === 100 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {t('wizard.participants.totalPct')}: {totalPercentage}% {totalPercentage !== 100 && `(${t('wizard.participants.mustEqual100')})`}
                </div>
            )}
            {value.splitMethod === 'custom' && value.participants.length > 0 && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${Math.abs(totalCustom - value.totalAmount) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {t('wizard.participants.totalCustom')}: {totalCustom.toFixed(2)} / {value.totalAmount.toFixed(2)}
                </div>
            )}

            {/* Add participant button */}
            <button
                type="button"
                onClick={addParticipant}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold text-sm transition-colors min-h-[44px]"
            >
                <UserPlus size={16} />
                {t('wizard.participants.addParticipant')}
            </button>
        </div>
    );
};
