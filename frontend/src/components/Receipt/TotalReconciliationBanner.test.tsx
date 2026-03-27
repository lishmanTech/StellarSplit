import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TotalReconciliationBanner } from './TotalReconciliationBanner';

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock formatCurrency
vi.mock('../../utils/format', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

describe('TotalReconciliationBanner', () => {
  it('shows matching totals in green', () => {
    render(
      <TotalReconciliationBanner
        receiptTotal={100}
        parsedTotal={100}
        currency="USD"
      />
    );
    expect(screen.getByText('Totals Match')).toBeDefined();
    expect(screen.getByText(/Receipt total:/)).toBeDefined();
  });

  it('shows mismatch warning in red', () => {
    render(
      <TotalReconciliationBanner
        receiptTotal={100}
        parsedTotal={95}
        currency="USD"
      />
    );
    expect(screen.getByText('Total Mismatch')).toBeDefined();
    expect(screen.getByText(/Difference:/)).toBeDefined();
  });

  it('respects tolerance threshold', () => {
    render(
      <TotalReconciliationBanner
        receiptTotal={100}
        parsedTotal={100.005}
        currency="USD"
        tolerance={0.01}
      />
    );
    expect(screen.getByText('Totals Match')).toBeDefined();
  });

  it('shows mismatch when outside tolerance', () => {
    render(
      <TotalReconciliationBanner
        receiptTotal={100}
        parsedTotal={100.02}
        currency="USD"
        tolerance={0.01}
      />
    );
    expect(screen.getByText('Total Mismatch')).toBeDefined();
  });
});
