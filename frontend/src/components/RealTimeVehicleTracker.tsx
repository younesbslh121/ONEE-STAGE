import React, { useState, useEffect, useRef } from 'react';
import SimpleMap from './SimpleMap';
import { missionService } from '../services/missionService';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, Mission } from '../types';
import './RealTimeVehicleTracker.css';

interface RealTimeVehicleTrackerProps {
  missionIds: number[];
  refreshInterval?: number; // en millisecondes
}

const RealTimeVehicleTracker: React.FC<RealTimeVehicleTrackerProps> = ({ 
  missionIds, 
  refreshInterval = 10000 // 10 secondes par défaut
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVehicleData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer les missions
      const missionPromises = missionIds.map(id => missionService.getMission(id));
      const fetchedMissions = await Promise.all(missionPromises);
      
      // Extraire les véhicules des missions
      const vehicleIds = fetchedMissions
        .map(mission => mission.vehicle_id)
        .filter(id => id !== undefined);
      
      // Récupérer les informations détaillées des véhicules (incluant les positions)
      const vehiclePromises = vehicleIds.map(id => vehicleService.getVehicle(id));
      const fetchedVehicles = await Promise.all(vehiclePromises);
      
      setMissions(fetchedMissions);
      setVehicles(fetchedVehicles);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erreur lors de la récupération des données des véhicules');
      console.error('Error fetching vehicle data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour démarrer le suivi en temps réel
  useEffect(() => {
    // Première récupération
    fetchVehicleData();
    
    // Démarrer l'intervalle de mise à jour
    intervalRef.current = setInterval(fetchVehicleData, refreshInterval);
    
    // Nettoyage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [missionIds, refreshInterval]);

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'in_use':
        return '#3b82f6'; // Bleu
      case 'available':
        return '#10b981'; // Vert
      case 'maintenance':
        return '#f59e0b'; // Orange
      case 'out_of_service':
        return '#ef4444'; // Rouge
      default:
        return '#6b7280'; // Gris
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Jamais';
    return `${lastUpdate.getHours().toString().padStart(2, '0')}:${lastUpdate.getMinutes().toString().padStart(2, '0')}:${lastUpdate.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="real-time-tracker">
      <div className="tracker-header">
        <h2>📍 Suivi en Temps Réel des Véhicules</h2>
        <div className="tracker-status">
          <span className={`status-indicator ${isLoading ? 'loading' : 'active'}`}>
            {isLoading ? '🔄 Mise à jour...' : '🟢 En ligne'}
          </span>
          <span className="last-update">
            Dernière mise à jour: {formatLastUpdate()}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="vehicles-summary">
        <h3>Véhicules Suivis ({vehicles.length})</h3>
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-header">
                <span className="vehicle-plate">{vehicle.license_plate}</span>
                <span 
                  className="vehicle-status"
                  style={{ backgroundColor: getVehicleStatusColor(vehicle.status) }}
                >
                  {vehicle.status}
                </span>
              </div>
              <div className="vehicle-details">
                <div>{vehicle.brand} {vehicle.model}</div>
                <div className="vehicle-location">
                  {vehicle.current_latitude && vehicle.current_longitude ? (
                    <span>
                      📍 {vehicle.current_latitude.toFixed(4)}, {vehicle.current_longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span className="no-location">❌ Position non disponible</span>
                  )}
                </div>
                {vehicle.last_location_update && (
                  <div className="location-update">
                    Dernière position: {new Date(vehicle.last_location_update).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-section">
        <h3>Carte en Temps Réel</h3>
        <SimpleMap 
          height="500px"
          vehicles={vehicles}
          missions={missions}
          showControls={true}
        />
      </div>

      <div className="missions-summary">
        <h3>Missions Actives ({missions.length})</h3>
        <div className="missions-grid">
          {missions.map((mission) => (
            <div key={mission.id} className="mission-card">
              <div className="mission-header">
                <span className="mission-title">{mission.title}</span>
                <span className={`mission-status ${mission.status}`}>
                  {mission.status}
                </span>
              </div>
              <div className="mission-details">
                <div>🎯 {mission.start_address} → {mission.end_address}</div>
                <div>👤 {mission.assigned_user?.first_name} {mission.assigned_user?.last_name}</div>
                <div>🚗 {mission.vehicle?.license_plate}</div>
                <div>📅 {new Date(mission.scheduled_start).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeVehicleTracker;
