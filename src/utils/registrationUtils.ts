import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  uploadRegistrationData, 
  storeRegistrationCount, 
  getRegistrationCount,
  listRegistrationCSVFiles,
  ensureStorageBucketsExist
} from "@/utils/storageUtils";

export interface RegistrationData {
  department: string;
  count: number;
  percent: number;
}

export interface RegistrationStats {
  total: number;
  departmentBreakdown: RegistrationData[];
}

// Keep local cache of registration data in case storage fails
let localRegistrationCache: RegistrationStats | null = null;
let localCSVFiles: Array<{name: string, created_at: string, size: number}> = [];

export const parseRegistrationCSV = async (file: File): Promise<RegistrationStats> => {
  try {
    console.log("Starting CSV parsing process...");
    
    // Make sure buckets exist before proceeding - but don't throw if this fails
    try {
      await ensureStorageBucketsExist();
      console.log("Storage buckets verified before CSV parsing");
    } catch (bucketError) {
      console.warn("Warning: Could not verify storage buckets, but will try to continue:", bucketError);
      // Continue anyway - we'll use local cache as fallback
    }
    
    const text = await file.text();
    const lines = text.split('\n');
    
    console.log("CSV content preview:", lines.slice(0, 3));
    
    const validLines = lines.filter(line => line.trim() && line.split(',').length >= 2);
    if (validLines.length === 0) {
      throw new Error('No valid data in CSV file');
    }
    
    const header = validLines[0].toLowerCase().split(',');
    const eventNameIndex = header.findIndex(col => col.includes('event name') || col.includes('event'));
    
    if (eventNameIndex === -1) {
      throw new Error('Event name column not found in CSV file');
    }
    
    const departmentCounts: Record<string, number> = {};
    let total = 0;

    for (let i = 1; i < validLines.length; i++) {
      const values = validLines[i].split(',');
      if (values.length <= eventNameIndex) continue;
      
      const eventName = values[eventNameIndex].trim();
      if (eventName) {
        const department = getDepartmentFromEventName(eventName);
        if (department) {
          departmentCounts[department] = (departmentCounts[department] || 0) + 1;
          total++;
        }
      }
    }
    
    console.log("Total registrations found:", total);
    console.log("Department breakdown:", departmentCounts);
    
    // Calculate percentages
    const departmentBreakdown: RegistrationData[] = Object.entries(departmentCounts)
      .map(([department, count]) => ({
        department,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const stats: RegistrationStats = {
      total,
      departmentBreakdown
    };
    
    // Store in local cache immediately
    localRegistrationCache = stats;
    
    // Add to local CSV files cache with current timestamp
    const newFileEntry = {
      name: `${new Date().toLocaleString()}_${file.name}`,
      created_at: new Date().toLocaleString(),
      size: file.size
    };
    localCSVFiles = [newFileEntry, ...localCSVFiles].slice(0, 10); // Keep last 10 files
    
    // Upload CSV to storage - but continue even if it fails
    console.log("Uploading CSV file to storage...");
    try {
      const uploadUrl = await uploadRegistrationData(file);
      if (!uploadUrl) {
        console.warn("Failed to upload CSV file to storage, using local cache instead");
        toast.warning("File processed successfully but couldn't be saved to cloud storage");
      } else {
        console.log("CSV file uploaded successfully to:", uploadUrl);
        toast.success("CSV file uploaded successfully");
      }
    } catch (uploadError) {
      console.warn("Error uploading CSV file:", uploadError);
      toast.warning("File processed successfully but couldn't be saved to cloud storage");
      // Continue with processing using local cache
    }
    
    // Store registration count
    console.log("Storing registration count:", total);
    try {
      const countStored = await storeRegistrationCount(total);
      if (!countStored) {
        console.warn("Failed to store registration count in storage, but stats are still available in local cache");
        toast.warning("Registration count processed but couldn't be saved to cloud storage");
      } else {
        console.log("Registration count stored successfully");
      }
    } catch (countError) {
      console.warn("Error storing registration count:", countError);
      toast.warning("Registration count processed but couldn't be saved to cloud storage");
      // Continue and return the stats from local cache
    }

    // Log status of operations
    console.log("CSV parsing complete. Stats available in local cache and attempted cloud storage");
    
    return stats;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error;
  }
};

// Helper function to determine department from event name
const getDepartmentFromEventName = (eventName: string): string => {
  // Add more events here based on the CSV you're importing
  const eventMap: Record<string, string> = {
    // CSE Department Events
    "Movie Mania": "CSE",
    "Code Sprint": "CSE",
    "Web Design": "CSE",
    "Tech Quiz": "CSE",
    
    // ECE Department Events
    "Circuit Challenge": "ECE", 
    "Robotics Rumble": "ECE",
    "Signal Processing": "ECE",
    "IoT Workshop": "ECE",
    
    // Non-technical Events
    "Pattern Play": "Non-Tech",
    "Food Beast": "Non-Tech",
    "Minute to Win It": "Non-Tech",
    "Veg Picasso": "Non-Tech",
    
    // ISE Department Events
    "Data Dive": "ISE",
    "Network Security": "ISE",
    "Database Design": "ISE",
    
    // AI & ML Department Events
    "AI Workshop": "AI & ML",
    "Neural Networks": "AI & ML",
    "Machine Learning": "AI & ML",
    "Computer Vision": "AI & ML",
    
    // Data Science Department Events
    "Data Analysis": "DS",
    "Big Data": "DS",
    "Data Visualization": "DS",
    
    // Civil & Mechanical Department Events
    "Bridge Building": "Civil",
    "CAD Design": "Civil",
    "Structural Analysis": "Civil",
    
    // Mathematics Department Events
    "Math Olympiad": "Math",
    "Statistical Analysis": "Math",
    
    // MBA Department Events
    "Business Case Study": "MBA",
    "Marketing Strategy": "MBA",
    "Entrepreneurship": "MBA",
    
    // Chemistry Department Events
    "Chemical Experiments": "Chem",
    "Material Science": "Chem",
    
    // Physics Department Events
    "Physics Demonstration": "Phy",
    "Quantum Mechanics": "Phy",
    
    // SVFC Department Events
    "Commerce Quiz": "SVFC",
    "Business Administration": "SVFC",
    "Computer Applications": "SVFC"
  };
  
  // Use the mapping or default to "Others"
  return eventMap[eventName] || "Others";
};

export const getCurrentRegistrationCount = async (): Promise<number> => {
  try {
    // First try to get from local cache if available
    if (localRegistrationCache) {
      console.log("Returning registration count from local cache:", localRegistrationCache.total);
      return localRegistrationCache.total;
    }
    
    // If not in cache, try to retrieve from storage
    try {
      await ensureStorageBucketsExist();
      console.log("Storage buckets verified before getting registration count");
    } catch (bucketError) {
      console.warn("Warning: Could not verify storage buckets for registration count:", bucketError);
      // Continue anyway - we'll try to get the count
    }
    
    const count = await getRegistrationCount();
    console.log("Retrieved registration count from storage:", count);
    return count;
  } catch (error) {
    console.error('Error in getCurrentRegistrationCount:', error);
    
    // If we have a cached value, return it as fallback
    if (localRegistrationCache) {
      console.log("Falling back to cached registration count:", localRegistrationCache.total);
      return localRegistrationCache.total;
    }
    
    return 0;
  }
};

export const getRegistrationData = async () => {
  try {
    // First check if we have data in local cache
    let count = localRegistrationCache?.total || 0;
    let files = [...localCSVFiles]; // Start with local cache
    
    // Try to get from storage as well
    try {
      await ensureStorageBucketsExist();
      console.log("Storage buckets verified before getting registration data");
    } catch (bucketError) {
      console.warn("Warning: Could not verify storage buckets for registration data:", bucketError);
      // Continue with local cache if available
      if (localRegistrationCache || localCSVFiles.length > 0) {
        console.log("Using local cache for registration data due to storage access issues");
        return { count, files };
      }
    }
    
    try {
      const storageCount = await getCurrentRegistrationCount();
      if (storageCount > 0) count = storageCount;
    } catch (countError) {
      console.warn("Could not retrieve registration count from storage:", countError);
      // Continue with local cache
    }
    
    try {
      const storageFiles = await listRegistrationCSVFiles();
      console.log("Successfully retrieved file list from storage:", storageFiles);
      if (storageFiles.length > 0) {
        // Merge with local files and remove duplicates
        const allFileNames = new Set(files.map(f => f.name));
        const uniqueStorageFiles = storageFiles.filter(f => !allFileNames.has(f.name));
        files = [...files, ...uniqueStorageFiles].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch (filesError) {
      console.warn("Could not retrieve registration CSV files from storage:", filesError);
      // Return with local cache files array
    }
    
    return { count, files };
  } catch (error) {
    console.error('Error getting registration data:', error);
    // Return local cache as fallback
    return { 
      count: localRegistrationCache?.total || 0, 
      files: localCSVFiles 
    };
  }
};

// New method to update local cache for testing without storage
export const setLocalRegistrationData = (stats: RegistrationStats, fileName: string, fileSize: number) => {
  localRegistrationCache = stats;
  const newFileEntry = {
    name: `${new Date().toLocaleString()}_${fileName}`,
    created_at: new Date().toLocaleString(),
    size: fileSize
  };
  localCSVFiles = [newFileEntry, ...localCSVFiles].slice(0, 10);
  return { count: stats.total, files: localCSVFiles };
};
