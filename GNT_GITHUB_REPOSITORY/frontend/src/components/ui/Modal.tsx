import React from 'react';

/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। `open` पुराने call sites के लिए रखा है। */
export interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  title?: React.ReactNode;
  onClose?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, open, title, onClose, footer, children }) => {
  const visible = isOpen ?? open ?? true;
  if (!visible) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      {title ? <header>{title}</header> : null}
      {onClose ? <button type="button" aria-label="Close" onClick={onClose}>×</button> : null}
      <div>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </div>
  );
};
