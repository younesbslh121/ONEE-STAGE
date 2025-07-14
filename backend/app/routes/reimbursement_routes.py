from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.reimbursement import Reimbursement
from app.models.mission import Mission
from app.models.user import User
from app import db
from datetime import datetime

reimbursement_bp = Blueprint('reimbursement', __name__)

# Tarifs de remboursement par grade (en MAD)
REIMBURSEMENT_RATES = {
    'agent_execution': {'dejeuner': 50, 'dinner': 80, 'hebergement': 200},
    'agent_maitrise': {'dejeuner': 70, 'dinner': 110, 'hebergement': 300},
    'agent_commandement': {'dejeuner': 90, 'dinner': 140, 'hebergement': 400},
    'haut_cadre': {'dejeuner': 120, 'dinner': 180, 'hebergement': 600}
}

@reimbursement_bp.route('', methods=['GET'])
def get_reimbursements():
    """Get all reimbursements."""
    try:
        reimbursements = Reimbursement.query.all()
        return jsonify({
            'message': 'Reimbursements retrieved successfully',
            'data': [r.to_dict() for r in reimbursements]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('', methods=['POST'])
def create_reimbursement():
    """Create a new reimbursement."""
    try:
        data = request.json
        
        # Valider les données requises
        if not data.get('mission_id') or not data.get('user_id') or not data.get('grade'):
            return jsonify({'error': 'Missing required fields: mission_id, user_id, grade'}), 400
        
        # Vérifier que la mission et l'utilisateur existent
        mission = Mission.query.get(data['mission_id'])
        user = User.query.get(data['user_id'])
        
        if not mission:
            return jsonify({'error': 'Mission not found'}), 404
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Calculer les montants basés sur le grade
        grade = data['grade']
        if grade not in REIMBURSEMENT_RATES:
            return jsonify({'error': f'Invalid grade: {grade}'}), 400
        
        rates = REIMBURSEMENT_RATES[grade]
        days_count = data.get('days_count', 1)
        
        dejeuner_amount = rates['dejeuner'] * days_count
        dinner_amount = rates['dinner'] * days_count
        hebergement_amount = rates['hebergement'] * max(0, days_count - 1)  # Pas d'hébergement pour 1 jour
        total_amount = dejeuner_amount + dinner_amount + hebergement_amount
        
        reimbursement = Reimbursement(
            mission_id=data['mission_id'],
            user_id=data['user_id'],
            grade=grade,
            days_count=days_count,
            dejeuner_amount=dejeuner_amount,
            dinner_amount=dinner_amount,
            hebergement_amount=hebergement_amount,
            total_amount=total_amount,
            status='pending'
        )
        
        db.session.add(reimbursement)
        db.session.commit()
        
        return jsonify({
            'message': 'Reimbursement created successfully',
            'data': reimbursement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('/<int:reimbursement_id>', methods=['DELETE'])
def delete_reimbursement(reimbursement_id):
    """Delete a reimbursement by ID."""
    try:
        reimbursement = Reimbursement.query.get(reimbursement_id)
        if not reimbursement:
            return jsonify({'error': 'Reimbursement not found'}), 404

        db.session.delete(reimbursement)
        db.session.commit()
        return jsonify({'message': 'Reimbursement deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('/<int:reimbursement_id>/approve', methods=['PATCH'])
def approve_reimbursement(reimbursement_id):
    """Approve a reimbursement."""
    try:
        reimbursement = Reimbursement.query.get(reimbursement_id)
        if not reimbursement:
            return jsonify({'error': 'Reimbursement not found'}), 404
        
        reimbursement.approve()
        db.session.commit()
        
        return jsonify({
            'message': 'Reimbursement approved successfully',
            'data': reimbursement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('/<int:reimbursement_id>/reject', methods=['PATCH'])
def reject_reimbursement(reimbursement_id):
    """Reject a reimbursement."""
    try:
        reimbursement = Reimbursement.query.get(reimbursement_id)
        if not reimbursement:
            return jsonify({'error': 'Reimbursement not found'}), 404
        
        data = request.json or {}
        reason = data.get('reason', 'No reason provided')
        
        reimbursement.reject(reason)
        db.session.commit()
        
        return jsonify({
            'message': 'Reimbursement rejected successfully',
            'data': reimbursement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('/<int:reimbursement_id>/paid', methods=['PATCH'])
def mark_as_paid(reimbursement_id):
    """Mark a reimbursement as paid."""
    try:
        reimbursement = Reimbursement.query.get(reimbursement_id)
        if not reimbursement:
            return jsonify({'error': 'Reimbursement not found'}), 404
        
        reimbursement.mark_as_paid()
        db.session.commit()
        
        return jsonify({
            'message': 'Reimbursement marked as paid successfully',
            'data': reimbursement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reimbursement_bp.route('/stats', methods=['GET'])
def get_reimbursement_stats():
    """Get reimbursement statistics."""
    try:
        reimbursements = Reimbursement.query.all()
        
        stats = {
            'total': len(reimbursements),
            'pending': len([r for r in reimbursements if r.status == 'pending']),
            'approved': len([r for r in reimbursements if r.status == 'approved']),
            'paid': len([r for r in reimbursements if r.status == 'paid']),
            'rejected': len([r for r in reimbursements if r.status == 'rejected']),
            'total_amount': sum(r.total_amount for r in reimbursements),
            'pending_amount': sum(r.total_amount for r in reimbursements if r.status == 'pending')
        }
        
        return jsonify({
            'message': 'Statistics retrieved successfully',
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
