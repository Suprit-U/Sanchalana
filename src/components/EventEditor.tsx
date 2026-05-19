import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Upload, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDepartmentData, type Event as EventType } from "@/utils/departmentDataUtils";
import { uploadEventImage, deleteEventImage } from "@/utils/storageUtils";

interface ExtendedEventType extends Partial<EventType> {
  poster_url?: string;
  team_size?: number;
  registration_link?: string;
  featured?: boolean;
}

interface EventEditorProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  eventId?: number; 
  onSave: (eventData: EventType) => void;
}

export function EventEditor({ isOpen, onClose, departmentId, eventId, onSave }: EventEditorProps) {
  const { toast } = useToast();
  const [event, setEvent] = useState<ExtendedEventType>({
    sl_no: 0,
    event_name: "",
    event_type: "Technical",
    department: "",
    venue: "",
    date: "",
    description: "",
    registration_fees: 0,
    rules_and_regulations: [""],
    faculty_coordinators: [{ name: "", phone: "" }],
    student_coordinators: [{ name: "", phone: "" }],
    poster_url: "",
    featured: false
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && departmentId) {
      const departmentFullNames: Record<string, string> = {
        'aiml': 'AI & ML',
        'cse': 'Computer Science',
        'ece': 'Electronics & Communication',
        'ise': 'Information Science',
        'civil': 'Civil Engineering',
        'math': 'Mathematics',
        'mba': 'MBA',
        'chem': 'Chemistry',
        'phy': 'Physics',
        'svfc': 'SVFC',
        'ds': 'Data Science'
      };
      
      if (eventId) {
        const fetchEvent = async () => {
          try {
            const data = await getDepartmentData(departmentId);
            if (data) {
              const foundEvent = data.events.find(e => e.sl_no === eventId);
              if (foundEvent) {
                setEvent({ ...foundEvent } as ExtendedEventType);
                
                if ((foundEvent as ExtendedEventType).poster_url) {
                  setOldImageUrl((foundEvent as ExtendedEventType).poster_url || null);
                  const refreshUrl = (foundEvent as ExtendedEventType).poster_url 
                    ? `${(foundEvent as ExtendedEventType).poster_url}?t=${Date.now()}` 
                    : null;
                  setImagePreview(refreshUrl);
                } else {
                  setImagePreview(null);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching event:", error);
            toast({
              title: "Error",
              description: "Could not fetch event details",
              variant: "destructive"
            });
          }
        };
        
        fetchEvent();
      } else {
        setEvent({
          sl_no: Date.now(),
          event_name: "",
          event_type: "Technical",
          department: departmentFullNames[departmentId] || departmentId.toUpperCase(),
          venue: "",
          date: "",
          description: "",
          registration_fees: 0,
          rules_and_regulations: [""],
          faculty_coordinators: [{ name: "", phone: "" }],
          student_coordinators: [{ name: "", phone: "" }],
          poster_url: "",
          featured: false
        });
        setImagePreview(null);
        setImageFile(null);
        setOldImageUrl(null);
      }
    }
  }, [isOpen, departmentId, eventId, toast]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
      
      setImageFile(file);
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setEvent(prev => ({
      ...prev,
      poster_url: ""
    }));
  };

  const addRule = () => {
    setEvent(prev => ({
      ...prev,
      rules_and_regulations: [...(prev.rules_and_regulations || []), ""]
    }));
  };

  const updateRule = (index: number, value: string) => {
    setEvent(prev => {
      const updatedRules = [...(prev.rules_and_regulations || [])];
      updatedRules[index] = value;
      return { ...prev, rules_and_regulations: updatedRules };
    });
  };

  const removeRule = (index: number) => {
    setEvent(prev => {
      const updatedRules = [...(prev.rules_and_regulations || [])];
      updatedRules.splice(index, 1);
      return { ...prev, rules_and_regulations: updatedRules };
    });
  };

  const addFacultyCoordinator = () => {
    setEvent(prev => ({
      ...prev,
      faculty_coordinators: [...(prev.faculty_coordinators || []), { name: "", phone: "" }]
    }));
  };

  const updateFacultyCoordinator = (index: number, field: 'name' | 'phone', value: string) => {
    setEvent(prev => {
      const updatedCoordinators = [...(prev.faculty_coordinators || [])];
      updatedCoordinators[index] = { ...updatedCoordinators[index], [field]: value };
      return { ...prev, faculty_coordinators: updatedCoordinators };
    });
  };

  const removeFacultyCoordinator = (index: number) => {
    setEvent(prev => {
      const updatedCoordinators = [...(prev.faculty_coordinators || [])];
      updatedCoordinators.splice(index, 1);
      return { ...prev, faculty_coordinators: updatedCoordinators };
    });
  };

  const addStudentCoordinator = () => {
    setEvent(prev => ({
      ...prev,
      student_coordinators: [...(prev.student_coordinators || []), { name: "", phone: "" }]
    }));
  };

  const updateStudentCoordinator = (index: number, field: 'name' | 'phone', value: string) => {
    setEvent(prev => {
      const updatedCoordinators = [...(prev.student_coordinators || [])];
      updatedCoordinators[index] = { ...updatedCoordinators[index], [field]: value };
      return { ...prev, student_coordinators: updatedCoordinators };
    });
  };

  const removeStudentCoordinator = (index: number) => {
    setEvent(prev => {
      const updatedCoordinators = [...(prev.student_coordinators || [])];
      updatedCoordinators.splice(index, 1);
      return { ...prev, student_coordinators: updatedCoordinators };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let posterUrl = event.poster_url;
      
      if (imageFile) {
        try {
          if (oldImageUrl && oldImageUrl !== posterUrl) {
            await deleteEventImage(oldImageUrl);
          }
          
          const filename = `${departmentId}/${Date.now()}-${imageFile.name}`;
          const imageUrl = await uploadEventImage(imageFile, filename);
          
          if (imageUrl) {
            posterUrl = imageUrl;
          } else {
            throw new Error("Failed to upload poster image");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Failed to upload poster image");
        }
      }
      
      const finalEventData: EventType = {
        sl_no: event.sl_no || Date.now(),
        event_name: event.event_name || "Untitled Event",
        event_type: event.event_type || "Technical",
        department: event.department || departmentId.toUpperCase(),
        venue: event.venue || "",
        date: event.date || "",
        description: event.description || "",
        registration_fees: event.registration_fees || 0,
        rules_and_regulations: event.rules_and_regulations || [""],
        faculty_coordinators: event.faculty_coordinators || [{ name: "", phone: "" }],
        student_coordinators: event.student_coordinators || [{ name: "", phone: "" }],
        poster_url: posterUrl || "",
        featured: event.featured || false
      };
      
      onSave(finalEventData);
      setLoading(false);
      
      toast({
        title: "Event saved",
        description: `${event.event_name} has been updated successfully`,
      });
      
      onClose();
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error saving event",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-gray-900 border-b border-white/10 px-6 py-4 z-10">
          <DialogTitle>
            {eventId ? `Edit Event: ${event.event_name}` : "Create New Event"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the event details below. Fields marked with * are required.<br/>
            <span className="font-bold text-purple-400">
              Poster: Portrait images (Preferred: 1080 x 1530 px, 4:6 Ratio)
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input 
                id="title" 
                value={event.event_name}
                onChange={(e) => setEvent({ ...event, event_name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department*</Label>
              <Input 
                id="department" 
                value={event.department}
                readOnly
                className="bg-gray-800/50 border-gray-700 text-white/80 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type*</Label>
              <Select 
                value={event.event_type} 
                onValueChange={(value) => setEvent({ ...event, event_type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Non-Technical">Non-Technical</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team_size">Team Size*</Label>
              <Input 
                id="team_size" 
                type="number"
                value={event.team_size || 1}
                onChange={(e) => setEvent({ ...event, team_size: parseInt(e.target.value) || 1 })}
                className="bg-gray-800 border-gray-700 text-white"
                min={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registration_fee">Registration Fee*</Label>
              <Input 
                id="registration_fee" 
                type="number"
                value={event.registration_fees}
                onChange={(e) => setEvent({ ...event, registration_fees: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white"
                min={0}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registration_link">Registration Link</Label>
              <Input 
                id="registration_link" 
                value={event.registration_link || ""}
                onChange={(e) => setEvent({ ...event, registration_link: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Where to register"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venue">Coordination Venue*</Label>
              <Input 
                id="venue" 
                value={event.venue}
                onChange={(e) => setEvent({ ...event, venue: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date*</Label>
              <Input 
                id="date" 
                type="date"
                value={event.date}
                onChange={(e) => setEvent({ ...event, date: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={event.description || ""}
                onChange={(e) => setEvent({ ...event, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                placeholder="Provide a detailed description of the event"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="featured">Featured Event</Label>
              <input
                type="checkbox"
                id="featured"
                checked={event.featured || false}
                onChange={(e) => setEvent({ ...event, featured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div>
            <div className="mb-6">
              <Label className="block mb-2">Event Poster (Portrait image required)</Label>
              <div className="border border-dashed border-white/30 rounded-lg p-4 flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="mx-auto object-contain rounded"
                      style={{
                        width: "260px",
                        height: "390px",
                        aspectRatio: "4/6"
                      }}
                    />
                    <p className="text-xs text-center mt-2 text-gray-400">
                      Upload a <span className="font-bold">portrait</span> poster (4:6 aspect ratio recommended, e.g. 1080×1530px)
                    </p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-gray-800/50"
                        onClick={() => document.getElementById('event-image-upload')?.click()}
                      >
                        <span>Change Image</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleRemoveImage}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-[260px] h-[390px] mx-auto bg-white/5 border border-dashed border-purple-300 flex items-center justify-center rounded mb-2">
                      <span className="text-gray-400">Portrait Image</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Upload a portrait image<br />(4:6 aspect ratio, e.g. 1080×1530px)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800/50"
                      onClick={() => document.getElementById('event-image-upload')?.click()}
                    >
                      Upload Image
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  id="event-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Faculty Coordinators</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 bg-gray-800/50"
                  onClick={addFacultyCoordinator}
                >
                  <Plus className="h-4 w-4" /> Add Faculty Coordinator
                </Button>
              </div>
              
              <div className="space-y-3">
                {event.faculty_coordinators && event.faculty_coordinators.map((coordinator, index) => (
                  <div key={`faculty-${index}`} className="flex gap-2 items-center">
                    <Input
                      value={coordinator.name}
                      onChange={(e) => updateFacultyCoordinator(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Input
                      value={coordinator.phone}
                      onChange={(e) => updateFacultyCoordinator(index, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    {event.faculty_coordinators && event.faculty_coordinators.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => removeFacultyCoordinator(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Student Coordinators</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 bg-gray-800/50"
                  onClick={addStudentCoordinator}
                  type="button"
                >
                  <Plus className="h-4 w-4" /> Add Student Coordinator
                </Button>
              </div>
              
              <div className="space-y-3">
                {event.student_coordinators && event.student_coordinators.map((coordinator, index) => (
                  <div key={`student-${index}`} className="flex gap-2 items-center">
                    <Input
                      value={coordinator.name}
                      onChange={(e) => updateStudentCoordinator(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Input
                      value={coordinator.phone}
                      onChange={(e) => updateStudentCoordinator(index, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    {event.student_coordinators && event.student_coordinators.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => removeStudentCoordinator(index)}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <Label className="block mb-2">Rules & Regulations*</Label>
          <div className="space-y-3">
            {event.rules_and_regulations && event.rules_and_regulations.map((rule, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="py-2 px-2 bg-purple-500/20 text-purple-300 rounded text-sm">
                  {index + 1}
                </div>
                <Textarea
                  value={rule}
                  onChange={(e) => updateRule(index, e.target.value)}
                  placeholder={`Rule ${index + 1}`}
                  className="flex-1 bg-gray-800 border-gray-700 text-white min-h-[60px]"
                />
                {event.rules_and_regulations && event.rules_and_regulations.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => removeRule(index)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800/50"
              onClick={addRule}
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Rule
            </Button>
          </div>
        </div>
        
        <DialogFooter className="sticky bottom-0 bg-gray-900 border-t border-white/10 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 hover:bg-white/5 text-white bg-gray-700 hover:bg-gray-600"
            type="button"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={loading}
            type="button"
          >
            {loading ? 'Saving...' : 'Update Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
