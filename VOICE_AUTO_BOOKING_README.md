# Voice-Based Auto Appointment Booking Feature

## Overview

This feature enables customers to book appointments automatically using voice commands and geolocation. The system finds the nearest available resource and books the earliest available slot.

## Architecture

### Backend Components

1. **Schema** (`app/schemas/auto_booking.py`)
   - `AutoBookingRequest`: Accepts latitude and longitude
   - `AutoBookingResponse`: Returns booking confirmation details

2. **Service** (`app/services/auto_booking_service.py`)
   - `find_nearest_resource()`: Calculates distance using Haversine formula
   - `find_earliest_available_slot()`: Finds next available slot for resource
   - `create_auto_booking()`: Creates appointment and updates slot capacity

3. **Router** (`app/routers/auto_booking.py`)
   - `POST /auto-book/`: JWT-protected endpoint for auto-booking

### Frontend Components

1. **Component** (`src/components/customer/VoiceAutoBookButton.tsx`)
   - Uses Web Speech API for voice recognition
   - Uses Geolocation API for user location
   - Uses Speech Synthesis for confirmation
   - Integrates with existing booking flow

2. **Integration** (`src/pages/customer/BookAppointment.tsx`)
   - Voice button added to booking page header

## Database Requirements

**IMPORTANT**: The Resource model needs latitude and longitude columns. Add them via migration:

```sql
ALTER TABLE resources ADD COLUMN latitude FLOAT;
ALTER TABLE resources ADD COLUMN longitude FLOAT;
```

Or using Alembic:

```python
def upgrade():
    op.add_column('resources', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('resources', sa.Column('longitude', sa.Float(), nullable=True))

def downgrade():
    op.drop_column('resources', 'longitude')
    op.drop_column('resources', 'latitude')
```

## Setup Instructions

### Backend

1. The router is already registered in `app/main.py`
2. Ensure Resource model has latitude/longitude columns (see above)
3. Populate resource locations:
   ```python
   resource = db.query(Resource).first()
   resource.latitude = 40.7128  # Example: NYC
   resource.longitude = -74.0060
   db.commit()
   ```

### Frontend

1. Component is already integrated in `BookAppointment.tsx`
2. Ensure browser supports:
   - Web Speech API (Chrome, Edge recommended)
   - Geolocation API
   - Speech Synthesis API

## Usage

1. User clicks "🎙 Book by Voice" button
2. Browser requests microphone permission
3. User says: "Book appointment" or "Schedule appointment"
4. System:
   - Gets user's current location
   - Finds nearest resource
   - Finds earliest available slot
   - Creates booking
   - Speaks confirmation
   - Redirects to bookings page

## API Endpoint

```
POST /auto-book/
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}

Response:
{
  "appointment_id": "uuid",
  "resource_name": "Resource Name",
  "start_time": "09:00",
  "end_time": "10:00",
  "message": "Appointment booked successfully..."
}
```

## Error Handling

- No active resources found
- No resources with location data
- Resource not assigned to appointment type
- No available slots
- Slot no longer available (race condition)
- Geolocation denied/unsupported
- Speech recognition not supported

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Limited speech recognition support
- **Safari**: Limited speech recognition support

## Security

- JWT authentication required
- Customer role required
- Slot locking prevents race conditions
- Input validation on coordinates

## Testing

1. **Backend Test**:
   ```python
   # Create test resource with location
   resource = Resource(name="Test Resource", latitude=40.7128, longitude=-74.0060)
   # Create test slot
   # Call create_auto_booking()
   ```

2. **Frontend Test**:
   - Click voice button
   - Grant microphone permission
   - Say "book appointment"
   - Verify booking created

## Notes

- Feature is additive - doesn't modify existing booking flow
- Reuses existing Appointment, Slot, Resource models
- Follows service-router-schema pattern
- No breaking changes to existing code

