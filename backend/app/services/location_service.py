from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.location import Location
from app.models.vehicle import Vehicle
from app.models.user import User
from app import db
from datetime import datetime, timedelta

class LocationService:
    
    @staticmethod
    @jwt_required()
    def add_location(location_data):
        """Add a new location point."""
        try:
            # Validate vehicle exists
            vehicle = Vehicle.query.get(location_data['vehicle_id'])
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Create location
            location = Location(
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                altitude=location_data.get('altitude'),
                speed=location_data.get('speed'),
                heading=location_data.get('heading'),
                accuracy=location_data.get('accuracy'),
                vehicle_id=location_data['vehicle_id'],
                mission_id=location_data.get('mission_id')
            )
            
            # Update vehicle's current location
            vehicle.update_location(location_data['latitude'], location_data['longitude'])
            
            db.session.add(location)
            db.session.commit()
            
            return {'message': 'Location added successfully', 'location': location.to_dict()}, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_vehicle_locations(vehicle_id, hours=24):
        """Get locations for a specific vehicle within the last X hours (JWT required)."""
        return LocationService._get_vehicle_locations_internal(vehicle_id, hours)
    
    @staticmethod
    def get_vehicle_locations_public(vehicle_id, hours=24):
        """Get locations for a specific vehicle within the last X hours (public access)."""
        return LocationService._get_vehicle_locations_internal(vehicle_id, hours)
    
    @staticmethod
    def _get_vehicle_locations_internal(vehicle_id, hours=24):
        """Internal method to get locations for a specific vehicle."""
        try:
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            # Calculate time threshold
            time_threshold = datetime.utcnow() - timedelta(hours=hours)
            
            locations = Location.query.filter(
                Location.vehicle_id == vehicle_id,
                Location.timestamp >= time_threshold
            ).order_by(Location.timestamp.desc()).all()
            
            return {
                'locations': [location.to_dict() for location in locations],
                'vehicle': vehicle.to_dict()
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_mission_locations(mission_id):
        """Get locations for a specific mission."""
        try:
            locations = Location.query.filter_by(mission_id=mission_id).order_by(Location.timestamp.desc()).all()
            
            return {
                'locations': [location.to_dict() for location in locations]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_all_current_locations():
        """Get current locations for all vehicles (JWT required)."""
        return LocationService._get_all_current_locations_internal()
    
    @staticmethod
    def get_all_current_locations_public():
        """Get current locations for all vehicles (public access)."""
        return LocationService._get_all_current_locations_internal()
    
    @staticmethod
    def _get_all_current_locations_internal():
        """Internal method to get current locations for all vehicles."""
        try:
            # Get the latest location for each vehicle
            vehicles = Vehicle.query.all()
            current_locations = []
            
            for vehicle in vehicles:
                latest_location = Location.query.filter_by(vehicle_id=vehicle.id).order_by(Location.timestamp.desc()).first()
                if latest_location:
                    location_data = latest_location.to_dict()
                    location_data['vehicle'] = vehicle.to_dict()
                    current_locations.append(location_data)
            
            return {'locations': current_locations}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_location_history(vehicle_id, start_date=None, end_date=None):
        """Get location history for a vehicle within a date range."""
        try:
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            query = Location.query.filter_by(vehicle_id=vehicle_id)
            
            if start_date:
                query = query.filter(Location.timestamp >= start_date)
            
            if end_date:
                query = query.filter(Location.timestamp <= end_date)
            
            locations = query.order_by(Location.timestamp.desc()).all()
            
            return {
                'locations': [location.to_dict() for location in locations],
                'vehicle': vehicle.to_dict()
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def delete_old_locations(days=30):
        """Delete location data older than specified days."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin']:
                return {'error': 'Insufficient permissions'}, 403
            
            # Calculate time threshold
            time_threshold = datetime.utcnow() - timedelta(days=days)
            
            # Delete old locations
            deleted_count = Location.query.filter(Location.timestamp < time_threshold).count()
            Location.query.filter(Location.timestamp < time_threshold).delete()
            
            db.session.commit()
            
            return {'message': f'Deleted {deleted_count} old location records'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
