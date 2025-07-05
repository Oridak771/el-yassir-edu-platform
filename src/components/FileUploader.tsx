'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

type FileUploaderProps = {
  bucket: string;
  folder: string;
  allowedFileTypes?: string[];
  maxSizeMB?: number;
  onUploadComplete?: (fileUrl: string, fileMetadata: any) => void;
  label?: string;
  userId: string;
  documentType: string;
};

export default function FileUploader({
  bucket,
  folder,
  allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeMB = 5,
  onUploadComplete,
  label = 'Upload File',
  userId,
  documentType
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = e.target.files[0];
    
    // Validate file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      setError(`File type not allowed. Please upload: ${allowedFileTypes.join(', ')}`);
      setFile(null);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum file size is ${maxSizeMB}MB`);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setUploadSuccess(false);
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
<<<<<<< HEAD
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Record in documents table
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          type: documentType,
          url: publicUrl,
          owner_id: userId,
          metadata: {
            size: file.size,
            contentType: file.type,
            originalName: file.name
          }
        });

      if (docError) throw docError;
=======
      const { data, error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702

      setUploadSuccess(true);
      setFile(null);
      setUploadProgress(100);

      if (onUploadComplete) {
<<<<<<< HEAD
        onUploadComplete(publicUrl, {
=======
        onUploadComplete('', {
>>>>>>> 90d3ac78f9d27dce9c7a5880abde4b7506fb9702
          size: file.size,
          contentType: file.type,
          originalName: file.name,
          path: filePath
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setFile(null);
    setError(null);
    setUploadSuccess(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium">{label}</div>
      
      {!file ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500 mt-1">
            {allowedFileTypes.map(type => type.split('/').pop()).join(', ')} up to {maxSizeMB}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={allowedFileTypes.join(',')}
          />
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {uploadSuccess ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelUpload}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={uploadFile}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {uploading && (
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
      
      {uploadSuccess && (
        <p className="text-sm text-green-500 mt-2">File uploaded successfully!</p>
      )}
    </div>
  );
}
