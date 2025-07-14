from app import db
from datetime import datetime

class Mission(db.Model):
    __tablename__ = 'missions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'in_progress', 'completed', 'cancelled'
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'urgent'
    
    # Location details
    start_latitude = db.Column(db.Float, nullable=False)
    start_longitude = db.Column(db.Float, nullable=False)
    start_address = db.Column(db.String(500))
    end_latitude = db.Column(db.Float, nullable=False)
    end_longitude = db.Column(db.Float, nullable=False)
    end_address = db.Column(db.String(500))
    
    # Time details
    scheduled_start = db.Column(db.DateTime, nullable=False)
    scheduled_end = db.Column(db.DateTime, nullable=False)
    actual_start = db.Column(db.DateTime)
    actual_end = db.Column(db.DateTime)
    
    # Foreign keys
    assigned_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    locations = db.relationship('Location', backref='mission', lazy=True)
    anomalies = db.relationship('Anomaly', backref='mission', lazy=True)
    
    def to_dict(self):
        """Convert mission to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'start_latitude': self.start_latitude,
            'start_longitude': self.start_longitude,
            'start_address': self.start_address,
            'end_latitude': self.end_latitude,
            'end_longitude': self.end_longitude,
            'end_address': self.end_address,
            'scheduled_start': self.scheduled_start.isoformat() if self.scheduled_start else None,
            'scheduled_end': self.scheduled_end.isoformat() if self.scheduled_end else None,
            'actual_start': self.actual_start.isoformat() if self.actual_start else None,
            'actual_end': self.actual_end.isoformat() if self.actual_end else None,
            'assigned_user_id': self.assigned_user_id,
            'vehicle_id': self.vehicle_id,
            'created_by': self.created_by,
            'assigned_user': self.assigned_user.to_dict() if self.assigned_user else None,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def start_mission(self):
        """Start the mission."""
        self.status = 'in_progress'
        self.actual_start = datetime.utcnow()
        
    def complete_mission(self):
        """Complete the mission."""
        self.status = 'completed'
        self.actual_end = datetime.utcnow()
        
    def cancel_mission(self):
        """Cancel the mission."""
        self.status = 'cancelled'
        
    def __repr__(self):
        return f'<Mission {self.title}>'
