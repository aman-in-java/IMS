// contexts/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '../services/api';
import type { User, Role, PermissionGrant, Action, StockLot, StockSelectionCriteria } from '../types';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  permissions: PermissionGrant[];
  isLoading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  can: (action: Action, context?: { stockLot?: StockLot }) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [sscs, setSscs] = useState<StockSelectionCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      setIsLoading(true);
      try {
        await dataService.init();

        const usersData = dataService.getUsers();
        const rolesData = dataService.getRoles();
        const permissionsData = dataService.getPermissions();
        const sscsData = dataService.getStockSelectionCriteria();

        setAllUsers(usersData);
        setRoles(rolesData);
        setPermissions(permissionsData);
        setSscs(sscsData);
        
        if (usersData.length > 0) {
          setUser(usersData[0]); // Default to manager
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
    if(allUsers.length > 0) {
        login(allUsers[0].id); // Log back in as default user on logout for demo
    }
  };

  const userPermissions = useMemo(() => {
    if (!user) return [];
    return permissions.filter(p => user.roleIds.includes(p.roleId));
  }, [user, permissions]);

  const can = useCallback((action: Action, context?: { stockLot?: StockLot }): boolean => {
    if (!user) return false;

    const relevantGrants = userPermissions.filter(p => p.action === action);
    if (relevantGrants.length === 0) return false;

    const hasUnconstrainedGrant = relevantGrants.some(p => !p.constraints);
    if (hasUnconstrainedGrant) return true;

    if (context?.stockLot) {
      const { stockLot } = context;
      return relevantGrants.some(p => {
        if (!p.constraints) return false;
        
        const { allowedPoolIds, allowedAreaIds, matchingSscIds } = p.constraints;
        
        const poolMatch = !allowedPoolIds || allowedPoolIds.includes(stockLot.mpId);
        const areaMatch = !allowedAreaIds || (stockLot.areaId && allowedAreaIds.includes(stockLot.areaId));
        
        const sscMatch = !matchingSscIds || matchingSscIds.some(sscId => {
            const ssc = sscs.find(s => s.id === sscId);
            if (!ssc) return false;
            // A stock lot matches an SSC if all of its conditions are met
            return (
                stockLot.mpId === ssc.poolId &&
                stockLot.areaId === ssc.areaId &&
                stockLot.stockState === ssc.status
            );
        });

        // For a grant to pass, all its defined constraints must be met
        // If a constraint type is not defined, it is considered a pass
        let finalMatch = true;
        if (allowedPoolIds) finalMatch &&= poolMatch;
        if (allowedAreaIds) finalMatch &&= areaMatch;
        if (matchingSscIds) finalMatch &&= sscMatch;

        return finalMatch;
      });
    }

    return false; // Has constraints but no context to check against
  }, [user, userPermissions, sscs]);
  

  const value = { user, roles, permissions, isLoading, login, logout, can };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
