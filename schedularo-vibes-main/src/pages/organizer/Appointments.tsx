import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { appointmentTypeApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Clock,
  Calendar,
  Share2,
  Edit,
  Eye,
  EyeOff,
  MoreVertical,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  appointment_mode: string;
  is_published: boolean;
}

const AppointmentCard = ({
  appointment,
  onShare,
  onTogglePublish,
  index,
}: {
  appointment: AppointmentType;
  onShare: () => void;
  onTogglePublish: () => void;
  index: number;
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0 bg-primary" />
                <h3 className="font-display font-bold text-lg truncate">
                  {appointment.name}
                </h3>
                <Badge
                  variant={appointment.is_published ? "default" : "secondary"}
                  className="flex-shrink-0"
                >
                  {appointment.is_published ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Unpublished
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{appointment.duration_minutes} min</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{appointment.appointment_mode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/organizer/appointments/${appointment.id}/meetings`)}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Meetings</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onShare}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/organizer/appointments/${appointment.id}`)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/organizer/appointments/${appointment.id}/meetings`)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Meetings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/organizer/appointments/${appointment.id}`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onTogglePublish}>
                    {appointment.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await appointmentTypeApi.listMy();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load appointments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (appointmentId: string) => {
    const shareUrl = `${window.location.origin}/customer/book/${appointmentId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Booking link copied to clipboard" });
  };

  const handleTogglePublish = async (appointment: AppointmentType) => {
    try {
      const updated = await appointmentTypeApi.publish(appointment.id);
      // Update the appointment in the list with the new publish status
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, is_published: updated.is_published } : a
        )
      );

      toast({
        title: updated.is_published ? "Published" : "Unpublished",
        description: `${appointment.name} is now ${updated.is_published ? "visible" : "hidden"} to customers`,
      });
    } catch (error) {
      console.error("Error updating publish status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredAppointments = appointments.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Appointment Types</h1>
            <p className="text-muted-foreground mt-1">Manage your services and bookings</p>
          </div>
          <Button onClick={() => navigate("/organizer/appointments/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            New Appointment
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md mx-auto sm:mx-0"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">No appointments yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first appointment type to start accepting bookings
            </p>
            <Button onClick={() => navigate("/organizer/appointments/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Appointment
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onShare={() => handleShare(appointment.id)}
                onTogglePublish={() => handleTogglePublish(appointment)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default AppointmentsPage;
