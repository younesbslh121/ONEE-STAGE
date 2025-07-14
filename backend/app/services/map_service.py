from app.models.vehicle import Vehicle
from app.models.location import Location
from app.models.mission import Mission
from app import db
from datetime import datetime, timedelta
import random
import math

class MapService:
    
    @staticmethod
    def generate_sample_locations():
        """Generate sample location data for testing."""
        vehicles = Vehicle.query.all()
        
        for vehicle in vehicles:
            # Generate random location within Paris bounds
            lat = 48.8566 + (random.random() - 0.5) * 0.1
            lon = 2.3522 + (random.random() - 0.5) * 0.1
            
            location = Location(
                vehicle_id=vehicle.id,
                latitude=lat,
                longitude=lon,
                timestamp=datetime.utcnow(),
                speed=random.uniform(0, 80),
                heading=random.uniform(0, 360)
            )
            
            db.session.add(location)
        
        db.session.commit()
        return {'message': 'Sample locations generated'}
    
    @staticmethod
    def simulate_vehicle_movement():
        """Simulate realistic vehicle movement for real-time updates."""
        vehicles = Vehicle.query.all()
        
        for vehicle in vehicles:
            # Get the last location
            last_location = Location.query.filter_by(vehicle_id=vehicle.id).order_by(Location.timestamp.desc()).first()
            
            if last_location:
                # Calculate small movement (simulate realistic driving)
                speed_kmh = random.uniform(10, 50)  # Speed between 10-50 km/h
                time_interval = 5  # 5 seconds
                
                # Convert speed to meters per second
                speed_ms = speed_kmh * 1000 / 3600
                
                # Calculate distance moved in meters
                distance_moved = speed_ms * time_interval
                
                # Convert to approximate lat/lon change (rough approximation)
                # 1 degree latitude ≈ 111,000 meters
                # 1 degree longitude ≈ 111,000 * cos(latitude) meters
                lat_change = (distance_moved / 111000) * random.choice([-1, 1])
                lon_change = (distance_moved / (111000 * math.cos(math.radians(last_location.latitude)))) * random.choice([-1, 1])
                
                # Add some randomness to make it more realistic
                lat_change += random.uniform(-0.0001, 0.0001)
                lon_change += random.uniform(-0.0001, 0.0001)
                
                new_lat = last_location.latitude + lat_change
                new_lon = last_location.longitude + lon_change
                
                # Keep within reasonable bounds (Paris area)
                new_lat = max(48.8, min(48.9, new_lat))
                new_lon = max(2.2, min(2.5, new_lon))
                
                heading = random.uniform(0, 360)
                
            else:
                # No previous location, start with random location in Paris
                new_lat = 48.8566 + (random.random() - 0.5) * 0.1
                new_lon = 2.3522 + (random.random() - 0.5) * 0.1
                speed_kmh = random.uniform(10, 50)
                heading = random.uniform(0, 360)
            
            # Create new location record
            location = Location(
                vehicle_id=vehicle.id,
                latitude=new_lat,
                longitude=new_lon,
                timestamp=datetime.utcnow(),
                speed=speed_kmh,
                heading=heading
            )
            
            db.session.add(location)
        
        db.session.commit()
        return {'message': 'Vehicle movements simulated'}
    
    @staticmethod
    def get_mission_map(mission_id):
        """Get map data for a specific mission including collaborators' locations."""
        try:
            from app.models.user import User
            from flask_jwt_extended import get_jwt_identity
            
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            mission = Mission.query.get(mission_id)
            if not mission:
                return {'error': 'Mission not found'}, 404
            
            # Check permissions
            if (current_user.role not in ['admin', 'manager'] and 
                mission.assigned_user_id != current_user_id):
                return {'error': 'Insufficient permissions'}, 403
            
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
            
            return map_data, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
