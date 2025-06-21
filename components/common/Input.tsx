import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean; // Can be boolean for just showing error style
  wrapperClassName?: string;
  leftIcon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  rightIcon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  labelSrOnly?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  error, 
  className = '', 
  wrapperClassName = '', 
  leftIcon, 
  rightIcon,
  labelSrOnly = false,
  ...props 
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = !!error;

  return (
    <div className={` ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium text-brand-text mb-1 ${labelSrOnly ? 'sr-only' : ''}`}>
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            {React.cloneElement(leftIcon, { className: 'h-5 w-5 text-gray-400' })}
          </div>
        )}
        <input
          id={inputId}
          className={`
            form-input
            block w-full px-3 py-2 
            border ${hasError ? 'border-brand-error' : 'border-brand-border'} 
            rounded-md 
            focus:outline-none focus:ring-1 ${hasError ? 'focus:ring-brand-error focus:border-brand-error' : 'focus:ring-brand-primary focus:border-brand-primary'}
            sm:text-sm 
            placeholder-gray-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError && typeof error === 'string' ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightIcon && !hasError && (
           <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {React.cloneElement(rightIcon, { className: 'h-5 w-5 text-gray-400' })}
          </div>
        )}
        {hasError && rightIcon && ( // Show error icon if error is present
            <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="h-5 w-5 text-brand-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
        )}
      </div>
      {hasError && typeof error === 'string' && <p id={`${inputId}-error`} className="mt-1.5 text-xs text-brand-error">{error}</p>}
    </div>
  );
};

export default Input;