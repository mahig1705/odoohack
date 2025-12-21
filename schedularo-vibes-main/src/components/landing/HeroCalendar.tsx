import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DoodleArrow, FloatingDoodle } from "@/components/doodles";
import { bookingApi } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Booking {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  appointment_type_name: string;
  status: string;
}

interface HeroCalendarProps {
  className?: string;
  isLoggedIn?: boolean;
}

export const HeroCalendar = ({ className = "", isLoggedIn = false }: HeroCalendarProps) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Fetch appointments when logged in
  useEffect(() => {
    if (isLoggedIn) {
      setIsLoading(true);
      bookingApi.getMyBookings()
        .then((data) => {
          setAppointments(data);
        })
        .catch((error) => {
          console.error("Error fetching appointments:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLoggedIn]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    appointments.forEach((apt) => {
      const date = apt.slot_date.split('T')[0]; // Get YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(apt);
    });
    return grouped;
  }, [appointments]);

  // Check if a day has appointments
  const hasAppointments = (day: number): boolean => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return !!appointmentsByDate[dateStr]?.length;
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number): Booking[] => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointmentsByDate[dateStr] || [];
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 md:h-12" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDate === day;
    const isTodayDate = isToday(day);
    const hasApts = isLoggedIn && hasAppointments(day);
    const dayAppointments = hasApts ? getAppointmentsForDay(day) : [];
    
    // Create tooltip content for days with appointments
    const tooltipContent = hasApts ? (
      <div className="text-xs">
        <div className="font-semibold mb-1">Appointments:</div>
        {dayAppointments.map((apt) => (
          <div key={apt.id} className="text-xs">
            {apt.start_time} - {apt.appointment_type_name}
          </div>
        ))}
      </div>
    ) : null;

    const dayButton = (
      <motion.button
        key={day}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedDate(day)}
        className={`
          h-10 md:h-12 rounded-full font-display font-semibold text-sm md:text-base
          transition-all duration-200 relative
          ${isSelected 
            ? "bg-primary text-primary-foreground shadow-glow" 
            : hasApts
              ? "bg-secondary text-secondary-foreground"
              : isTodayDate
                ? "bg-muted text-foreground"
                : "hover:bg-muted text-foreground"
          }
        `}
      >
        {day}
        {hasApts && !isSelected && (
          <motion.div
            layoutId="appointment-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
          />
        )}
        {isTodayDate && !isSelected && !hasApts && (
          <motion.div
            layoutId="today-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
          />
        )}
      </motion.button>
    );

    // Wrap with tooltip if has appointments
    if (hasApts && tooltipContent) {
      days.push(
        <Tooltip key={day}>
          <TooltipTrigger asChild>
            {dayButton}
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      );
    } else {
      days.push(dayButton);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`relative ${className}`}
    >
      {/* Doodle arrow pointing to calendar */}
      <FloatingDoodle
        className="absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-16 hidden lg:block"
        delay={1}
      >
        <DoodleArrow direction="right" className="w-full h-full" />
      </FloatingDoodle>

      <div className="bg-card border-2 border-foreground rounded-2xl shadow-doodle-lg overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="bg-secondary px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="p-2 hover:bg-background/50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <motion.h3
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold text-lg"
          >
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </motion.h3>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="p-2 hover:bg-background/50 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 px-4 py-2 border-b border-border">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <motion.div
          key={`${currentDate.getMonth()}-${currentDate.getFullYear()}-grid`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-7 gap-1 p-4"
        >
          {days}
        </motion.div>

        {/* Selected date info */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-6 py-4 bg-secondary border-t border-border"
          >
            <p className="text-sm text-muted-foreground mb-2">
              {MONTHS[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
            </p>
            {isLoggedIn && getAppointmentsForDay(selectedDate).length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Your appointments:</p>
                {getAppointmentsForDay(selectedDate).map((apt) => (
                  <div key={apt.id} className="text-sm bg-background/50 rounded-lg p-2">
                    <div className="font-semibold">{apt.appointment_type_name}</div>
                    <div className="text-muted-foreground">
                      {apt.start_time} - {apt.end_time}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {apt.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLoggedIn ? "No appointments on this day" : "Select a date to view details"}
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating doodle arrow pointing to selected date */}
      <FloatingDoodle
        className="absolute -right-14 top-1/3 w-12 h-16 hidden lg:block"
        delay={1.5}
        rotate={10}
      >
        <DoodleArrow direction="left" className="w-full h-full" />
      </FloatingDoodle>
    </motion.div>
  );
};
