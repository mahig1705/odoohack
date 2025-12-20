-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'organizer', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create appointment_types table (services offered by organizers)
CREATE TABLE public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#FF6B35',
  is_published BOOLEAN DEFAULT FALSE,
  requires_payment BOOLEAN DEFAULT FALSE,
  max_capacity INTEGER DEFAULT 1,
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create resources table (staff, rooms, equipment)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'staff',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create resource_assignments (link resources to appointment types)
CREATE TABLE public.resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (resource_id, appointment_type_id)
);

-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (resource_id, organizer_id, day_of_week)
);

-- Create slots table (available time slots)
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  capacity_remaining INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create appointment_questions table
CREATE TABLE public.appointment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'textarea', 'select', 'checkbox', 'radio')),
  options JSONB,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE CASCADE NOT NULL,
  slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create appointment_answers table (customer responses to questions)
CREATE TABLE public.appointment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.appointment_questions(id) ON DELETE CASCADE NOT NULL,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Appointment types policies
CREATE POLICY "Anyone can view published appointment types"
  ON public.appointment_types FOR SELECT
  USING (is_published = true);

CREATE POLICY "Organizers can view their own appointment types"
  ON public.appointment_types FOR SELECT
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can manage their own appointment types"
  ON public.appointment_types FOR ALL
  USING (organizer_id = auth.uid());

-- Resources policies
CREATE POLICY "Organizers can manage their own resources"
  ON public.resources FOR ALL
  USING (organizer_id = auth.uid());

CREATE POLICY "Public can view active resources"
  ON public.resources FOR SELECT
  USING (is_active = true);

-- Resource assignments policies
CREATE POLICY "Anyone can view resource assignments"
  ON public.resource_assignments FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage resource assignments"
  ON public.resource_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_id AND r.organizer_id = auth.uid()
    )
  );

-- Working hours policies
CREATE POLICY "Anyone can view working hours"
  ON public.working_hours FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage their working hours"
  ON public.working_hours FOR ALL
  USING (organizer_id = auth.uid());

-- Slots policies
CREATE POLICY "Anyone can view available slots"
  ON public.slots FOR SELECT
  USING (is_available = true);

CREATE POLICY "Organizers can manage slots for their appointment types"
  ON public.slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_types at
      WHERE at.id = appointment_type_id AND at.organizer_id = auth.uid()
    )
  );

-- Appointment questions policies
CREATE POLICY "Anyone can view questions for published appointment types"
  ON public.appointment_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_types at
      WHERE at.id = appointment_type_id AND at.is_published = true
    )
  );

CREATE POLICY "Organizers can manage questions for their appointment types"
  ON public.appointment_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_types at
      WHERE at.id = appointment_type_id AND at.organizer_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "Organizers can view bookings for their appointment types"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_types at
      WHERE at.id = appointment_type_id AND at.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update bookings for their appointment types"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_types at
      WHERE at.id = appointment_type_id AND at.organizer_id = auth.uid()
    )
  );

-- Appointment answers policies
CREATE POLICY "Customers can manage their own answers"
  ON public.appointment_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view answers for their bookings"
  ON public.appointment_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.appointment_types at ON at.id = b.appointment_type_id
      WHERE b.id = booking_id AND at.organizer_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Customers can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create payments for their bookings"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view payments for their bookings"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.appointment_types at ON at.id = b.appointment_type_id
      WHERE b.id = booking_id AND at.organizer_id = auth.uid()
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_types_updated_at
  BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();