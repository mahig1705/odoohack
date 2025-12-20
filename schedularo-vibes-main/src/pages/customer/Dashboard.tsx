import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useAuth } from "@/hooks/useAuth";
import { bookingApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle, XCircle, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Booking {
  id: string;
  appointment_type_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

const CustomerDashboard = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getMyBookings();
      
      // Filter upcoming bookings (not completed/cancelled)
      const upcomingBookings = data.filter(
        (b) => b.status !== "COMPLETED" && b.status !== "CANCELLED"
      );
      
      // Get next 5 upcoming bookings
      const sortedBookings = upcomingBookings
        .sort((a, b) => new Date(a.slot_date).getTime() - new Date(b.slot_date).getTime())
        .slice(0, 5);
      
      setBookings(sortedBookings);
      
      const upcoming = upcomingBookings.length;
      const completed = data.filter((b) => b.status === "COMPLETED").length;
      const cancelled = data.filter((b) => b.status === "CANCELLED").length;
      
      setStats({ upcoming, completed, cancelled });
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Upcoming", value: stats.upcoming, icon: <CalendarDays className="w-5 h-5" />, color: "bg-primary/10 text-primary" },
    { label: "Completed", value: stats.completed, icon: <CheckCircle className="w-5 h-5" />, color: "bg-green-500/10 text-green-600" },
    { label: "Cancelled", value: stats.cancelled, icon: <XCircle className="w-5 h-5" />, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Welcome back</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Hello, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "there"}</span>!
            </h1>
            <p className="text-muted-foreground mt-2">Here's what's happening with your appointments</p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-border rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="font-display text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Quick Actions
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Get started with your next appointment</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/customer/discover">
                    <Button className="rounded-xl group">
                      Book Appointment
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/customer/bookings">
                    <Button variant="outline" className="rounded-xl border-border">
                      View All Bookings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Upcoming Appointments</h2>
            <Link to="/customer/bookings">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
                  </div>
                  <p className="text-muted-foreground">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  <Link to="/customer/discover">
                    <Button className="rounded-xl">
                      Book your first appointment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                          <CalendarDays className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{booking.appointment_type_name || "Appointment"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(booking.slot_date), "MMM d, yyyy")}</span>
                            <span>•</span>
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        booking.status === "CONFIRMED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        booking.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-secondary text-secondary-foreground"
                      }`}>
                        {booking.status.toLowerCase()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
