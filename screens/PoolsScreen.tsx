// screens/PoolsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Pool } from '../types';
import { PoolNature, PoolSubtype, Action } from '../types';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Modal } from '../components/ui/Modal';
import { ICON_MAP } from '../constants';
import { dataService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { POOL_SUBTYPE_MAP } from '../utils/poolUtils';

type PoolWithChildren = Pool & { children?: PoolWithChildren[] };

const PoolForm: React.FC<{
    pool?: Pool | null;
    pools: Pool[];
    onSave: (pool: Omit<Pool, 'id'> | Pool) => void;
    onCancel: () => void;
}> = ({ pool, pools, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: pool?.name || '',
        code: pool?.code || '',
        nature: pool?.nature || PoolNature.INVENTORY,
        subtype: pool?.subtype || POOL_SUBTYPE_MAP[PoolNature.INVENTORY][0],
        isNested: pool?.isNested || false,
        parentId: pool?.parentId || '',
    });

    useEffect(() => {
        // Reset subtype if nature changes to something that doesn't include the current subtype
        const validSubtypes = POOL_SUBTYPE_MAP[formData.nature];
        if (!validSubtypes.includes(formData.subtype)) {
            setFormData(prev => ({ ...prev, subtype: validSubtypes[0] }));
        }
    }, [formData.nature, formData.subtype]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (!dataToSave.isNested) {
            delete dataToSave.parentId;
        }
        if (pool) {
            onSave({ ...pool, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Pool Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code</label>
                <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="nature" className="block text-sm font-medium text-gray-700">Nature</label>
                <select name="nature" id="nature" value={formData.nature} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {Object.values(PoolNature).map(nature => <option key={nature} value={nature}>{nature}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="subtype" className="block text-sm font-medium text-gray-700">Subtype</label>
                <select name="subtype" id="subtype" value={formData.subtype} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {POOL_SUBTYPE_MAP[formData.nature].map(subtype => <option key={subtype} value={subtype}>{subtype}</option>)}
                </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="isNested" id="isNested" checked={formData.isNested} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isNested" className="ml-2 block text-sm text-gray-900">Is Nested Pool</label>
            </div>
            {formData.isNested && (
                 <div>
                    <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent Pool</label>
                    <select name="parentId" id="parentId" value={formData.parentId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Select a parent</option>
                        {pools.filter(p => p.id !== pool?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700">Save</button>
            </div>
        </form>
    );
};


const PoolsScreen: React.FC = () => {
    const [pools, setPools] = useState<Pool[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPool, setEditingPool] = useState<Pool | null>(null);
    
    const { can } = useAuth();
    const canManage = can(Action.MANAGE_POOLS);

    const refreshPools = () => {
        setPools(dataService.getPools());
    };
    
    useEffect(() => {
        refreshPools();
    }, []);

    const hierarchicalPools = useMemo(() => {
        const poolMap: Record<string, PoolWithChildren> = {};
        const roots: PoolWithChildren[] = [];

        pools.forEach(pool => {
            poolMap[pool.id] = { ...pool, children: [] };
        });

        pools.forEach(pool => {
            if (pool.isNested && pool.parentId && poolMap[pool.parentId]) {
                poolMap[pool.parentId].children?.push(poolMap[pool.id]);
            } else {
                roots.push(poolMap[pool.id]);
            }
        });
        return roots;
    }, [pools]);

    const handleOpenCreateModal = () => {
        setEditingPool(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (pool: Pool) => {
        setEditingPool(pool);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPool(null);
    };

    const handleSavePool = async (poolData: Omit<Pool, 'id'> | Pool) => {
        if ('id' in poolData) {
            await dataService.updatePool(poolData);
        } else {
            await dataService.createPool(poolData);
        }
        refreshPools();
        handleCloseModal();
    };

    const handleDeletePool = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this pool?')) {
            await dataService.deletePool(id);
            refreshPools();
        }
    };

    const renderPoolRows = (poolsToRender: PoolWithChildren[], level = 0) => {
        return poolsToRender.flatMap(pool => {
            const row = (
                <tr key={pool.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: `${1.5 + level * 1.5}rem` }}>
                        {level > 0 && <span className="text-gray-400 mr-2">↳</span>}
                        {pool.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Tag color="blue">{pool.nature}</Tag>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.subtype}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.code}</td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <button onClick={() => handleOpenEditModal(pool)} className="text-indigo-600 hover:text-indigo-900">{ICON_MAP.Edit}</button>
                          <button onClick={() => handleDeletePool(pool.id)} className="text-red-600 hover:text-red-900">{ICON_MAP.Delete}</button>
                      </td>
                    )}
                </tr>
            );
            
            const childRows = pool.children ? renderPoolRows(pool.children, level + 1) : [];
            return [row, ...childRows];
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Pools</h1>
              {canManage && (
                <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
                  Create Pool
                </button>
              )}
            </div>
            <Card>
                {pools.length === 0 ? (
                    <div className="text-center py-12">No pools found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtype</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {renderPoolRows(hierarchicalPools)}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPool ? 'Edit Pool' : 'Create Pool'}>
                <PoolForm 
                    pool={editingPool}
                    pools={pools}
                    onSave={handleSavePool}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default PoolsScreen;
