from app import create_app, db
from app.utils.database import init_db
from app.models import User, Vehicle, Mission, Location, Anomaly

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Initialize database
        init_db(app)
        
        # Run the application
        app.run(
            host='0.0.0.0',
            port=app.config['API_PORT'],
            debug=app.config['DEBUG']
        )
