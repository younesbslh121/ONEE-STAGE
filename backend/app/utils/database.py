from app import db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.mission import Mission
from app.models.location import Location
from app.models.anomaly import Anomaly

def init_db(app):
    """Initialize database with app context."""
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default admin user if not exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                username='admin',
                email='admin@fleetmanagement.com',
                first_name='Admin',
                last_name='User',
                role='admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created: admin / admin123")
        
        # Create sample vehicles if none exist
        if Vehicle.query.count() == 0:
            sample_vehicles = [
                Vehicle(
                    license_plate='ABC-123',
                    brand='Toyota',
                    model='Camry',
                    year=2022,
                    color='White',
                    fuel_type='gasoline'
                ),
                Vehicle(
                    license_plate='XYZ-789',
                    brand='Ford',
                    model='Transit',
                    year=2021,
                    color='Blue',
                    fuel_type='diesel'
                ),
                Vehicle(
                    license_plate='DEF-456',
                    brand='Tesla',
                    model='Model 3',
                    year=2023,
                    color='Black',
                    fuel_type='electric'
                )
            ]
            
            for vehicle in sample_vehicles:
                db.session.add(vehicle)
            
            db.session.commit()
            print("Sample vehicles created")
        
        print("Database initialized successfully")
