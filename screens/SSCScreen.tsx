// screens/SSCScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { StockSelectionCriteria, Pool, Area } from '../types';
import { RAGState, Action } from '../types';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Tag } from '../components/ui/Tag';
import { RAGPill } from '../components/ui/RAGPill';
import { ICON_MAP } from '../constants';
import { dataService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// --- Form Component ---
const SSCForm: React.FC<{
    ssc?: StockSelectionCriteria | null;
    pools: Pool[];
    areas: Area[];
    onSave: (ssc: Omit<StockSelectionCriteria, 'id'> | StockSelectionCriteria) => void;
    onCancel: () => void;
}> = ({ ssc, pools, areas, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        poolId: ssc?.poolId || '',
        areaId: ssc?.areaId || '',
        status: ssc?.status || RAGState.Green,
        classes: ssc?.classes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ssc) {
            onSave({ ...ssc, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="poolId" className="block text-sm font-medium text-gray-700">Pool</label>
                <select name="poolId" id="poolId" value={formData.poolId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">Select a pool</option>
                    {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="areaId" className="block text-sm font-medium text-gray-700">Area</label>
                <select name="areaId" id="areaId" value={formData.areaId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">Select an area</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {Object.values(RAGState).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="classes" className="block text-sm font-medium text-gray-700">Classes (comma-separated)</label>
                <input type="text" name="classes" id="classes" value={formData.classes} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700">Save Criteria</button>
            </div>
        </form>
    );
};

// --- Main Screen Component ---
const SSCScreen: React.FC = () => {
    const [sscs, setSscs] = useState<StockSelectionCriteria[]>([]);
    const [pools, setPools] = useState<Pool[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSsc, setEditingSsc] = useState<StockSelectionCriteria | null>(null);

    const { can } = useAuth();
    const canManage = can(Action.MANAGE_SSC);

    const refreshData = () => {
        setSscs(dataService.getStockSelectionCriteria());
        setPools(dataService.getPools());
        setAreas(dataService.getAreas());
    };

    useEffect(() => {
        refreshData();
    }, []);

    const dataMaps = useMemo(() => ({
        pools: new Map(pools.map(p => [p.id, p.name])),
        areas: new Map(areas.map(a => [a.id, a.name])),
    }), [pools, areas]);

    const handleOpenCreateModal = () => {
        setEditingSsc(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (ssc: StockSelectionCriteria) => {
        setEditingSsc(ssc);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSsc(null);
    };

    const handleSaveSsc = async (sscData: Omit<StockSelectionCriteria, 'id'> | StockSelectionCriteria) => {
        if ('id' in sscData) {
            await dataService.updateSSC(sscData);
        } else {
            await dataService.createSSC(sscData);
        }
        refreshData();
        handleCloseModal();
    };

    const handleDeleteSsc = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this criterion?')) {
            await dataService.deleteSSC(id);
            refreshData();
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stock Selection Criteria</h1>
                {canManage && (
                    <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
                        Create Criterion
                    </button>
                )}
            </div>
            <Card>
                {sscs.length === 0 ? (
                    <div className="text-center py-12">No Stock Selection Criteria defined.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                                    {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sscs.map((ssc) => (
                                    <tr key={ssc.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataMaps.pools.get(ssc.poolId) || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dataMaps.areas.get(ssc.areaId) || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <RAGPill state={ssc.status} label={ssc.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {ssc.classes.split(',').map(c => c.trim()).filter(Boolean).map((cls, i) => (
                                                    <Tag key={i} color="gray">{cls}</Tag>
                                                ))}
                                            </div>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleOpenEditModal(ssc)} className="text-indigo-600 hover:text-indigo-900">{ICON_MAP.Edit}</button>
                                                <button onClick={() => handleDeleteSsc(ssc.id)} className="text-red-600 hover:text-red-900">{ICON_MAP.Delete}</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSsc ? 'Edit Criterion' : 'Create Criterion'}>
                <SSCForm
                    ssc={editingSsc}
                    pools={pools}
                    areas={areas}
                    onSave={handleSaveSsc}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default SSCScreen;
