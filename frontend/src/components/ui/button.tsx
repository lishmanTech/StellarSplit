import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const Button = ({ children, className, type = 'button', disabled, ...rest }: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed bg-[var(--color-primary)] text-white hover:opacity-90 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
};