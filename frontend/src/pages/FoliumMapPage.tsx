import React, { useState, useEffect } from 'react';
import FoliumMap from '../components/Map/FoliumMap';
import axios from 'axios';
import './FoliumMapPage.css';

interface Vehicle {
  id: number;
  license_plate: string;
  status: string;
  brand?: string;
  model?: string;
}

const FoliumMapPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [isRealTime, setIsRealTime] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/vehicles/noauth');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
      // Données de fallback
      setVehicles([
        { id: 1, license_plate: 'ABC-123', status: 'available', brand: 'Renault', model: 'Clio' },
        { id: 2, license_plate: 'DEF-456', status: 'in_use', brand: 'Peugeot', model: '308' },
        { id: 3, license_plate: 'GHI-789', status: 'maintenance', brand: 'Citroën', model: 'C4' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10b981'; // Green
      case 'in_use':
        return '#3b82f6'; // Blue
      case 'maintenance':
        return '#f59e0b'; // Orange
      case 'out_of_service':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'in_use':
        return 'En service';
      case 'maintenance':
        return 'Maintenance';
      case 'out_of_service':
        return 'Hors service';
      default:
        return 'Inconnu';
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowRoute(true);
  };

  const clearSelection = () => {
    setSelectedVehicle(null);
    setShowRoute(false);
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  return (
    <div className="folium-map-page">
      <div className="folium-page-header">
        <h1>🗺️ Carte Interactive de la Flotte</h1>
        <p>Visualisation en temps réel des véhicules avec Folium</p>
      </div>

      <div className="folium-page-controls">
        <div className="folium-controls-left">
          <button onClick={loadVehicles} className="folium-btn folium-btn-primary">
            🔄 Actualiser
          </button>
          <button 
            onClick={toggleRealTime} 
            className={`folium-btn ${isRealTime ? 'folium-btn-danger' : 'folium-btn-success'}`}
          >
            {isRealTime ? '⏸️ Pause' : '▶️ Temps réel'}
          </button>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="folium-select"
            disabled={!isRealTime}
          >
            <option value={5000}>5 secondes</option>
            <option value={10000}>10 secondes</option>
            <option value={30000}>30 secondes</option>
            <option value={60000}>1 minute</option>
          </select>
        </div>

        <div className="folium-controls-right">
          {selectedVehicle && (
            <div className="folium-selected-info">
              <span>Véhicule sélectionné: <strong>{selectedVehicle.license_plate}</strong></span>
              <button onClick={clearSelection} className="folium-btn folium-btn-secondary">
                ❌ Effacer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="folium-page-content">
        <div className="folium-sidebar">
          <div className="folium-vehicle-list">
            <h3>Véhicules ({vehicles.length})</h3>
            {loading ? (
              <div className="folium-sidebar-loading">
                <div className="folium-spinner-small"></div>
                <p>Chargement...</p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  className={`folium-vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="folium-vehicle-info">
                    <div className="folium-vehicle-plate">{vehicle.license_plate}</div>
                    <div className="folium-vehicle-details">
                      {vehicle.brand} {vehicle.model}
                    </div>
                    <div className="folium-vehicle-status">
                      <span 
                        className="folium-status-dot"
                        style={{ backgroundColor: getStatusColor(vehicle.status) }}
                      ></span>
                      {getStatusLabel(vehicle.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="folium-map-info">
            <h4>ℹ️ Informations</h4>
            <ul>
              <li>🟢 Vert: Véhicule disponible</li>
              <li>🔵 Bleu: Véhicule en service</li>
              <li>🟡 Orange: En maintenance</li>
              <li>🔴 Rouge: Hors service</li>
            </ul>
            <p>
              Cliquez sur un véhicule dans la liste pour voir sa route.
            </p>
          </div>
        </div>

        <div className="folium-map-area">
          <FoliumMap 
            height="600px"
            refreshInterval={isRealTime ? refreshInterval : 0}
            vehicleId={selectedVehicle?.id}
            showRoute={showRoute}
          />
        </div>
      </div>
    </div>
  );
};

export default FoliumMapPage;
