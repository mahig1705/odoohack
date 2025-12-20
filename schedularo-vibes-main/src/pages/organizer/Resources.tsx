import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { resourceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Box, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Resource {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [user]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourceApi.list();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast({ title: "Error", description: "Failed to load resources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setName(resource.name);
      setCapacity(resource.capacity);
    } else {
      setEditingResource(null);
      setName("");
      setCapacity(1);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingResource) {
        // Update not available in backend, use toggle to deactivate/reactivate
        await resourceApi.toggle(editingResource.id);
        toast({ title: "Updated!", description: "Resource status updated" });
      } else {
        await resourceApi.create({ name, capacity });
        toast({ title: "Created!", description: "Resource created successfully" });
      }

      setDialogOpen(false);
      fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast({ title: "Error", description: "Failed to save resource", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await resourceApi.toggle(id);
      toast({ title: "Updated!", description: "Resource status updated" });
      fetchResources();
    } catch (error) {
      console.error("Error toggling resource:", error);
      toast({ title: "Error", description: "Failed to update resource", variant: "destructive" });
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Resource Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff, rooms, and equipment</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                New Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingResource ? "Edit Resource" : "New Resource"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Room A, Dr. Smith"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Resources List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Box className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">No resources yet</h3>
            <p className="text-muted-foreground mb-6">
              Add staff, rooms, or equipment to assign to appointments
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Resource
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-border hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Box className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{resource.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={resource.is_active ? "default" : "secondary"} className="text-xs">
                              {resource.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Capacity: {resource.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(resource.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default ResourcesPage;
