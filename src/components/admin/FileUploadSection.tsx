
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Cloud, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteAllRegistrationData, ensureStorageBucketsExist, listRegistrationCSVFiles } from "@/utils/storageUtils";
import { toast } from "sonner";

interface FileUploadSectionProps {
  title: string;
  description: string;
  accept: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  handleImport: () => void;
  uploadHistory?: { name: string; date: string; size: string }[];
  onExport?: () => void;
  customButtons?: React.ReactNode;
}

export function FileUploadSection({
  title,
  description,
  accept,
  onFileSelect,
  selectedFile,
  handleImport,
  uploadHistory,
  onExport,
  customButtons
}: FileUploadSectionProps & { onExport?: () => void, customButtons?: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast: hookToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [verifyingBuckets, setVerifyingBuckets] = useState(false);
  const [csvFiles, setCsvFiles] = useState<Array<{name: string, created_at: string, size: number}>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const init = async () => {
      setVerifyingBuckets(true);
      try {
        console.log("FileUploadSection: Starting storage bucket verification");
        await ensureStorageBucketsExist();
        console.log("FileUploadSection: Storage buckets have been verified");
        
        if (accept === "text/csv") {
          console.log("FileUploadSection: CSV detected, fetching files");
          await fetchCSVFiles();
        }
      } catch (error) {
        console.error("FileUploadSection: Failed to verify storage buckets:", error);
        toast.warning("Storage warning: Could not verify all storage buckets. Some features might not work correctly.");
        
        // Add a retry mechanism
        if (retryCount < 2) {
          console.log(`FileUploadSection: Will retry bucket verification in 2 seconds (attempt ${retryCount + 1}/2)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } finally {
        setVerifyingBuckets(false);
      }
    };
    
    init();
  }, [toast, accept, retryCount]);
  
  const fetchCSVFiles = async () => {
    if (accept !== "text/csv") return;
    
    setIsLoadingFiles(true);
    try {
      console.log("FileUploadSection: Fetching CSV files");
      const files = await listRegistrationCSVFiles();
      console.log("FileUploadSection: CSV files found:", files);
      setCsvFiles(files);
    } catch (error) {
      console.error("FileUploadSection: Error fetching CSV files:", error);
      toast.error("Failed to fetch CSV files list. Please try again.");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === accept || 
          (accept === "application/json" && file.name.endsWith('.json')) || 
          (accept === "text/csv" && file.name.endsWith('.csv'))) {
        onFileSelect(file);
        setUploadStatus('idle');
        toast.success(`File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      } else {
        toast.error(`Please select a ${accept === "application/json" ? "JSON" : "CSV"} file`);
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === accept || 
          (accept === "application/json" && file.name.endsWith('.json')) || 
          (accept === "text/csv" && file.name.endsWith('.csv'))) {
        onFileSelect(file);
        setUploadStatus('idle');
        toast.success(`File dropped: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      } else {
        toast.error(`Please drop a ${accept === "application/json" ? "JSON" : "CSV"} file`);
      }
    }
  };

  const handleDeletePreviousData = async () => {
    if (accept !== "text/csv") return;
    
    setIsDeleting(true);
    try {
      console.log("FileUploadSection: Deleting previous registration data");
      const success = await deleteAllRegistrationData();
      
      if (success) {
        toast.success("Previous registration data has been deleted");
        setCsvFiles([]); // Clear the files list
      } else {
        toast.error("Failed to delete previous registration data");
      }
    } catch (error) {
      console.error("FileUploadSection: Error deleting data:", error);
      toast.error("An unexpected error occurred while deleting data");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleImportWithState = async () => {
    setIsImporting(true);
    setUploadStatus('idle');
    
    try {
      console.log("FileUploadSection: Starting import process");
      
      await handleImport();
      
      setUploadStatus('success');
      
      if (accept === "text/csv") {
        hookToast({
          title: "Import successful",
          description: "Registration data has been imported and saved to storage.",
        });
        
        // Immediately fetch CSV files after successful import
        console.log("FileUploadSection: Import successful, fetching updated CSV files list");
        await fetchCSVFiles();
      } else {
        hookToast({
          title: "Import successful",
          description: "File has been imported successfully",
        });
      }
    } catch (error: any) {
      console.error("FileUploadSection: Import error:", error);
      setUploadStatus('error');
      hookToast({
        title: "Import failed",
        description: error.message || "There was an error importing your file. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(2) + ' KB';
    return (kb / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
          {accept === "application/json" ? (
            <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          ) : (
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
      </div>
      <p className="text-gray-300 mb-6 text-sm sm:text-base">{description}</p>
      
      {verifyingBuckets && (
        <div className="mb-4 bg-blue-900/30 p-3 rounded-lg border border-blue-500/30 flex items-start gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400 mt-0.5"></div>
          <p className="text-sm text-blue-300">
            Verifying storage buckets... Please wait.
          </p>
        </div>
      )}
      
      {accept === "text/csv" && csvFiles.length > 0 && (
        <div className="mb-4 bg-green-900/30 p-3 rounded-lg border border-green-500/30 flex items-start gap-3">
          <FileText className="text-green-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-300">
            <p className="font-medium mb-1">Found {csvFiles.length} CSV file(s) in storage:</p>
            <ul className="list-disc pl-5 space-y-1">
              {csvFiles.slice(0, 3).map((file, idx) => (
                <li key={idx}>
                  {file.name} ({formatFileSize(file.size)}) - {file.created_at}
                </li>
              ))}
              {csvFiles.length > 3 && <li>+ {csvFiles.length - 3} more...</li>}
            </ul>
          </div>
        </div>
      )}
      
      {uploadStatus === 'success' && accept === "text/csv" && (
        <div className="mb-4 bg-green-900/30 p-3 rounded-lg border border-green-500/30 flex items-start gap-3">
          <FileText className="text-green-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-300">
            <p className="font-medium">Upload successful! The file list has been refreshed with your new upload.</p>
          </div>
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-300">
            <p className="font-medium">Upload failed. Please check console for error details.</p>
          </div>
        </div>
      )}
      
      {accept === "application/json" && (
        <div className="mb-4 bg-blue-900/30 p-3 rounded-lg border border-blue-500/30 flex items-start gap-3">
          <AlertTriangle className="text-blue-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            Department data is now stored in the cloud. Import once and access from any device or browser.
          </p>
        </div>
      )}

      {accept === "text/csv" && csvFiles.length === 0 && !isLoadingFiles && !verifyingBuckets && (
        <div className="mb-4 bg-yellow-900/30 p-3 rounded-lg border border-yellow-500/30 flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-300">
            <p>No CSV files found in storage. Upload a registration CSV file to track participation.</p>
            <Button 
              className="mt-2 bg-yellow-700/50 hover:bg-yellow-700/75 text-xs"
              size="sm"
              variant="outline" 
              onClick={fetchCSVFiles}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh File List
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div 
          className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-8 text-center cursor-pointer"
          onClick={handleFileSelect}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept={accept}
            onChange={handleFileChange}
          />
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            {selectedFile 
              ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)` 
              : "Drag and drop files here or click to browse"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-sm sm:text-base"
              onClick={(e) => {
                e.stopPropagation();
                handleFileSelect();
              }}
            >
              Select {accept === "application/json" ? "JSON" : "CSV"}
            </Button>
            {selectedFile && (
              <Button 
                className="bg-green-500 hover:bg-green-600 text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImportWithState();
                }}
                disabled={isImporting || verifyingBuckets}
              >
                {isImporting ? "Importing..." : "Import Now"}
              </Button>
            )}
            {accept === "application/json" && onExport && (
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
                disabled={verifyingBuckets}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            )}
            {customButtons && (
              <div onClick={(e) => e.stopPropagation()}>
                {customButtons}
              </div>
            )}
          </div>
        </div>
        
        {accept === "text/csv" && (
          <div className="flex justify-center gap-2">
            <Button 
              variant="destructive"
              onClick={handleDeletePreviousData}
              disabled={isDeleting || verifyingBuckets || csvFiles.length === 0}
              className="mt-2 text-sm sm:text-base"
            >
              {isDeleting ? "Deleting..." : "Delete Previous Registration Data"}
            </Button>
            <Button 
              variant="outline"
              onClick={fetchCSVFiles}
              disabled={isLoadingFiles || verifyingBuckets}
              className="mt-2 text-sm sm:text-base"
            >
              {isLoadingFiles ? 
                <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div> Refreshing...</> : 
                <><RefreshCw className="w-4 h-4 mr-2" /> Refresh File List</>
              }
            </Button>
          </div>
        )}
        
        {isLoadingFiles && accept === "text/csv" && (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-blue-300">Loading CSV files...</span>
          </div>
        )}
        
        {uploadHistory && uploadHistory.length > 0 && (
          <div className="text-xs sm:text-sm text-gray-400 bg-black/20 p-3 sm:p-4 rounded-lg">
            <p className="font-semibold mb-2">Recent Imports:</p>
            {uploadHistory.map((file, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="truncate max-w-[60%]">{file.name}</span>
                <span>{file.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
