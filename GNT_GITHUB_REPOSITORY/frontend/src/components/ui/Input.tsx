import React from 'react';

/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, id, ...rest }) => {
  const inputId = id ?? rest.name;
  return (
    <div data-field={inputId}>
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <input id={inputId} aria-invalid={error ? true : undefined} {...rest} />
      {error ? <span role="alert">{error}</span> : hint ? <span>{hint}</span> : null}
    </div>
  );
};
