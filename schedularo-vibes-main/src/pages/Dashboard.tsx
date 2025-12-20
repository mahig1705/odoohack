import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Calendar, CalendarCheck, Users, TrendingUp, Clock, 
  Plus, Bell, Settings, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingDoodle, DoodleScribble } from "@/components/doodles";

const stats = [
  { label: "Today's Appointments", value: "12", icon: CalendarCheck, color: "bg-primary/10 text-primary" },
  { label: "Total Clients", value: "284", icon: Users, color: "bg-accent/10 text-accent" },
  { label: "This Week", value: "47", icon: Calendar, color: "bg-orange-100 text-orange-600" },
  { label: "Growth", value: "+23%", icon: TrendingUp, color: "bg-green-100 text-green-600" },
];

const upcomingAppointments = [
  { time: "9:00 AM", client: "Sarah Johnson", service: "Yoga Class", duration: "60 min" },
  { time: "10:30 AM", client: "Mike Chen", service: "Personal Training", duration: "45 min" },
  { time: "12:00 PM", client: "Emma Williams", service: "Consultation", duration: "30 min" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">
              Schedul<span className="text-primary">aro</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
            <Link to="/"><Button variant="ghost" size="icon"><LogOut className="w-5 h-5" /></Button></Link>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 relative">
        <FloatingDoodle className="absolute top-4 right-4 w-12 h-12 opacity-20" delay={0}>
          <DoodleScribble variant="star" className="w-full h-full" />
        </FloatingDoodle>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Good morning, John! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your appointments today.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border-2 border-foreground rounded-xl p-5 shadow-doodle hover:shadow-doodle-lg transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card border-2 border-foreground rounded-xl p-6 shadow-doodle"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">Today's Appointments</h2>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> New</Button>
            </div>
            
            <div className="space-y-4">
              {upcomingAppointments.map((apt, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold">{apt.client}</p>
                    <p className="text-sm text-muted-foreground">{apt.service} · {apt.duration}</p>
                  </div>
                  <span className="font-medium text-primary">{apt.time}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border-2 border-foreground rounded-xl p-6 shadow-doodle"
          >
            <h2 className="font-display text-xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="doodle" className="w-full justify-start"><Plus className="w-4 h-4 mr-2" /> New Appointment</Button>
              <Button variant="outline" className="w-full justify-start border-2 border-foreground"><Users className="w-4 h-4 mr-2" /> Add Client</Button>
              <Button variant="outline" className="w-full justify-start border-2 border-foreground"><Calendar className="w-4 h-4 mr-2" /> View Calendar</Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
