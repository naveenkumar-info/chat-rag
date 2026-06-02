'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileID?: Number | null; // Optional: show the user exactly what they are deleting
}

export default function DeleteModal({ isOpen, onClose, onConfirm, fileID }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--danger-muted)] flex items-center justify-center">
              <AlertTriangle size={17} className="text-[var(--danger)]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Delete File</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to delete <span className="text-[var(--text-primary)] font-medium">this file</span>? 
            This action cannot be undone and the file will be permanently removed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-[13px] font-medium hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="flex-1 h-10 rounded-lg bg-[var(--danger)] text-white text-[13px] font-medium hover:brightness-110 transition-all shadow-sm shadow-[var(--danger-muted)]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}