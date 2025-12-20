import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { appointmentTypeApi, bookingApi, resourceApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoodleCircle, DoodleUnderline, DoodleScribble, FloatingDoodle } from "@/components/doodles";
import { Calendar, Users, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const OrganizerDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ appointments: 0, resources: 0, bookings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appts, resources, bookings] = await Promise.all([
          appointmentTypeApi.listMy(),
          resourceApi.list(),
          bookingApi.getAllBookings(),
        ]);
        setStats({
          appointments: appts.length,
          resources: resources.length,
          bookings: bookings.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Appointment Types", value: stats.appointments, icon: <Calendar className="w-6 h-6" />, href: "/organizer/appointments" },
    { label: "Resources", value: stats.resources, icon: <Users className="w-6 h-6" />, href: "/organizer/resources" },
    { label: "Total Bookings", value: stats.bookings, icon: <TrendingUp className="w-6 h-6" />, href: "/organizer/appointments" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="relative">
          <FloatingDoodle className="absolute -top-4 -left-4 w-12 h-12 opacity-30" delay={0}>
            <DoodleScribble variant="star" className="w-full h-full" />
          </FloatingDoodle>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Welcome, <span className="text-primary">{profile?.full_name?.split(" ")[0]}</span>!
              <DoodleUnderline className="w-32 h-3 mt-1" />
            </h1>
            <p className="text-muted-foreground mt-2">Manage your services and bookings</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Link to={stat.href}>
                <Card className="border-2 border-foreground rounded-2xl hover:shadow-lg transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="font-display text-4xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <Card className="border-2 border-foreground rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link to="/organizer/appointments/new">
              <Button variant="doodle"><Plus className="w-4 h-4 mr-2" />Create Service</Button>
            </Link>
            <Link to="/organizer/resources">
              <Button variant="outline" className="border-2 border-foreground rounded-xl"><Users className="w-4 h-4 mr-2" />Add Resource</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerDashboard;
