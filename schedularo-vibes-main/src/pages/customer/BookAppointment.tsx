import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { slotApi, bookingApi, appointmentQuestionApi, appointmentAnswerApi, paymentApi, appointmentTypeApi, formatDateLocal } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import VoiceAutoBookButton from "@/components/customer/VoiceAutoBookButton";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_capacity: number;
  status?: string;
  is_available?: boolean;
}

interface Question {
  id: string;
  appointment_type_id: string;
  question_text: string;
  input_type: string;
  is_required: boolean;
}

export default function BookAppointment() {
  const { appointmentTypeId } = useParams<{ appointmentTypeId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [booking, setBooking] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [appointmentType, setAppointmentType] = useState<{ name: string; price?: number; requires_payment?: boolean } | null>(null);

  // Fetch appointment type details and questions when component mounts
  useEffect(() => {
    if (appointmentTypeId) {
      fetchAppointmentType();
      fetchQuestions();
    }
  }, [appointmentTypeId]);

  const fetchAppointmentType = async () => {
    if (!appointmentTypeId) return;
    
    try {
      const appts = await appointmentTypeApi.list();
      const appt = appts.find(a => a.id === appointmentTypeId);
      if (appt) {
        // Note: Backend doesn't have payment_mandatory field yet
        // For now, we'll check if organizer set price/isPaid in frontend
        // This is a limitation - payment requirement should be stored in backend
        setAppointmentType(appt);
        // If backend adds payment_mandatory field, check it here
        // setPaymentRequired(appt.requires_payment || false);
      }
    } catch (error) {
      console.error("Error fetching appointment type:", error);
    }
  };

  const fetchQuestions = async () => {
    if (!appointmentTypeId) return;
    
    setLoadingQuestions(true);
    try {
      const data = await appointmentQuestionApi.list(appointmentTypeId);
      setQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Don't show error toast - questions are optional
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch slots (READ ONLY)
  const fetchSlotsForDate = async (slotDate: string) => {
    if (!appointmentTypeId) {
      console.error("❌ appointmentTypeId missing — cannot fetch slots");
      toast({
        title: "Configuration error",
        description: "Appointment type ID missing in URL",
        variant: "destructive",
      });
      return;
    }

    setLoadingSlots(true);
    setSelectedSlotId(null);

    try {
      console.log(
        "➡️ Calling GET /slots with:",
        appointmentTypeId,
        slotDate
      );

      const data = await slotApi.getSlots(appointmentTypeId, slotDate);

      console.log("✅ Slots received:", data);
      setSlots(data);
    } catch (err: any) {
      console.error("❌ Failed to fetch slots:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load slots",
        variant: "destructive",
      });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Calendar selection
  const handleDateSelect = (date?: Date) => {
    console.log("📅 Calendar clicked:", date);
    if (!date) return;

    const slotDate = formatDateLocal(date);
    console.log("📆 Formatted slotDate =", slotDate);

    setSelectedDate(slotDate);
    fetchSlotsForDate(slotDate);
  };

  // Book slot
  const handleBook = async () => {
    if (!selectedSlotId) return;

    // Validate required questions
    const requiredQuestions = questions.filter(q => q.is_required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id].trim() === "");
    
    if (missingAnswers.length > 0) {
      toast({
        title: "Missing required information",
        description: `Please answer all required questions`,
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      const result = await bookingApi.create({ slot_id: selectedSlotId });
      const newAppointmentId = result.appointment_id;
      setAppointmentId(newAppointmentId);

      // Submit answers
      if (questions.length > 0 && Object.keys(answers).length > 0) {
        try {
          await Promise.all(
            Object.entries(answers).map(([questionId, answer]) =>
              appointmentAnswerApi.submit({
                appointment_id: newAppointmentId,
                question_id: questionId,
                answer: answer,
              })
            )
          );
        } catch (answerError) {
          console.error("Error submitting answers:", answerError);
          // Don't fail booking if answers fail
        }
      }

      toast({
        title: "Appointment booked",
        description: "Your appointment has been booked successfully",
      });

      // Show payment screen
      // If payment is required, user must pay before continuing
      // If payment is optional, user can skip
      setShowPayment(true);
    } catch (err: any) {
      toast({
        title: "Booking failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!appointmentId || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);
    try {
      await paymentApi.create({
        appointment_id: appointmentId,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
      });

      toast({
        title: "Payment successful",
        description: "Your appointment has been confirmed",
      });

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        navigate("/customer/bookings");
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSkipPayment = () => {
    // Only allow skip if payment is not required
    if (paymentRequired) {
      toast({
        title: "Payment required",
        description: "Payment is mandatory for this appointment type",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking confirmed",
      description: "You can complete payment later",
    });
    setTimeout(() => {
      navigate("/customer/bookings");
    }, 1500);
  };

  const availableSlots = slots.filter((s) => {
    if (s.is_available !== undefined) return s.is_available;
    const open = !s.status || s.status === "OPEN" || s.status === "AVAILABLE";
    return open && s.booked_capacity < s.max_capacity;
  });

  // Render question input based on type
  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || "";

    switch (question.input_type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Your answer..."
            required={question.is_required}
          />
        );
      case "radio":
        // For radio, we'd need options - simplified for now
        return (
          <Input
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Your answer..."
            required={question.is_required}
          />
        );
      case "checkbox":
        // For checkbox, we'd need options - simplified for now
        return (
          <Input
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Your answer..."
            required={question.is_required}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Your answer..."
            required={question.is_required}
          />
        );
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Book Appointment</h1>
          {appointmentTypeId && <VoiceAutoBookButton appointmentTypeId={appointmentTypeId} />}
        </div>

        {/* Payment Screen */}
        {showPayment && appointmentId && (
          <Card className={paymentRequired ? "border-yellow-500" : "border-green-500"}>
            <CardHeader>
              <CardTitle>
                {paymentRequired ? "Payment Required" : "Complete Payment (Optional)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={paymentRequired ? "text-yellow-700 dark:text-yellow-400 font-medium" : "text-muted-foreground"}>
                {paymentRequired 
                  ? "Payment is mandatory for this appointment type. Please complete payment to confirm your booking."
                  : "Your appointment has been booked. You can complete payment now or later."}
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount {paymentRequired && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={appointmentType?.price ? appointmentType.price.toString() : "0.00"}
                  required={paymentRequired}
                />
                {appointmentType?.price && (
                  <p className="text-sm text-muted-foreground">
                    Suggested amount: {appointmentType.price}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePayment}
                  disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
                {!paymentRequired && (
                  <Button variant="outline" onClick={handleSkipPayment}>
                    Skip Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Form */}
        {!showPayment && (
          <>
            {/* Calendar */}
            <Card>
              <CardContent className="p-4">
                <Calendar mode="single" onSelect={handleDateSelect} />
              </CardContent>
            </Card>

            {loadingSlots && (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  Loading slots…
                </CardContent>
              </Card>
            )}

            {!loadingSlots && selectedDate && slots.length === 0 && (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  No slots found for {selectedDate}.
                </CardContent>
              </Card>
            )}

            {!loadingSlots && availableSlots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Time Slot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map((slot) => {
                      const start = slot.start_time.substring(0, 5);
                      const end = slot.end_time.substring(0, 5);

                      const [sh, sm] = start.split(":").map(Number);
                      const [eh, em] = end.split(":").map(Number);

                      const sd = new Date();
                      sd.setHours(sh, sm, 0, 0);
                      const ed = new Date();
                      ed.setHours(eh, em, 0, 0);

                      return (
                        <Button
                          key={slot.id}
                          variant={selectedSlotId === slot.id ? "default" : "outline"}
                          onClick={() => setSelectedSlotId(slot.id)}
                        >
                          {format(sd, "h:mm a")} – {format(ed, "h:mm a")}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions */}
            {selectedSlotId && questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label>
                        {question.question_text}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderQuestionInput(question)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {selectedSlotId && (
              <Button
                className="w-full"
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
