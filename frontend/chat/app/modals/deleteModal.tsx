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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <h3 className="text-xl font-semibold text-white">Delete File</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-gray-300 leading-relaxed">
            Are you sure you want to delete <span className="text-white font-medium">this file</span>? 
            This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all font-medium shadow-lg shadow-red-900/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}