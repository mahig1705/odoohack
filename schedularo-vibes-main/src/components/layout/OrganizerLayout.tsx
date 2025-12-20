import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, BarChart3, Settings, LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface OrganizerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Appointments", href: "/organizer/appointments", icon: Calendar },
  { label: "Reporting", href: "/organizer/reporting", icon: BarChart3 },
  { label: "Settings", href: "/organizer/settings", icon: Settings },
];

export const OrganizerLayout = ({ children }: OrganizerLayoutProps) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (href: string) => location.pathname.startsWith(href);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => mobile && setMobileOpen(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-muted"
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Navigation */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/organizer/appointments" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block">
                Schedularo <span className="text-primary">Admin</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="font-medium truncate">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/organizer/settings" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Button (Desktop) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <NavLinks mobile />
                    <div className="border-t border-border pt-4">
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="container mx-auto px-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
