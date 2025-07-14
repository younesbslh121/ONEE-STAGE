from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User

def token_required(f):
    """Decorator to require valid JWT token."""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Token validation failed'}), 401
    
    return decorated_function

def admin_required(f):
    """Decorator to require admin privileges."""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            if current_user.role != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authorization failed'}), 401
    
    return decorated_function

def manager_required(f):
    """Decorator to require manager or admin privileges."""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            if current_user.role not in ['admin', 'manager']:
                return jsonify({'error': 'Manager privileges required'}), 403
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authorization failed'}), 401
    
    return decorated_function
