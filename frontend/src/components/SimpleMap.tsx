import React, { useState, useEffect } from 'react';
import './SimpleMap.css';
import { Vehicle, Mission } from '../types';

interface SimpleMapProps {
  height?: string;
  currentLocation?: { latitude: number; longitude: number } | null;
  showControls?: boolean;
  vehicles?: Vehicle[];
  missions?: Mission[];
}

const SimpleMap: React.FC<SimpleMapProps> = ({ 
  height = '400px', 
  currentLocation,
  showControls = true,
  vehicles = [],
  missions = []
}) => {
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState({ lat: 33.9716, lng: -6.8498 }); // Casablanca, Morocco
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; label: string; color: string }>>([]);

  useEffect(() => {
    if (vehicles.length > 0) {
      // Afficher les véhicules réels
      const vehicleMarkers = vehicles.map((vehicle, index) => ({
        lat: vehicle.current_latitude || 33.9716,
        lng: vehicle.current_longitude || -6.8498,
        label: `${vehicle.license_plate} - ${vehicle.brand} ${vehicle.model}`,
        color: vehicle.status === 'in_use' ? '#3b82f6' : '#10b981'
      }));
      setMarkers(vehicleMarkers);
      
      // Centrer sur le premier véhicule
      if (vehicles[0].current_latitude && vehicles[0].current_longitude) {
        setCenter({ lat: vehicles[0].current_latitude, lng: vehicles[0].current_longitude });
      }
    } else if (currentLocation) {
      setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      setMarkers([
        {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          label: 'Position actuelle',
          color: '#10b981'
        }
      ]);
    } else {
      // Données de test
      const testMarkers = [
        { lat: 33.9716, lng: -6.8498, label: 'Véhicule 1', color: '#10b981' },
        { lat: 33.9750, lng: -6.8520, label: 'Véhicule 2', color: '#3b82f6' },
        { lat: 33.9680, lng: -6.8450, label: 'Véhicule 3', color: '#ef4444' },
      ];
      setMarkers(testMarkers);
    }
  }, [vehicles, currentLocation]);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 1));
  };

  const handleRecenter = () => {
    if (currentLocation) {
      setCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
    }
  };

  // Calcul simple de la position des marqueurs sur la carte
  const getMarkerPosition = (lat: number, lng: number) => {
    const latRange = 0.02; // ~2km
    const lngRange = 0.02; // ~2km
    
    const x = ((lng - center.lng + lngRange / 2) / lngRange) * 100;
    const y = ((center.lat - lat + latRange / 2) / latRange) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="simple-map-container" style={{ height }}>
      {showControls && (
        <div className="simple-map-controls">
          <div className="map-info">
            <span>📍 Carte Simple</span>
            <span>Zoom: {zoom}</span>
          </div>
          <div className="map-buttons">
            <button onClick={handleZoomIn} className="map-control-btn">
              🔍+
            </button>
            <button onClick={handleZoomOut} className="map-control-btn">
              🔍-
            </button>
            <button onClick={handleRecenter} className="map-control-btn">
              🎯
            </button>
          </div>
        </div>
      )}
      
      <div className="simple-map-view">
        <div className="map-background">
          <div className="grid-overlay"></div>
          
          {/* Marqueurs */}
          {markers.map((marker, index) => {
            const position = getMarkerPosition(marker.lat, marker.lng);
            return (
              <div
                key={index}
                className="map-marker"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  backgroundColor: marker.color,
                }}
                title={`${marker.label} - ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}
              >
                <div className="marker-pulse"></div>
              </div>
            );
          })}
          
          {/* Cercle de centre */}
          <div className="map-center">
            <div className="center-crosshair"></div>
          </div>
        </div>
        
        {/* Informations de position */}
        <div className="map-coordinates">
          <div>Centre: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
          {currentLocation && (
            <div>Position: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;
