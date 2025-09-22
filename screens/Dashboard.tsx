
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { dataService } from '../services/api';
import type { StockLot, DerivedStockState } from '../types';
import { calculateDerivedStates } from '../utils/stockCalculations';

const DashboardCard: React.FC<DerivedStockState> = ({ label, value, description }) => (
    <Card className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
    </Card>
);

const Dashboard: React.FC = () => {
    const [derivedStates, setDerivedStates] = useState<DerivedStockState[]>([]);

    useEffect(() => {
        // Data is pre-loaded by AuthContext, so we can get it synchronously
        const lots = dataService.getStockLots();
        const states = calculateDerivedStates(lots);
        setDerivedStates(states);
    }, []);
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            {derivedStates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {derivedStates.map(state => (
                        <DashboardCard key={state.label} {...state} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12">No stock data available.</div>
            )}
        </div>
    );
};

export default Dashboard;
