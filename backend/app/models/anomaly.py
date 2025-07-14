from app import db
from datetime import datetime

class Anomaly(db.Model):
    __tablename__ = 'anomalies'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # 'excessive_fuel', 'personal_use', 'route_deviation', etc.
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'critical'
    detected_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Foreign keys
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Additional fields for specific anomaly types
    fuel_consumed = db.Column(db.Float, nullable=True)
    expected_fuel = db.Column(db.Float, nullable=True)
    location_latitude = db.Column(db.Float, nullable=True)
    location_longitude = db.Column(db.Float, nullable=True)
    
    # Resolution fields
    is_resolved = db.Column(db.Boolean, default=False)
    resolution_notes = db.Column(db.Text, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert anomaly to dictionary."""
        return {
            'id': self.id,
            'type': self.type,
            'description': self.description,
            'severity': self.severity,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'vehicle_id': self.vehicle_id,
            'mission_id': self.mission_id,
            'user_id': self.user_id,
            'fuel_consumed': self.fuel_consumed,
            'expected_fuel': self.expected_fuel,
            'location_latitude': self.location_latitude,
            'location_longitude': self.location_longitude,
            'is_resolved': self.is_resolved,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'anomaly {self.type} for vehicle {self.vehicle_id}'
