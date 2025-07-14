from app import db
from datetime import datetime

class Reimbursement(db.Model):
    __tablename__ = 'reimbursements'
    
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    grade = db.Column(db.String(50), nullable=False)  # 'agent_execution', 'agent_maitrise', etc.
    
    # Détails du remboursement
    days_count = db.Column(db.Integer, nullable=False, default=1)
    dejeuner_amount = db.Column(db.Float, nullable=False, default=0)
    dinner_amount = db.Column(db.Float, nullable=False, default=0)
    hebergement_amount = db.Column(db.Float, nullable=False, default=0)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Statut et notes
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'paid', 'rejected'
    rejection_reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Métadonnées
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    paid_at = db.Column(db.DateTime)
    
    # Relations
    mission = db.relationship('Mission', backref='reimbursements')
    user = db.relationship('User', backref='reimbursements')
    
    def to_dict(self):
        """Convert reimbursement to dictionary."""
        return {
            'id': self.id,
            'mission_id': self.mission_id,
            'user_id': self.user_id,
            'grade': self.grade,
            'days_count': self.days_count,
            'dejeuner_amount': self.dejeuner_amount,
            'dinner_amount': self.dinner_amount,
            'hebergement_amount': self.hebergement_amount,
            'total_amount': self.total_amount,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'mission': self.mission.to_dict() if self.mission else None,
            'user': self.user.to_dict() if self.user else None
        }
    
    def approve(self):
        """Approve the reimbursement."""
        self.status = 'approved'
        self.approved_at = datetime.utcnow()
    
    def reject(self, reason=None):
        """Reject the reimbursement."""
        self.status = 'rejected'
        self.rejection_reason = reason
    
    def mark_as_paid(self):
        """Mark the reimbursement as paid."""
        self.status = 'paid'
        self.paid_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<Reimbursement {self.id} for Mission {self.mission_id}>'
