// Sample data generators for fallback when API returns empty/error

export interface SampleAppointmentType {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
  color: string;
  is_published: boolean;
  organizer_id: string;
  requires_payment: boolean;
  max_capacity: number;
}

export interface SampleResource {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  is_active: boolean;
  avatar_url: string | null;
}

export interface SampleSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  capacity_remaining: number;
}

export interface SampleQuestion {
  id: string;
  question: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

// Generate sample appointment types
export const generateSampleAppointmentTypes = (): SampleAppointmentType[] => [
  {
    id: "sample-dental-1",
    title: "Dental Consultation",
    description: "Complete dental checkup with cleaning and examination. Our expert dentists will ensure your oral health is in perfect condition.",
    duration_minutes: 30,
    price: 500,
    currency: "INR",
    color: "#FF6B35",
    is_published: true,
    organizer_id: "sample-org-1",
    requires_payment: true,
    max_capacity: 1,
  },
  {
    id: "sample-physio-1",
    title: "Physiotherapy Session",
    description: "One-on-one physiotherapy session for injury recovery and pain management. Personalized treatment plan included.",
    duration_minutes: 45,
    price: 800,
    currency: "INR",
    color: "#4ECDC4",
    is_published: true,
    organizer_id: "sample-org-1",
    requires_payment: true,
    max_capacity: 1,
  },
  {
    id: "sample-consult-1",
    title: "General Consultation",
    description: "General health consultation with our experienced physicians. Includes basic health assessment.",
    duration_minutes: 20,
    price: 300,
    currency: "INR",
    color: "#45B7D1",
    is_published: true,
    organizer_id: "sample-org-1",
    requires_payment: false,
    max_capacity: 1,
  },
];

// Generate sample resources
export const generateSampleResources = (): SampleResource[] => [
  {
    id: "sample-resource-1",
    name: "Dr. Sharma",
    description: "Senior Consultant - 15 years experience",
    resource_type: "staff",
    is_active: true,
    avatar_url: null,
  },
  {
    id: "sample-resource-2",
    name: "Dr. Patel",
    description: "Specialist - 10 years experience",
    resource_type: "staff",
    is_active: true,
    avatar_url: null,
  },
  {
    id: "sample-resource-3",
    name: "Room 101",
    description: "Consultation Room - Ground Floor",
    resource_type: "room",
    is_active: true,
    avatar_url: null,
  },
];

// Generate sample slots for a given date
export const generateSampleSlots = (date: Date): SampleSlot[] => {
  const slots: SampleSlot[] = [];
  const baseHour = 9; // Start at 9 AM
  
  for (let i = 0; i < 8; i++) {
    const startHour = baseHour + i;
    const endHour = startHour + 1;
    
    slots.push({
      id: `sample-slot-${date.toISOString().split('T')[0]}-${i}`,
      start_time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0).toISOString(),
      end_time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, 0).toISOString(),
      is_available: Math.random() > 0.3, // 70% available
      capacity_remaining: Math.floor(Math.random() * 3) + 1,
    });
  }
  
  return slots;
};

// Generate sample questions
export const generateSampleQuestions = (): SampleQuestion[] => [
  {
    id: "sample-q-1",
    question: "Please describe your symptoms or reason for visit",
    question_type: "textarea",
    options: null,
    is_required: true,
    sort_order: 0,
  },
  {
    id: "sample-q-2",
    question: "Do you have any allergies?",
    question_type: "radio",
    options: ["Yes", "No", "Not Sure"],
    is_required: true,
    sort_order: 1,
  },
  {
    id: "sample-q-3",
    question: "Contact phone number",
    question_type: "text",
    options: null,
    is_required: true,
    sort_order: 2,
  },
];

// Helper to check if data is empty
export const isDataEmpty = <T>(data: T[] | null | undefined): boolean => {
  return !data || data.length === 0;
};

// Get fallback data with type safety
export const getFallbackData = <T>(
  data: T[] | null | undefined,
  fallbackGenerator: () => T[]
): T[] => {
  if (isDataEmpty(data)) {
    console.log("Using fallback sample data");
    return fallbackGenerator();
  }
  return data as T[];
};
