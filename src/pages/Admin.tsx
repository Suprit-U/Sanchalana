
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { EventEditor } from "@/components/EventEditor";
import { useToast } from "@/hooks/use-toast";
import { 
  storeDepartmentData, 
  getDepartmentData,
  addToUploadHistory, 
  getUploadHistory,
  type Event as EventType,
  type DepartmentData
} from "@/utils/departmentDataUtils";
import { FileUploadSection } from "@/components/admin/FileUploadSection";
import { EventManagementSection } from "@/components/admin/EventManagementSection";
import { AssignAdminsSection } from "@/components/admin/AssignAdminsSection";
import { RegistrationManager } from "@/components/admin/RegistrationManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departmentConfig } from "@/config/departments";
import { toast } from "sonner";

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [selectedDepartmentForUpload, setSelectedDepartmentForUpload] = useState<string | null>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [uploadHistory, setUploadHistory] = useState<{name: string; date: string; size: string}[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [departmentEvents, setDepartmentEvents] = useState<EventType[]>([]);
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("event-management");
  const { toast: hookToast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setIsAuthenticated(true);
        setUser(data.session.user);
        
        // Check if super admin or department admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', data.session.user.email)
          .single();
        
        if (adminData) {
          setIsSuperAdmin(adminData.is_super_admin);
          
          if (!adminData.is_super_admin && adminData.department_id) {
            setDepartmentId(adminData.department_id);
            setSelectedDepartmentForUpload(adminData.department_id);
            await loadDepartmentEvents(adminData.department_id);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Ensure storage buckets exist when Admin page loads
    const setupStorage = async () => {
      try {
        const { ensureStorageBucketsExist } = await import('@/utils/storageUtils');
        console.log("Admin: Ensuring storage buckets exist at initialization");
        await ensureStorageBucketsExist();
        console.log("Admin: Storage buckets verification complete");
      } catch (error) {
        console.error("Admin: Failed to verify storage buckets:", error);
        toast.warning("Storage warning: Could not verify all storage buckets. Some features might not work correctly.");
      }
    };
    setupStorage();
    
    // Load upload history
    setUploadHistory(getUploadHistory());
  }, []);

  const loadDepartmentEvents = async (deptId: string) => {
    try {
      const data = await getDepartmentData(deptId);
      if (data && data.events) {
        setDepartmentEvents(data.events);
      } else {
        setDepartmentEvents([]);
      }
    } catch (error) {
      console.error("Error loading department events:", error);
      hookToast({
        title: "Error loading events",
        description: "Could not load department events",
        variant: "destructive",
      });
      setDepartmentEvents([]);
    }
  };
  
  const handleEventSelect = (eventId: number) => {
    setSelectedEventId(eventId);
  };
  
  const handleEditEvent = () => {
    if (selectedEventId) {
      setIsEventEditorOpen(true);
    } else {
      hookToast({
        title: "No event selected",
        description: "Please select an event to edit",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveEvent = async (eventData: EventType) => {
    if (!departmentId && !selectedDepartmentForUpload) {
      hookToast({
        title: "Department ID not found",
        description: "Please select a department first",
        variant: "destructive",
      });
      return;
    }
    
    const deptId = departmentId || selectedDepartmentForUpload;
    if (!deptId) return;
    
    try {
      // Get existing department data
      const data = await getDepartmentData(deptId);
      
      if (data) {
        // Find the index of the event to update
        const eventIndex = data.events.findIndex(e => e.sl_no === eventData.sl_no);
        
        if (eventIndex >= 0) {
          // Update the event
          data.events[eventIndex] = eventData;
        } else {
          // Add new event
          data.events.push(eventData);
        }
        
        // Save updated data
        await storeDepartmentData(deptId, data);
        
        // Reload events
        await loadDepartmentEvents(deptId);
        
        hookToast({
          title: "Event saved",
          description: `${eventData.event_name} has been updated successfully`,
        });
      } else {
        // Create a new department data object
        const newDeptData: DepartmentData = {
          department: departmentConfig[deptId as keyof typeof departmentConfig]?.name || deptId.toUpperCase(),
          description: `Events and activities for the ${departmentConfig[deptId as keyof typeof departmentConfig]?.name || deptId.toUpperCase()} department`,
          events: [eventData],
          faculty_coordinators: [],
          main_department_coordinators: []
        };
        
        // Save new department data
        await storeDepartmentData(deptId, newDeptData);
        
        // Reload events
        await loadDepartmentEvents(deptId);
        
        hookToast({
          title: "Event saved",
          description: `${eventData.event_name} has been created successfully`,
        });
      }
    } catch (error: any) {
      hookToast({
        title: "Error saving event",
        description: error.message || "An error occurred while saving the event",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateNewEvent = () => {
    setSelectedEventId(null);
    setIsEventEditorOpen(true);
  };

  const handleImportJsonFile = async () => {
    if (!importedFile) return;
    
    if (!isSuperAdmin && !departmentId && !selectedDepartmentForUpload) {
      hookToast({
        title: "Department ID not found",
        description: "Please select a department first",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // For super admin, allow selecting department for upload
          const deptId = selectedDepartmentForUpload || departmentId;
          
          if (!deptId) {
            hookToast({
              title: "Department ID not found",
              description: "Please select a department",
              variant: "destructive",
            });
            return;
          }
          
          const success = await storeDepartmentData(deptId, jsonData);
          
          if (success) {
            addToUploadHistory(importedFile.name, importedFile.size);
            setUploadHistory(getUploadHistory());
            
            await loadDepartmentEvents(deptId);
            
            hookToast({
              title: "Import successful",
              description: `${importedFile.name} data has been imported for department: ${deptId}`,
            });
            
            setImportedFile(null);
          } else {
            hookToast({
              title: "Import partially successful",
              description: "Data saved locally but could not be uploaded to cloud storage",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("JSON parse error:", error);
          hookToast({
            title: "Import failed",
            description: "The JSON file is invalid or corrupted",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        hookToast({
          title: "Import failed",
          description: "Error reading the file",
          variant: "destructive",
        });
      };
      reader.readAsText(importedFile);
    } catch (error) {
      console.error("File import error:", error);
      hookToast({
        title: "Import failed",
        description: "Error processing the file",
        variant: "destructive",
      });
    }
  };

  const handleExportJson = async () => {
    if (!selectedDepartmentForUpload && !departmentId) {
      hookToast({
        title: "Department not selected",
        description: "Please select a department to export data",
        variant: "destructive",
      });
      return;
    }

    const deptId = selectedDepartmentForUpload || departmentId;
    if (!deptId) return;

    try {
      const data = await getDepartmentData(deptId);
      if (data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${deptId}_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        hookToast({
          title: "Export successful",
          description: `Department data exported as ${deptId}_data.json`,
        });
      }
    } catch (error) {
      console.error("Error exporting JSON:", error);
      hookToast({
        title: "Export failed",
        description: "Could not export department data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access Required</h1>
          <p className="text-gray-300 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
          <div className="flex flex-col gap-4">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => navigate("/auth")}
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white hover:bg-white/5"
              onClick={() => navigate("/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white pb-16">
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Admin Dashboard</h1>
          <p className="text-gray-300">
            {isSuperAdmin ? "Manage Sanchalana 2025 events and settings" : `Manage Department: ${departmentId?.toUpperCase()}`}
          </p>
        </div>
        
        {isSuperAdmin && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 rounded-xl mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Department for Operations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Select value={selectedDepartmentForUpload || ""} onValueChange={setSelectedDepartmentForUpload}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20 text-white">
                    {Object.keys(departmentConfig).map((deptCode) => (
                      <SelectItem key={deptCode} value={deptCode}>
                        {departmentConfig[deptCode as keyof typeof departmentConfig].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        
        <Tabs
          defaultValue={isSuperAdmin ? "data-import" : "event-management"}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/10 border border-white/20 rounded-lg overflow-hidden">
              {!isSuperAdmin && (
                <TabsTrigger 
                  value="event-management" 
                  className="px-8 py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base"
                >
                  Event Management
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="data-import" 
                className="px-8 py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base"
              >
                Data Import
              </TabsTrigger>
              {isSuperAdmin && (
                <>
                  <TabsTrigger 
                    value="registration" 
                    className="px-8 py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base"
                  >
                    Registration Data
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assign-admins" 
                    className="px-8 py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base"
                  >
                    Assign Admins
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
          
          {!isSuperAdmin && (
            <TabsContent value="event-management" className="mt-0">
              <div className="grid md:grid-cols-1 gap-8">
                <EventManagementSection 
                  events={departmentEvents}
                  selectedEventId={selectedEventId}
                  onEventSelect={handleEventSelect}
                  onEditEvent={handleEditEvent}
                  onCreateEvent={handleCreateNewEvent}
                />
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="data-import" className="mt-0">
            <div className="grid md:grid-cols-1 gap-8">
              <FileUploadSection 
                title="Import Department Data"
                description={`Upload JSON files with your department's event data. ${departmentId && !isSuperAdmin ? `You can only upload data for ${departmentId.toUpperCase()}.` : 'Select a department first if needed.'}`}
                accept="application/json"
                onFileSelect={setImportedFile}
                selectedFile={importedFile}
                handleImport={handleImportJsonFile}
                uploadHistory={uploadHistory}
                onExport={handleExportJson}
              />
            </div>
          </TabsContent>
          
          {isSuperAdmin && (
            <TabsContent value="registration" className="mt-0">
              <div className="grid md:grid-cols-1 gap-8">
                <RegistrationManager />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="assign-admins" className="mt-0">
              <div className="grid md:grid-cols-1 gap-8">
                <AssignAdminsSection />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <EventEditor 
        isOpen={isEventEditorOpen}
        onClose={() => setIsEventEditorOpen(false)}
        departmentId={departmentId || selectedDepartmentForUpload || ""}
        eventId={selectedEventId || undefined}
        onSave={handleSaveEvent}
      />
    </div>
  );
}
