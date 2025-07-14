#!/usr/bin/env python3
"""
Simple script to run the Flask backend server
"""
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.utils.database import init_db

def main():
    try:
        # Create the Flask app
        app = create_app()
        
        # Initialize the database
        with app.app_context():
            init_db(app)
            print("✅ Database initialized successfully")
        
        # Start the server
        print("🚀 Starting Flask server...")
        print(f"🌐 Server will be available at: http://localhost:{app.config['API_PORT']}")
        print("👋 Press Ctrl+C to stop the server\n")
        
        app.run(
            host='0.0.0.0',
            port=app.config['API_PORT'],
            debug=app.config['DEBUG'],
            use_reloader=False  # Disable auto-reload to avoid issues
        )
        
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
