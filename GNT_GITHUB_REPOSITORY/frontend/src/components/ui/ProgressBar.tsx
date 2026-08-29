import React from 'react'; export const ProgressBar: React.FC<{value?:number}> = ({value=0}) => <progress value={value} max={100}/>;
