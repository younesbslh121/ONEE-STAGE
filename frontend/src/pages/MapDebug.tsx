import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import OnepLogo from '../components/OnepLogo';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapDebug: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Petite attente pour s'assurer que tous les composants sont montés
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <OnepLogo width={80} height={80} />
          <p style={{ marginTop: '20px', fontSize: '1.2em' }}>Chargement de la carte ONEP...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 75px)', width: '100%' }}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <OnepLogo width={40} height={40} />
        <h1 style={{ margin: 0, color: '#2d3748' }}>Carte de la Flotte ONEP - Maroc</h1>
      </div>
      
      <div style={{ height: 'calc(100% - 80px)', width: '100%' }}>
        <MapContainer
          center={[33.9716, -6.8498]} // Rabat, Maroc
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marker principal ONEP */}
          <Marker position={[33.9716, -6.8498]}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <OnepLogo width={60} height={60} />
                <h3 style={{ margin: '10px 0 5px 0', color: '#0066CC' }}>ONEP</h3>
                <p style={{ margin: '0', fontSize: '0.9em' }}>Office National de l'Eau Potable</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: '#666' }}>Rabat, Maroc</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Véhicules de test */}
          <Marker position={[33.9816, -6.8398]}>
            <Popup>
              <div>
                <strong>🚚 ONEP-001</strong><br/>
                Status: Disponible<br/>
                Zone: Rabat Centre
              </div>
            </Popup>
          </Marker>
          
          <Marker position={[33.9616, -6.8598]}>
            <Popup>
              <div>
                <strong>🚛 ONEP-002</strong><br/>
                Status: En mission<br/>
                Zone: Agdal
              </div>
            </Popup>
          </Marker>
          
          <Marker position={[33.9916, -6.8298]}>
            <Popup>
              <div>
                <strong>🚐 ONEP-003</strong><br/>
                Status: Maintenance<br/>
                Zone: Souissi
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapDebug;
