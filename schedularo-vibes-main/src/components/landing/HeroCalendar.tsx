import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DoodleArrow, FloatingDoodle } from "@/components/doodles";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface HeroCalendarProps {
  className?: string;
}

export const HeroCalendar = ({ className = "" }: HeroCalendarProps) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
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

    days.push(
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
            : isTodayDate
              ? "bg-accent text-accent-foreground"
              : "hover:bg-muted text-foreground"
          }
        `}
      >
        {day}
        {isTodayDate && !isSelected && (
          <motion.div
            layoutId="today-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
          />
        )}
      </motion.button>
    );
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
            className="px-6 py-4 bg-primary/10 border-t border-border"
          >
            <p className="text-sm text-muted-foreground">Selected date:</p>
            <p className="font-display font-bold text-lg">
              {MONTHS[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
            </p>
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
