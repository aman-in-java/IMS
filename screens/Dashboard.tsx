// screens/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { dataService } from '../services/api';
import type { StockLot, DerivedStockState, Item, Pool, Location, Area, RAGState } from '../types';
import { Action } from '../types';
import { calculateDerivedStates } from '../utils/stockCalculations';
import { RAGPill } from '../components/ui/RAGPill';
import { useAuth } from '../hooks/useAuth';

// --- Reusable Components ---

const DashboardCard: React.FC<DerivedStockState> = ({ label, value, description }) => (
    <Card className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
    </Card>
);

interface RAGCollectionProps {
  stockState: RAGState;
  qualityState: RAGState;
  supplyState: RAGState;
}

const RAGCollection: React.FC<RAGCollectionProps> = ({ stockState, qualityState, supplyState }) => (
    <div className="flex items-center space-x-2">
      <RAGPill state={stockState} label="S" />
      <RAGPill state={qualityState} label="Q" />
      <RAGPill state={supplyState} label="U" />
    </div>
);


// --- Main Dashboard Screen ---

const Dashboard: React.FC = () => {
    const { can } = useAuth();
    // State for aggregate cards
    const [derivedStates, setDerivedStates] = useState<DerivedStockState[]>([]);
    
    // State for explorer data
    const [stockLots, setStockLots] = useState<StockLot[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [pools, setPools] = useState<Pool[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);

    // State for explorer filters
    const [selectedSku, setSelectedSku] = useState('');
    const [selectedPool, setSelectedPool] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedArea, setSelectedArea] = useState('');

    useEffect(() => {
        // Data is pre-loaded by AuthContext, so we can get it synchronously
        const lots = dataService.getStockLots();
        const states = calculateDerivedStates(lots);
        setDerivedStates(states);
        
        // Load data for explorer
        setStockLots(lots);
        setItems(dataService.getItems());
        setPools(dataService.getPools());
        setLocations(dataService.getLocations());
        setAreas(dataService.getAreas());
    }, []);

    const dataMaps = useMemo(() => ({
        items: new Map(items.map(i => [i.id, i.name])),
        pools: new Map(pools.map(p => [p.id, p.name])),
        locations: new Map(locations.map(l => [l.id, l.name])),
        areas: new Map(areas.map(a => [a.id, a.name])),
    }), [items, pools, locations, areas]);
    
    const availableAreas = useMemo(() => {
        if (!selectedLocation) return areas;
        return areas.filter(a => a.locationId === selectedLocation);
    }, [selectedLocation, areas]);

    const filteredLots = useMemo(() => {
        return stockLots.filter(lot => {
            if (selectedSku && lot.sku !== selectedSku) return false;
            // For pools, check if the selected pool is involved as Owner, Source, or Custody
            if (selectedPool && (lot.mpId !== selectedPool && lot.spId !== selectedPool && lot.cpId !== selectedPool)) return false;
            if (selectedLocation && lot.locationId !== selectedLocation) return false;
            if (selectedArea && lot.areaId !== selectedArea) return false;
            return true;
        });
    }, [stockLots, selectedSku, selectedPool, selectedLocation, selectedArea]);
    
    const handleResetFilters = () => {
        setSelectedSku('');
        setSelectedPool('');
        setSelectedLocation('');
        setSelectedArea('');
    };
    
    const handleChangeState = (lot: StockLot) => {
        alert(`State change authorized for lot: ${dataMaps.items.get(lot.sku)}`);
        // In a real app, this would open a modal to change the RAG states.
    };

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

            <Card className="mt-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Stock Lot Explorer</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                    <div>
                        <label htmlFor="skuFilter" className="block text-sm font-medium text-gray-700">SKU / Item</label>
                        <select id="skuFilter" value={selectedSku} onChange={e => setSelectedSku(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">All Items</option>
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="poolFilter" className="block text-sm font-medium text-gray-700">Pool</label>
                        <select id="poolFilter" value={selectedPool} onChange={e => setSelectedPool(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">All Pools</option>
                            {pools.map(pool => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700">Location</label>
                        <select id="locationFilter" value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setSelectedArea(''); }} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">All Locations</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="areaFilter" className="block text-sm font-medium text-gray-700">Area</label>
                        <select id="areaFilter" value={selectedArea} onChange={e => setSelectedArea(e.target.value)} disabled={!selectedLocation} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed">
                            <option value="">All Areas</option>
                            {availableAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button onClick={handleResetFilters} className="w-full bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Reset</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pools (Owner/Source/Custody)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location / Area</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">States (S/Q/U)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLots.length > 0 ? (
                                filteredLots.map(lot => {
                                    const canChangeState = can(Action.CHANGE_STOCK_STATE, { stockLot: lot });
                                    return (
                                    <tr key={lot.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataMaps.items.get(lot.sku) || lot.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.quantity.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div><span className="font-semibold text-gray-700">O:</span> {dataMaps.pools.get(lot.mpId) || 'N/A'}</div>
                                            <div><span className="font-semibold text-gray-700">S:</span> {dataMaps.pools.get(lot.spId) || 'N/A'}</div>
                                            <div><span className="font-semibold text-gray-700">C:</span> {dataMaps.pools.get(lot.cpId) || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{dataMaps.locations.get(lot.locationId) || 'N/A'}</div>
                                            {lot.areaId && <div className="text-xs text-gray-400">{dataMaps.areas.get(lot.areaId) || 'N/A'}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <RAGCollection stockState={lot.stockState} qualityState={lot.qualityState} supplyState={lot.supplyState} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button 
                                                onClick={() => handleChangeState(lot)} 
                                                disabled={!canChangeState}
                                                className="bg-white py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                            >
                                                Change State
                                            </button>
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 px-6 text-gray-500">
                                        No stock lots match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;