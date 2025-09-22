// screens/InboundReceivingScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { dataService } from '../services/api';
import type { StockLot, Item, Pool, Location, Area } from '../types';
import { PoolNature, RAGState } from '../types';

const RECEIVING_POOL_ID = 'pool-receiving';
const RECEIVING_AREA_ID = 'area-1';

// --- Assignment Modal Component ---
interface AssignStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    lot: StockLot | null;
    pools: Pool[];
    areas: Area[];
    onAssign: (lot: StockLot, destinationPoolId: string, destinationAreaId: string) => void;
}

const AssignStockModal: React.FC<AssignStockModalProps> = ({ isOpen, onClose, lot, pools, areas, onAssign }) => {
    const [destinationPoolId, setDestinationPoolId] = useState('');
    const [destinationAreaId, setDestinationAreaId] = useState('');
    
    useEffect(() => {
        if (lot) {
            setDestinationPoolId('');
            setDestinationAreaId('');
        }
    }, [lot]);

    if (!lot) return null;
    
    const ownerPools = pools.filter(p => [PoolNature.INVENTORY, PoolNature.ASSETS, PoolNature.OFF_INVENTORY].includes(p.nature));
    const destinationAreas = areas.filter(a => a.locationId === lot.locationId && a.id !== RECEIVING_AREA_ID);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAssign(lot, destinationPoolId, destinationAreaId);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Stock Lot">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p className="text-sm"><span className="font-medium text-gray-700">Item:</span> {dataService.getItems().find(i => i.id === lot.sku)?.name}</p>
                    <p className="text-sm"><span className="font-medium text-gray-700">Quantity:</span> {lot.quantity}</p>
                    <p className="text-sm"><span className="font-medium text-gray-700">From:</span> {dataService.getPools().find(p => p.id === lot.spId)?.name}</p>
                </div>
                <hr/>
                <div>
                    <label htmlFor="destinationPoolId" className="block text-sm font-medium text-gray-700">Destination Pool</label>
                    <select id="destinationPoolId" value={destinationPoolId} onChange={(e) => setDestinationPoolId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Select an owner pool...</option>
                        {ownerPools.map(pool => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="destinationAreaId" className="block text-sm font-medium text-gray-700">Destination Area</label>
                    <select id="destinationAreaId" value={destinationAreaId} onChange={(e) => setDestinationAreaId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Select a storage area...</option>
                        {destinationAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700">Confirm Assignment</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Screen Component ---
const InboundReceivingScreen: React.FC = () => {
    // Data stores
    const [stockLots, setStockLots] = useState<StockLot[]>([]);
    const [pools, setPools] = useState<Pool[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLot, setSelectedLot] = useState<StockLot | null>(null);

    // Load all necessary data
    const refreshData = () => {
        setStockLots(dataService.getStockLots());
        setPools(dataService.getPools());
        setAreas(dataService.getAreas());
    };
    
    useEffect(() => {
        refreshData();
    }, []);

    const unassignedLots = useMemo(() => stockLots.filter(lot => lot.mpId === RECEIVING_POOL_ID), [stockLots]);

    const dataMaps = useMemo(() => ({
        items: new Map(dataService.getItems().map(i => [i.id, i.name])),
        pools: new Map(pools.map(p => [p.id, p.name])),
        locations: new Map(dataService.getLocations().map(l => [l.id, l.name])),
    }), [pools]);

    const handleOpenModal = (lot: StockLot) => {
        setSelectedLot(lot);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLot(null);
    };

    const handleAssignLot = async (lot: StockLot, destinationPoolId: string, destinationAreaId: string) => {
        const updatedLot: StockLot = {
            ...lot,
            mpId: destinationPoolId,
            cpId: destinationPoolId, // Custody moves to the new owner pool
            areaId: destinationAreaId,
            stockState: RAGState.Green, // Now available
            supplyState: RAGState.Green, // Fully supplied
            // qualityState remains Amber, assuming a separate QC process
        };

        try {
            await dataService.updateStockLot(updatedLot);
            refreshData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to assign stock lot:", error);
            // In a real app, show an error to the user
        }
    };
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Inbound Control Ledger</h1>
            
            <Card>
                <h2 className="text-lg font-medium text-gray-800 mb-4">Items Pending Assignment</h2>
                {unassignedLots.length === 0 ? (
                     <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-700">All Clear!</h3>
                        <p className="text-gray-500 mt-2">No items are currently pending assignment.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {unassignedLots.map(lot => (
                                    <tr key={lot.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataMaps.items.get(lot.sku) || lot.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.quantity.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dataMaps.pools.get(lot.spId) || lot.spId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dataMaps.locations.get(lot.locationId) || lot.locationId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(lot)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 text-xs font-semibold">
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <AssignStockModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                lot={selectedLot}
                pools={pools}
                areas={areas}
                onAssign={handleAssignLot}
            />
        </div>
    );
};

export default InboundReceivingScreen;
