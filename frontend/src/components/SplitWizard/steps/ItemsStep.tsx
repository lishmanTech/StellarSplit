import { useTranslation } from 'react-i18next';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { WizardItem, WizardParticipant, WizardState } from '../../../types/wizard';

interface ItemsStepProps {
    value: Pick<WizardState, 'items' | 'participants' | 'currency'>;
    onChange: (patch: Partial<WizardState>) => void;
    errors: Record<string, string>;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const emptyItem = (): WizardItem => ({
    id: generateId(),
    name: '',
    price: 0,
    assignedTo: [],
});

const toggleAssignment = (item: WizardItem, participantId: string): WizardItem => ({
    ...item,
    assignedTo: item.assignedTo.includes(participantId)
        ? item.assignedTo.filter((id) => id !== participantId)
        : [...item.assignedTo, participantId],
});

const participantLabel = (p: WizardParticipant, index: number) =>
    p.name || `#${index + 1}`;

export const ItemsStep = ({ value, onChange, errors }: ItemsStepProps) => {
    const { t } = useTranslation();

    const updateItem = (id: string, patch: Partial<WizardItem>) => {
        onChange({
            items: value.items.map((item) =>
                item.id === id ? { ...item, ...patch } : item
            ),
        });
    };

    const addItem = () => {
        onChange({ items: [...value.items, emptyItem()] });
    };

    const removeItem = (id: string) => {
        onChange({ items: value.items.filter((item) => item.id !== id) });
    };

    const subtotal = value.items.reduce((acc, item) => acc + item.price, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">{t('wizard.items.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('wizard.items.subtitle')}</p>
            </div>

            {errors.items && (
                <p className="text-xs text-red-500">{errors.items}</p>
            )}

            <div className="space-y-3">
                {value.items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                        {/* Item header */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                                #{index + 1}
                            </span>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                placeholder={t('wizard.items.itemNamePlaceholder')}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            <div className="relative shrink-0 w-28">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    {value.currency}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price === 0 ? '' : item.price}
                                    onChange={(e) =>
                                        updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-2 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                aria-label={t('wizard.items.removeItem')}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        {/* Participant assignment */}
                        {value.participants.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-2">{t('wizard.items.assignTo')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {value.participants.map((p, pIdx) => {
                                        const isAssigned = item.assignedTo.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => updateItem(item.id, toggleAssignment(item, p.id))}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all min-h-[28px]
                                                    ${isAssigned
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {participantLabel(p, pIdx)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Subtotal */}
            {value.items.length > 0 && (
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                    <span className="text-gray-500">{t('common.subtotal')}</span>
                    <span className="font-bold text-gray-800">
                        {value.currency} {subtotal.toFixed(2)}
                    </span>
                </div>
            )}

            <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold text-sm transition-colors min-h-[44px]"
            >
                <PlusCircle size={16} />
                {t('wizard.items.addItem')}
            </button>
        </div>
    );
};
