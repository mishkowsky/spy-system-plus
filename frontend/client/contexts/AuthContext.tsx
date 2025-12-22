import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from "@/types";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        apiClient.setAuthToken(token);
        const response = await apiClient.post<AuthResponse>(
          "/auth/login",
          "-1",
        );
        if (response.success && response.data) {
          const { user, token } = response.data;
          setUser(user);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      apiClient.clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const credentials_s = `${credentials.username}:${credentials.password}`;
      const encodedCredentials = btoa(credentials_s); // base64 encode
      apiClient.setAuthToken(encodedCredentials);
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials,
      );

      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setAuthToken(encodedCredentials);
        setUser(user);
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        data,
      );

      const { user, token } = response;
      apiClient.setAuthToken(token);
      setUser(user);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.clearAuthToken();
    setUser(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
