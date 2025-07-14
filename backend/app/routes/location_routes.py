from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from app.schemas.location_schema import LocationSchema, LocationCreateSchema
from app.services.location_service import LocationService

location_bp = Blueprint('location', __name__)

@location_bp.route('', methods=['POST'])
def add_location():
    """Add a new location point."""
    try:
        schema = LocationCreateSchema()
        data = schema.load(request.json)
        
        result, status_code = LocationService.add_location(data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/current', methods=['GET'])
def get_all_current_locations():
    """Get current locations for all vehicles."""
    try:
        result, status_code = LocationService.get_all_current_locations()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/vehicle/<int:vehicle_id>', methods=['GET'])
def get_vehicle_locations(vehicle_id):
    """Get locations for a specific vehicle."""
    try:
        hours = request.args.get('hours', 24, type=int)
        result, status_code = LocationService.get_vehicle_locations(vehicle_id, hours)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/mission/<int:mission_id>', methods=['GET'])
def get_mission_locations(mission_id):
    """Get locations for a specific mission."""
    try:
        result, status_code = LocationService.get_mission_locations(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/vehicle/<int:vehicle_id>/history', methods=['GET'])
def get_location_history(vehicle_id):
    """Get location history for a vehicle."""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        result, status_code = LocationService.get_location_history(
            vehicle_id, start_date, end_date
        )
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/cleanup', methods=['DELETE'])
def delete_old_locations():
    """Delete old location data."""
    try:
        days = request.args.get('days', 30, type=int)
        result, status_code = LocationService.delete_old_locations(days)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
