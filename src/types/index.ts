export type Role = 'owner' | 'admin' | 'reseller';

export interface User {
  id: string;
  username: string;
  role: Role;
  level: number;
  balance: number;
  status?: string;
  created_at?: string;
}

export interface LicenseKey {
  id: string;
  user_key: string;
  game: string;
  duration: '1d' | '7d' | '30d' | 'lifetime' | string;
  status: 'unused' | 'active' | 'paused' | 'expired' | 'banned';
  hwid: string | null;
  max_devices: number;
  created_at: string;
  first_used_at: string | null;
  expires_at: string | null;
  paused_at: string | null;
  remaining_seconds_on_pause: number;
  reset_count: number;
  last_reset_at: string | null;
  created_by: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  ticket_id: number;
  game: string;
  duration: string;
  devices: string;
  action: string;
  status: 'success' | 'warning' | 'danger';
  timestamp: string;
}

export interface DashboardStats {
  total_keys: number;
  active_keys: number;
  unused_keys: number;
  expired_keys: number;
  paused_keys: number;
  reset_count: number;
  admins_count: number;
  resellers_count: number;
  total_users_count: number;
}

export interface SystemSettings {
  site_name: string;
  default_game: string;
  secret_key?: string;
  maintenance_mode: boolean;
  allow_client_self_reset: boolean;
  client_reset_cooldown_hours: number;
  announcement: string;
  reseller_prices: Record<string, number>;
}
