
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | boolean;
  wrapperClassName?: string;
  labelSrOnly?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  id, 
  error, 
  className = '', 
  wrapperClassName = '', 
  labelSrOnly = false,
  ...props 
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = !!error;

  return (
    <div className={` ${wrapperClassName}`}>
      {label && (
        <label htmlFor={textareaId} className={`block text-sm font-medium text-brand-text mb-1 ${labelSrOnly ? 'sr-only' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={props.rows || 3}
        className={`
          form-textarea
          block w-full px-3 py-2 
          border ${hasError ? 'border-brand-error' : 'border-brand-border'} 
          rounded-md 
          shadow-sm 
          focus:outline-none focus:ring-1 ${hasError ? 'focus:ring-brand-error focus:border-brand-error' : 'focus:ring-brand-primary focus:border-brand-primary'}
          sm:text-sm 
          placeholder-gray-400
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={hasError}
        aria-describedby={hasError && typeof error === 'string' ? `${textareaId}-error` : undefined}
        {...props}
      />
      {hasError && typeof error === 'string' && <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-brand-error">{error}</p>}
    </div>
  );
};

export default Textarea;
