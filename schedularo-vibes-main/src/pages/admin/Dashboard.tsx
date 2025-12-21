import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Shield,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
type RecentUser = {
  id: string;
  full_name: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  created_at: string;
};

type RecentProvider = {
  id: string;
  name: string;
  category: string;
  status: "ACTIVE" | "PENDING";
  created_at: string;
};


// Types must match backend response
type AdminStats = {
  total_users: number;
  total_organizers: number;
  total_bookings: number;
  total_appointment_types: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentProviders, setRecentProviders] = useState<RecentProvider[]>([]);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          statsRes,
          recentUsersRes,
          recentProvidersRes,
        ] = await Promise.all([
          adminApi.getStats(),
          adminApi.getRecentUsers(),       // ✅ ADD
          adminApi.getRecentProviders(),   // ✅ ADD
        ]);
  
        setStats(statsRes);
        setRecentUsers(
          recentUsersRes.map((u: any) => ({
            ...u,
            status: u.status.toUpperCase() as "ACTIVE" | "PENDING" | "INACTIVE",
          }))
        );         // ✅ ADD
        setRecentProviders(
          recentProvidersRes.map((p: any) => ({
            ...p,
            status: p.status.toUpperCase() as "ACTIVE" | "PENDING",
          }))
        );
        
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
        setError("Unable to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
 

  
  const statCards = [
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      icon: <Users className="w-5 h-5" />,
      href: "/admin/users",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Organizers",
      value: stats?.total_organizers ?? 0,
      icon: <Shield className="w-5 h-5" />,
      href: "/admin/roles",
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Total Bookings",
      value: stats?.total_bookings ?? 0,
      icon: <TrendingUp className="w-5 h-5" />,
      href: "/admin/bookings",
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Services",
      value: stats?.total_appointment_types ?? 0,
      icon: <Calendar className="w-5 h-5" />,
      href: "/admin/appointments",
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            System overview and management
          </p>
        </motion.div>

        {/* Loading & Error */}
        {loading && (
          <p className="text-muted-foreground">Loading dashboard statistics…</p>
        )}
        {error && <p className="text-destructive">{error}</p>}

        {/* Stats Grid */}
        {!loading && !error && (
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
                          <p className="text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="font-display text-3xl font-bold mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
                        >
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
        )}
        {/* ================= RECENT USERS & PROVIDERS ================= */}
{!loading && !error && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* -------- Recent Users -------- */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-lg">Recent Users</h2>
              <p className="text-sm text-muted-foreground">
                Latest registered users
              </p>
            </div>
            <Link
              to="/admin/users"
              className="text-sm text-orange-600 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      u.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : u.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {u.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>

      {/* -------- Recent Providers -------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-lg">Recent Providers</h2>
                <p className="text-sm text-muted-foreground">
                  Latest service providers
                </p>
              </div>
              <Link
                to="/admin/providers"
                className="text-sm text-orange-600 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentProviders.map((p) => (
                <div key={p.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        p.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {p.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )}

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
