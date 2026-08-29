import React from 'react'; export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({children,...p}) => <div {...p}>{children}</div>;
