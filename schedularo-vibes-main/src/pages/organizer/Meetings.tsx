import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { appointmentTypeApi, bookingApi, slotApi, workingHoursApi, formatDateLocal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, Clock, Box, Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Booking {
  id: string;
  appointment_type_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  booked_by: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-500" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-green-500" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-500" },
];

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  max_capacity: number;
  booked_capacity: number;
}

const MeetingsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Slot generation state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState<Slot[]>([]);
  const [viewDate, setViewDate] = useState<Date | undefined>(undefined);
  const [workingHours, setWorkingHours] = useState<Array<{ weekday: number; start_time: string; end_time: string }>>([]);

  useEffect(() => {
    if (user && id) {
      fetchBookings();
      fetchWorkingHours();
    }
  }, [user, id]);

  const fetchWorkingHours = async () => {
    if (!id) return;
    try {
      const whs = await workingHoursApi.list(id);
      setWorkingHours(whs);
    } catch (error) {
      console.error("Error fetching working hours:", error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch appointment type info
      const appts = await appointmentTypeApi.listMy();
      const appt = appts.find(a => a.id === id);
      if (appt) {
        setAppointmentTitle(appt.name);
      }

      // Fetch all bookings and filter by appointment type
      const allBookings = await bookingApi.getAllBookings();
      const filteredBookings = allBookings.filter(b => b.appointment_type_id === id);
      setBookings(filteredBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({ title: "Error", description: "Failed to load meetings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.booked_by?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge variant="outline" className="gap-1.5">
        <span className={`w-2 h-2 rounded-full ${option?.color || "bg-gray-500"}`} />
        {option?.label || status}
      </Badge>
    );
  };

  // Generate slots for selected date
  const handleGenerateSlots = async () => {
    if (!id || !selectedDate) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      // Convert Date to YYYY-MM-DD string using local timezone (prevents timezone shifts)
      const dateStr = formatDateLocal(selectedDate);

      // Generate slots
      await slotApi.generateSlots({
        appointment_type_id: id,
        slot_date: dateStr,
      });

      // Fetch generated slots
      const slots = await slotApi.getSlots(id, dateStr);
      setGeneratedSlots(slots);
      setViewDate(selectedDate);

      toast({ 
        title: "Success!", 
        description: `Generated ${slots.length} slots for ${format(selectedDate, "MMM d, yyyy")}` 
      });
    } catch (error: any) {
      console.error("Error generating slots:", error);
      const errorMessage = error?.message || "Failed to generate slots";
      
      // Extract helpful error message
      let userMessage = errorMessage;
      if (errorMessage.includes("No working hours defined")) {
        userMessage = errorMessage;
      } else if (errorMessage.includes("working hours")) {
        userMessage = errorMessage;
      }
      
      toast({ 
        title: "Cannot Generate Slots", 
        description: userMessage,
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  // View slots for a date
  const handleViewSlots = async (date: Date) => {
    if (!id) return;
    
    try {
      // Convert Date to YYYY-MM-DD string using local timezone (prevents timezone shifts)
      const dateStr = formatDateLocal(date);

      const slots = await slotApi.getSlots(id, dateStr);
      setGeneratedSlots(slots);
      setViewDate(date);
      setGenerateDialogOpen(true);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast({ title: "Error", description: "Failed to load slots", variant: "destructive" });
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organizer/appointments")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold">Meetings</h1>
              <p className="text-muted-foreground">{appointmentTitle}</p>
              {workingHours.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Working hours configured for {workingHours.length} day{workingHours.length !== 1 ? 's' : ''}
                </p>
              )}
              {workingHours.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ No working hours configured.{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-amber-600 dark:text-amber-400 underline ml-1"
                    onClick={() => navigate(`/organizer/appointments/${id}`)}
                  >
                    Set up working hours
                  </Button>
                </p>
              )}
            </div>
          </div>
          
          {/* Generate Slots Button */}
          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Generate Slots
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Time Slots</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">Select Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateSlots} 
                  disabled={!selectedDate || generating}
                  className="w-full gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate Slots
                    </>
                  )}
                </Button>

                {/* Generated Slots Display */}
                {generatedSlots.length > 0 && viewDate && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">
                      Generated Slots for {format(viewDate, "MMM d, yyyy")}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {generatedSlots.map((slot) => (
                        <Badge 
                          key={slot.id} 
                          variant={slot.status === "OPEN" ? "default" : "secondary"}
                          className="justify-center py-2"
                        >
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {generatedSlots.length} slots generated
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Meetings Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">No meetings yet</h3>
            <p className="text-muted-foreground">
              Bookings for this appointment type will appear here
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">#</th>
                      <th className="text-left p-4 font-medium">Appointment</th>
                      <th className="text-left p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Booked By
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Date & Time
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => {
                      const startDate = new Date(`${booking.slot_date}T${booking.start_time}`);

                      return (
                        <motion.tr
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-t hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 text-muted-foreground">{index + 1}</td>
                          <td className="p-4 font-medium">
                            {booking.appointment_type_name}
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{booking.booked_by || "Unknown"}</p>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{format(startDate, "MMM d, yyyy")}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.start_time} - {booking.end_time}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(booking.status)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default MeetingsPage;

