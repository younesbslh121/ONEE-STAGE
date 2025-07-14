from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.schemas.mission_schema import MissionSchema, MissionCreateSchema
from app.services.mission_service import MissionService
from app.services.map_service import MapService

mission_bp = Blueprint('mission', __name__)

@mission_bp.route('', methods=['POST'])
@jwt_required()
def create_mission():
    """Create a new mission."""
    try:
        schema = MissionCreateSchema()
        data = schema.load(request.json)
        
        result, status_code = MissionService.create_mission(data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('', methods=['GET'])
@jwt_required()
def get_missions():
    """Get all missions."""
    try:
        result, status_code = MissionService.get_missions()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>', methods=['GET'])
@jwt_required()
def get_mission(mission_id):
    """Get a specific mission by ID."""
    try:
        result, status_code = MissionService.get_mission(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>/map', methods=['GET'])
@jwt_required()
def get_mission_map(mission_id):
    """Get map for a specific mission."""
    try:
        # Use the MapService to display mission map
        result, status_code = MapService.get_mission_map(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>', methods=['PUT'])
@jwt_required()
def update_mission(mission_id):
    """Update a mission."""
    try:
        schema = MissionSchema()
        data = schema.load(request.json)
        
        result, status_code = MissionService.update_mission(mission_id, data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>/start', methods=['PUT'])
@jwt_required()
def start_mission(mission_id):
    """Start a mission."""
    try:
        result, status_code = MissionService.start_mission(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>/complete', methods=['PUT'])
@jwt_required()
def complete_mission(mission_id):
    """Complete a mission."""
    try:
        result, status_code = MissionService.complete_mission(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_mission(mission_id):
    """Cancel a mission."""
    try:
        result, status_code = MissionService.cancel_mission(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/<int:mission_id>', methods=['DELETE'])
@jwt_required()
def delete_mission(mission_id):
    """Delete a mission."""
    try:
        result, status_code = MissionService.delete_mission(mission_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/noauth', methods=['GET'])
def get_missions_no_auth():
    """Get all missions without authentication for development."""
    try:
        from app.models.mission import Mission
        missions = Mission.query.all()
        return jsonify({
            'missions': [mission.to_dict() for mission in missions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/noauth', methods=['POST'])
def create_mission_no_auth():
    """Create a new mission without authentication for development."""
    try:
        from app.models.mission import Mission
        from app import db
        from datetime import datetime
        
        data = request.json
        
        # Nous avons besoin d'un utilisateur pour assigned_user_id et created_by
        # Créons un utilisateur par défaut s'il n'existe pas
        from app.models.user import User
        default_user = User.query.first()
        if not default_user:
            default_user = User(
                username='default_user',
                email='default@example.com',
                first_name='Default',
                last_name='User',
                role='admin'
            )
            default_user.set_password('password')
            db.session.add(default_user)
            db.session.commit()
        
        # Parse scheduled times if provided
        scheduled_start = None
        scheduled_end = None
        if data.get('scheduled_start'):
            try:
                scheduled_start = datetime.fromisoformat(data['scheduled_start'].replace('Z', '+00:00'))
            except:
                scheduled_start = datetime.now()
        else:
            scheduled_start = datetime.now()
            
        if data.get('scheduled_end'):
            try:
                scheduled_end = datetime.fromisoformat(data['scheduled_end'].replace('Z', '+00:00'))
            except:
                from datetime import timedelta
                scheduled_end = scheduled_start + timedelta(hours=2)
        else:
            from datetime import timedelta
            scheduled_end = scheduled_start + timedelta(hours=2)
        
        # Create mission
        mission = Mission(
            title=data['title'],
            description=data.get('description', ''),
            start_latitude=float(data.get('start_latitude', 48.8566)),
            start_longitude=float(data.get('start_longitude', 2.3522)),
            start_address=data.get('start_address', ''),
            end_latitude=float(data.get('end_latitude', 48.8566)),
            end_longitude=float(data.get('end_longitude', 2.3522)),
            end_address=data.get('end_address', ''),
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            assigned_user_id=default_user.id,
            vehicle_id=data.get('vehicle_id', 1),
            created_by=default_user.id
        )
        
        db.session.add(mission)
        db.session.commit()
        
        return jsonify({'message': 'Mission created successfully', 'mission': mission.to_dict()}), 201
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/noauth/<int:mission_id>', methods=['DELETE'])
def delete_mission_no_auth(mission_id):
    """Delete a mission without authentication for development."""
    try:
        from app.models.mission import Mission
        from app import db
        
        mission = Mission.query.get(mission_id)
        if not mission:
            return jsonify({'error': 'Mission not found'}), 404
        
        db.session.delete(mission)
        db.session.commit()
        
        return jsonify({'message': 'Mission deleted successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mission_bp.route('/noauth/<int:mission_id>/map', methods=['GET'])
def get_mission_map_no_auth(mission_id):
    """Get map for a specific mission without authentication for development."""
    try:
        from app.models.mission import Mission
        from app.models.user import User
        from app.models.vehicle import Vehicle
        from app.models.location import Location
        from datetime import datetime, timedelta
        
        mission = Mission.query.get(mission_id)
        if not mission:
            return jsonify({'error': 'Mission not found'}), 404
        
        # Get mission details
        assigned_user = User.query.get(mission.assigned_user_id)
        vehicle = Vehicle.query.get(mission.vehicle_id)
        
        # Get current location of the vehicle
        current_location = Location.query.filter_by(
            vehicle_id=mission.vehicle_id
        ).order_by(Location.timestamp.desc()).first()
        
        # Get recent locations for the vehicle (last 6 hours)
        recent_locations = Location.query.filter(
            Location.vehicle_id == mission.vehicle_id,
            Location.timestamp >= datetime.utcnow() - timedelta(hours=6)
        ).order_by(Location.timestamp.asc()).all()
        
        # Get other active missions for context
        other_missions = Mission.query.filter(
            Mission.status == 'in_progress',
            Mission.id != mission_id
        ).all()
        
        # Build map data
        map_data = {
            'mission': {
                'id': mission.id,
                'title': mission.title,
                'description': mission.description,
                'status': mission.status,
                'priority': mission.priority,
                'start_location': {
                    'latitude': mission.start_latitude,
                    'longitude': mission.start_longitude,
                    'address': mission.start_address
                },
                'end_location': {
                    'latitude': mission.end_latitude,
                    'longitude': mission.end_longitude,
                    'address': mission.end_address
                },
                'assigned_user': {
                    'id': assigned_user.id,
                    'name': f"{assigned_user.first_name} {assigned_user.last_name}",
                    'email': assigned_user.email,
                    'role': assigned_user.role
                } if assigned_user else None,
                'vehicle': {
                    'id': vehicle.id,
                    'license_plate': vehicle.license_plate,
                    'brand': vehicle.brand,
                    'model': vehicle.model,
                    'status': vehicle.status
                } if vehicle else None
            },
            'current_location': {
                'latitude': current_location.latitude,
                'longitude': current_location.longitude,
                'timestamp': current_location.timestamp.isoformat(),
                'speed': current_location.speed,
                'heading': current_location.heading
            } if current_location else None,
            'route': [
                {
                    'latitude': loc.latitude,
                    'longitude': loc.longitude,
                    'timestamp': loc.timestamp.isoformat(),
                    'speed': loc.speed,
                    'heading': loc.heading
                } for loc in recent_locations
            ],
            'other_collaborators': []
        }
        
        # Get other collaborators (other active missions)
        for other_mission in other_missions:
            other_user = User.query.get(other_mission.assigned_user_id)
            other_vehicle = Vehicle.query.get(other_mission.vehicle_id)
            other_location = Location.query.filter_by(
                vehicle_id=other_mission.vehicle_id
            ).order_by(Location.timestamp.desc()).first()
            
            if other_user and other_vehicle and other_location:
                map_data['other_collaborators'].append({
                    'mission_id': other_mission.id,
                    'mission_title': other_mission.title,
                    'collaborator': {
                        'id': other_user.id,
                        'name': f"{other_user.first_name} {other_user.last_name}",
                        'role': other_user.role
                    },
                    'vehicle': {
                        'id': other_vehicle.id,
                        'license_plate': other_vehicle.license_plate
                    },
                    'location': {
                        'latitude': other_location.latitude,
                        'longitude': other_location.longitude,
                        'timestamp': other_location.timestamp.isoformat(),
                        'speed': other_location.speed
                    }
                })
        
        # Set map center based on current location or mission start
        if current_location:
            map_data['center'] = {
                'latitude': current_location.latitude,
                'longitude': current_location.longitude
            }
        else:
            map_data['center'] = {
                'latitude': mission.start_latitude,
                'longitude': mission.start_longitude
            }
        
        map_data['zoom'] = 13
        
        return jsonify(map_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

