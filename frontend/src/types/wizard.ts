export type SplitMethod = 'equal' | 'itemized' | 'percentage' | 'custom';

export interface WizardParticipant {
    id: string;
    name: string;
    walletAddress?: string;
    email?: string;
    percentage?: number;
    customAmount?: number;
}

export interface WizardItem {
    id: string;
    name: string;
    price: number;
    assignedTo: string[];
}

export interface WizardState {
    title: string;
    currency: string;
    totalAmount: number;
    splitMethod: SplitMethod;
    participants: WizardParticipant[];
    items: WizardItem[];
    taxAmount: number;
    tipAmount: number;
}

export const WIZARD_DRAFT_KEY = 'splitwizard_draft';

export const INITIAL_WIZARD_STATE: WizardState = {
    title: '',
    currency: 'USD',
    totalAmount: 0,
    splitMethod: 'equal',
    participants: [],
    items: [],
    taxAmount: 0,
    tipAmount: 0,
};

export const SUPPORTED_CURRENCIES = [
    { code: 'USD', label: 'USD – US Dollar' },
    { code: 'EUR', label: 'EUR – Euro' },
    { code: 'GBP', label: 'GBP – British Pound' },
    { code: 'JPY', label: 'JPY – Japanese Yen' },
    { code: 'CAD', label: 'CAD – Canadian Dollar' },
    { code: 'AUD', label: 'AUD – Australian Dollar' },
    { code: 'NGN', label: 'NGN – Nigerian Naira' },
    { code: 'XLM', label: 'XLM – Stellar Lumens' },
];
