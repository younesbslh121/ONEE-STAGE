from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.mission import Mission
from app.models.user import User
from app.models.vehicle import Vehicle
from app import db
from datetime import datetime

class MissionService:
    
    @staticmethod
    @jwt_required()
    def create_mission(mission_data):
        """Create a new mission."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            # Validate assigned user exists
            assigned_user = User.query.get(mission_data['assigned_user_id'])
            if not assigned_user:
                return {'error': 'Assigned user not found'}, 404
            
            # Validate vehicle exists and is available
            vehicle = Vehicle.query.get(mission_data['vehicle_id'])
            if not vehicle:
                return {'error': 'Vehicle not found'}, 404
            
            if vehicle.status != 'available':
                return {'error': 'Vehicle is not available'}, 400
            
            # Create mission
            mission = Mission(
                title=mission_data['title'],
                description=mission_data.get('description'),
                priority=mission_data.get('priority', 'medium'),
                start_latitude=mission_data['start_latitude'],
                start_longitude=mission_data['start_longitude'],
                start_address=mission_data.get('start_address'),
                end_latitude=mission_data['end_latitude'],
                end_longitude=mission_data['end_longitude'],
                end_address=mission_data.get('end_address'),
                scheduled_start=mission_data['scheduled_start'],
                scheduled_end=mission_data['scheduled_end'],
                assigned_user_id=mission_data['assigned_user_id'],
                vehicle_id=mission_data['vehicle_id'],
                created_by=current_user_id
            )
            
            # Update vehicle status
            vehicle.status = 'in_use'
            
            db.session.add(mission)
            db.session.commit()
            
            return {'message': 'Mission created successfully', 'mission': mission.to_dict()}, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_missions():
        """Get all missions."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return {'error': 'User not found'}, 404
            
            # Filter missions based on user role
            if current_user.role in ['admin', 'manager']:
                missions = Mission.query.all()
            else:
                missions = Mission.query.filter_by(assigned_user_id=current_user_id).all()
            
            return {
                'missions': [mission.to_dict() for mission in missions]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_mission(mission_id):
        """Get a specific mission."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Check permissions
            if (current_user.role not in ['admin', 'manager'] and 
                mission.assigned_user_id != current_user_id):
                return {'error': 'Insufficient permissions'}, 403
            
            return {'mission': mission.to_dict()}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def update_mission(mission_id, mission_data):
        """Update a mission."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Update fields
            updatable_fields = ['title', 'description', 'priority', 'start_latitude', 
                              'start_longitude', 'start_address', 'end_latitude', 
                              'end_longitude', 'end_address', 'scheduled_start', 
                              'scheduled_end', 'assigned_user_id', 'vehicle_id']
            
            for field in updatable_fields:
                if field in mission_data:
                    # Special handling for vehicle_id
                    if field == 'vehicle_id':
                        if mission_data[field] is not None:
                            # Validate vehicle exists and is available
                            vehicle = Vehicle.query.get(mission_data[field])
                            if not vehicle:
                                return {'error': 'Vehicle not found'}, 404
                            # Only check availability if mission is not in progress
                            if mission.status == 'pending' and vehicle.status not in ['available', 'in_use']:
                                return {'error': 'Vehicle is not available'}, 400
                            setattr(mission, field, mission_data[field])
                        else:
                            return {'error': 'Vehicle ID cannot be null'}, 400
                    elif field == 'assigned_user_id':
                        if mission_data[field] is not None:
                            # Validate user exists
                            user = User.query.get(mission_data[field])
                            if not user:
                                return {'error': 'Assigned user not found'}, 404
                            setattr(mission, field, mission_data[field])
                        else:
                            return {'error': 'Assigned user ID cannot be null'}, 400
                    else:
                        setattr(mission, field, mission_data[field])
            
            db.session.commit()
            
            return {'message': 'Mission updated successfully', 'mission': mission.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def start_mission(mission_id):
        """Start a mission."""
        try:
            current_user_id = get_jwt_identity()
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Check if user is assigned to this mission
            if mission.assigned_user_id != current_user_id:
                return {'error': 'You are not assigned to this mission'}, 403
            
            if mission.status != 'pending':
                return {'error': 'Mission cannot be started'}, 400
            
            # Start the mission
            mission.start_mission()
            
            # Create initial location for the vehicle at mission start
            from app.models.location import Location
            initial_location = Location(
                vehicle_id=mission.vehicle_id,
                latitude=mission.start_latitude,
                longitude=mission.start_longitude,
                timestamp=datetime.utcnow(),
                speed=0.0,
                heading=0.0
            )
            db.session.add(initial_location)
            
            # Update vehicle status to in_use
            vehicle = Vehicle.query.get(mission.vehicle_id)
            if vehicle:
                vehicle.status = 'in_use'
            
            db.session.commit()
            
            # Start real-time tracking simulation for this vehicle
            MissionService._start_mission_tracking(mission_id)
            
            return {'message': 'Mission started successfully', 'mission': mission.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def _start_mission_tracking(mission_id):
        """Start real-time position tracking for a mission."""
        try:
            from app.models.location import Location
            import random
            import math
            
            mission = Mission.query.get(mission_id)
            if not mission or mission.status != 'in_progress':
                return
            
            # Get the last location for this vehicle
            last_location = Location.query.filter_by(vehicle_id=mission.vehicle_id).order_by(Location.timestamp.desc()).first()
            
            if last_location:
                # Calculate movement towards destination
                start_lat = last_location.latitude
                start_lon = last_location.longitude
                end_lat = mission.end_latitude
                end_lon = mission.end_longitude
                
                # Calculate bearing towards destination
                lat1_rad = math.radians(start_lat)
                lat2_rad = math.radians(end_lat)
                dlon_rad = math.radians(end_lon - start_lon)
                
                y = math.sin(dlon_rad) * math.cos(lat2_rad)
                x = (math.cos(lat1_rad) * math.sin(lat2_rad) - 
                     math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon_rad))
                
                bearing = math.degrees(math.atan2(y, x))
                bearing = (bearing + 360) % 360  # Normalize to 0-360
                
                # Simulate movement in that direction
                speed_kmh = random.uniform(20, 60)  # Realistic city speed
                time_interval = 30  # 30 seconds
                speed_ms = speed_kmh * 1000 / 3600
                distance_moved = speed_ms * time_interval
                
                # Convert to lat/lon change
                lat_change = (distance_moved / 111000) * math.cos(math.radians(bearing))
                lon_change = (distance_moved / (111000 * math.cos(math.radians(start_lat)))) * math.sin(math.radians(bearing))
                
                # Add some randomness for realistic movement
                lat_change += random.uniform(-0.0002, 0.0002)
                lon_change += random.uniform(-0.0002, 0.0002)
                
                new_lat = start_lat + lat_change
                new_lon = start_lon + lon_change
                
                # Create new location
                new_location = Location(
                    vehicle_id=mission.vehicle_id,
                    latitude=new_lat,
                    longitude=new_lon,
                    timestamp=datetime.utcnow(),
                    speed=speed_kmh,
                    heading=bearing
                )
                db.session.add(new_location)
                db.session.commit()
        
        except Exception as e:
            print(f"Error in mission tracking: {str(e)}")
            pass
    
    @staticmethod
    @jwt_required()
    def complete_mission(mission_id):
        """Complete a mission."""
        try:
            current_user_id = get_jwt_identity()
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Check if user is assigned to this mission
            if mission.assigned_user_id != current_user_id:
                return {'error': 'You are not assigned to this mission'}, 403
            
            if mission.status != 'in_progress':
                return {'error': 'Mission cannot be completed'}, 400
            
            mission.complete_mission()
            
            # Update vehicle status
            vehicle = Vehicle.query.get(mission.vehicle_id)
            if vehicle:
                vehicle.status = 'available'
            
            db.session.commit()
            
            return {'message': 'Mission completed successfully', 'mission': mission.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def cancel_mission(mission_id):
        """Cancel a mission."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            if mission.status in ['completed', 'cancelled']:
                return {'error': 'Mission cannot be cancelled'}, 400
            
            mission.cancel_mission()
            
            # Update vehicle status
            vehicle = Vehicle.query.get(mission.vehicle_id)
            if vehicle:
                vehicle.status = 'available'
            
            db.session.commit()
            
            return {'message': 'Mission cancelled successfully', 'mission': mission.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def delete_mission(mission_id):
        """Delete a mission."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Only allow deletion of pending or cancelled missions
            if mission.status in ['in_progress', 'completed']:
                return {'error': 'Cannot delete mission that is in progress or completed'}, 400
            
            # Update vehicle status if it was assigned
            vehicle = Vehicle.query.get(mission.vehicle_id)
            if vehicle and vehicle.status == 'in_use':
                vehicle.status = 'available'
            
            db.session.delete(mission)
            db.session.commit()
            
            return {'message': 'Mission deleted successfully'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
