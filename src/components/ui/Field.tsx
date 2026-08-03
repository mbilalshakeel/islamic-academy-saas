import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export interface FieldProps {
  label?: string;
  helper?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

/** Wraps a label + control + helper/error text with consistent spacing. */
export function Field({ label, helper, error, htmlFor, children }: FieldProps) {
  return (
    <div>
      {label && (
        <label className="ds-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? <div className="ds-helper ds-helper-error">{error}</div> : helper ? <div className="ds-helper">{helper}</div> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className = "", error, ...props }, ref) => (
    <input ref={ref} className={`ds-input ${error ? "ds-input-error" : ""} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className = "", error, ...props }, ref) => (
    <textarea ref={ref} className={`ds-textarea ${error ? "ds-input-error" : ""} ${className}`} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select ref={ref} className={`ds-select ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";
