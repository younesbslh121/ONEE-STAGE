from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from app.schemas.user_schema import UserRegistrationSchema, UserLoginSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint."""
    try:
        schema = UserRegistrationSchema()
        data = schema.load(request.json)
        
        result, status_code = AuthService.register_user(data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint."""
    try:
        schema = UserLoginSchema()
        data = schema.load(request.json)
        
        result, status_code = AuthService.authenticate_user(
            data['username'], data['password']
        )
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user information."""
    try:
        result, status_code = AuthService.get_current_user()
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile."""
    try:
        result, status_code = AuthService.update_user_profile(request.json)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
def change_password():
    """Change user password."""
    try:
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        result, status_code = AuthService.change_password(current_password, new_password)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login-simple', methods=['POST'])
def login_simple():
    """Simple login endpoint without JWT for testing."""
    try:
        from app.models.user import User
        
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Trouver l'utilisateur
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Vérifier le mot de passe
        if not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Retourner les infos utilisateur avec un token simple
        return jsonify({
            'access_token': f'simple_token_for_{user.id}',
            'user': user.to_dict(),
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
