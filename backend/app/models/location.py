from app import db
from datetime import datetime

class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    altitude = db.Column(db.Float)
    speed = db.Column(db.Float)  # Speed in km/h
    heading = db.Column(db.Float)  # Direction in degrees
    accuracy = db.Column(db.Float)  # GPS accuracy in meters
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Foreign keys
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert location to dictionary."""
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'speed': self.speed,
            'heading': self.heading,
            'accuracy': self.accuracy,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'vehicle_id': self.vehicle_id,
            'mission_id': self.mission_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Location {self.latitude}, {self.longitude}>'
