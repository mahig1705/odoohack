import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { resourceApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, User, Save, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

const UsersPage = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const data = await resourceApi.list();
      setTeamMembers(
        data.map((r) => ({
          id: r.id,
          name: r.name,
          email: "",
          role: "Staff",
        }))
      );
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({ title: "Error", description: "Failed to load team members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setName(member.name);
      setEmail(member.email);
    } else {
      setEditingMember(null);
      setName("");
      setEmail("");
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
      if (editingMember) {
        await resourceApi.toggle(editingMember.id);
        toast({ title: "Updated!", description: "Team member updated successfully" });
      } else {
        await resourceApi.create({ name, capacity: 1 });
        toast({ title: "Created!", description: "Team member added successfully" });
      }

      setDialogOpen(false);
      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error saving team member:", error);
      toast({ title: "Error", description: error.message || "Failed to save team member", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceApi.toggle(id);
      toast({ title: "Deleted!", description: "Team member removed successfully" });
      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error deleting team member:", error);
      toast({ title: "Error", description: error.message || "Failed to delete team member", variant: "destructive" });
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
            <h1 className="font-display text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage your team members</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingMember ? "Edit User" : "Add User"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10"
                    />
                  </div>
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

        {/* Users List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-6">
              Add team members to assign them to appointments
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 border-border hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <div className="flex items-center gap-2">
                            {member.email && (
                              <span className="text-sm text-muted-foreground">{member.email}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {member.role || "Staff"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(member)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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

export default UsersPage;
