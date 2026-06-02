'use client';

import { FileText, Trash2, ChevronDown, Upload, Pencil, X, Search, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import UploadModal from '@/app/modals/uploadModal';
import DeleteModal from '@/app/modals/deleteModal';
import { useAuth } from '@clerk/nextjs';

const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pdf:         { label: 'PDF',          color: '#f87171', bgColor: 'rgba(248,113,113,0.08)' },
    images:      { label: 'Images',       color: '#60a5fa', bgColor: 'rgba(96,165,250,0.08)' },
    spreadsheet: { label: 'Spreadsheets', color: '#34d399', bgColor: 'rgba(52,211,153,0.08)' },
    html:        { label: 'HTML',         color: '#fbbf24', bgColor: 'rgba(251,191,36,0.08)' },
    document:    { label: 'Documents',    color: '#a78bfa', bgColor: 'rgba(167,139,250,0.08)' },
};

const extensionToCategory: Record<string, string> = {
    'pdf': 'pdf',
    'png': 'images', 'jpg': 'images', 'jpeg': 'images', 'gif': 'images',
    'xlsx': 'spreadsheet', 'xls': 'spreadsheet',
    'html': 'html', 'htm': 'html',
    'docx': 'document', 'doc': 'document',
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
    const { getToken } = useAuth();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<number | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [availableFiles, setAvailableFiles] = useState<file_data[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter files by search query
    const filteredCategories = Object.entries(groupedByCategory).reduce((acc, [category, files]) => {
        if (!searchQuery.trim()) {
            acc[category] = files;
            return acc;
        }
        const filtered = files.filter(f =>
            f.filename.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
    }, {} as Record<string, file_data[]>);

    const totalFiles = Object.values(groupedByCategory).flat().length;
    const totalFilteredFiles = Object.values(filteredCategories).flat().length;

    // ── always get a fresh token, never cache in state ──
    const getAuthHeaders = async () => {
        const t = await getToken();
        if (!t) throw new Error('No token available');
        return { Authorization: `Bearer ${t}` };
    };

    const getFiles = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${NEXT_API_URL}/files/`, { headers });
            setAvailableFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    useEffect(() => {
        getFiles();
    }, []);

    const uploadfileHandler = async (file: File) => {
        try {
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('file', file);
            await axios.post(`${NEXT_API_URL}/uploadfile/`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadModalOpen(false);
            getFiles(); // refresh list after upload
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleConfirmDelete = async () => {

        console.log("Attempting to delete file with ID:", fileToDelete);

        try{
            const response = await axios.delete(`${NEXT_API_URL}/deletefiles/${fileToDelete}`, {
                headers: {
                    ...await getAuthHeaders()
                }
            });
            console.log('Delete response:', response.data);
             setDeleteModalOpen(false);
            setFileToDelete(null);
        }
        catch (error) {
            console.error('Error delete file:', error);
        }
        
       
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
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('email', adminEmail);
            await axios.post(`${NEXT_API_URL}/promote`, formData, { headers });
            handleCloseAdminModal();
        } catch (error: any) {
            setAdminError(error.response?.data?.message || 'Failed to promote user');
        } finally {
            setAdminLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-6 sm:p-8 h-full flex flex-col overflow-hidden">

            {/* ── Header ── */}
            <div className="mb-6 shrink-0 animate-slide-down">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="min-w-0">
                        <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--text-primary)] tracking-tight mb-1">
                            Files
                        </h2>
                        <p className="text-[13px] text-[var(--text-tertiary)]">
                            {totalFiles} file{totalFiles !== 1 ? 's' : ''} uploaded across {Object.keys(groupedByCategory).length} categor{Object.keys(groupedByCategory).length !== 1 ? 'ies' : 'y'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setAdminModalOpen(true)}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-secondary)] text-[13px] font-medium hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all duration-200"
                        >
                            <Pencil size={14} />
                            <span className="hidden sm:inline">Create Admin</span>
                        </button>

                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="h-9 px-3 sm:px-4 flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm shadow-[var(--accent-muted)]"
                        >
                            <Upload size={14} />
                            <span className="hidden sm:inline">Upload File</span>
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative max-w-md">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--surface-3)] transition-all duration-200"
                    />
                </div>
            </div>

            {/* ── File Categories ── */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {Object.entries(filteredCategories).map(([category, files], catIdx) => {
                    const config = categoryConfig[category] || { label: category, color: '#8b8b96', bgColor: 'rgba(139,139,150,0.08)' };
                    const isExpanded = openCategory === category;

                    return (
                        <div key={category} className="animate-slide-up" style={{ animationDelay: `${catIdx * 40}ms` }}>
                            {/* Category header button */}
                            <button
                                onClick={() => setOpenCategory(isExpanded ? null : category)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group ${
                                    isExpanded
                                        ? "bg-[var(--surface-3)] border-[var(--border-strong)]"
                                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] hover:bg-[var(--surface-3)] hover:border-[var(--border-default)]"
                                }`}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                                    style={{ background: config.bgColor }}
                                >
                                    <FileText size={15} style={{ color: config.color }} />
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {config.label}
                                    </span>
                                </div>

                                <span className="text-[11px] font-medium text-[var(--text-tertiary)] tabular-nums px-2 py-0.5 rounded-md bg-[var(--surface-4)]">
                                    {files.length}
                                </span>

                                <ChevronDown
                                    size={15}
                                    className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                            </button>

                            {/* Expanded file list */}
                            {isExpanded && (
                                <div className="mt-1.5 space-y-1 pl-3 animate-slide-up">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)] transition-all duration-200 group/file"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            {/* File icon */}
                                            <div
                                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                                style={{ background: config.bgColor }}
                                            >
                                                <FileText size={14} style={{ color: config.color }} />
                                            </div>

                                            {/* File info */}
                                            <div className="flex-1 min-w-0">
                                                {file.file_type === "pdf" || file.file_type === "jpg" || file.file_type === "png" ? (
                                                    <a
                                                        href={file.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-hover)] truncate block transition-colors"
                                                    >
                                                        {file.filename}
                                                    </a>
                                                ) : file.file_type === "doc" || file.file_type === "docx" || file.file_type === "xls" || file.file_type === "xlsx" ? (
                                                    <span className="text-[13px] font-medium text-[var(--text-primary)] truncate block cursor-default">
                                                        {file.filename}
                                                    </span>
                                                ) : (
                                                    <a
                                                        href={file.file_url}
                                                        className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-hover)] truncate block transition-colors underline underline-offset-2 decoration-[var(--border-default)]"
                                                    >
                                                        {file.filename}
                                                    </a>
                                                )}
                                                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                                                    .{file.file_type}
                                                </p>
                                            </div>

                                            {/* Date */}
                                            <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap tabular-nums hidden sm:block">
                                                {formatDate(file.created_at)}
                                            </span>

                                            {/* Delete button */}
                                            <button
                                                onClick={() => { setFileToDelete(file.id); setDeleteModalOpen(true); }}
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-tertiary)] opacity-0 group-hover/file:opacity-100 hover:text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-all duration-200 shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Empty state ── */}
            {totalFiles === 0 && (
                <div className="flex-1 flex items-center justify-center animate-fade-in">
                    <div className="text-center max-w-sm px-6">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--surface-3)] border border-[var(--border-default)] flex items-center justify-center">
                            <FolderOpen size={28} className="text-[var(--text-tertiary)]" />
                        </div>
                        <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">
                            No files uploaded
                        </h3>
                        <p className="text-[13px] text-[var(--text-tertiary)] mb-5 leading-relaxed">
                            Upload your first file to get started with document analysis
                        </p>
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="h-9 px-5 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm shadow-[var(--accent-muted)]"
                        >
                            Upload File
                        </button>
                    </div>
                </div>
            )}

            {/* Search empty state */}
            {totalFiles > 0 && totalFilteredFiles === 0 && searchQuery.trim() && (
                <div className="flex-1 flex items-center justify-center animate-fade-in">
                    <div className="text-center max-w-sm px-6">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--surface-3)] border border-[var(--border-default)] flex items-center justify-center">
                            <Search size={22} className="text-[var(--text-tertiary)]" />
                        </div>
                        <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
                            No results found
                        </h3>
                        <p className="text-[13px] text-[var(--text-tertiary)]">
                            No files match &ldquo;{searchQuery}&rdquo;
                        </p>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {deleteModalOpen && (
                <DeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    fileID={fileToDelete}
                />
            )}

            {uploadModalOpen && (
                <UploadModal
                    isOpen={uploadModalOpen}
                    onClose={handleCloseUploadModal}
                    onUpload={uploadfileHandler}
                />
            )}

            {/* ── Admin Promote Modal ── */}
            {adminModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Promote to Admin</h3>
                            <button
                                onClick={handleCloseAdminModal}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-5">
                            <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] block mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                                placeholder="user@example.com"
                                className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
                            />
                            {adminError && (
                                <p className="text-[12px] text-[var(--danger)] mt-2">{adminError}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseAdminModal}
                                className="flex-1 h-10 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-[13px] font-medium hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePromoteAdmin}
                                disabled={adminLoading}
                                className="flex-1 h-10 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium hover:bg-[var(--accent-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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