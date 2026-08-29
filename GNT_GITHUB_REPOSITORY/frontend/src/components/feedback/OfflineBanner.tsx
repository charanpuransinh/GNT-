import React from 'react'; export const OfflineBanner: React.FC<{offline?:boolean}> = ({offline=false}) => offline ? <div role="alert">Offline</div> : null;
