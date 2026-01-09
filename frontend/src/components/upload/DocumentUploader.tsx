import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

interface DocumentUploaderProps {
    label: string;
    fileType: 'image' | 'pdf' | 'csv' | 'text';
    onFileChange: (file: File | null) => void;
    onTextChange: (text: string) => void;
    required?: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    label,
    fileType,
    onFileChange,
    onTextChange,
    required
}) => {
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [textValue, setTextValue] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setUploadedFile(file);
            onFileChange(file);
        }
    }, [onFileChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: fileType === 'image' ? { 'image/*': [] } :
            fileType === 'pdf' ? { 'application/pdf': [] } :
                fileType === 'csv' ? { 'text/csv': [], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [] } :
                    undefined
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextValue(e.target.value);
        onTextChange(e.target.value);
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUploadedFile(null);
        onFileChange(null);
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-border shadow-sm mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-text-primary flex items-center gap-2">
                    {label}
                    {required && <span className="text-danger text-xs">*</span>}
                </label>
                <div className="flex bg-surface rounded p-1 border border-border">
                    <button
                        type="button"
                        onClick={() => setMode('file')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${mode === 'file' ? 'bg-white shadow-sm text-primary font-bold' : 'text-text-secondary'}`}
                    >
                        File Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('text')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${mode === 'text' ? 'bg-white shadow-sm text-primary font-bold' : 'text-text-secondary'}`}
                    >
                        Text Input
                    </button>
                </div>
            </div>

            {mode === 'file' ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${uploadedFile ? 'bg-success/5 border-success' : ''}
          `}
                    style={{ minHeight: '120px' }}
                >
                    <input {...getInputProps()} />
                    {uploadedFile ? (
                        <div className="flex items-center gap-3 text-success">
                            <File size={32} />
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{uploadedFile.name}</span>
                                <span className="text-xs opacity-75">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                                onClick={clearFile}
                                className="p-1 hover:bg-danger/10 text-danger rounded-full ml-2"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload size={24} className="text-text-secondary mb-2" />
                            <p className="text-sm text-text-secondary text-center">
                                Drag & drop {fileType.toUpperCase()} file here, or click to browse
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <textarea
                    value={textValue}
                    onChange={handleTextChange}
                    placeholder={`Paste or type ${label.toLowerCase()} here...`}
                    className="w-full h-32 p-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                />
            )}
        </div>
    );
};

export default DocumentUploader;
