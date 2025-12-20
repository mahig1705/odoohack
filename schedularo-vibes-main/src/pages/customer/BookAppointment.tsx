import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { slotApi, bookingApi, formatDateLocal } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_capacity: number;
  status?: string;
  is_available?: boolean;
}

export default function BookAppointment() {
  const { appointmentTypeId } = useParams<{ appointmentTypeId: string }>();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // 🔥 HARD DEBUG — REMOVE LATER
  useEffect(() => {
    console.log("BookAppointment mounted");
    console.log("appointmentTypeId from URL =", appointmentTypeId);
  }, [appointmentTypeId]);

  // Fetch slots (READ ONLY)
  const fetchSlotsForDate = async (slotDate: string) => {
    if (!appointmentTypeId) {
      console.error("❌ appointmentTypeId missing — cannot fetch slots");
      toast({
        title: "Configuration error",
        description: "Appointment type ID missing in URL",
        variant: "destructive",
      });
      return;
    }

    setLoadingSlots(true);
    setSelectedSlotId(null);

    try {
      console.log(
        "➡️ Calling GET /slots with:",
        appointmentTypeId,
        slotDate
      );

      const data = await slotApi.getSlots(appointmentTypeId, slotDate);

      console.log("✅ Slots received:", data);
      setSlots(data);
    } catch (err: any) {
      console.error("❌ Failed to fetch slots:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load slots",
        variant: "destructive",
      });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Calendar selection
  const handleDateSelect = (date?: Date) => {
    console.log("📅 Calendar clicked:", date);
    if (!date) return;

    const slotDate = formatDateLocal(date);
    console.log("📆 Formatted slotDate =", slotDate);

    setSelectedDate(slotDate);
    fetchSlotsForDate(slotDate);
  };

  // Book slot
  const handleBook = async () => {
    if (!selectedSlotId) return;

    try {
      await bookingApi.create({ slot_id: selectedSlotId });
      toast({
        title: "Appointment booked",
        description: "Your appointment has been booked successfully",
      });
    } catch (err: any) {
      toast({
        title: "Booking failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const availableSlots = slots.filter((s) => {
    if (s.is_available !== undefined) return s.is_available;
    const open = !s.status || s.status === "OPEN" || s.status === "AVAILABLE";
    return open && s.booked_capacity < s.max_capacity;
  });

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Book Appointment</h1>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <Calendar mode="single" onSelect={handleDateSelect} />
          </CardContent>
        </Card>

        {loadingSlots && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Loading slots…
            </CardContent>
          </Card>
        )}

        {!loadingSlots && selectedDate && slots.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No slots found for {selectedDate}.
            </CardContent>
          </Card>
        )}

        {!loadingSlots && availableSlots.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {availableSlots.map((slot) => {
              const start = slot.start_time.substring(0, 5);
              const end = slot.end_time.substring(0, 5);

              const [sh, sm] = start.split(":").map(Number);
              const [eh, em] = end.split(":").map(Number);

              const sd = new Date();
              sd.setHours(sh, sm, 0, 0);
              const ed = new Date();
              ed.setHours(eh, em, 0, 0);

              return (
                <Button
                  key={slot.id}
                  variant={selectedSlotId === slot.id ? "default" : "outline"}
                  onClick={() => setSelectedSlotId(slot.id)}
                >
                  {format(sd, "h:mm a")} – {format(ed, "h:mm a")}
                </Button>
              );
            })}
          </div>
        )}

        {selectedSlotId && (
          <Button className="w-full mt-4" onClick={handleBook}>
            Confirm Booking
          </Button>
        )}
      </div>
    </CustomerLayout>
  );
}
