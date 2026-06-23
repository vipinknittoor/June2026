"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-4 sm:items-center sm:justify-center">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        initial={{ opacity: 0, y: 24 }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <Button
            aria-label="Close modal"
            className="h-9 w-9 px-0"
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
            type="button"
            variant="ghost"
          />
        </div>
        {children}
      </motion.div>
    </div>
  );
}
