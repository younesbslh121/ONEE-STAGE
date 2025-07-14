from .auth_routes import auth_bp
from .mission_routes import mission_bp
from .vehicle_routes import vehicle_bp
from .location_routes import location_bp
from .anomaly_routes import anomaly_bp
from .map_routes import map_bp
from .dashboard_routes import dashboard_bp
from .reimbursement_routes import reimbursement_bp

def register_routes(app):
    """Register all blueprint routes with the Flask app."""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(mission_bp, url_prefix='/api/missions')
    app.register_blueprint(vehicle_bp, url_prefix='/api/vehicles')
    app.register_blueprint(location_bp, url_prefix='/api/locations')
    app.register_blueprint(anomaly_bp, url_prefix='/api/anomalies')
    app.register_blueprint(map_bp, url_prefix='/api/map')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reimbursement_bp, url_prefix='/api/reimbursements')
