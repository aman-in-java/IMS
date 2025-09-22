// screens/PermissionsScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Tag } from '../components/ui/Tag';
import { RAGPill } from '../components/ui/RAGPill';
import { ICON_MAP } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/api';
import type { Role, PermissionGrant, StockSelectionCriteria } from '../types';
import { Action } from '../types';

// --- Helper Functions & Components ---

const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const sscsMap = new Map(dataService.getStockSelectionCriteria().map(s => [s.id, s]));
const poolsMap = new Map(dataService.getPools().map(p => [p.id, p.name]));
const areasMap = new Map(dataService.getAreas().map(a => [a.id, a.name]));

const renderConstraints = (constraints?: { matchingSscIds?: string[] }) => {
    if (!constraints || !constraints.matchingSscIds || constraints.matchingSscIds.length === 0) {
        return <Tag color="green">Unconstrained</Tag>;
    }
    return (
        <div className="space-y-2">
            {constraints.matchingSscIds.map(id => {
                const ssc = sscsMap.get(id);
                if (!ssc) return <div key={id} className="text-xs text-red-500">Invalid Rule ID: {id}</div>;
                const poolName = poolsMap.get(ssc.poolId);
                const areaName = areasMap.get(ssc.areaId);
                return (
                    <div key={id} className="p-2 bg-gray-50 rounded-md border text-xs">
                       <span className="font-semibold">If</span> Pool is <span className="font-medium text-indigo-600">{poolName}</span>, Area is <span className="font-medium text-indigo-600">{areaName}</span>, and Status is <span className="font-medium text-indigo-600">{ssc.status}</span>.
                    </div>
                );
            })}
        </div>
    );
};


// --- Permission Form Component ---

interface PermissionFormProps {
    grant?: PermissionGrant | null;
    grantIndex?: number | null;
    roles: Role[];
    sscs: StockSelectionCriteria[];
    onSave: (grant: PermissionGrant, index?: number) => void;
    onCancel: () => void;
}

const PermissionForm: React.FC<PermissionFormProps> = ({ grant, grantIndex, roles, sscs, onSave, onCancel }) => {
    const [roleId, setRoleId] = useState(grant?.roleId || '');
    const [action, setAction] = useState(grant?.action || '');
    const [selectedSscIds, setSelectedSscIds] = useState<string[]>(grant?.constraints?.matchingSscIds || []);

    const handleSscChange = (sscId: string) => {
        setSelectedSscIds(prev =>
            prev.includes(sscId) ? prev.filter(id => id !== sscId) : [...prev, sscId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newGrant: PermissionGrant = {
            roleId,
            action: action as Action,
        };
        if (selectedSscIds.length > 0) {
            newGrant.constraints = { matchingSscIds: selectedSscIds };
        }
        onSave(newGrant, grantIndex ?? undefined);
    };
    
    const getSscDescription = (ssc: StockSelectionCriteria) => {
        const pool = poolsMap.get(ssc.poolId) || 'N/A';
        const area = areasMap.get(ssc.areaId) || 'N/A';
        return `Pool: ${pool}, Area: ${area}, Status: ${ssc.status}`;
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">Role</label>
                <select id="roleId" value={roleId} onChange={e => setRoleId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">Select a Role...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="action" className="block text-sm font-medium text-gray-700">Action</label>
                <select id="action" value={action} onChange={e => setAction(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="">Select an Action...</option>
                    {Object.values(Action).map(act => <option key={act} value={act}>{formatAction(act)}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Constraints (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">Apply this permission only if the stock matches one of these criteria.</p>
                <div className="mt-2 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto space-y-2">
                    {sscs.map(ssc => (
                         <div key={ssc.id} className="flex items-start">
                            <div className="flex items-center h-5">
                                <input 
                                    id={`ssc-${ssc.id}`} 
                                    type="checkbox" 
                                    checked={selectedSscIds.includes(ssc.id)}
                                    onChange={() => handleSscChange(ssc.id)}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor={`ssc-${ssc.id}`} className="font-medium text-gray-800">{getSscDescription(ssc)}</label>
                                <p className="text-xs text-gray-500">Classes: {ssc.classes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700">Save Grant</button>
            </div>
        </form>
    );
};


// --- Main Screen Component ---

const PermissionsScreen: React.FC = () => {
    const { can } = useAuth();
    const canManage = can(Action.MANAGE_PERMISSIONS);
    
    // Local state to manage the full list of permissions
    const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [sscs, setSscs] = useState<StockSelectionCriteria[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGrant, setEditingGrant] = useState<PermissionGrant | null>(null);
    const [editingGrantIndex, setEditingGrantIndex] = useState<number | null>(null);

    const refreshData = () => {
        setPermissions(dataService.getPermissions());
        setRoles(dataService.getRoles());
        setSscs(dataService.getStockSelectionCriteria());
        setUsers(dataService.getUsers());
    };

    useEffect(() => {
        refreshData();
    }, []);

    const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles]);

    const handleOpenCreateModal = () => {
        setEditingGrant(null);
        setEditingGrantIndex(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (grant: PermissionGrant, index: number) => {
        setEditingGrant(grant);
        setEditingGrantIndex(index);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGrant(null);
        setEditingGrantIndex(null);
    };
    
    const handleSavePermission = async (grant: PermissionGrant, index?: number) => {
        if (index !== undefined && index !== null) {
            await dataService.updatePermissionGrant(index, grant);
        } else {
            await dataService.createPermissionGrant(grant);
        }
        refreshData();
        handleCloseModal();
    };

    const handleDeletePermission = async (index: number) => {
        if (window.confirm('Are you sure you want to delete this permission grant?')) {
            await dataService.deletePermissionGrant(index);
            refreshData();
        }
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
                 {canManage && (
                    <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
                        Grant Permission
                    </button>
                 )}
            </div>
            
            <div className="space-y-6">
                <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Role Membership</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {roles.map(role => (
                           <div key={role.id}>
                               <p className="font-semibold text-sm text-gray-700">{role.name}</p>
                               <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                {users.filter(u => u.roleIds.includes(role.id)).map(u => (
                                    <span key={u.id} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">{u.name.split(' ')[0]}</span>
                                ))}
                                {users.filter(u => u.roleIds.includes(role.id)).length === 0 && (
                                    <span className="text-xs text-gray-400 italic">No users assigned</span>
                                )}
                               </div>
                           </div>
                       ))}
                    </div>
                </Card>

                 <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">All Permission Grants</h2>
                    <p className="text-sm text-gray-600 mb-4">This table shows every permission rule configured in the system.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constraints</th>
                                    {canManage && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {permissions.map((perm, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <Tag color="blue">{roleMap.get(perm.roleId) || perm.roleId}</Tag>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAction(perm.action)}</td>
                                        <td className="px-6 py-4 align-top text-sm text-gray-500 w-1/2">
                                            {renderConstraints(perm.constraints)}
                                        </td>
                                        {canManage && (
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenEditModal(perm, index)} className="text-indigo-600 hover:text-indigo-900">{ICON_MAP.Edit}</button>
                                            <button onClick={() => handleDeletePermission(index)} className="text-red-600 hover:text-red-900">{ICON_MAP.Delete}</button>
                                          </td>
                                        )}
                                    </tr>
                                ))}
                                {permissions.length === 0 && (
                                    <tr><td colSpan={canManage ? 4 : 3} className="text-center py-8 text-gray-500">No permissions have been configured.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {canManage && (
                <Modal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    title={editingGrant ? 'Edit Permission Grant' : 'Create Permission Grant'}
                >
                    <PermissionForm 
                        grant={editingGrant}
                        grantIndex={editingGrantIndex}
                        roles={roles}
                        sscs={sscs}
                        onSave={handleSavePermission}
                        onCancel={handleCloseModal}
                    />
                </Modal>
            )}
        </div>
    );
};

export default PermissionsScreen;