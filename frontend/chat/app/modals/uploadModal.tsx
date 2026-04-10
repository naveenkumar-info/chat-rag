'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Upload File</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all mb-6 ${
            dragActive
              ? 'border-white bg-gray-800/40 ring-2 ring-white/10'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
          }`}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          
          <label htmlFor="file-input" className="cursor-pointer block">
            <Upload 
              size={48} 
              className={`mx-auto mb-4 transition-colors ${dragActive ? 'text-white' : 'text-gray-600'}`} 
            />
            <p className="text-white font-medium mb-2">
              {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
            </p>
            <p className="text-gray-400 text-sm">
              {selectedFile 
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
                : 'or click to browse'}
            </p>
          </label>
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
            onClick={uploadfileHandler}
            disabled={!selectedFile}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedFile
                ? 'bg-white text-black hover:bg-gray-200 active:scale-95'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}