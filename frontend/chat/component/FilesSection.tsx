'use client';

import { FileText, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { file_data } from '../data/sampleStats';

const categoryIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={20} className="text-red-500" />,
    image: <FileText size={20} className="text-blue-500" />,
    spreadsheet: <FileText size={20} className="text-green-500" />,
    html: <FileText size={20} className="text-yellow-500" />,
    document: <FileText size={20} className="text-purple-500" />,
};

const categoryLabels: Record<string, string> = {
    pdf: 'PDF',
    image: 'Images',
    spreadsheet: 'Spreadsheets',
    html: 'HTML',
    document: 'Documents',
};

export default function FilesSection() {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pdfName, setPdfName] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Group files by category
    const groupedByCategory = file_data.reduce((acc, file) => {
        const category = file.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(file);
        return acc;
    }, {} as Record<string, typeof file_data>);

    const handleDeleteClick = (fileName: string) => {
        setFileToDelete(fileName); 
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        console.log(`Deleting file: ${fileToDelete}`);
        // delete
        setDeleteModalOpen(false);
        setFileToDelete(null);
    };

    const handleCancel = () => {
        setDeleteModalOpen(false);
        setFileToDelete(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile && pdfName.trim()) {
            console.log(`Uploading file: ${selectedFile.name} as "${pdfName}"`);
            // Add upload logic here with pdfName for future context
            setUploadModalOpen(false);
            setSelectedFile(null);
            setPdfName('');
        }
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedFile(null);
        setPdfName('');
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Files</h2>
                    <p className="text-gray-400">Manage and organize your uploaded files</p>
                </div>
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap ml-4"
                >
                    + Upload PDF
                </button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                    <p className="text-gray-400 text-sm font-medium mb-2">Total Files</p>
                    <div className="flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-white">{Object.values(groupedByCategory).flat().length}</p>
                        
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8">
                {Object.entries(groupedByCategory).map(([category, files]) => (
                    <div key={category}>
                        <div className="flex items-center gap-2 mb-4">
                            {categoryIcons[category]}
                            <h3 className="text-xl font-semibold text-white">
                                {categoryLabels[category]}
                            </h3>
                            <span className="text-sm text-gray-500 ml-2">({files.length})</span>
                        </div>

                        <div className="space-y-3">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-950 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                                                {categoryIcons[category]}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{file.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {file.pdf_file ||
                                                        file.image_file ||
                                                        file.spreadsheet_file ||
                                                        file.html_file ||
                                                        file.document_file}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-xs text-gray-400">
                                            <span>Uploaded: {file.date}</span>
                                            
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteClick(file.name)}
                                        className="ml-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete file"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {Object.keys(groupedByCategory).length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="border border-gray-800 rounded-lg p-12 text-center bg-gray-950 w-full max-w-md">
                        <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No files uploaded
                        </h3>
                        <p className="text-gray-400 mb-4">Upload your first file to get started</p>
                        <button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                            Upload File
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-8 max-w-sm w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Delete File</h3>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-8">
                            Are you sure you want to delete <span className="font-semibold text-white">{fileToDelete}</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-8 max-w-lg w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Upload PDF</h3>
                            <button
                                onClick={handleCloseUploadModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
                                dragActive
                                    ? 'border-white bg-gray-800/30'
                                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                            }`}
                        >
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="pdf-input"
                            />
                            <label htmlFor="pdf-input" className="cursor-pointer block">
                                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-white font-medium mb-2">
                                    {selectedFile ? selectedFile.name : 'Drag and drop your PDF here'}
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                    {selectedFile ? 'File selected' : 'or click to browse'}
                                </p>
                                {!selectedFile && (
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Choose File
                                    </button>
                                )}
                            </label>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                PDF Name *
                            </label>
                            <input
                                type="text"
                                value={pdfName}
                                onChange={(e) => setPdfName(e.target.value)}
                                placeholder="Enter a name for this PDF"
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCloseUploadModal}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || !pdfName.trim()}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedFile && pdfName.trim()
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}