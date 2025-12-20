import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  LayoutDashboard,
  Menu,
  X,
  Users,
  Settings,
  BarChart3,
  UserCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Roles", href: "/admin/roles", icon: <Shield className="w-4 h-4" /> },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="w-4 h-4" /> },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16">
        <div className="h-full mx-4 mt-3">
          <div className="h-full bg-secondary/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm px-4 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-9 h-9 bg-secondary-foreground rounded-xl flex items-center justify-center"
              >
                <Shield className="w-5 h-5 text-secondary" />
              </motion.div>
              <span className="font-display font-bold text-lg hidden sm:block text-secondary-foreground">
                Schedularo <span className="text-primary">Admin</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - User Menu */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto rounded-xl text-secondary-foreground">
                    <div className="w-8 h-8 bg-secondary-foreground/20 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                      {profile?.full_name?.split(" ")[0] || "Admin"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-secondary-foreground/70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-secondary-foreground/10 rounded-lg text-secondary-foreground"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden fixed top-24 left-4 right-4 bg-card border border-border rounded-2xl shadow-lg z-50 p-4"
            >
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};