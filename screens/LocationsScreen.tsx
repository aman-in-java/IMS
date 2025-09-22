// screens/LocationsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Location } from '../types';
import { Action } from '../types';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ICON_MAP } from '../constants';
import { dataService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type LocationWithChildren = Location & { children?: LocationWithChildren[] };

const LocationForm: React.FC<{
    location?: Location | null;
    locations: Location[];
    onSave: (location: Omit<Location, 'id'> | Location) => void;
    onCancel: () => void;
}> = ({ location, locations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: location?.name || '',
        description: location?.description || '',
        isNested: location?.isNested || false,
        parentId: location?.parentId || '',
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
        const dataToSave = { ...formData };
        if (!dataToSave.isNested) {
            delete dataToSave.parentId;
        }
        if (location) {
            onSave({ ...location, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Location Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="isNested" id="isNested" checked={formData.isNested} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isNested" className="ml-2 block text-sm text-gray-900">Is Nested Location</label>
            </div>
            {formData.isNested && (
                 <div>
                    <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent Location</label>
                    <select name="parentId" id="parentId" value={formData.parentId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Select a parent</option>
                        {locations.filter(l => l.id !== location?.id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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


const LocationsScreen: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    
    const { can } = useAuth();
    const canManage = can(Action.MANAGE_LOCATIONS);

    const refreshLocations = () => {
        setLocations(dataService.getLocations());
    };
    
    useEffect(() => {
        refreshLocations();
    }, []);

    const hierarchicalLocations = useMemo(() => {
        const locationMap: Record<string, LocationWithChildren> = {};
        const roots: LocationWithChildren[] = [];

        locations.forEach(location => {
            locationMap[location.id] = { ...location, children: [] };
        });

        locations.forEach(location => {
            if (location.isNested && location.parentId && locationMap[location.parentId]) {
                locationMap[location.parentId].children?.push(locationMap[location.id]);
            } else {
                roots.push(locationMap[location.id]);
            }
        });
        return roots;
    }, [locations]);

    const handleOpenCreateModal = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (location: Location) => {
        setEditingLocation(location);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
    };

    const handleSaveLocation = async (locationData: Omit<Location, 'id'> | Location) => {
        if ('id' in locationData) {
            await dataService.updateLocation(locationData);
        } else {
            await dataService.createLocation(locationData);
        }
        refreshLocations();
        handleCloseModal();
    };

    const handleDeleteLocation = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this location? This may affect nested locations.')) {
            await dataService.deleteLocation(id);
            refreshLocations();
        }
    };

    const renderLocationRows = (locationsToRender: LocationWithChildren[], level = 0) => {
        return locationsToRender.flatMap(location => {
            const row = (
                <tr key={location.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ paddingLeft: `${1.5 + level * 1.5}rem` }}>
                        {level > 0 && <span className="text-gray-400 mr-2">↳</span>}
                        {location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.description}</td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <button onClick={() => handleOpenEditModal(location)} className="text-indigo-600 hover:text-indigo-900">{ICON_MAP.Edit}</button>
                          <button onClick={() => handleDeleteLocation(location.id)} className="text-red-600 hover:text-red-900">{ICON_MAP.Delete}</button>
                      </td>
                    )}
                </tr>
            );
            
            const childRows = location.children ? renderLocationRows(location.children, level + 1) : [];
            return [row, ...childRows];
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              {canManage && (
                <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
                  Create Location
                </button>
              )}
            </div>
            <Card>
                {locations.length === 0 ? (
                    <div className="text-center py-12">No locations found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {renderLocationRows(hierarchicalLocations)}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLocation ? 'Edit Location' : 'Create Location'}>
                <LocationForm 
                    location={editingLocation}
                    locations={locations}
                    onSave={handleSaveLocation}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default LocationsScreen;
