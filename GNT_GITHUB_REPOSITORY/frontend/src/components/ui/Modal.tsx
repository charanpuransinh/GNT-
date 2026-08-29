import React from 'react'; export const Modal: React.FC<{open?:boolean;children?:React.ReactNode}> = ({open=true,children}) => open ? <div>{children}</div> : null;
