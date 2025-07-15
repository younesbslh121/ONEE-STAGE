import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import FoliumMapEmbed from './Map/FoliumMapEmbed';
import SimpleMap from './SimpleMap';
import './MissionTracker.css';

interface MissionTrackerProps {
  missionId: number;
  collaboratorId: number;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const MissionTracker: React.FC<MissionTrackerProps> = ({ 
  missionId, 
  collaboratorId, 
  onLocationUpdate 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState({
    startTime: null as Date | null,
    totalDistance: 0,
    currentSpeed: 0,
    lastUpdate: null as Date | null,
    locationsCount: 0
  });
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapMode, setMapMode] = useState<'folium' | 'simple'>('folium');
  const [foliumError, setFoliumError] = useState(false);
  
  const { position, error: geoError, getCurrentPosition } = useGeolocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const offlineQueueRef = useRef<Array<{ latitude: number; longitude: number; timestamp: Date }>>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sendLocationUpdate = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/missions/${missionId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          collaborator_id: collaboratorId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la position');
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const syncOfflineData = useCallback(async () => {
    try {
      const queue = [...offlineQueueRef.current];
      offlineQueueRef.current = [];
      
      for (const location of queue) {
        await sendLocationUpdate(location.latitude, location.longitude);
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation des données offline:', err);
    }
  }, [missionId, collaboratorId]);

  useEffect(() => {
    if (isOnline && offlineQueueRef.current.length > 0) {
      syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateSpeed = (distance: number, timeSeconds: number): number => {
    if (timeSeconds === 0) return 0;
    return (distance * 1000) / timeSeconds * 3.6; // km/h
  };

  const startTracking = async () => {
    try {
      setError('');
      
      // Obtenir la position initiale
      const initialPosition = await getCurrentPosition();
      
      setIsTracking(true);
      setTrackingData({
        startTime: new Date(),
        totalDistance: 0,
        currentSpeed: 0,
        lastUpdate: new Date(),
        locationsCount: 0
      });
      
      lastPositionRef.current = {
        latitude: initialPosition.latitude,
        longitude: initialPosition.longitude
      };

      // Envoyer la position initiale
      if (isOnline) {
        await sendLocationUpdate(initialPosition.latitude, initialPosition.longitude);
      } else {
        offlineQueueRef.current.push({
          latitude: initialPosition.latitude,
          longitude: initialPosition.longitude,
          timestamp: new Date()
        });
      }

      // Démarrer le tracking périodique
      intervalRef.current = setInterval(async () => {
        try {
          const currentPosition = await getCurrentPosition();
          
          // Calculer la distance parcourue
          let distance = 0;
          let speed = 0;
          
          if (lastPositionRef.current) {
            distance = calculateDistance(
              lastPositionRef.current.latitude,
              lastPositionRef.current.longitude,
              currentPosition.latitude,
              currentPosition.longitude
            );
            
            const timeElapsed = (new Date().getTime() - (trackingData.lastUpdate?.getTime() || 0)) / 1000;
            speed = calculateSpeed(distance, timeElapsed);
          }

          // Mettre à jour les données de tracking
          setTrackingData(prev => ({
            ...prev,
            totalDistance: prev.totalDistance + distance,
            currentSpeed: speed,
            lastUpdate: new Date(),
            locationsCount: prev.locationsCount + 1
          }));

          // Envoyer la position au serveur
          if (isOnline) {
            await sendLocationUpdate(currentPosition.latitude, currentPosition.longitude);
          } else {
            offlineQueueRef.current.push({
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
              timestamp: new Date()
            });
          }

          // Notifier le parent
          if (onLocationUpdate) {
            onLocationUpdate({
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude
            });
          }

          // Mettre à jour la position actuelle pour la carte
          setCurrentLocation({
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude
          });

          lastPositionRef.current = {
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude
          };

        } catch (err) {
          console.error('Erreur lors du tracking:', err);
          setError('Erreur lors de la mise à jour de la position');
        }
      }, 10000); // Toutes les 10 secondes

    } catch (err) {
      setError('Impossible de démarrer le tracking de position');
      console.error('Erreur start tracking:', err);
    }
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    
    // Synchroniser les données restantes si en ligne
    if (isOnline && offlineQueueRef.current.length > 0) {
      syncOfflineData();
    }
  };

  const formatDuration = (startTime: Date | null): string => {
    if (!startTime) return '00:00:00';
    
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  return (
    <div className="mission-tracker">
      <div className="tracker-header">
        <h3>🎯 Tracking Mission</h3>
        <div className="connection-status">
          {isOnline ? (
            <span className="online">🟢 En ligne</span>
          ) : (
            <span className="offline">🔴 Hors ligne</span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {geoError && (
        <div className="error-message">
          Géolocalisation: {geoError}
        </div>
      )}

      <div className="tracker-stats">
        <div className="stat-item">
          <span className="stat-label">Durée:</span>
          <span className="stat-value">{formatDuration(trackingData.startTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Distance:</span>
          <span className="stat-value">{formatDistance(trackingData.totalDistance)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Vitesse:</span>
          <span className="stat-value">{trackingData.currentSpeed.toFixed(1)} km/h</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Points:</span>
          <span className="stat-value">{trackingData.locationsCount}</span>
        </div>
      </div>

      {position && (
        <div className="current-position">
          <h4>📍 Position actuelle:</h4>
          <div className="position-info">
            <div>Latitude: {position.latitude.toFixed(6)}</div>
            <div>Longitude: {position.longitude.toFixed(6)}</div>
            <div>Précision: {position.accuracy.toFixed(0)}m</div>
          </div>
        </div>
      )}

      <div className="tracker-controls">
        {!isTracking ? (
          <button 
            onClick={startTracking}
            className="start-tracking-btn"
          >
            ▶️ Démarrer le tracking
          </button>
        ) : (
          <button 
            onClick={stopTracking}
            className="stop-tracking-btn"
          >
            ⏹️ Arrêter le tracking
          </button>
        )}
      </div>

      {!isOnline && offlineQueueRef.current.length > 0 && (
        <div className="offline-queue">
          <span>📤 {offlineQueueRef.current.length} positions en attente de synchronisation</span>
        </div>
      )}

      <div className="map-section">
        <div className="map-header">
          <button 
            onClick={() => setShowMap(!showMap)}
            className="map-toggle-btn"
          >
            🗺️ {showMap ? 'Masquer' : 'Afficher'} la carte
          </button>
        </div>
        
        {showMap && (
          <div className="map-container">
            <div className="map-mode-selector">
              <button 
                onClick={() => setMapMode('folium')}
                className={`mode-btn ${mapMode === 'folium' ? 'active' : ''}`}
                disabled={foliumError}
              >
                🗺️ Folium
              </button>
              <button 
                onClick={() => setMapMode('simple')}
                className={`mode-btn ${mapMode === 'simple' ? 'active' : ''}`}
              >
                🌍 Simple
              </button>
            </div>
            
            {mapMode === 'folium' && !foliumError ? (
              <div className="folium-map-wrapper">
                <FoliumMapEmbed 
                  height="400px"
                  refreshInterval={30000}
                  showControls={true}
                />
              </div>
            ) : (
              <div className="simple-map-wrapper">
                <SimpleMap 
                  height="400px"
                  currentLocation={currentLocation}
                  showControls={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionTracker;
