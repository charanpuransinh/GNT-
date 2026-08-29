import React from 'react'; export const AppLogo: React.FC<{alt?:string}> = ({alt='GNT'}) => <span aria-label={alt}>{alt}</span>;
