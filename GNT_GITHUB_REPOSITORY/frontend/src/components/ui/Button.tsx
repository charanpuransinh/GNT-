import React from 'react'; export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({children,...p}) => <button {...p}>{children}</button>;
