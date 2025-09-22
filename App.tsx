// App.tsx

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './screens/Dashboard';
import PoolsScreen from './screens/PoolsScreen';
import LocationsScreen from './screens/LocationsScreen';
import AreasScreen from './screens/AreasScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import GenericScreen from './screens/GenericScreen';
import InboundReceivingScreen from './screens/InboundReceivingScreen';
import SSCScreen from './screens/SSCScreen';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Loading System...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pools" element={<PoolsScreen />} />
            <Route path="/locations" element={<LocationsScreen />} />
            <Route path="/zones" element={<AreasScreen />} />
            <Route path="/ssc" element={<SSCScreen />} />
            <Route path="/permissions" element={<PermissionsScreen />} />
            <Route path="/inbound" element={<InboundReceivingScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;