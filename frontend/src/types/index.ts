export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'technician' | 'inspector';
  grade?: 'agent_execution' | 'agent_maitrise' | 'agent_commandement' | 'haut_cadre';
  first_name: string;
  last_name: string;
  phone?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  driver_id?: number;
  driver?: User;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  start_latitude?: number;
  start_longitude?: number;
  start_address?: string;
  end_latitude?: number;
  end_longitude?: number;
  end_address?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  start_time?: string;
  end_time?: string | null;
  assigned_user_id: number;
  vehicle_id: number;
  created_by?: number;
  assigned_user?: User;
  vehicle?: Vehicle;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
  vehicle_id: number;
  mission_id?: number;
  created_at: string;
}

export interface Anomaly {
  id: number;
  type: 'excessive_fuel' | 'personal_use' | 'route_deviation' | 'unauthorized_stop' | 'maintenance_due' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  vehicle_id: number;
  mission_id?: number;
  user_id?: number;
  fuel_consumed?: number;
  expected_fuel?: number;
  location_latitude?: number;
  location_longitude?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  notes?: string;
  created_at: string;
}

export interface ReimbursementRate {
  grade: 'agent_execution' | 'agent_maitrise' | 'agent_commandement' | 'haut_cadre';
  dejeuner: number;
  dinner: number;
  hebergement: number;
}

export interface MissionReimbursement {
  id: number;
  mission_id: number;
  user_id: number;
  grade: 'agent_execution' | 'agent_maitrise' | 'agent_commandement' | 'haut_cadre';
  dejeuner_amount: number;
  dinner_amount: number;
  hebergement_amount: number;
  total_amount: number;
  days_count: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  updated_at: string;
  mission?: Mission;
  user?: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  vehicles: {
    total: number;
    available: number;
    in_use: number;
    maintenance: number;
  };
  missions: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  users: {
    total: number;
    active: number;
  };
  anomalies: {
    recent: number;
  };
}
