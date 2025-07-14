from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.anomaly import Anomaly
from app.models.mission import Mission
from app.models.vehicle import Vehicle
from app.models.location import Location
from app.models.user import User
from app import db
from datetime import datetime, timedelta
import math

class AnomalyService:
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula."""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    @staticmethod
    def detect_route_deviation(vehicle_id, mission_id, current_lat, current_lon, threshold_km=2):
        """Detect if vehicle has deviated from planned route."""
        try:
            mission = Mission.query.get(mission_id)
            if not mission:
                return None
            
            # Calculate distance from start point
            distance_from_start = AnomalyService.calculate_distance(
                current_lat, current_lon,
                mission.start_latitude, mission.start_longitude
            )
            
            # Calculate distance from end point
            distance_from_end = AnomalyService.calculate_distance(
                current_lat, current_lon,
                mission.end_latitude, mission.end_longitude
            )
            
            # Simple deviation check - if too far from both start and end points
            if distance_from_start > threshold_km and distance_from_end > threshold_km:
                return AnomalyService.create_anomaly(
                    vehicle_id, mission_id, 'deviation',
                    f'Vehicle deviated {distance_from_start:.1f}km from start and {distance_from_end:.1f}km from end',
                    'medium'
                )
            
            return None
            
        except Exception as e:
            print(f"Error detecting route deviation: {e}")
            return None
    
    @staticmethod
    def detect_speed_anomaly(vehicle_id, mission_id, current_speed, speed_limit=80):
        """Detect speeding violations."""
        try:
            if current_speed > speed_limit:
                return AnomalyService.create_anomaly(
                    vehicle_id, mission_id, 'speeding',
                    f'Vehicle exceeded speed limit: {current_speed:.1f} km/h (limit: {speed_limit} km/h)',
                    'high' if current_speed > speed_limit * 1.5 else 'medium'
                )
            
            return None
            
        except Exception as e:
            print(f"Error detecting speed anomaly: {e}")
            return None
    
    @staticmethod
    def detect_schedule_delay(mission_id):
        """Detect if mission is running behind schedule."""
        try:
            mission = Mission.query.get(mission_id)
            if not mission:
                return None
            
            now = datetime.utcnow()
            
            # Check if mission should have started but hasn't
            if (mission.status == 'pending' and 
                mission.scheduled_start < now):
                delay_minutes = (now - mission.scheduled_start).total_seconds() / 60
                
                return AnomalyService.create_anomaly(
                    mission.vehicle_id, mission_id, 'delay',
                    f'Mission delayed by {delay_minutes:.0f} minutes',
                    'high' if delay_minutes > 60 else 'medium'
                )
            
            # Check if mission should have ended but hasn't
            if (mission.status == 'in_progress' and 
                mission.scheduled_end < now):
                delay_minutes = (now - mission.scheduled_end).total_seconds() / 60
                
                return AnomalyService.create_anomaly(
                    mission.vehicle_id, mission_id, 'delay',
                    f'Mission overdue by {delay_minutes:.0f} minutes',
                    'high' if delay_minutes > 120 else 'medium'
                )
            
            return None
            
        except Exception as e:
            print(f"Error detecting schedule delay: {e}")
            return None
    
    @staticmethod
    def detect_idle_time(vehicle_id, mission_id, threshold_minutes=30):
        """Detect if vehicle has been idle for too long."""
        try:
            # Get recent locations for the vehicle
            time_threshold = datetime.utcnow() - timedelta(minutes=threshold_minutes)
            
            locations = Location.query.filter(
                Location.vehicle_id == vehicle_id,
                Location.timestamp >= time_threshold
            ).order_by(Location.timestamp.desc()).limit(2).all()
            
            if len(locations) >= 2:
                # Check if vehicle hasn't moved significantly
                distance = AnomalyService.calculate_distance(
                    locations[0].latitude, locations[0].longitude,
                    locations[1].latitude, locations[1].longitude
                )
                
                if distance < 0.1:  # Less than 100 meters
                    return AnomalyService.create_anomaly(
                        vehicle_id, mission_id, 'idle',
                        f'Vehicle idle for more than {threshold_minutes} minutes',
                        'medium'
                    )
            
            return None
            
        except Exception as e:
            print(f"Error detecting idle time: {e}")
            return None
    
    @staticmethod
    def create_anomaly(vehicle_id, mission_id, anomaly_type, description, severity):
        """Create a new anomaly record."""
        try:
            anomaly = Anomaly(
                type=anomaly_type,
                description=description,
                severity=severity,
                vehicle_id=vehicle_id,
                mission_id=mission_id
            )
            
            db.session.add(anomaly)
            db.session.commit()
            
            return anomaly
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating anomaly: {e}")
            return None
    
    @staticmethod
    def get_anomalies(vehicle_id=None, mission_id=None, severity=None):
        """Get anomalies with optional filters."""
        try:
            query = Anomaly.query
            
            if vehicle_id:
                query = query.filter_by(vehicle_id=vehicle_id)
            
            if mission_id:
                query = query.filter_by(mission_id=mission_id)
            
            if severity:
                query = query.filter_by(severity=severity)
            
            anomalies = query.order_by(Anomaly.detected_at.desc()).all()
            
            return {
                'anomalies': [anomaly.to_dict() for anomaly in anomalies]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_recent_anomalies(hours=24):
        """Get anomalies from the last X hours."""
        try:
            time_threshold = datetime.utcnow() - timedelta(hours=hours)
            
            anomalies = Anomaly.query.filter(
                Anomaly.detected_at >= time_threshold
            ).order_by(Anomaly.detected_at.desc()).all()
            
            return {
                'anomalies': [anomaly.to_dict() for anomaly in anomalies]
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def run_anomaly_detection():
        """Run anomaly detection for all active missions."""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role not in ['admin', 'manager']:
                return {'error': 'Insufficient permissions'}, 403
            
            # Get all in-progress missions
            missions = Mission.query.filter_by(status='in_progress').all()
            detected_anomalies = []
            
            for mission in missions:
                # Get latest location for the vehicle
                latest_location = Location.query.filter_by(
                    vehicle_id=mission.vehicle_id
                ).order_by(Location.timestamp.desc()).first()
                
                if latest_location:
                    # Check for route deviation
                    deviation = AnomalyService.detect_route_deviation(
                        mission.vehicle_id, mission.id,
                        latest_location.latitude, latest_location.longitude
                    )
                    if deviation:
                        detected_anomalies.append(deviation.to_dict())
                    
                    # Check for speeding
                    if latest_location.speed:
                        speeding = AnomalyService.detect_speed_anomaly(
                            mission.vehicle_id, mission.id, latest_location.speed
                        )
                        if speeding:
                            detected_anomalies.append(speeding.to_dict())
                    
                    # Check for idle time
                    idle = AnomalyService.detect_idle_time(
                        mission.vehicle_id, mission.id
                    )
                    if idle:
                        detected_anomalies.append(idle.to_dict())
                
                # Check for schedule delays
                delay = AnomalyService.detect_schedule_delay(mission.id)
                if delay:
                    detected_anomalies.append(delay.to_dict())
            
            return {
                'message': f'Anomaly detection completed. Found {len(detected_anomalies)} anomalies.',
                'anomalies': detected_anomalies
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
