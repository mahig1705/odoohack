import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Search } from "lucide-react";

/* ================= TYPES ================= */

type User = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  roles?: string[];
  created_at?: string;
};

/* ================= HELPERS ================= */

const roleLabel = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "ORGANISER":
      return "Organizer";
    default:
      return "User";
  }
};

const formatJoinDate = (dateString?: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/* ================= COMPONENT ================= */

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ===== Header ===== */}
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage all registered users
          </p>
        </div>

        {/* ===== Search ===== */}
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

        {/* ===== Table ===== */}
        <div className="border rounded-xl overflow-hidden bg-background">
          {loading ? (
            <p className="p-6 text-muted-foreground">Loading users…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-3">User</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Appointments</th>
                  <th className="text-right px-6">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-muted/30 transition"
                  >
                    {/* ===== User Column ===== */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ===== Status ===== */}
                    <td>
                      <Badge
                        className={
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* ===== Role ===== */}
                    <td>
                      <Badge className="bg-gray-100 text-gray-700">
                        {roleLabel(user.roles?.[0])}
                      </Badge>
                    </td>

                    {/* ===== Join Date ===== */}
                    <td className="text-muted-foreground">
                      {formatJoinDate(user.created_at)}
                    </td>

                    {/* ===== Appointments (placeholder) ===== */}
                    <td>—</td>

                    {/* ===== Actions ===== */}
                    <td className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              adminApi
                                .updateUserStatus(
                                  user.id,
                                  !user.is_active
                                )
                                .then(fetchUsers)
                            }
                          >
                            {user.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
