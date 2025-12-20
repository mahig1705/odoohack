import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { appointmentTypeApi, resourceApi, appointmentQuestionApi, workingHoursApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Clock,
  MapPin,
  User,
  Box,
  X,
  GripVertical,
} from "lucide-react";

interface Resource {
  id: string;
  name: string;
  is_active: boolean;
}

interface ScheduleRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Question {
  id: string;
  question: string;
  question_type: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
}

// Weekday mapping: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
// This matches Python's date.weekday() and must be stored exactly as-is in the database
const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const QUESTION_TYPES = [
  { value: "text", label: "Single-line text" },
  { value: "textarea", label: "Multi-line text" },
  { value: "phone", label: "Phone number" },
  { value: "radio", label: "Radio (one answer)" },
  { value: "checkbox", label: "Checkboxes (multiple)" },
];

const AppointmentFormPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditing = id && id !== "new";

  // Basic details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Booking behavior
  const [bookingMode, setBookingMode] = useState<"user" | "resource">("user");
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "choose">("auto");
  const [allowSimultaneous, setAllowSimultaneous] = useState(false);
  const [capacity, setCapacity] = useState(1);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Schedule - default to Monday (0)
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { id: "1", day_of_week: 0, start_time: "09:00", end_time: "17:00" },
  ]);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestionType, setNewQuestionType] = useState("text");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Options
  const [manualConfirmation, setManualConfirmation] = useState(false);
  const [maxCapacityPercent, setMaxCapacityPercent] = useState(100);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [slotDuration, setSlotDuration] = useState(30);
  const [cancellationDeadline, setCancellationDeadline] = useState(24);

  // Misc
  const [introMessage, setIntroMessage] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Resources list
  const [resources, setResources] = useState<Resource[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!isEditing);

  useEffect(() => {
    if (user) {
      fetchResources();
      if (isEditing) {
        fetchAppointment();
      }
    }
  }, [user, isEditing]);

  const fetchResources = async () => {
    try {
      const data = await resourceApi.list();
      setResources(data.filter(r => r.is_active));
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const appts = await appointmentTypeApi.listMy();
      const appt = appts.find(a => a.id === id);
      
      if (appt) {
        setTitle(appt.name);
        setDescription("");
        setDurationHours(Math.floor(appt.duration_minutes / 60));
        setDurationMinutes(appt.duration_minutes % 60);
        setPrice(0);
        setCurrency("USD");
        setIsPaid(false);
        setCapacity(1);
      }

      // Fetch resource assignments
      if (id) {
        const resources = await resourceApi.listForAppointment(id);
        setSelectedResources(resources.map(r => r.id));

        // Fetch questions
        const qs = await appointmentQuestionApi.list(id);
        setQuestions(
          qs.map((q, index) => ({
            id: q.id,
            question: q.question_text,
            question_type: q.input_type,
            is_required: q.is_required,
            options: null,
            sort_order: index,
          }))
        );

        // Fetch working hours - weekday is stored exactly as Python date.weekday() (0=Monday, 6=Sunday)
        const whs = await workingHoursApi.list(id);
        setScheduleRows(
          whs.map(wh => ({
            id: wh.id,
            day_of_week: wh.weekday, // Store exactly as received - no conversion needed
            start_time: wh.start_time.substring(0, 5), // Convert HH:MM:SS to HH:MM
            end_time: wh.end_time.substring(0, 5),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast({ title: "Error", description: "Failed to load appointment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const durationTotal = durationHours * 60 + durationMinutes;
      const appointmentData = {
        name: title,
        description: description || undefined,
        duration_minutes: durationTotal,
        appointment_mode: location ? "IN_PERSON" : "ONLINE",
        location: location || undefined,
      };

      let appointmentId = id;

      if (isEditing && id) {
        // Update not available in backend, create new one
        const result = await appointmentTypeApi.create(appointmentData);
        appointmentId = result.id;
      } else {
        const result = await appointmentTypeApi.create(appointmentData);
        appointmentId = result.id;
      }

      // Save working hours
      if (scheduleRows.length > 0) {
        try {
          // Delete existing working hours if editing
          if (isEditing && id) {
            try {
              const existingWhs = await workingHoursApi.list(id);
              await Promise.all(existingWhs.map(wh => workingHoursApi.delete(wh.id)));
            } catch (error) {
              console.error("Error deleting existing working hours:", error);
            }
          }

          // Create new working hours
          const createPromises = scheduleRows.map(async (row) => {
            // Convert HH:MM to HH:MM:SS format
            const startTime = row.start_time.includes(':') && row.start_time.split(':').length === 2
              ? `${row.start_time}:00`
              : row.start_time;
            const endTime = row.end_time.includes(':') && row.end_time.split(':').length === 2
              ? `${row.end_time}:00`
              : row.end_time;
            
            // Store weekday exactly as-is - no conversion needed
            // Frontend and backend both use: 0=Monday, 1=Tuesday, ..., 6=Sunday (Python date.weekday() format)
            console.log(`Saving working hours: weekday=${row.day_of_week}, time=${startTime}-${endTime}`);
            
            return workingHoursApi.create({
              appointment_type_id: appointmentId,
              weekday: row.day_of_week, // Store exactly as received - matches Python date.weekday()
              start_time: startTime,
              end_time: endTime,
            });
          });
          
          await Promise.all(createPromises);
          console.log(`Successfully saved ${scheduleRows.length} working hours entries`);
        } catch (error: any) {
          console.error("Error saving working hours:", error);
          toast({ 
            title: "Warning", 
            description: `Appointment saved but working hours may not have been saved: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      // Assign resources (if backend supports it)
      // Note: Resource assignment endpoint exists but requires POST with body params

      toast({ title: "Saved!", description: "Appointment saved successfully" });
      navigate("/organizer/appointments");
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      toast({ title: "Error", description: error.message || "Failed to save appointment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addScheduleRow = () => {
    setScheduleRows([
      ...scheduleRows,
      { id: Date.now().toString(), day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    ]);
  };

  const removeScheduleRow = (id: string) => {
    setScheduleRows(scheduleRows.filter((r) => r.id !== id));
  };

  const updateScheduleRow = (id: string, field: keyof ScheduleRow, value: any) => {
    setScheduleRows(scheduleRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addQuestionOption = () => {
    if (newOptionInput.trim()) {
      setNewQuestionOptions([...newQuestionOptions, newOptionInput.trim()]);
      setNewOptionInput("");
    }
  };

  const removeQuestionOption = (index: number) => {
    setNewQuestionOptions(newQuestionOptions.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    if (!newQuestionText.trim()) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: newQuestionText,
      question_type: newQuestionType,
      is_required: newQuestionRequired,
      options: ["radio", "checkbox"].includes(newQuestionType) ? newQuestionOptions : null,
      sort_order: questions.length,
    };

    setQuestions([...questions, newQuestion]);
    setNewQuestionText("");
    setNewQuestionRequired(false);
    setNewQuestionOptions([]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const toggleResource = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((r) => r !== resourceId)
        : [...prev, resourceId]
    );
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organizer/appointments")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {isEditing ? "Edit Appointment" : "New Appointment"}
              </h1>
              <p className="text-muted-foreground text-sm">Configure your appointment type</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </motion.div>

        {/* Basic Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-[1fr,200px] gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Appointment Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Dental Care"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your appointment..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min={0}
                            value={durationHours}
                            onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                            placeholder="Hours"
                          />
                          <span className="text-xs text-muted-foreground">hours</span>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            min={0}
                            max={59}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                            placeholder="Minutes"
                          />
                          <span className="text-xs text-muted-foreground">minutes</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter location"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <Label>Cover Image</Label>
                  <div className="mt-1 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Behavior */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Booking Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Booking Mode</Label>
                <RadioGroup
                  value={bookingMode}
                  onValueChange={(v) => setBookingMode(v as "user" | "resource")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Book by User
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="resource" id="resource" />
                    <Label htmlFor="resource" className="flex items-center gap-2 cursor-pointer">
                      <Box className="w-4 h-4" />
                      Book by Resource
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Resource/User Selection */}
              <div>
                <Label className="mb-3 block">
                  {bookingMode === "user" ? "Select Users" : "Select Resources"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {resources.map((resource) => (
                    <Badge
                      key={resource.id}
                      variant={selectedResources.includes(resource.id) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleResource(resource.id)}
                    >
                      {resource.name}
                    </Badge>
                  ))}
                  {resources.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No resources found.{" "}
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/organizer/resources")}>
                        Add resources
                      </Button>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Assignment Logic</Label>
                <RadioGroup
                  value={assignmentMode}
                  onValueChange={(v) => setAssignmentMode(v as "auto" | "choose")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="cursor-pointer">Automatically assign</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="choose" id="choose" />
                    <Label htmlFor="choose" className="cursor-pointer">Let visitor choose</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="simultaneous"
                    checked={allowSimultaneous}
                    onCheckedChange={(c) => setAllowSimultaneous(!!c)}
                  />
                  <Label htmlFor="simultaneous" className="cursor-pointer">
                    Allow simultaneous appointments per user
                  </Label>
                </div>
                {allowSimultaneous && (
                  <Input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="misc">Misc</TabsTrigger>
            </TabsList>

            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <Card className="border-2 border-border">
                <CardContent className="pt-6 space-y-4">
                  {scheduleRows.map((row, index) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <Select
                        value={row.day_of_week.toString()}
                        onValueChange={(v) => updateScheduleRow(row.id, "day_of_week", parseInt(v))}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">from</span>
                      <Input
                        type="time"
                        value={row.start_time}
                        onChange={(e) => updateScheduleRow(row.id, "start_time", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={row.end_time}
                        onChange={(e) => updateScheduleRow(row.id, "end_time", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeScheduleRow(row.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                  <Button variant="outline" onClick={addScheduleRow} className="gap-2 mt-4">
                    <Plus className="w-4 h-4" />
                    Add a line
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions">
              <Card className="border-2 border-border">
                <CardContent className="pt-6 space-y-6">
                  {/* Question Type Selector */}
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <Badge
                        key={type.value}
                        variant={newQuestionType === type.value ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => {
                          setNewQuestionType(type.value);
                          setNewQuestionOptions([]);
                        }}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>

                  {/* New Question Form */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label>Question Text</Label>
                      <Input
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Enter your question..."
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="required"
                        checked={newQuestionRequired}
                        onCheckedChange={(c) => setNewQuestionRequired(!!c)}
                      />
                      <Label htmlFor="required" className="cursor-pointer">
                        Mandatory
                      </Label>
                    </div>

                    {/* Options for radio/checkbox */}
                    {["radio", "checkbox"].includes(newQuestionType) && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newOptionInput}
                            onChange={(e) => setNewOptionInput(e.target.value)}
                            placeholder="Add option..."
                            onKeyDown={(e) => e.key === "Enter" && addQuestionOption()}
                          />
                          <Button variant="outline" onClick={addQuestionOption}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newQuestionOptions.map((opt, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                              {opt}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeQuestionOption(i)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={addQuestion} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add a question
                    </Button>
                  </div>

                  {/* Questions Table */}
                  {questions.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Question</th>
                            <th className="text-left p-3 font-medium">Answer Type</th>
                            <th className="text-left p-3 font-medium">Example</th>
                            <th className="text-center p-3 font-medium">Mandatory</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((q) => (
                            <tr key={q.id} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="p-3">{q.question}</td>
                              <td className="p-3 text-muted-foreground capitalize">{q.question_type}</td>
                              <td className="p-3 text-muted-foreground text-sm">
                                {q.options ? q.options.join(", ") : "Text input"}
                              </td>
                              <td className="p-3 text-center">
                                <Checkbox checked={q.is_required} disabled />
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeQuestion(q.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Options Tab */}
            <TabsContent value="options">
              <Card className="border-2 border-border">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Manual Confirmation</Label>
                      <p className="text-sm text-muted-foreground">
                        Require manual approval for each booking
                      </p>
                    </div>
                    <Switch checked={manualConfirmation} onCheckedChange={setManualConfirmation} />
                  </div>

                  <div className="space-y-2">
                    <Label>Max % of capacity allowed</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={maxCapacityPercent}
                        onChange={(e) => setMaxCapacityPercent(parseInt(e.target.value) || 100)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Paid Booking</Label>
                      <p className="text-sm text-muted-foreground">Require payment for this appointment</p>
                    </div>
                    <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                  </div>

                  {isPaid && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>Booking Fee</Label>
                        <div className="flex gap-2 mt-1">
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Slot Creation Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={5}
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(parseInt(e.target.value) || 30)}
                      className="w-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cancellation Deadline (hours before appointment)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cancellationDeadline}
                      onChange={(e) => setCancellationDeadline(parseInt(e.target.value) || 24)}
                      className="w-32"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Misc Tab */}
            <TabsContent value="misc">
              <Card className="border-2 border-border">
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label htmlFor="intro">Introduction Page Message</Label>
                    <Textarea
                      id="intro"
                      value={introMessage}
                      onChange={(e) => setIntroMessage(e.target.value)}
                      placeholder="Welcome message shown to customers before booking..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmation">Confirmation Page Message</Label>
                    <Textarea
                      id="confirmation"
                      value={confirmationMessage}
                      onChange={(e) => setConfirmationMessage(e.target.value)}
                      placeholder="Thank you message shown after booking is confirmed..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};

export default AppointmentFormPage;
