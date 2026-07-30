export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
}
