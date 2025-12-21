# Scheduling & Voice Booking Platform

This repository contains a scheduling platform with voice-enabled auto-booking and payment integration. It comprises a FastAPI backend and a React (Vite + TypeScript) frontend. The project is prepared for local development, testing, and deployment; this README summarizes architecture, setup, environment configuration and pointers to common workflows.

## Demo

Demo: https://drive.google.com/drive/folders/1YuaxCvof7MF1KQ18o6g7YEi2xQUQZbWR

## Project Overview

- Backend: FastAPI, SQLAlchemy, Pydantic — provides REST APIs for users, resources, appointment types, slots, bookings and payments.
- Frontend: React + Vite + TypeScript — user interface for customers and organizers, includes a voice-based auto-booking component and payment checkout integration.
- Payments: Razorpay integration for online payments (server-side order creation and verification, webhook support).

## Key Features

- Voice-based appointment booking with deterministic parsing of spoken date/time.
- Intelligent auto-booking that attempts to honor preferred date/time and falls back to the nearest available slot.
- Full checkout flow with Razorpay: server order creation, client checkout, server-side verification and webhook handling.
- Organizer reporting dashboard with charts and analytics.

## Repository Layout

- `backend/` — FastAPI application and service layer
  - `app/` — main application code (routers, services, models, schemas)
  - `requirements.txt` — Python dependencies
  - `.env` — environment variables (not checked into source control)
- `schedularo-vibes-main/` — frontend React application (Vite + TypeScript)
  - `src/` — source code for the web client

## Prerequisites

- Python 3.10+ for the backend
- Node.js 16+ and npm/yarn for the frontend
- PostgreSQL (or the project's configured database) and connection credentials

## Backend — Local Setup

1. Create and activate a virtual environment:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Configure environment variables

Create a `.env` file in the `backend/` directory (this project expects environment variables to be available at startup). Example variables used by the application include:

- `DATABASE_URL` — SQLAlchemy database URL
- `SECRET_KEY` — application secret
- `RAZORPAY_KEY_ID` — Razorpay key id (for test and production)
- `RAZORPAY_KEY_SECRET` — Razorpay key secret
- `RAZORPAY_WEBHOOK_SECRET` — webhook signing secret (optional but recommended)

Ensure these are set before starting the server. The backend reads environment variables at process start; if you modify `.env`, restart the server.

4. Run the backend (development):

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API documentation will be available at `http://127.0.0.1:8000/docs` when the server is running.

## Frontend — Local Setup

1. Install dependencies and run the dev server:

```bash
cd schedularo-vibes-main
npm install
npm run dev
```

2. Environment configuration

If the frontend requires environment variables (for example, to configure a public payment key), add them using the Vite `.env` mechanism in the `schedularo-vibes-main` directory. For local testing with Razorpay, ensure the backend is running and serving the `/payments/create-order` and `/payments/verify` endpoints.

## Razorpay Integration Notes

- The backend contains a service that creates Razorpay orders and verifies payment signatures. It stores the Razorpay `order_id` in the payment record for verification and webhook correlation.
- To test payments locally, use Razorpay test keys and configure the corresponding values in `backend/.env`.
- Webhook processing requires a reachable endpoint. For local development, tools such as `ngrok` can expose `http://localhost:8000/payments/webhook` to the public internet. Add the public URL to your Razorpay webhook configuration.

## Voice Auto-Booking Notes

- The frontend includes a deterministic parser for extracting preferred date and time from spoken transcripts (regex and keyword-driven). This avoids external AI/LLM services and runs in the browser.
- The backend attempts to honor the supplied preferences and falls back to the nearest available slot if an exact match is not available.

## Testing & Debugging

- Backend: use the OpenAPI docs at `/docs` to exercise endpoints manually.
- Frontend: use the browser dev tools and console logs for tracing issues in the client.
- If Razorpay keys are updated, remember to restart the backend so settings are reloaded.

## Contribution

Contributions are welcome. Please open an issue to discuss substantial changes before submitting pull requests. Keep pull requests focused and include tests or manual verification steps when applicable.

## License

This repository does not include a project license file. Add a `LICENSE` file if you intend to publish or share under a specific license.

## Contact

For questions about deployment or to request assistance, please open an issue in this repository.

---

*README created to provide a concise project overview and setup instructions. Add your demo link in the Demo section above.*
