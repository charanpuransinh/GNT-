import React from 'react'; export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({children,...p}) => <table {...p}>{children}</table>;
