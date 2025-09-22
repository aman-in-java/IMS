// contexts/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '../services/api';
import type { User, Role, PermissionGrant, Action } from '../types';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  permissions: PermissionGrant[];
  isLoading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  can: (action: Action, context?: { poolId?: string; areaId?: string }) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      setIsLoading(true);
      try {
        // Initialize the data service: this fetches ALL data for the app
        await dataService.init();

        // Now that data is loaded, we can get it synchronously
        const usersData = dataService.getUsers();
        const rolesData = dataService.getRoles();
        const permissionsData = dataService.getPermissions();

        setAllUsers(usersData);
        setRoles(rolesData);
        setPermissions(permissionsData);
        
        // Default to logging in the first user (the manager) for demo purposes
        if (usersData.length > 0) {
          setUser(usersData[0]);
        }
      } catch (error) {
        console.error("Failed to load application data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = useCallback((userId: string) => {
    const userToLogin = allUsers.find(u => u.id === userId);
    setUser(userToLogin || null);
  }, [allUsers]);

  const logout = () => {
    setUser(null);
  };

  const userPermissions = useMemo(() => {
    if (!user) return [];
    return permissions.filter(p => user.roleIds.includes(p.roleId));
  }, [user, permissions]);

  const can = useCallback((action: Action, context?: { poolId?: string; areaId?: string }): boolean => {
    if (!user) return false;
    
    const relevantGrants = userPermissions.filter(p => p.action === action);
    if (relevantGrants.length === 0) return false; // No grant for this action

    // Check if any grant allows the action without constraints
    const hasUnconstrainedGrant = relevantGrants.some(p => !p.constraints);
    if (hasUnconstrainedGrant) return true;

    // If context is provided, check against constrained grants
    if (context) {
        return relevantGrants.some(p => {
            if (!p.constraints) return false; // Already handled by unconstrained check
            const { allowedPoolIds, allowedAreaIds } = p.constraints;
            
            const poolMatch = !context.poolId || !allowedPoolIds || allowedPoolIds.includes(context.poolId);
            const areaMatch = !context.areaId || !allowedAreaIds || allowedAreaIds.includes(context.areaId);

            return poolMatch && areaMatch;
        });
    }

    return false; // Action requires constraints, but no context was provided
  }, [user, userPermissions]);
  

  const value = { user, roles, permissions, isLoading, login, logout, can };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
