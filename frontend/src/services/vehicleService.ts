import { Vehicle } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/noauth`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.vehicles || [];
  },

  async getVehicle(id: number): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/noauth/${id}`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.vehicle;
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/noauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicle),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.vehicle;
  },

  async updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/noauth/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicle),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.vehicle;
  },

  async deleteVehicle(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/noauth/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
  },

  async getAvailableVehicles(): Promise<Vehicle[]> {
    const vehicles = await this.getVehicles();
    return vehicles.filter(vehicle => vehicle.status === 'available');
  }
};
