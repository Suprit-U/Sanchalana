
import React, { useState, useEffect } from "react";
import { FileUploadSection } from "./FileUploadSection";
import { RegistrationStatsSection } from "./RegistrationStatsSection";
import { parseRegistrationCSV, getRegistrationData, setLocalRegistrationData } from "@/utils/registrationUtils";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function RegistrationManager() {
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [files, setFiles] = useState<Array<{name: string, created_at: string, size: number}>>([]);
  const [isError, setIsError] = useState(false);
  const [isFileProcessed, setIsFileProcessed] = useState(false);
  const { toast: hookToast } = useToast();

  const loadRegistrationData = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const { count, files } = await getRegistrationData();
      console.log("Registration Manager: Loaded data with count:", count, "files:", files);
      
      if (count > 0) {
        // We have registration data
        setStats({
          total: count,
          departmentBreakdown: [] // This will be available if parseRegistrationCSV is called
        });
      }
      
      setFiles(files);
    } catch (error) {
      console.error("Error loading registration data:", error);
      setIsError(true);
      toast.error("Failed to load registration data. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrationData();
  }, []);

  const handleImportRegistrationFile = async () => {
    if (!registrationFile) return;
    
    setIsLoading(true);
    try {
      const result = await parseRegistrationCSV(registrationFile);
      setStats(result);
      setIsFileProcessed(true);
      
      // Refresh file list after successful parse
      const { files } = await getRegistrationData();
      setFiles(files);
      
      toast.success("Registration data imported successfully");
    } catch (error: any) {
      console.error("Error importing registration data:", error);
      setIsError(true);
      toast.error("Failed to import CSV: " + (error.message || "Unknown error"));
      hookToast({
        title: "Import failed",
        description: error.message || "The CSV file is invalid or corrupted",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRegistrationFile(null);
    }
  };

  const handleTestMode = () => {
    // If storage is not working, we can use this for demo purposes
    if (!registrationFile) {
      toast.error("Please select a file first");
      return;
    }
    
    const mockStats = {
      total: 255,
      departmentBreakdown: [
        { department: "CSE", count: 72, percent: 28 },
        { department: "ECE", count: 54, percent: 21 },
        { department: "Non-Tech", count: 45, percent: 18 },
        { department: "ISE", count: 35, percent: 14 },
        { department: "AI & ML", count: 25, percent: 10 },
        { department: "Others", count: 24, percent: 9 }
      ]
    };
    
    setStats(mockStats);
    const { files } = setLocalRegistrationData(mockStats, registrationFile.name, registrationFile.size);
    setFiles(files);
    setIsFileProcessed(true);
    toast.success("Test data loaded successfully");
  };
  
  return (
    <div className="space-y-8">
      {isError && !isFileProcessed && (
        <Alert variant="destructive" className="bg-red-900/30 border-red-500/30 text-white">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle>Storage Connection Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>There was an issue connecting to cloud storage. You can:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Try refreshing the page</li>
              <li>Try uploading your CSV again</li>
              <li>Use Test Mode to preview functionality without cloud storage</li>
            </ol>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700"
                onClick={loadRegistrationData}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <FileUploadSection 
        title="Registration Data Import"
        description="Upload CSV files to update registration counts. Previous data will be deleted."
        accept="text/csv"
        onFileSelect={setRegistrationFile}
        selectedFile={registrationFile}
        handleImport={handleImportRegistrationFile}
        uploadHistory={files.map(file => ({
          name: file.name,
          date: file.created_at,
          size: formatSize(file.size)
        }))}
        customButtons={
          <Button 
            variant="outline" 
            onClick={handleTestMode} 
            className="bg-yellow-700/50 hover:bg-yellow-700/75 text-sm"
            disabled={!registrationFile}
          >
            Use Test Mode (No Storage)
          </Button>
        }
      />
      
      {(stats || isError) && (
        <RegistrationStatsSection stats={stats} isError={isError && !isFileProcessed} />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(2) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
}
