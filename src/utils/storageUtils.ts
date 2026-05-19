import { supabase } from "@/integrations/supabase/client";

export const ensureStorageBucketsExist = async (): Promise<void> => {
  try {
    console.log("Checking if storage buckets exist...");
    
    // Check which buckets actually exist
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking buckets:', listError);
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    const existingBucketNames = existingBuckets?.map(b => b.name) || [];
    console.log("Existing buckets:", existingBucketNames);
    
    // The buckets we need for our application
    const requiredBuckets = ['registrations', 'registration-data', 'event-images'];
    
    // Try to create any missing buckets
    for (const bucketId of requiredBuckets) {
      if (!existingBucketNames.includes(bucketId)) {
        console.log(`Bucket ${bucketId} does not exist, creating...`);
        
        try {
          const { data, error } = await supabase.storage.createBucket(bucketId, { 
            public: true,
            allowedMimeTypes: bucketId === 'registrations' ? ['text/csv'] : undefined,
            fileSizeLimit: bucketId === 'registrations' ? 5242880 : undefined // 5MB limit for CSV files
          });
          
          if (error) {
            console.warn(`Could not create bucket ${bucketId}:`, error);
          } else {
            console.log(`Created bucket: ${bucketId}`);
          }
        } catch (bucketError: any) {
          console.warn(`Error creating bucket ${bucketId}:`, bucketError);
        }
      } else {
        console.log(`Bucket ${bucketId} already exists`);
      }
    }
    
    // Check again which buckets exist after creation attempts
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('Error checking final buckets state:', finalError);
      throw new Error(`Failed to verify buckets: ${finalError.message}`);
    }
    
    const finalBucketNames = finalBuckets?.map(b => b.name) || [];
    console.log("Final bucket state:", finalBucketNames);
    
    // Check if any required buckets are still missing
    const missingBuckets = requiredBuckets.filter(id => !finalBucketNames.includes(id));
    if (missingBuckets.length > 0) {
      console.warn("Some buckets are still missing after creation attempts:", missingBuckets);
      // Continue anyway - don't throw an error, just warn
    }
    
    return;
  } catch (error) {
    console.error('Error ensuring buckets exist:', error);
    // Don't rethrow - we want to degrade gracefully
  }
};

export const uploadRegistrationData = async (file: File): Promise<string | null> => {
  try {
    console.log("Uploading registration data");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-registration.csv`;
    
    // Ensure bucket exists before upload
    await ensureStorageBucketsExist();
    
    const { data, error } = await supabase.storage
      .from('registrations')
      .upload(filename, file, {
        upsert: true,
        contentType: 'text/csv',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading registration data:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('registrations')
      .getPublicUrl(data.path);

    console.log("File uploaded successfully:", publicUrl.publicUrl);
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error uploading registration data:', error);
    return null;
  }
};

export const storeRegistrationCount = async (count: number): Promise<boolean> => {
  try {
    // Ensure bucket exists before upload
    await ensureStorageBucketsExist();
    
    const countData = { total: count, updated_at: new Date().toISOString() };
    const jsonString = JSON.stringify(countData);
    const countBlob = new Blob([jsonString], { type: 'application/json' });
    
    const { error } = await supabase.storage
      .from('registration-data')
      .upload('current-count.json', countBlob, {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '0'
      });
      
    if (error) {
      console.error('Error storing registration count:', error);
      return false;
    }
    console.log("Registration count stored successfully");
    return true;
  } catch (error) {
    console.error('Error storing registration count:', error);
    return false;
  }
};

export const getRegistrationCount = async (): Promise<number> => {
  try {
    // Ensure bucket exists before download - but don't throw if it fails
    try {
      await ensureStorageBucketsExist();
    } catch (bucketError) {
      console.warn("Could not verify buckets before getting registration count:", bucketError);
      // Continue anyway
    }
    
    const timestamp = Date.now(); // Add timestamp to bypass cache
    const { data, error } = await supabase.storage
      .from('registration-data')
      .download(`current-count.json?t=${timestamp}`);
      
    if (error) {
      console.log("No count file found or access denied:", error);
      return 0;
    }
    
    const text = await data.text();
    const countData = JSON.parse(text);
    console.log("Retrieved count data:", countData);
    return countData.total || 0;
  } catch (error) {
    console.error('Error getting registration count:', error);
    return 0;
  }
};

export const listRegistrationCSVFiles = async (): Promise<Array<{name: string, created_at: string, size: number}>> => {
  try {
    // Ensure bucket exists before listing - but don't throw if it fails
    try {
      await ensureStorageBucketsExist();
    } catch (bucketError) {
      console.warn("Could not verify buckets before listing files:", bucketError);
      // Continue anyway
    }
    
    const { data, error } = await supabase.storage
      .from('registrations')
      .list('', { sortBy: { column: 'created_at', order: 'desc' } });
    
    if (error) {
      console.error('Error listing CSV files:', error);
      throw new Error(`Failed to list CSV files: ${error.message}`);
    }
    
    console.log("Raw files data from storage:", data);
    
    return data
      ?.filter(file => file.name.endsWith('.csv'))
      .map(file => ({
        name: file.name,
        created_at: new Date(file.created_at).toLocaleString(),
        size: file.metadata?.size || 0
      })) || [];
  } catch (error) {
    console.error('Error listing CSV files:', error);
    return []; // Return empty array instead of throwing
  }
};

export const deleteAllRegistrationData = async (): Promise<boolean> => {
  try {
    try {
      await ensureStorageBucketsExist();
    } catch (bucketError) {
      console.warn("Could not verify buckets before deletion:", bucketError);
      // Continue anyway
    }
    
    const { data: files, error: listError } = await supabase.storage
      .from('registrations')
      .list();
    
    if (listError) {
      console.error('Error listing files for deletion:', listError);
      return false;
    }
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => file.name);
      const { error } = await supabase.storage
        .from('registrations')
        .remove(filePaths);
      
      if (error) {
        console.error('Error deleting files:', error);
        return false;
      }
    }
    
    // Also delete the count file
    await supabase.storage
      .from('registration-data')
      .remove(['current-count.json']);
      
    return true;
  } catch (error) {
    console.error('Error deleting registration data:', error);
    return false;
  }
};

export const uploadEventImage = async (file: File, filePath: string): Promise<string | null> => {
  try {
    // Ensure bucket exists before upload
    try {
      await ensureStorageBucketsExist();
    } catch (bucketError) {
      console.warn("Could not verify buckets before uploading image:", bucketError);
      // Continue anyway
    }
    
    console.log("Uploading event image:", filePath);
    
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading event image:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('event-images')
      .getPublicUrl(data.path);

    console.log("Image uploaded successfully:", publicUrl.publicUrl);
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    return null;
  }
};

export const deleteEventImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    // The URL format is typically like: https://[project-ref].supabase.co/storage/v1/object/public/event-images/[filename]
    const urlParts = imageUrl.split('/');
    const filePath = urlParts[urlParts.length - 1];
    
    console.log("Deleting event image:", filePath);
    
    const { error } = await supabase.storage
      .from('event-images')
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting event image:', error);
      return false;
    }
    
    console.log("Image deleted successfully");
    return true;
  } catch (error) {
    console.error('Error deleting event image:', error);
    return false;
  }
};
