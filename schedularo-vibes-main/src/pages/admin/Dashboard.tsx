import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { appointmentTypeApi, bookingApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Shield, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, organizers: 0, bookings: 0, appointmentTypes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appointmentTypes, bookings] = await Promise.all([
          appointmentTypeApi.list(),
          bookingApi.getAllBookings(),
        ]);
        setStats({
          users: 0, // TODO: Add user count endpoint
          organizers: 0, // TODO: Add organizer count endpoint
          bookings: bookings.length,
          appointmentTypes: appointmentTypes.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.users, icon: <Users className="w-5 h-5" />, href: "/admin/users", color: "bg-blue-500/10 text-blue-600" },
    { label: "Organizers", value: stats.organizers, icon: <Shield className="w-5 h-5" />, href: "/admin/roles", color: "bg-purple-500/10 text-purple-600" },
    { label: "Total Bookings", value: stats.bookings, icon: <TrendingUp className="w-5 h-5" />, href: "/admin/reports", color: "bg-green-500/10 text-green-600" },
    { label: "Services", value: stats.appointmentTypes, icon: <Calendar className="w-5 h-5" />, href: "/admin/reports", color: "bg-primary/10 text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">System overview and management</p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.href}>
                <Card className="border border-border rounded-2xl hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="font-display text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      <span>View details</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-secondary via-secondary/80 to-secondary/50 p-6">
              <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/admin/users" className="block">
                  <div className="p-4 bg-background/80 rounded-xl hover:bg-background transition-colors">
                    <Users className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-semibold">Manage Users</h3>
                    <p className="text-sm text-muted-foreground">View and edit user accounts</p>
                  </div>
                </Link>
                <Link to="/admin/roles" className="block">
                  <div className="p-4 bg-background/80 rounded-xl hover:bg-background transition-colors">
                    <Shield className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-semibold">Assign Roles</h3>
                    <p className="text-sm text-muted-foreground">Manage user permissions</p>
                  </div>
                </Link>
                <Link to="/admin/reports" className="block">
                  <div className="p-4 bg-background/80 rounded-xl hover:bg-background transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-semibold">View Reports</h3>
                    <p className="text-sm text-muted-foreground">Analytics and insights</p>
                  </div>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
