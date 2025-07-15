import React, { useEffect, useState, useRef } from 'react';
import './FoliumMapEmbed.css';

interface FoliumMapEmbedProps {
  height?: string;
  refreshInterval?: number;
  showControls?: boolean;
}

const FoliumMapEmbed: React.FC<FoliumMapEmbedProps> = ({
  height = '600px',
  refreshInterval = 30000, // 30 secondes
  showControls = true
}) => {
  const [mapHtml, setMapHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMapData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/map/test-folium');
      
      if (!response.ok) {
        throw new Error(`Serveur backend indisponible (${response.status})`);
      }
      
      const html = await response.text();
      setMapHtml(html);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Erreur lors du chargement de la carte:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      
      // Si c'est une erreur de réseau, suggérer l'utilisation de SimpleMap
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('indisponible')) {
        setError('Serveur backend indisponible. Utilisez la carte simple.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMapData();
  };

  const toggleAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else {
      intervalRef.current = setInterval(fetchMapData, refreshInterval);
    }
  };

  useEffect(() => {
    // Chargement initial
    fetchMapData();

    // Auto-refresh
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMapData, refreshInterval);
    }

    // Nettoyage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  // Créer une URL blob pour l'iframe
  const createBlobUrl = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="folium-map-embed-container">
      {showControls && (
        <div className="map-controls">
          <div className="control-group">
            <button 
              onClick={handleRefresh} 
              className="control-btn refresh-btn"
              disabled={isLoading}
            >
              🔄 {isLoading ? 'Actualisation...' : 'Actualiser'}
            </button>
            
            <button 
              onClick={toggleAutoRefresh}
              className={`control-btn auto-refresh-btn ${intervalRef.current ? 'active' : ''}`}
            >
              ⏰ Auto-refresh {intervalRef.current ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {lastUpdate && (
            <div className="last-update">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>
      )}
      
      <div className="map-container" style={{ height }}>
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Chargement de la carte...</div>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h3>Erreur de chargement</h3>
              <p>{error}</p>
              <button onClick={handleRefresh} className="retry-btn">
                Réessayer
              </button>
            </div>
          </div>
        )}
        
        {mapHtml && !error && (
          <iframe
            ref={iframeRef}
            src={createBlobUrl(mapHtml)}
            title="Carte de géolocalisation Folium"
            className="folium-iframe"
            style={{ 
              width: '100%', 
              height: '100%',
              border: 'none',
              borderRadius: '12px'
            }}
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FoliumMapEmbed;
