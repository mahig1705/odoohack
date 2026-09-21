from sqlalchemy.orm import Session
from app.models.resource import Resource
from app.models.appointment_type_resource import AppointmentTypeResource

def create_resource(db: Session, data, user_id):
    resource = Resource(
        name=data.name,
        capacity=data.capacity,
        latitude=data.latitude,
        longitude=data.longitude,
        created_by=user_id
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def toggle_resource_status(db: Session, resource_id, user_id):
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.created_by == user_id
    ).first()

    if not resource:
        return None

    resource.is_active = not resource.is_active
    db.commit()
    return resource


def assign_resource_to_appointment(db: Session, appointment_type_id, resource_id):
    mapping = AppointmentTypeResource(
        appointment_type_id=appointment_type_id,
        resource_id=resource_id
    )
    db.add(mapping)
    db.commit()
    return mapping


def get_resources_for_appointment(db: Session, appointment_type_id):
    return db.query(Resource).join(
        AppointmentTypeResource,
        Resource.id == AppointmentTypeResource.resource_id
    ).filter(
        AppointmentTypeResource.appointment_type_id == appointment_type_id,
        Resource.is_active == True
    ).all()
