# Fleet Management System

## Overview

This project is a full-stack application that enables company managers to plan, track, and analyze employee trips via a web interface.

## Features

- **Authentication:** Secure user authentication using JWT.
- **Dashboard:** View and manage trips using interactive maps and tables.
- **Real-time Tracking:** Monitor the real-time position of vehicles.
- **Dynamic Missions:** Create and assign missions to employees.
- **Anomaly Detection:** Automatic detection of route deviations, delays, and other anomalies.

## Tech Stack

- **Frontend:** React.js (TypeScript), Tailwind CSS, ShadCN UI
- **Backend:** Flask (Python) with FastAPI for certain APIs
- **Database:** SQLite (dev), PostgreSQL (production)
- **Authentication:** JWT
- **Mapping:** Folium + Geopandas
- **Deployment:** GitHub + Render / Railway

## Setup

1. ### Backend

    - Navigate to the backend directory:
      ```bash
      cd backend
      ```

    - Create a virtual environment and activate it:
      ```bash
      python -m venv venv
      . venv/bin/activate  # On Windows use 'venv\\Scripts\\activate'
      ```

    - Install dependencies:
      ```bash
      pip install -r requirements.txt
      ```

    - Run the server:
      ```bash
      flask run
      ```

2. ### Frontend

    - Navigate to the frontend directory:
      ```bash
      cd frontend
      ```

    - Install dependencies:
      ```bash
      npm install
      ```

    - Start the development server:
      ```bash
      npm start
      ```

## Deployment

- **GitHub**
- **Render**
- **Railway**

## Testing

- Use Postman for API testing.
- Utilize DB Browser for SQLite to view database changes.

## Contributing

Feel free to contribute by submitting a pull request. Please ensure all tests pass before merging.

## License

MIT License. See `LICENSE` for more information.
