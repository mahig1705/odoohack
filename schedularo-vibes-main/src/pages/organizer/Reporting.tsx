import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { appointmentTypeApi, bookingApi, resourceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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
  const [bookingsTrend, setBookingsTrend] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [topTypes, setTopTypes] = useState<any[]>([]);
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

      // Build bookings trend (last 14 days)
      const days = 14;
      const today = new Date();
      const dateMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dateMap[key] = 0;
      }

      bookings.forEach((b: any) => {
        const key = b.slot_date;
        if (key in dateMap) dateMap[key] += 1;
      });

      const trend = Object.entries(dateMap).map(([date, count]) => ({ date, count }));
      setBookingsTrend(trend);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      bookings.forEach((b: any) => {
        const s = b.status || "OPEN";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const breakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      setStatusBreakdown(breakdown);

      // Top appointment types by bookings
      const typeCounts: Record<string, number> = {};
      bookings.forEach((b: any) => {
        const t = b.appointment_type_name || "Unknown";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      const typesArr = Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setTopTypes(typesArr);
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

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="font-display">Bookings (last 14 days)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ff6b3d" strokeWidth={3} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="font-display">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                      {(statusBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#4ade80", "#f87171", "#60a5fa", "#fbbf24"][index % 4]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="font-display">Top Appointment Types</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTypes} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ff6b3d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};

export default ReportingPage;
