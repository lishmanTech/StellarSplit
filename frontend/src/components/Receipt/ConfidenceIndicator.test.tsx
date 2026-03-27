import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConfidenceIndicator } from './ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
  it('renders high confidence in green', () => {
    render(<ConfidenceIndicator confidence={85} />);
    expect(screen.getByText('85%')).toBeDefined();
  });

  it('renders medium confidence in yellow', () => {
    render(<ConfidenceIndicator confidence={65} />);
    expect(screen.getByText('65%')).toBeDefined();
  });

  it('renders low confidence in red', () => {
    render(<ConfidenceIndicator confidence={30} />);
    expect(screen.getByText('30%')).toBeDefined();
  });

  it('respects size prop', () => {
    const { container } = render(<ConfidenceIndicator confidence={75} size="lg" />);
    expect(container.querySelector('.px-4')).toBeDefined();
  });
});
