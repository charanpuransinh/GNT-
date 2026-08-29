import React from 'react'; export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({children,...p}) => <span {...p}>{children}</span>;
