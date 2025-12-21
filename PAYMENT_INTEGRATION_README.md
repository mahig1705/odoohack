# Razorpay Integration (Schedularo)

This document describes how to enable Razorpay payments for the Schedularo project (backend + frontend).

Important: This integration is deterministic and does not change database schema. It adds server-side Razorpay order creation and client-side checkout with server-side signature verification. Manual/offline payments remain supported via the existing `/payments` endpoint.

## What was added
- Backend:
  - `razorpay` dependency in `backend/requirements.txt`
  - Config keys in `app/core/config.py`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (optional)
  - New service: `app/services/razorpay_service.py` for order creation and signature verification
  - Updated payment service `app/services/payment_service.py` to create a PENDING `Payment` record for online payments and call Razorpay to create an order
  - New endpoints in `app/routers/payment.py`:
    - `POST /payments/` (legacy behavior preserved)
    - `POST /payments/create-order` → create payment (PENDING) and Razorpay order (returns `payment_id`, `order_id`, `amount`, `currency`, `key_id`)
    - `POST /payments/verify` → verify razorpay signature and mark payment SUCCESS and appointment CONFIRMED

- Frontend:
  - API helpers added to `src/lib/api.ts`: `paymentApi.createOrder` and `paymentApi.verify`
  - Booking flow (`src/pages/customer/BookAppointment.tsx`) now uses Razorpay checkout:
    1. Calls `/payments/create-order` to get `order_id` and our `payment_id`
    2. Loads Razorpay script and opens checkout
    3. On success, calls `/payments/verify` to confirm and finalize booking

## Environment variables
Add the following to the backend `.env` (or your deployment environment):

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_optional
```

Also keep other variables like `DATABASE_URL`, `SECRET_KEY`, etc.

## Backend setup (Windows / dev)
From `backend/` folder:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Run the app:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend setup
From `schedularo-vibes-main/`:

```bash
npm install
npm run dev
```

## Webhook (optional but recommended)
You can configure a Razorpay webhook to notify your server on payment events. If you want to use webhooks, set `RAZORPAY_WEBHOOK_SECRET` in env and add a webhook endpoint that verifies the signature using that secret. A simple webhook endpoint can match `razorpay_payment_id` events and update the local `payments` table.

This repo includes a Supabase function example in `schedularo-vibes-main/supabase/functions/razorpay` showing how to create orders and verify payments in a serverless environment. The backend implementation performs the same work but inside FastAPI.

## Testing payments locally
1. Use Razorpay test credentials (key_id and key_secret).
2. Go through booking flow in frontend and on payment step enter test card details in Razorpay checkout (see Razorpay docs for test cards).
3. After successful payment, backend will verify signature and mark the payment `SUCCESS` and appointment `CONFIRMED`.

## Notes & Safety
- No schema changes were performed; we reused existing `payments` model.
- Manual/offline payments continue to work via the original `/payments` POST endpoint.
- All signature verification is performed server-side with Razorpay SDK; do NOT trust client-side callbacks alone.

If you want, I can add a `/payments/webhook` endpoint that verifies `razorpay_signature` for webhook payloads and updates payments accordingly. Would you like that added now?
