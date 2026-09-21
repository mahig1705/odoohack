import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Import model modules so SQLAlchemy resolves all foreign-key tables
from app.database import SessionLocal
from app.models.user import User  # noqa: F401
from app.models.resource import Resource

RESOURCE_COORDS = {
    "shaurya": {"latitude": 19.0760, "longitude": 72.8777},
    "Mahi Gandhi": {"latitude": 19.0896, "longitude": 72.8656},
    "room1": {"latitude": 19.0180, "longitude": 72.8423},
    "hhh": {"latitude": 19.1127, "longitude": 72.8825},
    "ddd": {"latitude": 19.1197, "longitude": 72.9054},
    "ffff": {"latitude": 19.0167, "longitude": 72.8561},
}


def main():
    db = SessionLocal()
    try:
        for name, coords in RESOURCE_COORDS.items():
            resource = db.query(Resource).filter(Resource.name == name).first()
            if resource is None:
                print(f"Missing resource: {name}")
                continue

            resource.latitude = coords["latitude"]
            resource.longitude = coords["longitude"]
            print(f"Updated {name}: ({resource.latitude}, {resource.longitude})")

        db.commit()
        print("Resource coordinates updated successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
