import React, { useState, useEffect } from 'react';
import SimpleMap from './SimpleMap';
import { missionService } from '../services/missionService';
import { Vehicle } from '../types';

interface MultipleVehicleTrackerProps {
  missionIds: number[];
}

const MultipleVehicleTracker: React.FC<MultipleVehicleTrackerProps> = ({ missionIds }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const missions = await Promise.all(missionIds.map(id => missionService.getMission(id)));
        const vehicles = missions.map(mission => mission.vehicle).filter(v => v !== undefined) as Vehicle[];
        setVehicles(vehicles);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [missionIds]);

  return (
    <div>
      <h3>Real-time Vehicle Tracking</h3>
      <SimpleMap vehicles={vehicles} />
    </div>
  );
};

export default MultipleVehicleTracker;
