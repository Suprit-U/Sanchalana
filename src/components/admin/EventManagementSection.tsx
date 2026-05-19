
import { Calendar, Edit, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Event } from "@/utils/departmentDataUtils";

interface EventManagementSectionProps {
  events: Event[];
  selectedEventId: number | null;
  onEventSelect: (eventId: number) => void;
  onEditEvent: () => void;
  onCreateEvent: () => void;
}

export function EventManagementSection({
  events,
  selectedEventId,
  onEventSelect,
  onEditEvent,
  onCreateEvent
}: EventManagementSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-inner shadow-white/10">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Event Management</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <p className="text-gray-300 mb-4">
            Select, edit, or create new events for your department. Make sure to fill in all required details.
          </p>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg shadow-inner mb-4">
            <h3 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Available Events ({events.length})
            </h3>
            
            <Select 
              value={selectedEventId?.toString() || ""} 
              onValueChange={(value) => onEventSelect(parseInt(value))}
            >
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white focus:ring-purple-400">
                <SelectValue placeholder="Select event to edit..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20 text-white">
                {events.map((event) => (
                  <SelectItem key={event.sl_no} value={event.sl_no.toString()} className="focus:bg-purple-500/20 focus:text-white">
                    {event.event_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
            onClick={onEditEvent}
            disabled={!selectedEventId}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Selected Event
          </Button>
          
          <Button 
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
            onClick={onCreateEvent}
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Event
          </Button>
        </div>
        
        {events.length === 0 && (
          <div className="text-center p-6 bg-white/5 border border-dashed border-white/20 rounded-lg">
            <p className="text-gray-400">No events found. Create your first event to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
