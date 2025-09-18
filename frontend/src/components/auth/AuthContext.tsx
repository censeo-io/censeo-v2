/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType } from "../../types/auth";
import { authApi } from "../../services/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESTORE_SESSION"; payload: User };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const createUnauthenticatedState = (state: AuthState): AuthState => ({
  ...state,
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGIN_FAILURE":
    case "LOGOUT":
      return createUnauthenticatedState(state);
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First, check if we have a stored user (for immediate UI feedback)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            dispatch({ type: "RESTORE_SESSION", payload: user });
          } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem("user");
          }
        }

        // Then verify with the server
        const statusResponse = await authApi.getStatus();

        if (statusResponse.authenticated && statusResponse.user) {
          dispatch({ type: "LOGIN_SUCCESS", payload: statusResponse.user });
          // Update localStorage with server data
          localStorage.setItem("user", JSON.stringify(statusResponse.user));
        } else {
          dispatch({ type: "LOGIN_FAILURE" });
          // Clear any stale data
          localStorage.removeItem("user");
          localStorage.removeItem("session_token");
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error);
        dispatch({ type: "LOGIN_FAILURE" });
        // Clear any stale data
        localStorage.removeItem("user");
        localStorage.removeItem("session_token");
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (name: string, email: string): Promise<void> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await authApi.login(name, email);

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(response.user));

      dispatch({ type: "LOGIN_SUCCESS", payload: response.user });
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // Always clear local state, even if the request fails
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("user");
      localStorage.removeItem("session_token");
    }
  };

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
