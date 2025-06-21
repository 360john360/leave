
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-light transition-all ease-in-out duration-150 flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-brand-primary hover:bg-brand-primary-hover text-white focus:ring-brand-primary',
    secondary: 'bg-brand-secondary hover:bg-brand-secondary-hover text-white focus:ring-brand-secondary',
    danger: 'bg-brand-error hover:bg-red-700 text-white focus:ring-brand-error',
    success: 'bg-brand-success hover:bg-green-700 text-white focus:ring-brand-success',
    warning: 'bg-brand-warning hover:bg-amber-600 text-white focus:ring-brand-warning',
    info: 'bg-brand-info hover:bg-sky-600 text-white focus:ring-brand-info',
    ghost: 'bg-transparent hover:bg-slate-100 text-brand-primary border border-brand-border focus:ring-brand-primary',
    link: 'bg-transparent hover:underline text-brand-primary focus:ring-brand-primary p-0 shadow-none hover:shadow-none',
  };

  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm leading-4',
    md: 'px-4 py-2 text-sm', // Adjusted default to text-sm for corporate feel
    lg: 'px-6 py-3 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className={children ? "mr-2" : ""}>{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className={children ? "ml-2" : ""}>{rightIcon}</span>}
    </button>
  );
};

export default Button;
