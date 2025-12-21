import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, Search } from "lucide-react";

type Resource = {
    id: string;
    name: string;
    capacity: number;
    is_active: boolean;
  
    created_by_id: string | null;
    created_by_name: string;
    created_by_email: string;
  };
  

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const AdminResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      const data = await adminApi.getResources();
      setResources(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filtered = useMemo(() => {
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.created_by_name.toLowerCase().includes(search.toLowerCase())

    );
  }, [resources, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground">
            Monitor and control all system resources
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by resource or owner..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-xl overflow-hidden bg-background">
          {loading ? (
            <p className="p-6 text-muted-foreground">Loading resources…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-3">Resource</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th className="text-right px-6">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t hover:bg-muted/30 transition"
                  >
                    <td className="px-6 py-4 font-medium">{r.name}</td>

                    <td>{r.capacity ?? "—"}</td>

                    <td>
                      <Badge
                        className={
                          r.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td>
                      <div className="text-sm">{r.created_by_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.created_by_email}
                      </div>
                    </td>

                    

                    <td className="text-right px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          adminApi
                            .updateResourceStatus(r.id, !r.is_active)
                            .then(fetchResources)
                        }
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
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

export default AdminResources;
