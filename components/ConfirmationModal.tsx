import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  requiredConfirmationText?: string;
  confirmationInputName?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  requiredConfirmationText,
  confirmationInputName = 'destructive-action-confirmation',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();
  const confirmationInputId = useId();
  const confirmationHelpId = useId();
  const confirmationStatusId = useId();
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmationMatched = !requiredConfirmationText || confirmationText === requiredConfirmationText;
  const describedByIds = requiredConfirmationText
    ? `${messageId} ${confirmationHelpId} ${confirmationStatusId}`
    : messageId;
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isConfirming) return;
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isConfirming, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4 sm:p-6"
      onClick={isConfirming ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={describedByIds}
    >
      <div
        ref={modalRef}
        className="relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 sm:max-h-[calc(100vh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 id={titleId} className="text-lg leading-6 font-bold text-slate-900">
                    {title}
                </h3>
                <div id={messageId} className="mt-2">
                    <div className="text-sm text-slate-600">
                        {message}
                    </div>
                </div>
            </div>
        </div>
        {requiredConfirmationText && (
          <div className="mt-5">
            <label htmlFor={confirmationInputId} className="block text-sm font-medium text-slate-700">
              Type <span className="font-bold text-slate-900" translate="no">{requiredConfirmationText}</span> to confirm
            </label>
            <input
              id={confirmationInputId}
              name={confirmationInputName}
              type="text"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              disabled={isConfirming}
              autoComplete="off"
              spellCheck={false}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              aria-describedby={`${confirmationHelpId} ${confirmationStatusId}`}
            />
            <p id={confirmationHelpId} className="mt-2 text-xs text-slate-500">
              This extra step prevents accidental permanent deletion.
            </p>
            <p id={confirmationStatusId} className="mt-1 text-xs font-medium text-red-700" aria-live="polite">
              {isConfirmationMatched ? 'Deletion confirmation matched.' : `Type ${requiredConfirmationText} exactly to enable deletion.`}
            </p>
          </div>
        )}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto sm:text-sm transition-colors"
            disabled={isConfirming || !isConfirmationMatched}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            disabled={isConfirming}
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
