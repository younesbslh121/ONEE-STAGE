from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app import db
from werkzeug.security import generate_password_hash
from datetime import timedelta

class AuthService:
    
    @staticmethod
    def register_user(user_data):
        """Register a new user."""
        try:
            # Check if user already exists
            if User.query.filter_by(username=user_data['username']).first():
                return {'error': 'Username already exists'}, 400
            
            if User.query.filter_by(email=user_data['email']).first():
                return {'error': 'Email already exists'}, 400
            
            # Create new user
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                phone=user_data.get('phone'),
                role=user_data.get('role', 'employee')
            )
            
            user.set_password(user_data['password'])
            
            db.session.add(user)
            db.session.commit()
            
            return {'message': 'User registered successfully', 'user': user.to_dict()}, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    def authenticate_user(username, password):
        """Authenticate user and return JWT token."""
        try:
            user = User.query.filter_by(username=username).first()
            
            if not user or not user.check_password(password):
                return {'error': 'Invalid credentials'}, 401
            
            if not user.is_active:
                return {'error': 'Account is deactivated'}, 401
            
            # Create JWT token
            access_token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(hours=24)
            )
            
            return {
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict()
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def get_current_user():
        """Get current authenticated user."""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                return {'error': 'User not found or inactive'}, 404
            
            return user.to_dict(), 200
            
        except Exception as e:
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def update_user_profile(user_data):
        """Update user profile."""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return {'error': 'User not found'}, 404
            
            # Update fields
            for field in ['first_name', 'last_name', 'phone']:
                if field in user_data:
                    setattr(user, field, user_data[field])
            
            db.session.commit()
            
            return {'message': 'Profile updated successfully', 'user': user.to_dict()}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
    
    @staticmethod
    @jwt_required()
    def change_password(current_password, new_password):
        """Change user password."""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return {'error': 'User not found'}, 404
            
            if not user.check_password(current_password):
                return {'error': 'Current password is incorrect'}, 400
            
            user.set_password(new_password)
            db.session.commit()
            
            return {'message': 'Password changed successfully'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
