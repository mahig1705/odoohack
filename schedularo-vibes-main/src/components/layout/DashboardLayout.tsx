import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DoodleScribble, FloatingDoodle } from "@/components/doodles";
import {
  Calendar,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  CalendarDays,
  Briefcase,
  UserCircle,
  BarChart3,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const customerNav: NavItem[] = [
    { label: "Dashboard", href: "/customer/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Discover", href: "/customer/discover", icon: <Briefcase className="w-5 h-5" /> },
    { label: "My Bookings", href: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { label: "Profile", href: "/customer/profile", icon: <UserCircle className="w-5 h-5" /> },
  ];

  const organizerNav: NavItem[] = [
    { label: "Dashboard", href: "/organizer/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Appointments", href: "/organizer/appointment-types", icon: <Calendar className="w-5 h-5" /> },
    { label: "Resources", href: "/organizer/resources", icon: <Users className="w-5 h-5" /> },
    { label: "Working Hours", href: "/organizer/working-hours", icon: <Clock className="w-5 h-5" /> },
    { label: "Slots", href: "/organizer/slots", icon: <CalendarDays className="w-5 h-5" /> },
    { label: "Bookings", href: "/organizer/bookings", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Settings", href: "/organizer/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
    { label: "Roles", href: "/admin/roles", icon: <Shield className="w-5 h-5" /> },
    { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const navItems = role === "admin" ? adminNav : role === "organizer" ? organizerNav : customerNav;

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-secondary text-foreground"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        {item.icon}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && sidebarOpen && (
          <ChevronRight className="w-4 h-4 ml-auto" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col border-r border-border bg-card relative"
      >
        {/* Decorative doodles */}
        <FloatingDoodle className="absolute top-4 right-4 w-8 h-8 opacity-20" delay={0}>
          <DoodleScribble variant="star" className="w-full h-full" />
        </FloatingDoodle>

        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-display font-bold text-xl"
                >
                  Schedul<span className="text-primary">aro</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-md hover:scale-110 transition-transform"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3 mb-4", !sidebarOpen && "justify-center")}>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-6 h-6 text-secondary-foreground" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium truncate">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="outline"
            className={cn("w-full border-2 border-foreground rounded-xl", !sidebarOpen && "px-2")}
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-2"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">Schedularo</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-secondary rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col"
          >
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-2 border-foreground rounded-xl"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
