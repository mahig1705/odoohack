const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 * This prevents timezone shifts that occur with toISOString()
 * @param date - Date object to convert
 * @returns YYYY-MM-DD string in local timezone
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get auth token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// Set auth token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

// Remove auth token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem("auth_token");
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authApi = {
  register: async (data: { full_name: string; email: string; password: string; role?: string }) => {
    return apiRequest<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiRequest<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setToken(response.access_token);
    return response;
  },

  verifyOtp: async (data: { email: string; otp: string }) => {
    return apiRequest<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  resendVerificationOtp: async (email: string) => {
    return apiRequest<{ message: string }>("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  logout: () => {
    removeToken();
  },
};

// User API
export const userApi = {
  getMe: async () => {
    return apiRequest<{
      id: string;
      full_name: string;
      email: string;
      is_active: boolean;
      is_verified: boolean;
      roles: string[];
    }>("/users/me");
  },

  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    return apiRequest<{ message: string }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// Appointment Types API
export const appointmentTypeApi = {
  list: async () => {
    return apiRequest<Array<{
      id: string;
      name: string;
      duration_minutes: number;
      appointment_mode: string;
      is_published: boolean;
    }>>("/appointment-types/public");
  },

  listMy: async () => {
    return apiRequest<Array<{
      id: string;
      name: string;
      duration_minutes: number;
      appointment_mode: string;
      is_published: boolean;
    }>>("/appointment-types/my");
  },

  create: async (data: {
    name: string;
    description?: string;
    duration_minutes: number;
    appointment_mode: string;
    location?: string;
  }) => {
    return apiRequest<{
      id: string;
      name: string;
      duration_minutes: number;
      appointment_mode: string;
      is_published: boolean;
    }>("/appointment-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (appointmentId: string, data: {
    name?: string;
    description?: string;
    duration_minutes?: number;
    appointment_mode?: string;
    location?: string;
  }) => {
    // Clean the payload: remove empty strings and undefined values
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== "" && value !== null) {
        cleanedData[key] = value;
      }
    }
    
    return apiRequest<{
      id: string;
      name: string;
      duration_minutes: number;
      appointment_mode: string;
      is_published: boolean;
    }>(`/appointment-types/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify(cleanedData),
    });
  },

  publish: async (appointmentId: string) => {
    return apiRequest<{
      id: string;
      name: string;
      duration_minutes: number;
      appointment_mode: string;
      is_published: boolean;
    }>(`/appointment-types/${appointmentId}/publish`, {
      method: "POST",
    });
  },
};

// Slots API
export const slotApi = {
  getSlots: async (appointmentTypeId: string, slotDate: string) => {
    try {
      const url = `/slots?appointment_type_id=${appointmentTypeId}&slot_date=${slotDate}`;
      console.log(`[slotApi.getSlots] Requesting: ${API_BASE_URL}${url}`);
      
      const slots = await apiRequest<Array<{
        id: string;
        appointment_type_id: string;
        slot_date: string;
        start_time: string;
        end_time: string;
        max_capacity: number;
        booked_capacity: number;
        status: string;
      }>>(url);
      
      console.log(`[slotApi.getSlots] Received ${slots.length} slots:`, slots);
      
      // Map backend response to include is_available
      const mappedSlots = slots.map(slot => ({
        ...slot,
        is_available:
          slot.booked_capacity < slot.max_capacity &&
          (!slot.status || slot.status === "OPEN" || slot.status === "AVAILABLE")
      }));
      
      
      console.log(`[slotApi.getSlots] Mapped ${mappedSlots.length} available slots`);
      return mappedSlots;
    } catch (error: any) {
      console.error(`[slotApi.getSlots] Error fetching slots:`, error);
      throw error;
    }
  },

  generateSlots: async (data: { appointment_type_id: string; slot_date: string }) => {
    return apiRequest<{ message: string }>("/slots/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Working Hours API
export const workingHoursApi = {
  list: async (appointmentTypeId: string) => {
    return apiRequest<Array<{
      id: string;
      appointment_type_id: string;
      weekday: number;
      start_time: string;
      end_time: string;
    }>>(`/working-hours/appointment/${appointmentTypeId}`);
  },

  create: async (data: {
    appointment_type_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
  }) => {
    return apiRequest<{ message: string }>("/working-hours", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete: async (workingHoursId: string) => {
    return apiRequest<{ message: string }>(`/working-hours/${workingHoursId}`, {
      method: "DELETE",
    });
  },
};

// Bookings API
export const bookingApi = {
  create: async (data: { slot_id: string; people_count?: number }) => {
    return apiRequest<{
      appointment_id: string;
      status: string;
    }>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyBookings: async () => {
    return apiRequest<Array<{
      id: string;
      appointment_type_id: string;
      slot_id: string;
      user_id: string;
      people_count: number;
      status: string;
      created_at: string;
      appointment_type_name: string;
      slot_date: string;
      start_time: string;
      end_time: string;
      booked_by: string;
    }>>("/bookings/my");
  },

  getAllBookings: async () => {
    return apiRequest<Array<{
      id: string;
      appointment_type_id: string;
      slot_id: string;
      user_id: string;
      people_count: number;
      status: string;
      created_at: string;
      appointment_type_name: string;
      slot_date: string;
      start_time: string;
      end_time: string;
      booked_by: string;
    }>>("/bookings/all");
  },

  cancel: async (appointmentId: string) => {
    return apiRequest<{ message: string }>(`/appointments/${appointmentId}/cancel`, {
      method: "POST",
    });
  },
};

// Password Reset API
export const passwordApi = {
  requestReset: async (email: string) => {
    return apiRequest<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiRequest<{ reset_token: string }>("/auth/verify-password-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
    });
  },
};

// Resources API
export const resourceApi = {
  list: async () => {
    return apiRequest<Array<{
      id: string;
      name: string;
      capacity: number;
      is_active: boolean;
    }>>("/resources/my");
  },

  listForAppointment: async (appointmentTypeId: string) => {
    return apiRequest<Array<{
      id: string;
      name: string;
      capacity: number;
      is_active: boolean;
    }>>(`/resources/appointment/${appointmentTypeId}`);
  },

  create: async (data: { name: string; capacity?: number }) => {
    return apiRequest<{
      id: string;
      name: string;
      capacity: number;
      is_active: boolean;
    }>("/resources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  toggle: async (resourceId: string) => {
    return apiRequest<{ message: string }>(`/resources/${resourceId}/toggle`, {
      method: "POST",
    });
  },

  assign: async (appointmentTypeId: string, resourceId: string) => {
    return apiRequest<{ message: string }>(
      `/resources/assign?appointment_type_id=${appointmentTypeId}&resource_id=${resourceId}`,
      {
        method: "POST",
      }
    );
  },
};

// Appointment Questions API
export const appointmentQuestionApi = {
  list: async (appointmentTypeId: string) => {
    return apiRequest<Array<{
      id: string;
      appointment_type_id: string;
      question_text: string;
      input_type: string;
      is_required: boolean;
    }>>(`/appointment-questions/${appointmentTypeId}`);
  },
};

// Payment API
export const paymentApi = {
  // Legacy create (keeps existing behavior for offline/manual payments)
  create: async (data: {
    appointment_id: string;
    amount: number;
    payment_method: string;
  }) => {
    return apiRequest<{
      payment_id: string;
      status: string;
    }>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  createOrder: async (data: { appointment_id: string; amount: number; currency?: string }) => {
    return apiRequest<{
      payment_id: string;
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
    }>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  verify: async (data: { payment_id: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    return apiRequest<{ success: boolean }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Create an online order (Razorpay). Returns our payment record id and razorpay order id + key id.
  createOrder: async (data: { appointment_id: string; amount: number; currency?: string }) => {
    return apiRequest<{
      payment_id: string;
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
    }>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Verify payment after Razorpay checkout
  verify: async (data: { payment_id: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    return apiRequest<{ success: boolean; payment_id: string }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Appointment Answers API
export const appointmentAnswerApi = {
  submit: async (data: {
    appointment_id: string;
    question_id: string;
    answer: string;
  }) => {
    return apiRequest<{ message: string }>("/appointment-answers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Appointment Status History API
export const appointmentStatusApi = {
  getHistory: async (appointmentId: string) => {
    return apiRequest<Array<{
      id: string;
      appointment_id: string;
      old_status: string;
      new_status: string;
      changed_at: string;
      changed_by: string;
    }>>(`/appointment-status/${appointmentId}`);
  },
};

