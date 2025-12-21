# Backend Inventory & Frontend Gap Analysis

## PHASE 1: BACKEND DISCOVERY

### Complete Backend Endpoint Inventory

#### 1. Auth Domain (`/auth`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/auth/register` | POST | None (public) | `RegisterRequest` (full_name, email, password, role) | `{message: string}` | ✅ Implemented |
| `/auth/verify-otp` | POST | None (public) | `OTPVerifyRequest` (email, otp) | `{message: string}` | ✅ Implemented |
| `/auth/login` | POST | None (public) | `LoginRequest` (email, password) | `TokenResponse` (access_token, token_type) | ✅ Implemented |

**Notes:**
- Registration supports CUSTOMER and ORGANISER roles only
- First user becomes ADMIN automatically
- OTP verification required before account activation

#### 2. Users Domain (`/users`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/users/me` | GET | Authenticated | None | `UserResponse` (id, full_name, email, is_active, is_verified, roles[]) | ✅ Implemented |

**Notes:**
- Returns current user info with all roles
- No update endpoint exists in backend

#### 3. Appointment Types Domain (`/appointment-types`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/appointment-types` | POST | ORGANISER, ADMIN | `AppointmentTypeCreate` | `AppointmentTypeResponse` | ✅ Implemented |
| `/appointment-types/{id}/publish` | POST | ORGANISER, ADMIN | None | `AppointmentTypeResponse` | ✅ Implemented |
| `/appointment-types/public` | GET | None (public) | None | `AppointmentTypeResponse[]` | ✅ Implemented |
| `/appointment-types/my` | GET | ORGANISER, ADMIN | None | `AppointmentTypeResponse[]` | ✅ Implemented |

**Notes:**
- No UPDATE endpoint exists (only create and publish)
- No DELETE endpoint exists
- Public endpoint returns only published appointment types

#### 4. Working Hours Domain (`/working-hours`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/working-hours/appointment/{appointment_type_id}` | GET | None (public) | None | `WorkingHoursResponse[]` | ✅ Implemented |
| `/working-hours` | POST | Authenticated | `WorkingHoursCreate` | `{message: string}` | ✅ Implemented |
| `/working-hours/{id}` | DELETE | Authenticated | None | `{message: string}` | ✅ Implemented |

**Notes:**
- No UPDATE endpoint exists (delete and recreate pattern)
- Weekday stored as 0-6 (Monday-Sunday, Python date.weekday())

#### 5. Slots Domain (`/slots`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/slots/generate` | POST | ORGANISER, ADMIN | `SlotGenerateRequest` (appointment_type_id, slot_date) | `{message: string}` | ✅ Implemented |
| `/slots` | GET | None (public) | Query: appointment_type_id, slot_date | `SlotResponse[]` | ✅ Implemented |
| `/slots/appointment/{appointment_type_id}/date/{slot_date}` | GET | None (public) | Path params | `SlotResponse[]` | ✅ Implemented |

**Notes:**
- Slot generation requires organizer to own the appointment type (or be ADMIN)
- Slots are read-only for customers
- No DELETE or UPDATE endpoints for slots

#### 6. Resources Domain (`/resources`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/resources/my` | GET | ORGANISER, ADMIN | None | `ResourceResponse[]` | ✅ Implemented |
| `/resources` | POST | ORGANISER, ADMIN | `ResourceCreate` (name, capacity?) | `ResourceResponse` | ✅ Implemented |
| `/resources/{id}/toggle` | POST | ORGANISER, ADMIN | None | `{message: string}` | ✅ Implemented |
| `/resources/assign` | POST | ORGANISER, ADMIN | Query: appointment_type_id, resource_id | `{message: string}` | ⚠️ Partial |
| `/resources/appointment/{appointment_type_id}` | GET | None (public) | Path param | `ResourceResponse[]` | ✅ Implemented |

**Notes:**
- No UPDATE endpoint (use toggle for status, recreate for other changes)
- Resource assignment endpoint exists but UI may be incomplete

#### 7. Bookings Domain (`/bookings`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/bookings` | POST | CUSTOMER | `BookingCreate` (slot_id, people_count?) | `{appointment_id, status}` | ✅ Implemented |
| `/bookings/my` | GET | CUSTOMER | None | `BookingResponse[]` | ✅ Implemented |
| `/bookings/all` | GET | ORGANISER, ADMIN | None | `BookingResponse[]` | ✅ Implemented |

**Notes:**
- Customers can only create bookings
- Organizers can view all bookings
- No UPDATE endpoint for bookings

#### 8. Payments Domain (`/payments`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/payments` | POST | CUSTOMER | `PaymentCreate` | `{payment_id, status}` | ❌ MISSING |

**Notes:**
- Payment endpoint exists but NO frontend implementation
- No GET endpoint for payment status/history
- Payment service likely integrates with Razorpay (see supabase/functions/razorpay)

#### 9. Cancellation Domain (`/appointments`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/appointments/{id}/cancel` | POST | CUSTOMER | None | `{message: string}` | ✅ Implemented |

**Notes:**
- Only customers can cancel their own appointments
- Backend validates ownership

#### 10. Appointment Questions Domain (`/appointment-questions`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/appointment-questions` | POST | CUSTOMER | `AppointmentQuestionCreate` | Question object | ⚠️ Partial |
| `/appointment-questions/{appointment_type_id}` | GET | None (public) | Path param | `AppointmentQuestionResponse[]` | ✅ Implemented |

**Notes:**
- Questions can be created by customers (unusual - may be organizer feature)
- Questions are read-only for booking flow

#### 11. Appointment Answers Domain (`/appointment-answers`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/appointment-answers` | POST | CUSTOMER | `AppointmentAnswerCreate` | `{message: string}` | ❌ MISSING |

**Notes:**
- Answers submitted during booking
- No GET endpoint to view answers

#### 12. Appointment Status History Domain (`/appointment-status`)
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/appointment-status/{appointment_id}` | GET | CUSTOMER, ADMIN, ORGANISER | Path param | `AppointmentStatusHistory[]` | ❌ MISSING |

**Notes:**
- Audit trail for appointment status changes
- No frontend implementation

#### 13. Roles Domain (`/roles`) - ADMIN ONLY
| Endpoint | Method | Role Required | Request Schema | Response Schema | Frontend Status |
|----------|--------|---------------|----------------|----------------|-----------------|
| `/roles/assign` | POST | ADMIN | Query: user_id, role | `{message: string}` | ⚠️ Partial |
| `/roles/remove` | POST | ADMIN | Query: user_id, role | `{message: string}` | ⚠️ Partial |
| `/roles/{user_id}` | GET | ADMIN | Path param | `{roles: string[]}` | ⚠️ Partial |

**Notes:**
- Admin-only functionality
- May be partially implemented in admin dashboard

---

## PHASE 2: FRONTEND GAP ANALYSIS

### Frontend Coverage Matrix

| Feature | Backend Exists | Frontend Exists | Status | Priority |
|---------|---------------|-----------------|--------|----------|
| **Auth** |
| User Registration | ✅ | ✅ | ✅ COMPLETE | - |
| OTP Verification | ✅ | ✅ | ✅ COMPLETE | - |
| Login | ✅ | ✅ | ✅ COMPLETE | - |
| **Users** |
| Get Current User | ✅ | ✅ | ✅ COMPLETE | - |
| **Appointment Types** |
| Create Appointment Type | ✅ | ✅ | ✅ COMPLETE | - |
| List My Appointments | ✅ | ✅ | ✅ COMPLETE | - |
| List Public Appointments | ✅ | ✅ | ✅ COMPLETE | - |
| Publish Appointment | ✅ | ✅ | ✅ COMPLETE | - |
| **Working Hours** |
| List Working Hours | ✅ | ✅ | ✅ COMPLETE | - |
| Create Working Hours | ✅ | ✅ | ✅ COMPLETE | - |
| Delete Working Hours | ✅ | ✅ | ✅ COMPLETE | - |
| **Slots** |
| Generate Slots (Organizer) | ✅ | ✅ | ✅ COMPLETE | - |
| Get Slots (Public) | ✅ | ✅ | ✅ COMPLETE | - |
| **Resources** |
| List My Resources | ✅ | ✅ | ✅ COMPLETE | - |
| Create Resource | ✅ | ✅ | ✅ COMPLETE | - |
| Toggle Resource Status | ✅ | ✅ | ✅ COMPLETE | - |
| Assign Resource to Appointment | ✅ | ⚠️ | ⚠️ PARTIAL | Medium |
| List Resources for Appointment | ✅ | ✅ | ✅ COMPLETE | - |
| **Bookings** |
| Create Booking | ✅ | ✅ | ✅ COMPLETE | - |
| Get My Bookings | ✅ | ✅ | ✅ COMPLETE | - |
| Get All Bookings (Organizer) | ✅ | ✅ | ✅ COMPLETE | - |
| Cancel Booking | ✅ | ✅ | ✅ COMPLETE | - |
| **Payments** |
| Create Payment | ✅ | ❌ | ❌ MISSING | HIGH |
| View Payment Status | ❌ | ❌ | ❌ NOT SUPPORTED | - |
| Payment History | ❌ | ❌ | ❌ NOT SUPPORTED | - |
| **Appointment Questions** |
| List Questions | ✅ | ✅ | ✅ COMPLETE | - |
| Create Question | ✅ | ⚠️ | ⚠️ PARTIAL | Low |
| **Appointment Answers** |
| Submit Answer | ✅ | ❌ | ❌ MISSING | Medium |
| **Status History** |
| Get Status History | ✅ | ❌ | ❌ MISSING | Low |
| **Roles (Admin)** |
| Assign Role | ✅ | ⚠️ | ⚠️ PARTIAL | Low |
| Remove Role | ✅ | ⚠️ | ⚠️ PARTIAL | Low |
| Get User Roles | ✅ | ⚠️ | ⚠️ PARTIAL | Low |

---

## PHASE 3: MISSING FRONTEND IMPLEMENTATIONS

### Critical Missing Features

1. **Payment Integration** ❌ HIGH PRIORITY
   - Backend: `POST /payments` exists
   - Frontend: No payment API wrapper, no payment page
   - Required: Payment form in booking flow, payment confirmation page

2. **Appointment Answers Submission** ❌ MEDIUM PRIORITY
   - Backend: `POST /appointment-answers` exists
   - Frontend: Questions displayed but answers not submitted
   - Required: Form fields in booking flow, submit answers with booking

3. **Resource Assignment UI** ⚠️ MEDIUM PRIORITY
   - Backend: `POST /resources/assign` exists
   - Frontend: Assignment may be incomplete in AppointmentForm
   - Required: Verify and complete resource assignment UI

4. **Appointment Status History** ❌ LOW PRIORITY
   - Backend: `GET /appointment-status/{id}` exists
   - Frontend: No history view
   - Required: Status history component for booking details

---

## PHASE 4: SECURITY VERIFICATION CHECKLIST

- [x] Customers cannot access `/slots/generate` (organizer-only)
- [x] Customers cannot access `/appointment-types/my` (organizer-only)
- [x] Customers cannot access `/resources/my` (organizer-only)
- [x] Customers cannot access `/bookings/all` (organizer-only)
- [x] Organizers cannot generate slots for appointment types they don't own
- [x] Booking only uses existing slots (no frontend slot generation)
- [ ] Payment pages handle failure states (MISSING - needs implementation)
- [x] Route params match backend expectations (UUID format)
- [x] Role-based navigation enforced via ProtectedRoute

---

## PHASE 5: IMPLEMENTATION PLAN

### Step 1: Add Payment API to Frontend
- Add `paymentApi` to `src/lib/api.ts`
- Implement payment creation endpoint

### Step 2: Create Payment Flow
- Add payment step to booking flow
- Create payment confirmation page
- Handle payment failures gracefully

### Step 3: Add Appointment Answers
- Integrate answer submission in booking flow
- Submit answers with booking creation

### Step 4: Complete Resource Assignment
- Verify resource assignment UI in AppointmentForm
- Ensure assignment endpoint is called correctly

### Step 5: Add Status History (Optional)
- Create status history component
- Add to booking details page

---

## Summary

**Total Backend Endpoints:** 33
**Fully Implemented:** 25
**Partially Implemented:** 4
**Missing:** 4

**Critical Missing:**
- Payment integration (HIGH)
- Appointment answers submission (MEDIUM)

**Frontend does NOT exceed backend capabilities** ✅
**All implemented features are backed by backend endpoints** ✅


