from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.vehicle import Vehicle
from app.models.user import User
from app import db
from datetime import datetime

class VehicleService:
    
    @staticmethod
    def create_vehicle(vehicle_data):
        """Create a new vehicle."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            # Check if license plate already exists
            if Vehicle.query.filter_by(license_plate=vehicle_data['license_plate']).first():
                return {'error': 'License plate already exists'}, 400
            
            # Create vehicle
            vehicle = Vehicle(
                license_plate=vehicle_data['license_plate'],
                brand=vehicle_data['brand'],
                model=vehicle_data['model'],
                year=vehicle_data.get('year'),
                color=vehicle_data.get('color'),
                fuel_type=vehicle_data.get('fuel_type')
            )
            
            db.session.add(vehicle)
            db.session.commit()
            
            return {'message': 'Vehicle created successfully', 'vehicle': vehicle.to_dict()}, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def get_vehicles():
        """Get all vehicles."""
        try:
            vehicles = Vehicle.query.all()
            return {
                'vehicles': [vehicle.to_dict() for vehicle in vehicles]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def get_vehicle(vehicle_id):
        """Get a specific vehicle."""
        try:
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            return {'vehicle': vehicle.to_dict()}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def update_vehicle(vehicle_id, vehicle_data):
        """Update a vehicle."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Update fields
            updatable_fields = ['brand', 'model', 'year', 'color', 'fuel_type', 'status']
            
            for field in updatable_fields:
                if field in vehicle_data:
                    setattr(vehicle, field, vehicle_data[field])
            
            db.session.commit()
            
            return {'message': 'Vehicle updated successfully', 'vehicle': vehicle.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def assign_driver(vehicle_id, driver_id):
        """Assign a driver to a vehicle."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            driver = User.query.get(driver_id)
            if not driver:
                return {'error': 'Driver not found'}, 404
            
            vehicle.driver_id = driver_id
            db.session.commit()
            
            return {'message': 'Driver assigned successfully', 'vehicle': vehicle.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def update_vehicle_location(vehicle_id, latitude, longitude):
        """Update vehicle location."""
        try:
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            vehicle.update_location(latitude, longitude)
            db.session.commit()
            
            return {'message': 'Location updated successfully', 'vehicle': vehicle.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def get_available_vehicles():
        """Get all available vehicles."""
        try:
            vehicles = Vehicle.query.filter_by(status='available').all()
            return {
                'vehicles': [vehicle.to_dict() for vehicle in vehicles]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    def delete_vehicle(vehicle_id):
        """Delete a vehicle."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin']:
                return {'error': 'Insufficient permissions'}, 403
            
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Check if vehicle has active missions
            from app.models.mission import Mission
            active_missions = Mission.query.filter(
                Mission.vehicle_id == vehicle_id,
                Mission.status.in_(['pending', 'in_progress'])
            ).all()
            
            if active_missions:
                mission_titles = [mission.title for mission in active_missions]
                return {
                    'error': f'Impossible de supprimer ce véhicule. Il est assigné à {len(active_missions)} mission(s): {", ".join(mission_titles)}. Veuillez d\'abord supprimer ces missions ou les réassigner à un autre véhicule.'
                }, 400
            
            # Check if vehicle is in use
            if vehicle.status == 'in_use':
                return {'error': 'Cannot delete vehicle in use'}, 400
            
            db.session.delete(vehicle)
            db.session.commit()
            
            return {'message': 'Vehicle deleted successfully'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def delete_vehicle_with_reassignment(vehicle_id, reassign_to_vehicle_id=None):
        """Delete a vehicle and reassign its missions."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin']:
                return {'error': 'Insufficient permissions'}, 403
            
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Get active missions
            from app.models.mission import Mission
            active_missions = Mission.query.filter(
                Mission.vehicle_id == vehicle_id,
                Mission.status.in_(['pending', 'in_progress'])
            ).all()
            
            if active_missions:
                if reassign_to_vehicle_id:
                    # Reassign to specific vehicle
                    reassign_vehicle = Vehicle.query.get(reassign_to_vehicle_id)
                    if not reassign_vehicle:
                        return {'error': 'Target vehicle for reassignment not found'}, 404
                    
                    for mission in active_missions:
                        mission.vehicle_id = reassign_to_vehicle_id
                else:
                    # Find first available vehicle
                    available_vehicle = Vehicle.query.filter(
                        Vehicle.status == 'available',
                        Vehicle.id != vehicle_id
                    ).first()
                    
                    if not available_vehicle:
                        return {
                            'error': 'Aucun véhicule disponible pour la réassignation. Veuillez spécifier un véhicule ou supprimer les missions manuellement.'
                        }, 400
                    
                    for mission in active_missions:
                        mission.vehicle_id = available_vehicle.id
            
            # Delete the vehicle
            db.session.delete(vehicle)
            db.session.commit()
            
            return {
                'message': f'Vehicle deleted successfully. {len(active_missions)} missions reassigned.',
                'reassigned_missions': len(active_missions)
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def delete_vehicle_no_auth(vehicle_id):
        """Delete a vehicle without authentication (for development)."""
        try:
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Get active missions
            from app.models.mission import Mission
            active_missions = Mission.query.filter(
                Mission.vehicle_id == vehicle_id,
                Mission.status.in_(['pending', 'in_progress'])
            ).all()
            
            if active_missions:
                # Find first available vehicle for reassignment
                available_vehicle = Vehicle.query.filter(
                    Vehicle.status.in_(['available', 'maintenance']),
                    Vehicle.id != vehicle_id
                ).first()
                
                if available_vehicle:
                    # Reassign missions to available vehicle
                    for mission in active_missions:
                        mission.vehicle_id = available_vehicle.id
                        # Ensure vehicle_id is not None
                        if mission.vehicle_id is None:
                            mission.vehicle_id = available_vehicle.id
                    message = f'Vehicle deleted. {len(active_missions)} missions reassigned to {available_vehicle.license_plate}.'
                else:
                    # Cancel missions if no vehicle available (don't set vehicle_id to None)
                    for mission in active_missions:
                        mission.status = 'cancelled'
                        # Keep the original vehicle_id or assign to first available vehicle
                        fallback_vehicle = Vehicle.query.filter(Vehicle.id != vehicle_id).first()
                        if fallback_vehicle:
                            mission.vehicle_id = fallback_vehicle.id
                    message = f'Vehicle deleted. {len(active_missions)} missions cancelled (no available vehicle for reassignment).'
            else:
                message = 'Vehicle deleted successfully.'
            
            # Delete the vehicle
            db.session.delete(vehicle)
            db.session.commit()
            
            return {'message': message}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
