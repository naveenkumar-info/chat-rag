'use client';

import { FileText, Trash2, X, ChevronDown, Upload } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import axios from 'axios';

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
    //environment
    const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

    //states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<Number | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [availableFiles, setAvailableFiles] = useState<file_data[]>([]);
 
    // Group files by category
    const groupedByCategory = availableFiles.reduce((acc, file) => {
        const category = extensionToCategory[file.file_type] || 'other';
        console.log('Processing file:', category);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(file);
        return acc;
    }, {} as Record<string,  file_data[]>);

//<---CRUDS--->

    //get files from backend
    const getFiles = async () => {
        try {
            const response = await axios.get(`${NEXT_API_URL}/files/`);
            setAvailableFiles(response.data);
            console.log('Files fetched successfully:', response.data);
        }
        catch (error) {
            console.error('Error fetching files:', error);
        }
    }

    useEffect(() => {
        getFiles();
    }, []);
    useEffect(() => {

        console.log('Available files updated:', availableFiles);

    }, [availableFiles]);

    //upload file to backend
    const uploadfileHandler = async () =>{

        const formData = new FormData();
        
        if (selectedFile) {
            console.log(`Uploading file: ${selectedFile.name}`);
            formData.append('file', selectedFile);
        }
 
        console.log('Selected file:', selectedFile);
        

        try {
            const response = await axios.post(`${NEXT_API_URL}/uploadfile/`, formData);
            console.log('File uploaded successfully:', response.data);

            setUploadModalOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
        }



    }
    
    const  handleDeleteClick = async (file_id: Number) => {

        const res = await axios.delete(`${NEXT_API_URL}/deletefiles/${file_id}`);
        console.log('Delete response:', res.data);
        setDeleteModalOpen(false);
    };

    const handleConfirmDelete = () => {
        console.log(`Deleting file: ${fileToDelete}`);
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

    
    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedFile(null);
    };

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden">
            <div className="mb-6 flex items-center justify-between shrink-0 gap-4">

  {/* LEFT CONTENT */}
  <div className="min-w-0  overflow-hidden">
    
    <h2 className="text-[18px] sm:text-[20px] font-bold text-white mb-2 flex items-center gap-2 flex-wrap">
      <span className="whitespace-nowrap ">
            Files
            </span>

      <span
        className="text-gray-400 text-[18px] sm:text-[20px] transition-all duration-300 overflow-hidden whitespace-nowrap"
      >
        • Total files: {Object.values(groupedByCategory).flat().length}
      </span>
    </h2>

    <p className="text-gray-400 flex flex-wrap">
      Manage and organize your uploaded files
    </p>

  </div>

  {/* RIGHT BUTTON */}
  <div>
    <button
      onClick={() => 
        
        setUploadModalOpen(true)
      }
      className="p-3 w-10 h-9.5 sm:w-30 sm:h-10  bg-white text-black rounded-lg text-[12px] hover:bg-gray-200 transition-all duration-300  ml-4 flex items-center gap-2"
    >
      <Upload size={18}  />

      {/* Animate text like sidebar */}
      <span className="hidden text-[12px] md:text-[15px] md:inline whitespace-nowrap">
        Upload File
      </span>
    </button>
  </div>

</div>

           <div className="flex-1 overflow-y-auto space-y-4 px-2 sm:px-4">

  {Object.entries(groupedByCategory).map(([category, files]) => (
    <div key={category}>

      {/* CATEGORY BUTTON */}
      <button
        onClick={() =>
          setOpenCategory(openCategory === category ? null : category)
        }
        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 rounded-lg border transition-all ${
          openCategory === category
            ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
            : "bg-gray-900 border-gray-800 hover:bg-gray-850 hover:border-gray-700"
        }`}
      >
        {/* Arrow */}
        <div
          className={`shrink-0 transition-transform duration-300 ${
            openCategory === category ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
        </div>

       

        {/* Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {categoryIcons[category]}
        
          <>{console.log('Rendering category:', category , categoryIcons[category] )}</>

          <h3 className="text-sm sm:text-lg font-semibold text-white truncate">
            {categoryLabels[category]}
          </h3>
        </div>

        {/* Count */}
        <span className="text-xs sm:text-sm text-gray-400 shrink-0">
          ({files.length})
        </span>
      </button>

      {/* DROPDOWN */}
      {openCategory === category && (
        <div className="space-y-2 flex flex-col items-center sm:space-y-3 ml-2 sm:ml-8">
  {files.map((file, index) => (
    <div
  key={index}
  className="bg-gray-950 border border-gray-800 rounded-lg 
  p-3 sm:p-4 hover:border-gray-700 transition-colors 
  flex flex-col sm:flex-row gap-3 flex-wrap overflow-hidden
  max-w-[220px] sm:max-w-full
   "
>

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">

        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded flex items-center justify-center shrink-0">
          {categoryIcons[category]}
        </div>

       
        <div className="flex-1 min-w-0">
  {file.file_type === "pdf" || file.file_type === "jpg" || file.file_type === "png" ? (
    // ✅ Direct open (PDF / images)
    <a
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white  cursor-pointer text-[12px] sm:text-base font-medium truncate"
    >
      {file.filename}
    </a>
  ) : file.file_type === "doc" || file.file_type === "docx" || file.file_type === "xls" || file.file_type === "xlsx" ? (
    // ✅ Microsoft Viewer
    <a
      href={`https://docs.google.com/gview?url=${encodeURIComponent(file.file_url)}&embedded=true`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white cursor-pointer text-[12px] sm:text-base font-medium truncate"
    >
      {file.filename}
    </a>
  ) : (
    // ✅ Fallback (download)
    <a
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 cursor-pointer text-[12px] sm:text-base font-medium truncate underline"
    >
      {file.filename} 
    </a>
  )}
</div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">

        <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
          {file.created_at}
        </span>

        <button
          onClick={()=>{
            setFileToDelete(file.id)
            setDeleteModalOpen(true)
          }}
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
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No files uploaded
                        </h3>
                        <p className="text-gray-400 mb-4">Upload your first file to get started</p>
                        <button onClick={()=>{setUploadModalOpen(true)}}  className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
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
                                onClick={()=>setDeleteModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-8">
                            Are you sure you want to delete this file? This action cannot be undone.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteClick(fileToDelete!)}
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
                            <h3 className="text-xl font-semibold text-white">Upload File</h3>
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
                                onChange={handleFileSelect}
                                className="hidden w-full h-full absolute top-0 left-0 cursor-pointer"
                                id="file-input"
                                
                            />
                            <label htmlFor="file-input" className="cursor-pointer block">
                                <Upload size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-white font-medium mb-2">
                                    {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                    {selectedFile ? 'File selected' : 'or click to browse'}
                                </p>
                                
                            </label>
                        </div>



                        <div className="flex gap-4">
                            <button
                                onClick={handleCloseUploadModal}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={()=> uploadfileHandler()}
                                disabled={!selectedFile}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedFile
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