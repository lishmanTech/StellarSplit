import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const Button = ({ children, className, type = 'button', ...rest }: ButtonProps) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed bg-sky-600 text-white hover:bg-sky-700 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
};