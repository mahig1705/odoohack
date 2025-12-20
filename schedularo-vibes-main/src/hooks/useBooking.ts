import { useState } from "react";
import { appointmentTypeApi, slotApi, bookingApi, resourceApi, appointmentQuestionApi, formatDateLocal } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Types
export interface AppointmentType {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  color: string;
  is_published: boolean;
  organizer_id: string;
  requires_payment: boolean;
  max_capacity: number;
  buffer_before: number;
  buffer_after: number;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  resource_type: string;
  is_active: boolean;
  avatar_url: string | null;
}

export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  capacity_remaining: number;
  resource_id?: string;
}

export interface Question {
  id: string;
  question: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export interface BookingData {
  appointmentTypeId: string;
  resourceId: string | null;
  slotId: string | null;
  selectedDate: Date | null;
  selectedSlot: Slot | null;
  answers: Record<string, string>;
  notes: string;
}

export const useBooking = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const usingSampleData = false; // No longer using sample data

  // Fetch published appointment types
  const fetchAppointmentTypes = async (): Promise<AppointmentType[]> => {
    setIsLoading(true);
    try {
      const types = await appointmentTypeApi.list();
      
      // Map backend format to frontend format
      return types.map(type => ({
        id: type.id,
        title: type.name,
        description: null,
        duration_minutes: type.duration_minutes,
        price: 0,
        currency: "USD",
        color: "#FF6B35",
        is_published: type.is_published,
        organizer_id: "",
        requires_payment: false,
        max_capacity: 1,
        buffer_before: 0,
        buffer_after: 0,
      })) as AppointmentType[];
    } catch (error) {
      console.error("Error fetching appointment types:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single appointment type
  const fetchAppointmentType = async (id: string): Promise<AppointmentType | null> => {
    setIsLoading(true);
    try {
      const types = await appointmentTypeApi.list();
      const type = types.find(t => t.id === id);
      
      if (!type) {
        return null;
      }

      // Map backend format to frontend format
      return {
        id: type.id,
        title: type.name,
        description: null,
        duration_minutes: type.duration_minutes,
        price: 0,
        currency: "USD",
        color: "#FF6B35",
        is_published: type.is_published,
        organizer_id: "",
        requires_payment: false,
        max_capacity: 1,
        buffer_before: 0,
        buffer_after: 0,
      } as AppointmentType;
    } catch (error) {
      console.error("Error fetching appointment type:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch resources for appointment type
  const fetchResources = async (appointmentTypeId: string): Promise<Resource[]> => {
    try {
      const resources = await resourceApi.listForAppointment(appointmentTypeId);
      return resources.map(r => ({
        id: r.id,
        name: r.name,
        description: null,
        resource_type: "resource",
        is_active: r.is_active,
        avatar_url: null,
      })) as Resource[];
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  };

  // Fetch available slots - users can ONLY fetch existing slots, never generate
  const fetchSlots = async (
    appointmentTypeId: string,
    date: Date,
    resourceId?: string
  ): Promise<Slot[]> => {
    try {
      // Convert Date to YYYY-MM-DD string using local timezone (prevents timezone shifts)
      const dateStr = formatDateLocal(date);
      
      // Fetch existing slots only - no generation
      const slots = await slotApi.getSlots(appointmentTypeId, dateStr);
      
      return slots
        .filter(slot => slot.is_available)
        .map(slot => ({
          id: slot.id,
          start_time: `${dateStr}T${slot.start_time}:00`,
          end_time: `${dateStr}T${slot.end_time}:00`,
          is_available: slot.is_available,
          capacity_remaining: (slot.max_capacity || 1) - (slot.booked_capacity || 0),
          resource_id: resourceId,
        })) as Slot[];
    } catch (error) {
      console.error("Error fetching slots:", error);
      return [];
    }
  };

  // Fetch questions for appointment type
  const fetchQuestions = async (appointmentTypeId: string): Promise<Question[]> => {
    try {
      const questions = await appointmentQuestionApi.list(appointmentTypeId);
      return questions.map((q, index) => ({
        id: q.id,
        question: q.question_text,
        question_type: q.input_type,
        options: null,
        is_required: q.is_required,
        sort_order: index,
      })) as Question[];
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  };

  // Create Razorpay order
  const createPaymentOrder = async (amount: number, currency: string) => {
    // Payment integration can be added later
    throw new Error("Payment integration not yet implemented");
  };

  // Verify payment
  const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    bookingId: string,
    amount: number,
    currency: string
  ) => {
    // Payment integration can be added later
    throw new Error("Payment integration not yet implemented");
  };

  // Create booking
  const createBooking = async (bookingData: BookingData, userId: string) => {
    try {
      if (!bookingData.slotId) {
        throw new Error("Please select a time slot");
      }

      const result = await bookingApi.create({
        slot_id: bookingData.slotId,
        people_count: 1,
      });

      return {
        id: result.appointment_id,
        booking_date: bookingData.selectedSlot?.start_time || formatDateLocal(new Date()),
        status: result.status,
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  };

  return {
    isLoading,
    usingSampleData,
    fetchAppointmentTypes,
    fetchAppointmentType,
    fetchResources,
    fetchSlots,
    fetchQuestions,
    createPaymentOrder,
    verifyPayment,
    createBooking,
  };
};
