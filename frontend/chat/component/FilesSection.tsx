'use client';

import { FileText, Trash2, ChevronDown, Upload, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import UploadModal from '@/app/modals/uploadModal';
import DeleteModal from '@/app/modals/deleteModal';

const categoryIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={20} className="text-red-500" />,
    images: <FileText size={20} className="text-blue-500" />,
    spreadsheet: <FileText size={20} className="text-green-500" />,
    html: <FileText size={20} className="text-yellow-500" />,
    document: <FileText size={20} className="text-purple-500" />,
};

const extensionToCategory: Record<string, string> = {
    'pdf': 'pdf',
    'png': 'images',
    'jpg': 'images',
    'jpeg': 'images',
    'gif': 'images',
    'xlsx': 'spreadsheet',
    'xls': 'spreadsheet',
    'html': 'html',
    'htm': 'html',
    'docx': 'document',
    'doc': 'document',
};

const categoryLabels: Record<string, string> = {
    pdf: 'pdf',
    images: 'images',
    spreadsheet: 'Spreadsheets',
    html: 'HTML',
    document: 'Documents',
};

interface file_data {
    id: number;
    file_type: string;
    filename: string;
    created_at: string;
    file_url: string;
}

export default function FilesSection() {
    const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<Number | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [availableFiles, setAvailableFiles] = useState<file_data[]>([]);

    // Admin modal states
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');

    const groupedByCategory = availableFiles.reduce((acc, file) => {
        const category = extensionToCategory[file.file_type] || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(file);
        return acc;
    }, {} as Record<string, file_data[]>);

    const getFiles = async () => {
        try {
            const response = await axios.get(`${NEXT_API_URL}/files/`);
            setAvailableFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    useEffect(() => { getFiles(); }, []);

    const uploadfileHandler = async () => {
        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        try {
            await axios.post(`${NEXT_API_URL}/uploadfile/`, formData);
            setUploadModalOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleConfirmDelete = () => {
        setDeleteModalOpen(false);
        setFileToDelete(null);
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedFile(null);
    };

    const handleCloseAdminModal = () => {
        setAdminModalOpen(false);
        setAdminEmail('');
        setAdminError('');
    };

    const handlePromoteAdmin = async () => {
    if (!adminEmail.trim()) {
        setAdminError('Please enter an email address');
        return;
    }
    setAdminLoading(true);
    setAdminError('');
    try {
        const formData = new FormData();
        formData.append('email', adminEmail);
        await axios.post(`${NEXT_API_URL}/promote`, formData);
        handleCloseAdminModal();
    } catch (error: any) {
        setAdminError(error.response?.data?.message || 'Failed to promote user');
    } finally {
        setAdminLoading(false);
    }
};

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden">
            <div className="mb-6 flex items-center justify-between shrink-0 gap-4">

                {/* LEFT CONTENT */}
                <div className="min-w-0 overflow-hidden">
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-white mb-2 flex items-center gap-2 flex-wrap">
                        <span className="whitespace-nowrap">Files</span>
                        <span className="text-gray-400 text-[18px] sm:text-[20px] transition-all duration-300 overflow-hidden whitespace-nowrap">
                            • Total files: {Object.values(groupedByCategory).flat().length}
                        </span>
                    </h2>
                    <p className="text-gray-400 flex flex-wrap">
                        Manage and organize your uploaded files
                    </p>
                </div>

                {/* RIGHT BUTTONS */}
                <div className="flex items-center gap-2">

                    {/* Create Admin Button */}
                    <button
                        onClick={() => setAdminModalOpen(true)}
                        className="p-3 w-10 h-9.5 sm:w-auto sm:h-10 bg-gray-800 text-white border border-gray-700 rounded-lg text-[12px] hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
                    >
                        <Pencil size={16} />
                        <span className="hidden md:inline whitespace-nowrap text-[12px] md:text-[15px]">
                            Create Admin
                        </span>
                    </button>

                    {/* Upload Button */}
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="p-3 w-10 h-9.5 sm:w-30 sm:h-10 bg-white text-black rounded-lg text-[12px] hover:bg-gray-200 transition-all duration-300 ml-4 flex items-center gap-2"
                    >
                        <Upload size={18} />
                        <span className="hidden text-[12px] md:text-[15px] md:inline whitespace-nowrap">
                            Upload File
                        </span>
                    </button>

                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-2 sm:px-4">
                {Object.entries(groupedByCategory).map(([category, files]) => (
                    <div key={category}>
                        <button
                            onClick={() => setOpenCategory(openCategory === category ? null : category)}
                            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 rounded-lg border transition-all ${
                                openCategory === category
                                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    : "bg-gray-900 border-gray-800 hover:bg-gray-850 hover:border-gray-700"
                            }`}
                        >
                            <div className={`shrink-0 transition-transform duration-300 ${openCategory === category ? "rotate-180" : ""}`}>
                                <ChevronDown size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {categoryIcons[category]}
                                <h3 className="text-sm sm:text-lg font-semibold text-white truncate">
                                    {categoryLabels[category]}
                                </h3>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-400 shrink-0">
                                ({files.length})
                            </span>
                        </button>

                        {openCategory === category && (
                            <div className="space-y-2 flex flex-col items-center sm:space-y-3 ml-2 sm:ml-8">
                                {files.map((file, index) => (
                                    <div key={index} className="bg-gray-950 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-gray-700 transition-colors flex flex-col sm:flex-row gap-3 flex-wrap overflow-hidden max-w-[220px] sm:max-w-full">
                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded flex items-center justify-center shrink-0">
                                                {categoryIcons[category]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {file.file_type === "pdf" || file.file_type === "jpg" || file.file_type === "png" ? (
                                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-white cursor-pointer text-[12px] sm:text-base font-medium truncate">
                                                        {file.filename}
                                                    </a>
                                                ) : file.file_type === "doc" || file.file_type === "docx" || file.file_type === "xls" || file.file_type === "xlsx" ? (
                                                    <a className="text-white cursor-pointer text-[12px] sm:text-base font-medium truncate">
                                                        {file.filename}
                                                    </a>
                                                ) : (
                                                    <a href={file.file_url} className="text-gray-400 cursor-pointer text-[12px] sm:text-base font-medium truncate underline">
                                                        {file.filename}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                            <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                                                {file.created_at}
                                            </span>
                                            <button
                                                onClick={() => { setFileToDelete(file.id); setDeleteModalOpen(true); }}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 size={18} className="sm:w-[20px] sm:h-[20px]" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {Object.keys(groupedByCategory).length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="border border-gray-800 rounded-lg p-12 text-center bg-gray-950 w-full max-w-md">
                        <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No files uploaded</h3>
                        <p className="text-gray-400 mb-4">Upload your first file to get started</p>
                        <button onClick={() => setUploadModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                            Upload File
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    fileID={fileToDelete}
                />
            )}

            {/* Upload Modal */}
            {uploadModalOpen && (
                <UploadModal
                    isOpen={uploadModalOpen}
                    onClose={handleCloseUploadModal}
                    onUpload={uploadfileHandler}
                />
            )}

            {/* Create Admin Modal */}
            {adminModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-semibold text-lg">Promote to Admin</h3>
                            <button
                                onClick={handleCloseAdminModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="mb-4">
                            <label className="text-gray-400 text-sm mb-2 block">
                                Search by email address
                            </label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                                placeholder="user@example.com"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                            />
                            {adminError && (
                                <p className="text-red-400 text-xs mt-2">{adminError}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseAdminModal}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePromoteAdmin}
                                disabled={adminLoading}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {adminLoading ? 'Promoting...' : 'Promote'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}