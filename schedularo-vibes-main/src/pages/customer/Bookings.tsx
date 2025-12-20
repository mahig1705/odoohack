import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { bookingApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  appointment_type_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

const CustomerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await bookingApi.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (bookingId: string) => {
    try {
      await bookingApi.cancel(bookingId);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully",
      });
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const upcomingBookings = bookings.filter(b => 
    (b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "BOOKED") && 
    new Date(b.slot_date) >= new Date()
  );
  
  const pastBookings = bookings.filter(b => 
    (b.status === "COMPLETED" || (new Date(b.slot_date) < new Date() && b.status !== "CANCELLED"))
  );
  
  const cancelledBookings = bookings.filter(b => b.status === "CANCELLED");

  const BookingCard = ({ booking, showCancel = false }: { booking: Booking; showCancel?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold truncate">{booking.appointment_type_name || "Appointment"}</h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
              <span>{format(new Date(booking.slot_date), "EEEE, MMMM d, yyyy")}</span>
              <span>•</span>
              <span>{booking.start_time} - {booking.end_time}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{booking.start_time} - {booking.end_time}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
            booking.status === "CONFIRMED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
            booking.status === "BOOKED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            booking.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            booking.status === "COMPLETED" ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" :
            "bg-secondary text-secondary-foreground"
          }`}>
            {booking.status.toLowerCase()}
          </span>
          {showCancel && (booking.status === "CONFIRMED" || booking.status === "PENDING" || booking.status === "BOOKED") && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
              onClick={() => cancelBooking(booking.id)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
        <CalendarDays className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              My Bookings
            </h1>
            <p className="text-muted-foreground mt-2">View and manage all your appointments</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6 bg-secondary p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-background px-4 py-2">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-background px-4 py-2">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-background px-4 py-2">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card className="border border-border rounded-2xl">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <EmptyState message="No upcoming appointments" />
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} showCancel />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="border border-border rounded-2xl">
              <CardContent className="p-4">
                {pastBookings.length === 0 ? (
                  <EmptyState message="No past appointments" />
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card className="border border-border rounded-2xl">
              <CardContent className="p-4">
                {cancelledBookings.length === 0 ? (
                  <EmptyState message="No cancelled appointments" />
                ) : (
                  <div className="space-y-3">
                    {cancelledBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default CustomerBookings;
