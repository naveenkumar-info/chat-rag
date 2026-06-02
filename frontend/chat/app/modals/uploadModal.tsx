'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload, FileUp } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Prevent default behavior for drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle manual file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadfileHandler = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null); // Reset after upload
      onClose(); // Close modal
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl p-6 sm:p-7 max-w-lg w-full mx-4 shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Upload File</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
              Drag and drop or browse to upload
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 mb-6 ${
            dragActive
              ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
              : selectedFile
                ? 'border-[var(--border-strong)] bg-[var(--surface-2)]'
                : 'border-[var(--border-default)] bg-[var(--surface-0)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all ${
              dragActive
                ? 'bg-[var(--accent-muted)]'
                : 'bg-[var(--surface-3)] border border-[var(--border-default)]'
            }`}>
              {selectedFile ? (
                <FileUp size={22} className="text-[var(--accent)]" />
              ) : (
                <Upload 
                  size={22} 
                  className={`transition-colors ${dragActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} 
                />
              )}
            </div>

            {selectedFile ? (
              <>
                <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
                  Drop your file here
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  or click to browse from your device
                </p>
              </>
            )}
          </label>
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
            onClick={uploadfileHandler}
            disabled={!selectedFile}
            className={`flex-1 h-10 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              selectedFile
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm shadow-[var(--accent-muted)]'
                : 'bg-[var(--surface-3)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-subtle)]'
            }`}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}