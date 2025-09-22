// components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICON_MAP } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Action } from '../../types';

const Sidebar: React.FC = () => {
  const { user, logout, can } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: ICON_MAP.Dashboard, action: Action.VIEW_DASHBOARD },
    { path: '/binder', label: 'Binder (Items)', icon: ICON_MAP.Binder, action: Action.VIEW_POOLS }, // Assuming binder access is tied to pools
    { path: '/pools', label: 'Pools', icon: ICON_MAP.Pools, action: Action.VIEW_POOLS },
    { path: '/locations', label: 'Locations', icon: ICON_MAP.Locations, action: Action.VIEW_LOCATIONS },
    { path: '/zones', label: 'Areas (Zones)', icon: ICON_MAP.Areas, action: Action.VIEW_AREAS },
    { path: '/inbound', label: 'Inbound Receiving', icon: ICON_MAP.Inbound, action: Action.VIEW_DASHBOARD }, // Placeholder permission
    { path: '/permissions', label: 'Permissions', icon: ICON_MAP.Permissions, action: Action.VIEW_PERMISSIONS },
  ];
  
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col shrink-0">
      <div className="h-16 flex items-center justify-center text-xl font-bold border-b border-gray-700">
        {ICON_MAP.Logo}
        <span className="ml-3">AIMS</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.filter(item => can(item.action)).map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
            <span className="ml-3">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-700 p-4">
        {user && (
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                </div>
            </div>
        )}
        <button onClick={logout} className="w-full mt-4 text-left flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
            <svg xmlns="http://www.w.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
