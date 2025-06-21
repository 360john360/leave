
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string | boolean;
  wrapperClassName?: string;
  placeholder?: string;
  labelSrOnly?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  options, 
  error, 
  className = '', 
  wrapperClassName = '', 
  placeholder,
  labelSrOnly = false,
  ...rest
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = !!error;

  return (
    <div className={`${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className={`block text-sm font-medium text-brand-text mb-1 ${labelSrOnly ? 'sr-only' : ''}`}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          form-select
          block w-full pl-3 pr-10 py-2 
          text-base 
          border ${hasError ? 'border-brand-error' : 'border-brand-border'} 
          rounded-md 
          focus:outline-none focus:ring-1 ${hasError ? 'focus:ring-brand-error focus:border-brand-error' : 'focus:ring-brand-primary focus:border-brand-primary'}
          sm:text-sm 
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={hasError}
        aria-describedby={hasError && typeof error === 'string' ? `${selectId}-error` : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && typeof error === 'string' && <p id={`${selectId}-error`} className="mt-1.5 text-xs text-brand-error">{error}</p>}
    </div>
  );
};

export default Select;
