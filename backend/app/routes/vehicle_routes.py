from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.schemas.vehicle_schema import VehicleSchema, VehicleCreateSchema
from app.services.vehicle_service import VehicleService

vehicle_bp = Blueprint('vehicle', __name__)

@vehicle_bp.route('', methods=['POST'])
@jwt_required()
def create_vehicle():
    """Create a new vehicle."""
    try:
        schema = VehicleCreateSchema()
        data = schema.load(request.json)
        
        result, status_code = VehicleService.create_vehicle(data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('', methods=['GET'])
@jwt_required()
def get_vehicles():
    """Get all vehicles."""
    try:
        result, status_code = VehicleService.get_vehicles()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_vehicles():
    """Get available vehicles."""
    try:
        result, status_code = VehicleService.get_available_vehicles()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    """Get a specific vehicle by ID."""
    try:
        result, status_code = VehicleService.get_vehicle(vehicle_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    """Update a vehicle."""
    try:
        schema = VehicleSchema()
        data = schema.load(request.json)
        
        result, status_code = VehicleService.update_vehicle(vehicle_id, data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    """Delete a vehicle."""
    try:
        result, status_code = VehicleService.delete_vehicle(vehicle_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>/driver', methods=['PUT'])
@jwt_required()
def assign_driver(vehicle_id):
    """Assign a driver to a vehicle."""
    try:
        data = request.json
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({'error': 'Driver ID is required'}), 400
        
        result, status_code = VehicleService.assign_driver(vehicle_id, driver_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>/location', methods=['PUT'])
@jwt_required()
def update_vehicle_location(vehicle_id):
    """Update vehicle location."""
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        result, status_code = VehicleService.update_vehicle_location(vehicle_id, latitude, longitude)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/noauth', methods=['GET'])
def get_vehicles_no_auth():
    """Get all vehicles without authentication for development."""
    try:
        from app.models.vehicle import Vehicle
        vehicles = Vehicle.query.all()
        return jsonify({
            'vehicles': [vehicle.to_dict() for vehicle in vehicles]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/noauth', methods=['POST'])
def create_vehicle_no_auth():
    """Create a new vehicle without authentication for development."""
    try:
        from app.models.vehicle import Vehicle
        from app import db
        
        data = request.json
        
        # Check if license plate already exists
        if Vehicle.query.filter_by(license_plate=data['license_plate']).first():
            return jsonify({'error': 'License plate already exists'}), 400
        
        # Create vehicle
        vehicle = Vehicle(
            license_plate=data['license_plate'],
            brand=data['brand'],
            model=data['model'],
            year=data.get('year'),
            color=data.get('color'),
            fuel_type=data.get('fuel_type', 'gasoline')
        )
        
        db.session.add(vehicle)
        db.session.commit()
        
        return jsonify({'message': 'Vehicle created successfully', 'vehicle': vehicle.to_dict()}), 201
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/noauth/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle_no_auth(vehicle_id):
    """Delete a vehicle without authentication for development."""
    try:
        result, status_code = VehicleService.delete_vehicle_no_auth(vehicle_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>/force-delete', methods=['DELETE'])
@jwt_required()
def force_delete_vehicle(vehicle_id):
    """Force delete a vehicle with mission reassignment."""
    try:
        data = request.json or {}
        reassign_to_vehicle_id = data.get('reassign_to_vehicle_id')
        
        result, status_code = VehicleService.delete_vehicle_with_reassignment(
            vehicle_id, reassign_to_vehicle_id
        )
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/noauth/<int:vehicle_id>/force-delete', methods=['DELETE'])
def force_delete_vehicle_no_auth(vehicle_id):
    """Force delete a vehicle with mission reassignment (no auth)."""
    try:
        result, status_code = VehicleService.delete_vehicle_no_auth(vehicle_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/init-db', methods=['POST'])
def init_database():
    """Initialize database with sample data."""
    try:
        from app.models.vehicle import Vehicle
        from app.models.user import User
        from app import db
        
        # Create default user if not exists
        if not User.query.first():
            user = User(
                username='admin',
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                role='admin'
            )
            user.set_password('admin123')
            db.session.add(user)
            db.session.commit()
        
        # No longer creating vehicles automatically for a cleaner start experience
        
        db.session.commit()
        
        return jsonify({'message': 'Database initialized successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/clear-vehicles', methods=['POST'])
@jwt_required()
def clear_vehicles():
    """Remove all vehicles from the system."""
    try:
        from app.models.vehicle import Vehicle
        from app import db

        Vehicle.query.delete()
        db.session.commit()

        return jsonify({'message': 'All vehicles removed successfully'}), 200
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vehicle_bp.route('/noauth/clear-vehicles', methods=['POST'])
def clear_vehicles_no_auth():
    """Remove all vehicles from the system without authentication (for development)."""
    try:
        from app.models.vehicle import Vehicle
        from app import db

        # Delete all vehicles
        Vehicle.query.delete()
        db.session.commit()

        return jsonify({'message': 'All vehicles removed successfully'}), 200
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
