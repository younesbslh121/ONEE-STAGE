from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.mission import Mission
from app.models.location import Location
from app.models.anomaly import Anomaly
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/', methods=['GET'])
def dashboard_home():
    """Simple dashboard home route."""
    return jsonify({'message': 'Dashboard API is working', 'status': 'ok'}), 200

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        # Basic counts
        total_vehicles = Vehicle.query.count()
        total_users = User.query.count()
        total_missions = Mission.query.count()
        
        # Vehicle status counts
        available_vehicles = Vehicle.query.filter_by(status='available').count()
        in_use_vehicles = Vehicle.query.filter_by(status='in_use').count()
        maintenance_vehicles = Vehicle.query.filter_by(status='maintenance').count()
        
        # Mission status counts
        pending_missions = Mission.query.filter_by(status='pending').count()
        in_progress_missions = Mission.query.filter_by(status='in_progress').count()
        completed_missions = Mission.query.filter_by(status='completed').count()
        
        # Recent anomalies (last 24 hours)
        time_threshold = datetime.utcnow() - timedelta(hours=24)
        recent_anomalies = Anomaly.query.filter(
            Anomaly.detected_at >= time_threshold
        ).count()
        
        # Active users (users with missions in progress)
        active_users = User.query.join(Mission).filter(
            Mission.status == 'in_progress'
        ).distinct().count()
        
        stats = {
            'vehicles': {
                'total': total_vehicles,
                'available': available_vehicles,
                'in_use': in_use_vehicles,
                'maintenance': maintenance_vehicles
            },
            'missions': {
                'total': total_missions,
                'pending': pending_missions,
                'in_progress': in_progress_missions,
                'completed': completed_missions
            },
            'users': {
                'total': total_users,
                'active': active_users
            },
            'anomalies': {
                'recent': recent_anomalies
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Get recent activity for dashboard."""
    try:
        hours = request.args.get('hours', 24, type=int)
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        # Recent missions
        recent_missions = Mission.query.filter(
            Mission.created_at >= time_threshold
        ).order_by(Mission.created_at.desc()).limit(10).all()
        
        # Recent anomalies
        recent_anomalies = Anomaly.query.filter(
            Anomaly.detected_at >= time_threshold
        ).order_by(Anomaly.detected_at.desc()).limit(10).all()
        
        # Active missions
        active_missions = Mission.query.filter_by(status='in_progress').all()
        
        activity = {
            'recent_missions': [mission.to_dict() for mission in recent_missions],
            'recent_anomalies': [anomaly.to_dict() for anomaly in recent_anomalies],
            'active_missions': [mission.to_dict() for mission in active_missions]
        }
        
        return jsonify(activity), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/mission-analytics', methods=['GET'])
@jwt_required()
def get_mission_analytics():
    """Get mission analytics data."""
    try:
        days = request.args.get('days', 30, type=int)
        time_threshold = datetime.utcnow() - timedelta(days=days)
        
        # Mission completion rate
        total_missions = Mission.query.filter(
            Mission.created_at >= time_threshold
        ).count()
        
        completed_missions = Mission.query.filter(
            Mission.created_at >= time_threshold,
            Mission.status == 'completed'
        ).count()
        
        completion_rate = (completed_missions / total_missions * 100) if total_missions > 0 else 0
        
        # Average mission duration
        completed_missions_with_times = Mission.query.filter(
            Mission.created_at >= time_threshold,
            Mission.status == 'completed',
            Mission.actual_start.isnot(None),
            Mission.actual_end.isnot(None)
        ).all()
        
        total_duration = sum([
            (mission.actual_end - mission.actual_start).total_seconds() / 3600
            for mission in completed_missions_with_times
        ])
        
        avg_duration = (total_duration / len(completed_missions_with_times)) if completed_missions_with_times else 0
        
        # Mission priority distribution
        priority_counts = Mission.query.filter(
            Mission.created_at >= time_threshold
        ).with_entities(
            Mission.priority, func.count(Mission.id)
        ).group_by(Mission.priority).all()
        
        priority_distribution = {priority: count for priority, count in priority_counts}
        
        # Daily mission counts
        daily_counts = Mission.query.filter(
            Mission.created_at >= time_threshold
        ).with_entities(
            func.date(Mission.created_at).label('date'),
            func.count(Mission.id).label('count')
        ).group_by(func.date(Mission.created_at)).order_by('date').all()
        
        daily_mission_counts = [
            {'date': str(date), 'count': count}
            for date, count in daily_counts
        ]
        
        analytics = {
            'completion_rate': round(completion_rate, 2),
            'average_duration_hours': round(avg_duration, 2),
            'priority_distribution': priority_distribution,
            'daily_mission_counts': daily_mission_counts,
            'total_missions': total_missions,
            'completed_missions': completed_missions
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/vehicle-analytics', methods=['GET'])
@jwt_required()
def get_vehicle_analytics():
    """Get vehicle analytics data."""
    try:
        days = request.args.get('days', 30, type=int)
        time_threshold = datetime.utcnow() - timedelta(days=days)
        
        # Vehicle utilization
        vehicle_usage = []
        vehicles = Vehicle.query.all()
        
        for vehicle in vehicles:
            missions_count = Mission.query.filter(
                Mission.vehicle_id == vehicle.id,
                Mission.created_at >= time_threshold
            ).count()
            
            vehicle_usage.append({
                'vehicle_id': vehicle.id,
                'license_plate': vehicle.license_plate,
                'missions_count': missions_count,
                'status': vehicle.status
            })
        
        # Fuel type distribution
        fuel_counts = Vehicle.query.with_entities(
            Vehicle.fuel_type, func.count(Vehicle.id)
        ).group_by(Vehicle.fuel_type).all()
        
        fuel_distribution = {fuel_type: count for fuel_type, count in fuel_counts}
        
        # Vehicle status over time (simplified)
        status_counts = Vehicle.query.with_entities(
            Vehicle.status, func.count(Vehicle.id)
        ).group_by(Vehicle.status).all()
        
        status_distribution = {status: count for status, count in status_counts}
        
        analytics = {
            'vehicle_usage': vehicle_usage,
            'fuel_distribution': fuel_distribution,
            'status_distribution': status_distribution
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
