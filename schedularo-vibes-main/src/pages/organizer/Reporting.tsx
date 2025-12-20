import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { appointmentTypeApi, bookingApi, resourceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react";

const ReportingPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    avgDuration: 0,
    activeResources: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [appointmentTypes, bookings, resources] = await Promise.all([
        appointmentTypeApi.listMy(),
        bookingApi.getAllBookings(),
        resourceApi.list(),
      ]);

      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;
      const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

      const avgDuration =
        appointmentTypes.reduce((sum, a) => sum + a.duration_minutes, 0) / (appointmentTypes.length || 1) || 0;

      setStats({
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: 0, // Revenue calculation not available in current API
        avgDuration: Math.round(avgDuration),
        activeResources: resources.filter((r) => r.is_active).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Confirmed",
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Cancelled",
      value: stats.cancelledBookings,
      icon: TrendingUp,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Avg Duration",
      value: `${stats.avgDuration} min`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Active Resources",
      value: stats.activeResources,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Reporting</h1>
          <p className="text-muted-foreground mt-1">Overview of your booking analytics</p>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="font-display text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Placeholder for charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="font-display">Booking Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};

export default ReportingPage;
