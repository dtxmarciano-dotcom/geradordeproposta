import { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
