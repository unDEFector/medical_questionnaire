"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto max-h-[92vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-0 text-navy shadow-2xl backdrop:bg-navy/50 ${wide ? "max-w-2xl" : "max-w-md"}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Закрыть окно"
          className="px-3 text-xl"
        >
          ×
        </Button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
