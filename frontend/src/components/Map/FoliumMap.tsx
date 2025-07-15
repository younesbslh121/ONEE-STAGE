import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './FoliumMap.css';

interface FoliumMapProps {
  height?: string;
  refreshInterval?: number;
  vehicleId?: number;
  showRoute?: boolean;
}

const FoliumMap: React.FC<FoliumMapProps> = ({ 
  height = '600px', 
  refreshInterval = 30000,
  vehicleId,
  showRoute = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadMap = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = 'http://localhost:5000/api/map/folium-embed';
      
      // Si un véhicule spécifique est demandé avec sa route
      if (vehicleId && showRoute) {
        url = `http://localhost:5000/api/map/folium-map-with-route/${vehicleId}`;
      }

      const response = await axios.get(url, {
        responseType: 'text', // Important pour récupérer le HTML
        headers: {
          'Accept': 'text/html'
        }
      });

      // Créer un blob URL pour le HTML
      const blob = new Blob([response.data], { type: 'text/html' });
      const url_obj = URL.createObjectURL(blob);
      
      // Nettoyer l'ancienne URL si elle existe
      if (mapUrl) {
        URL.revokeObjectURL(mapUrl);
      }
      
      setMapUrl(url_obj);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la carte Folium:', err);
      setError('Impossible de charger la carte. Vérifiez que le serveur backend est démarré.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMap();

    // Cleanup function
    return () => {
      if (mapUrl) {
        URL.revokeObjectURL(mapUrl);
      }
    };
  }, [vehicleId, showRoute]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(loadMap, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, vehicleId, showRoute]);

  const handleRefresh = () => {
    loadMap();
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="folium-map-container" style={{ height }}>
        <div className="folium-loading">
          <div className="folium-spinner"></div>
          <p>Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="folium-map-container" style={{ height }}>
        <div className="folium-error">
          <div className="folium-error-icon">⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="folium-retry-btn">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="folium-map-container" style={{ height }}>
      <div className="folium-map-header">
        <div className="folium-map-info">
          <h3>🗺️ Carte Interactive</h3>
          {lastUpdate && (
            <span className="folium-last-update">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="folium-map-controls">
          <button onClick={handleRefresh} className="folium-control-btn" title="Actualiser">
            🔄
          </button>
          <button onClick={handleFullscreen} className="folium-control-btn" title="Plein écran">
            📺
          </button>
        </div>
      </div>
      
      {mapUrl && (
        <iframe
          ref={iframeRef}
          src={mapUrl}
          className="folium-map-iframe"
          title="Fleet Management Map"
          frameBorder="0"
          allowFullScreen
          style={{ 
            width: '100%', 
            height: `calc(${height} - 60px)`,
            border: 'none',
            borderRadius: '0 0 8px 8px'
          }}
        />
      )}
    </div>
  );
};

export default FoliumMap;
