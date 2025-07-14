from flask import Blueprint, request, jsonify
from app.services.anomaly_service import AnomalyService

anomaly_bp = Blueprint('anomaly', __name__)

@anomaly_bp.route('', methods=['GET'])
def get_anomalies():
    """Get anomalies with optional filters."""
    try:
        vehicle_id = request.args.get('vehicle_id', type=int)
        mission_id = request.args.get('mission_id', type=int)
        severity = request.args.get('severity')
        
        result, status_code = AnomalyService.get_anomalies(
            vehicle_id=vehicle_id,
            mission_id=mission_id,
            severity=severity
        )
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/recent', methods=['GET'])
def get_recent_anomalies():
    """Get recent anomalies."""
    try:
        hours = request.args.get('hours', 24, type=int)
        result, status_code = AnomalyService.get_recent_anomalies(hours)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('', methods=['POST'])
def create_anomaly():
    """Create a new anomaly."""
    try:
        from app.models.anomaly import Anomaly
        from app import db
        
        data = request.json
        
        # Valider les données requises
        if not data.get('type') or not data.get('description') or not data.get('vehicle_id'):
            return jsonify({'error': 'Missing required fields: type, description, vehicle_id'}), 400
        
        # Créer l'anomalie
        anomaly = Anomaly(
            type=data['type'],
            description=data['description'],
            severity=data.get('severity', 'medium'),
            vehicle_id=int(data['vehicle_id']),
            mission_id=int(data['mission_id']) if data.get('mission_id') else None,
            user_id=int(data['user_id']) if data.get('user_id') else None,
            fuel_consumed=float(data['fuel_consumed']) if data.get('fuel_consumed') else None,
            expected_fuel=float(data['expected_fuel']) if data.get('expected_fuel') else None,
            location_latitude=float(data['location_latitude']) if data.get('location_latitude') else None,
            location_longitude=float(data['location_longitude']) if data.get('location_longitude') else None,
            is_resolved=False
        )
        
        db.session.add(anomaly)
        db.session.commit()
        
        return jsonify({
            'message': 'Anomaly created successfully',
            'data': anomaly.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/<int:anomaly_id>', methods=['DELETE'])
def delete_anomaly(anomaly_id):
    """Delete an anomaly."""
    try:
        from app.models.anomaly import Anomaly
        from app import db
        
        anomaly = Anomaly.query.get(anomaly_id)
        if not anomaly:
            return jsonify({'error': 'Anomaly not found'}), 404
        
        db.session.delete(anomaly)
        db.session.commit()
        
        return jsonify({'message': 'Anomaly deleted successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/<int:anomaly_id>/resolve', methods=['PATCH'])
def resolve_anomaly(anomaly_id):
    """Mark an anomaly as resolved."""
    try:
        from app.models.anomaly import Anomaly
        from app import db
        
        anomaly = Anomaly.query.get(anomaly_id)
        if not anomaly:
            return jsonify({'error': 'Anomaly not found'}), 404
        
        data = request.json or {}
        anomaly.is_resolved = True
        anomaly.resolution_notes = data.get('notes', '')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Anomaly resolved successfully',
            'data': anomaly.to_dict()
        }), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/detect', methods=['POST'])
def run_anomaly_detection():
    """Run anomaly detection for all active missions."""
    try:
        result, status_code = AnomalyService.run_anomaly_detection()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/noauth', methods=['GET'])
def get_anomalies_no_auth():
    """Get anomalies without authentication for development."""
    try:
        from app.models.anomaly import Anomaly
        anomalies = Anomaly.query.all()
        return jsonify({
            'data': [anomaly.to_dict() for anomaly in anomalies]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/noauth', methods=['POST'])
def create_anomaly_no_auth():
    """Create a new anomaly without authentication for development."""
    try:
        from app.models.anomaly import Anomaly
        from app import db
        
        data = request.json
        
        # Valider les données requises
        if not data.get('type') or not data.get('description') or not data.get('vehicle_id'):
            return jsonify({'error': 'Missing required fields: type, description, vehicle_id'}), 400
        
        # Créer l'anomalie
        anomaly = Anomaly(
            type=data['type'],
            description=data['description'],
            severity=data.get('severity', 'medium'),
            vehicle_id=int(data['vehicle_id']),
            mission_id=int(data['mission_id']) if data.get('mission_id') else None,
            user_id=int(data['user_id']) if data.get('user_id') else None,
            fuel_consumed=float(data['fuel_consumed']) if data.get('fuel_consumed') else None,
            expected_fuel=float(data['expected_fuel']) if data.get('expected_fuel') else None,
            location_latitude=float(data['location_latitude']) if data.get('location_latitude') else None,
            location_longitude=float(data['location_longitude']) if data.get('location_longitude') else None,
            is_resolved=False
        )
        
        db.session.add(anomaly)
        db.session.commit()
        
        return jsonify({
            'message': 'Anomaly created successfully',
            'data': anomaly.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
