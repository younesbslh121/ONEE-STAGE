import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LeafletMissionMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  height?: string;
  missionData?: {
    mission: {
      id: number;
      title: string;
      start_location: { latitude: number; longitude: number; address: string };
      end_location: { latitude: number; longitude: number; address: string };
      assigned_user?: { name: string; role: string };
      vehicle?: { license_plate: string; brand: string; model: string };
    };
    current_location?: {
      latitude: number;
      longitude: number;
      timestamp: string;
      speed: number;
    };
    route: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
      speed: number;
    }>;
    other_collaborators: Array<{
      mission_title: string;
      collaborator: { name: string; role: string };
      vehicle: { license_plate: string };
      location: { latitude: number; longitude: number; speed: number };
    }>;
  };
}

const LeafletMissionMap: React.FC<LeafletMissionMapProps> = ({
  center,
  zoom = 13,
  height = '500px',
  missionData
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([center.latitude, center.longitude], zoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add mission data if provided
    if (missionData) {
      addMissionData(map, missionData);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when data changes
  useEffect(() => {
    if (mapInstanceRef.current && missionData) {
      // Clear existing layers except base tile layer
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Circle) {
          mapInstanceRef.current!.removeLayer(layer);
        }
      });

      // Add updated mission data
      addMissionData(mapInstanceRef.current, missionData);
    }
  }, [missionData]);

  const addMissionData = (map: L.Map, data: NonNullable<LeafletMissionMapProps['missionData']>) => {
    // Define custom icons
    const missionIcon = L.divIcon({
      html: '🎯',
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const vehicleIcon = L.divIcon({
      html: '🚗',
      className: 'custom-marker vehicle-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const collaboratorIcon = L.divIcon({
      html: '👤',
      className: 'custom-marker collaborator-marker',
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    });

    // Add start and end markers for the mission
    if (data.mission.start_location) {
      L.marker([data.mission.start_location.latitude, data.mission.start_location.longitude], {
        icon: L.divIcon({
          html: '🟢',
          className: 'custom-marker start-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>Départ: ${data.mission.title}</h4>
            <p><strong>Adresse:</strong> ${data.mission.start_location.address}</p>
          </div>
        `);
    }

    if (data.mission.end_location) {
      L.marker([data.mission.end_location.latitude, data.mission.end_location.longitude], {
        icon: L.divIcon({
          html: '🔴',
          className: 'custom-marker end-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>Destination: ${data.mission.title}</h4>
            <p><strong>Adresse:</strong> ${data.mission.end_location.address}</p>
          </div>
        `);
    }

    // Add current vehicle position
    if (data.current_location) {
      L.marker([data.current_location.latitude, data.current_location.longitude], {
        icon: vehicleIcon
      })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>🚗 ${data.mission.vehicle?.license_plate || 'Véhicule'}</h4>
            <p><strong>Mission:</strong> ${data.mission.title}</p>
            <p><strong>Conducteur:</strong> ${data.mission.assigned_user?.name || 'N/A'}</p>
            <p><strong>Vitesse:</strong> ${data.current_location.speed.toFixed(1)} km/h</p>
            <p><strong>Dernière mise à jour:</strong> ${new Date(data.current_location.timestamp).toLocaleString('fr-FR')}</p>
          </div>
        `);

      // Add speed circle around vehicle
      const speedRadius = Math.max(50, data.current_location.speed * 2); // Minimum 50m radius
      L.circle([data.current_location.latitude, data.current_location.longitude], {
        color: data.current_location.speed > 50 ? 'red' : data.current_location.speed > 30 ? 'orange' : 'green',
        fillColor: data.current_location.speed > 50 ? 'red' : data.current_location.speed > 30 ? 'orange' : 'green',
        fillOpacity: 0.1,
        radius: speedRadius
      }).addTo(map);
    }

    // Add route path
    if (data.route && data.route.length > 1) {
      const routeCoordinates = data.route.map(point => [point.latitude, point.longitude] as [number, number]);
      L.polyline(routeCoordinates, {
        color: 'blue',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(map).bindPopup('Parcours effectué');
    }

    // Add other collaborators
    data.other_collaborators.forEach((collab, index) => {
      L.marker([collab.location.latitude, collab.location.longitude], {
        icon: collaboratorIcon
      })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>👤 ${collab.collaborator.name}</h4>
            <p><strong>Mission:</strong> ${collab.mission_title}</p>
            <p><strong>Véhicule:</strong> ${collab.vehicle.license_plate}</p>
            <p><strong>Rôle:</strong> ${collab.collaborator.role}</p>
            <p><strong>Vitesse:</strong> ${collab.location.speed.toFixed(1)} km/h</p>
          </div>
        `);
    });

    // Fit map to show all markers
    const group = new L.FeatureGroup();
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        group.addLayer(layer);
      }
    });

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '8px' }} />
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
          font-size: 20px;
          text-align: center;
          line-height: 30px;
        }
        .vehicle-marker {
          animation: pulse 2s infinite;
        }
        .collaborator-marker {
          opacity: 0.8;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LeafletMissionMap;
