import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet dans React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapSimple: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler un temps de chargement puis afficher la carte
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          Chargement de la carte...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div style={{
        padding: '10px',
        backgroundColor: '#007bff',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>🗺️ Carte Simple de Test - Fleet Management</h2>
        <p>Carte avec véhicules de test à Paris</p>
      </div>
      
      <div style={{ height: 'calc(100vh - 80px)' }}>
        <MapContainer
          center={[48.8566, 2.3522]} // Paris
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Véhicule 1 - Tour Eiffel */}
          <Marker position={[48.8584, 2.2945]}>
            <Popup>
              <div>
                <strong>🚗 Véhicule ABC-123</strong><br />
                Statut: <span style={{color: 'green'}}>Disponible</span><br />
                Localisation: Tour Eiffel<br />
                Dernière MAJ: {new Date().toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {/* Véhicule 2 - Louvre */}
          <Marker position={[48.8606, 2.3376]}>
            <Popup>
              <div>
                <strong>🚐 Véhicule XYZ-789</strong><br />
                Statut: <span style={{color: 'blue'}}>En service</span><br />
                Localisation: Musée du Louvre<br />
                Dernière MAJ: {new Date().toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {/* Véhicule 3 - Notre-Dame */}
          <Marker position={[48.8530, 2.3499]}>
            <Popup>
              <div>
                <strong>🚙 Véhicule DEF-456</strong><br />
                Statut: <span style={{color: 'orange'}}>Maintenance</span><br />
                Localisation: Notre-Dame<br />
                Dernière MAJ: {new Date().toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {/* Véhicule 4 - Champs-Élysées */}
          <Marker position={[48.8698, 2.3076]}>
            <Popup>
              <div>
                <strong>🚚 Véhicule GHI-012</strong><br />
                Statut: <span style={{color: 'green'}}>Disponible</span><br />
                Localisation: Champs-Élysées<br />
                Dernière MAJ: {new Date().toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      <div style={{
        position: 'absolute',
        top: '100px',
        left: '10px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '250px'
      }}>
        <h4>📊 Véhicules de la flotte</h4>
        <div style={{ fontSize: '14px' }}>
          <div style={{ marginBottom: '8px' }}>
            🚗 <strong>ABC-123</strong> - <span style={{color: 'green'}}>Disponible</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            🚐 <strong>XYZ-789</strong> - <span style={{color: 'blue'}}>En service</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            🚙 <strong>DEF-456</strong> - <span style={{color: 'orange'}}>Maintenance</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            🚚 <strong>GHI-012</strong> - <span style={{color: 'green'}}>Disponible</span>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Total: 4 véhicules
        </div>
      </div>
    </div>
  );
};

export default MapSimple;
