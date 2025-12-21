import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, Search, Star } from "lucide-react";


type Provider = {   
  id: string;
  name: string;
  email: string;
  status: string;
  bookings: number;
  type: string;
  rating: number | null;
  location: string;
};

const AdminProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      adminApi.getProviders(),
      adminApi.getProviderStats(),
    ]).then(([list, stats]) => {
      setProviders(list);
      setStats(stats);
    });
  }, []);

  const filtered = useMemo(() => {
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [providers, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <p className="text-muted-foreground">
            View and manage all service providers
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Total Providers" value={stats.total} />
            <Stat label="Active" value={stats.active} color="green" />
            <Stat label="Pending Approval" value={stats.pending} color="yellow" />
            <Stat label="Inactive" value={stats.inactive} color="red" />
          </div>
        )}

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3">Provider</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Bookings</th>
                <th>Location</th>
                <th className="text-right px-6">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.email}
                      </div>
                    </div>
                  </td>

                  <td>
                    <Badge className="bg-gray-100 text-gray-700">
                      {p.type}
                    </Badge>
                  </td>

                  <td>
                    <Badge
                      className={
                        p.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>

                  <td>
                    {p.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {p.rating}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        No ratings yet
                      </span>
                    )}
                  </td>

                  <td>{p.bookings}</td>
                  <td>{p.location}</td>

                  <td className="text-right px-6">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProviders;

const Stat = ({ label, value, color }: any) => (
  <div className="border rounded-xl p-4">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div
      className={`text-2xl font-bold ${
        color === "green"
          ? "text-green-600"
          : color === "red"
          ? "text-red-600"
          : color === "yellow"
          ? "text-yellow-600"
          : ""
      }`}
    >
      {value}
    </div>
  </div>
);


