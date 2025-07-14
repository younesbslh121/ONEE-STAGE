from app import db
from datetime import datetime

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    license_plate = db.Column(db.String(20), unique=True, nullable=False)
    brand = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer)
    color = db.Column(db.String(30))
    fuel_type = db.Column(db.String(20))  # 'gasoline', 'diesel', 'electric', 'hybrid'
    status = db.Column(db.String(20), default='available')  # 'available', 'in_use', 'maintenance', 'out_of_service'
    current_latitude = db.Column(db.Float)
    current_longitude = db.Column(db.Float)
    last_location_update = db.Column(db.DateTime)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    missions = db.relationship('Mission', backref='vehicle', lazy=True)
    locations = db.relationship('Location', backref='vehicle', lazy=True)
    anomalies = db.relationship('Anomaly', backref='vehicle', lazy=True)
    
    def to_dict(self):
        """Convert vehicle to dictionary."""
        return {
            'id': self.id,
            'license_plate': self.license_plate,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'color': self.color,
            'fuel_type': self.fuel_type,
            'status': self.status,
            'current_latitude': self.current_latitude,
            'current_longitude': self.current_longitude,
            'last_location_update': self.last_location_update.isoformat() if self.last_location_update else None,
            'driver_id': self.driver_id,
            'driver': self.driver.to_dict() if self.driver else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_location(self, latitude, longitude):
        """Update vehicle location."""
        self.current_latitude = latitude
        self.current_longitude = longitude
        self.last_location_update = datetime.utcnow()
        
    def __repr__(self):
        return f'<Vehicle {self.license_plate}>'
