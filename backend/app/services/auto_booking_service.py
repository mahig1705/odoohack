from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from datetime import datetime, date, time
from typing import Optional
import math
from uuid import UUID
from fastapi import HTTPException
from app.models.resource import Resource
from app.models.slot import Slot
from app.models.appointment import Appointment
from app.models.appointment_type import AppointmentType
from app.models.appointment_type_resource import AppointmentTypeResource
from app.services.appointment_status_service import log_status_change


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula"""
    R = 6371  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def find_nearest_resource_for_appointment_type(
    db: Session, 
    appointment_type_id, 
    latitude: float, 
    longitude: float
):
    """Find the nearest active resource with location data for a specific appointment type"""
    # Join Resource with AppointmentTypeResource to filter by appointment_type_id
    resources = (
        db.query(Resource)
        .join(
            AppointmentTypeResource,
            Resource.id == AppointmentTypeResource.resource_id
        )
        .filter(
            AppointmentTypeResource.appointment_type_id == appointment_type_id,
            Resource.is_active == True
        )
        .all()
    )
    
    if not resources:
        raise HTTPException(
            status_code=404,
            detail="No resources assigned to this appointment type. Please assign resources first."
        )
    
    # Filter resources that have latitude/longitude and calculate distances
    nearest_resource = None
    min_distance = float('inf')
    valid_resources = []
    resources_without_location = []
    
    for resource in resources:
        # Check if resource has location data
        # Try to access latitude/longitude - they may not exist in the model yet
        resource_lat = getattr(resource, 'latitude', None)
        resource_lon = getattr(resource, 'longitude', None)
        
        # Check if columns exist by trying to access them
        # If AttributeError, columns don't exist in database
        try:
            if resource_lat is None or resource_lon is None:
                resources_without_location.append(resource.name)
                continue
        except AttributeError:
            resources_without_location.append(resource.name)
            continue
        
        valid_resources.append(resource)
        distance = calculate_distance(latitude, longitude, resource_lat, resource_lon)
        
        if distance < min_distance:
            min_distance = distance
            nearest_resource = resource
    
    # Debug logging
    print(f"DEBUG auto-book: appointment_type_id={appointment_type_id}")
    print(f"DEBUG auto-book: total resources found: {len(resources)}")
    print(f"DEBUG auto-book: resources with location data: {len(valid_resources)}")
    print(f"DEBUG auto-book: resources without location: {len(resources_without_location)}")
    
    if resources_without_location:
        print(f"DEBUG auto-book: resources missing location: {', '.join(resources_without_location)}")
    
    for r in valid_resources:
        r_lat = getattr(r, 'latitude', None)
        r_lon = getattr(r, 'longitude', None)
        print(f"  - Resource ID: {r.id}, Name: {r.name}, Lat: {r_lat}, Lng: {r_lon}")
    
    if not nearest_resource:
        if resources_without_location:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Resources are assigned but missing location data. "
                    f"Please add latitude/longitude to resources: {', '.join(resources_without_location[:3])}"
                )
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="No resources available for this appointment type"
            )
    
    return nearest_resource


def find_earliest_available_slot_for_appointment_type(
    db: Session, 
    appointment_type_id
):
    """Find the earliest available slot for an appointment type"""
    today = date.today()
    
    slot = db.query(Slot).filter(
        Slot.appointment_type_id == appointment_type_id,
        Slot.status == "OPEN",
        Slot.booked_capacity < Slot.max_capacity,
        Slot.slot_date >= today
    ).order_by(
        Slot.slot_date.asc(),
        Slot.start_time.asc()
    ).first()
    
    # Debug logging
    print(f"DEBUG auto-book: slot search for appointment_type_id={appointment_type_id}")
    print(f"DEBUG auto-book: searching for slots with status=OPEN, booked_capacity < max_capacity, date >= {today}")
    
    # Count total slots for debugging
    total_slots = db.query(Slot).filter(
        Slot.appointment_type_id == appointment_type_id,
        Slot.slot_date >= today
    ).count()
    print(f"DEBUG auto-book: total slots for this appointment type (future dates): {total_slots}")
    
    if slot:
        print(f"  - Found slot ID: {slot.id}, Date: {slot.slot_date}, Time: {slot.start_time}-{slot.end_time}, Status: {slot.status}, Capacity: {slot.booked_capacity}/{slot.max_capacity}")
    else:
        print(f"  - No available slots found")
        # Additional debug: check why slots aren't available
        all_slots = db.query(Slot).filter(
            Slot.appointment_type_id == appointment_type_id,
            Slot.slot_date >= today
        ).all()
        if all_slots:
            print(f"  - Found {len(all_slots)} slots but none are available:")
            for s in all_slots[:5]:  # Show first 5
                print(f"    Slot {s.id}: status={s.status}, capacity={s.booked_capacity}/{s.max_capacity}, date={s.slot_date}")
    
    if not slot:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No available slots found for this appointment type. "
                f"Please generate slots first or check if all slots are booked."
            )
        )
    
    return slot


def create_auto_booking(db: Session, user_id, appointment_type_id: UUID, latitude: float, longitude: float, preferred_date: Optional[date] = None, preferred_time: Optional[time] = None):
    """Create an automatic booking based on location and appointment type"""
    print(f"DEBUG auto-book: Starting auto booking for user={user_id}, appointment_type={appointment_type_id}, location=({latitude}, {longitude})")
    
    # Validate appointment_type_id exists
    appointment_type = db.query(AppointmentType).filter(AppointmentType.id == appointment_type_id).first()
    if not appointment_type:
        raise HTTPException(
            status_code=404,
            detail=f"Appointment type {appointment_type_id} not found"
        )
    
    print(f"DEBUG auto-book: Appointment type validated: {appointment_type.name}")
    
    # Find nearest resource for this appointment type
    try:
        resource = find_nearest_resource_for_appointment_type(
            db, appointment_type_id, latitude, longitude
        )
        print(f"DEBUG auto-book: Nearest resource found: {resource.name} (ID: {resource.id})")
    except Exception as e:
        print(f"DEBUG auto-book: Resource finding failed: {str(e)}")
        raise
    
    # Find earliest available slot for this appointment type
    try:
        # Collect candidate slots (future, open, capacity available)
        today = date.today()
        candidates = db.query(Slot).filter(
            Slot.appointment_type_id == appointment_type_id,
            Slot.status == "OPEN",
            Slot.booked_capacity < Slot.max_capacity,
            Slot.slot_date >= today
        ).all()

        print(f"DEBUG auto-book: Found {len(candidates)} candidate future slots")

        if not candidates:
            print("DEBUG auto-book: No future candidate slots found")
            raise HTTPException(status_code=404, detail="No slots available")

        chosen_slot = None
        used_fallback = False

        # If preferred_date provided, try to find slots on that date
        if preferred_date:
            date_slots = [s for s in candidates if s.slot_date == preferred_date]
            if date_slots:
                # If preferred_time also provided, pick by nearest time difference
                if preferred_time:
                    def time_diff_minutes(s):
                        dt_slot = datetime.combine(s.slot_date, s.start_time)
                        dt_pref = datetime.combine(preferred_date, preferred_time)
                        return abs((dt_slot - dt_pref).total_seconds() / 60.0)

                    date_slots.sort(key=lambda s: (time_diff_minutes(s), s.slot_date, s.start_time))
                    chosen_slot = date_slots[0]
                else:
                    # pick earliest on that date
                    date_slots.sort(key=lambda s: (s.start_time, s.slot_date))
                    chosen_slot = date_slots[0]
            else:
                # No slots on requested date -> fallback to nearest available
                print("DEBUG auto-book: No slots available on selected date; falling back to nearest available slot")
                used_fallback = True

        # If not chosen yet, and preferred_time provided (but no date or no date match), select nearest by time across candidates
        if not chosen_slot and preferred_time:
            def time_diff_minutes_global(s):
                # prefer same-day closeness but compute absolute diff to preferred_time on slot's date
                dt_slot = datetime.combine(s.slot_date, s.start_time)
                # For comparison, anchor preferred time to slot date
                dt_pref = datetime.combine(s.slot_date, preferred_time)
                return abs((dt_slot - dt_pref).total_seconds() / 60.0)

            candidates.sort(key=lambda s: (time_diff_minutes_global(s), s.slot_date, s.start_time))
            chosen_slot = candidates[0]

        # If still not chosen, pick earliest available
        if not chosen_slot:
            candidates.sort(key=lambda s: (s.slot_date, s.start_time))
            chosen_slot = candidates[0]

        slot = chosen_slot
        print(f"DEBUG auto-book: Chosen slot: {slot.id} on {slot.slot_date} at {slot.start_time}")
        # include used_fallback in debug; we'll construct message later
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG auto-book: Slot finding failed: {str(e)}")
        raise
    
    # Lock the slot for update to prevent race conditions
    locked_slot = db.execute(
        select(Slot)
        .where(Slot.id == slot.id)
        .with_for_update()
    ).scalar_one_or_none()
    
    if not locked_slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    # Double-check availability after lock
    if locked_slot.status != "OPEN":
        raise HTTPException(status_code=400, detail="Slot no longer available")
    
    if locked_slot.booked_capacity >= locked_slot.max_capacity:
        raise HTTPException(status_code=400, detail="Slot is full")
    
    # Update slot capacity
    locked_slot.booked_capacity += 1
    
    if locked_slot.booked_capacity == locked_slot.max_capacity:
        locked_slot.status = "FULL"
    
    # Create appointment
    appointment = Appointment(
        user_id=user_id,
        appointment_type_id=locked_slot.appointment_type_id,
        slot_id=locked_slot.id,
        people_count=1,
        status="BOOKED",
        created_at=datetime.utcnow()
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Log status change
    log_status_change(
        db=db,
        appointment_id=appointment.id,
        old_status="NEW",
        new_status="BOOKED",
        user_id=user_id
    )
    
    return {
        "appointment": appointment,
        "resource": resource,
        "slot": locked_slot
    }

