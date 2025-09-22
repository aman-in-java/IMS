// screens/AreasScreen.tsx
import React, { useState, useEffect } from 'react';
import type { Area, Location } from '../types';
import { Card } from '../components/ui/Card';
import { ICON_MAP } from '../constants';
import { dataService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Action } from '../types';
import { Tag } from '../components/ui/Tag';
import { Modal } from '../components/ui/Modal';

const AreaForm: React.FC<{
    area?: Area | null;
    locations: Location[];
    onSave: (area: Omit<Area, 'id'> | Area) => void;
    onCancel: () => void;
}> = ({ area, locations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: area?.name || '',
        description: area?.description || '',
        locationId: area?.locationId || '',
        squareFeet: area?.squareFeet || '',
        isQualityArea: area?.isQualityArea || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            squareFeet: formData.squareFeet ? Number(formData.squareFeet) : undefined,
        };
        if (area) {
            onSave({ ...area, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Area Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">Parent Location</label>
                <select name="locationId" id="locationId" value={formData.locationId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">Select a location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700">Square Feet</label>
                <input type="number" name="squareFeet" id="squareFeet" value={formData.squareFeet} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="isQualityArea" id="isQualityArea" checked={formData.isQualityArea} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isQualityArea" className="ml-2 block text-sm text-gray-900">Is a Quality Area</label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700">Save</button>
            </div>
        </form>
    );
};


const AreasScreen: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);

    const { can } = useAuth();
    const canManage = can(Action.MANAGE_AREAS);

    const refreshData = () => {
        setAreas(dataService.getAreas());
        setLocations(dataService.getLocations());
    };

    useEffect(() => {
        refreshData();
    }, []);

    const getLocationName = (locationId: string) => {
        return locations.find(l => l.id === locationId)?.name || 'Unknown Location';
    };

    const handleOpenCreateModal = () => {
        setEditingArea(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (area: Area) => {
        setEditingArea(area);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingArea(null);
    };

    const handleSaveArea = async (areaData: Omit<Area, 'id'> | Area) => {
        if ('id' in areaData) {
            await dataService.updateArea(areaData);
        } else {
            await dataService.createArea(areaData);
        }
        refreshData();
        handleCloseModal();
    };

    const handleDeleteArea = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this area?')) {
            await dataService.deleteArea(id);
            refreshData();
        }
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Areas (Zones)</h1>
              {canManage && (
                <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
                  Create Area
                </button>
              )}
            </div>
            <Card>
                {areas.length === 0 ? (
                    <div className="text-center py-12">No areas found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Location</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {areas.map((area) => (
                                    <tr key={area.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getLocationName(area.locationId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                            {area.squareFeet && <Tag color="gray">{area.squareFeet.toLocaleString()} sq ft</Tag>}
                                            {area.isQualityArea && <Tag color="purple">Quality Area</Tag>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.description}</td>
                                        {canManage && (
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                              <button onClick={() => handleOpenEditModal(area)} className="text-indigo-600 hover:text-indigo-900">{ICON_MAP.Edit}</button>
                                              <button onClick={() => handleDeleteArea(area.id)} className="text-red-600 hover:text-red-900">{ICON_MAP.Delete}</button>
                                          </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingArea ? 'Edit Area' : 'Create Area'}>
                <AreaForm
                    area={editingArea}
                    locations={locations}
                    onSave={handleSaveArea}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default AreasScreen;