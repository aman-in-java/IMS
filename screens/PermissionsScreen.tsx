// screens/PermissionsScreen.tsx
import React from 'react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { useAuth } from '../hooks/useAuth';

const PermissionsScreen: React.FC = () => {
    const { user, roles, permissions, isLoading } = useAuth();

    const userRoles = roles.filter(role => user?.roleIds.includes(role.id));
    const userPermissions = permissions.filter(p => user?.roleIds.includes(p.roleId));

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Permissions</h1>
            {isLoading ? (
                <Card>
                    <div className="text-center py-12">Loading permissions...</div>
                </Card>
            ) : user ? (
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Current User</h2>
                        <p><span className="font-semibold">Name:</span> {user.name}</p>
                        <p><span className="font-semibold">Email:</span> {user.email}</p>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-gray-800 mb-3">Assigned Roles</h2>
                        <div className="flex flex-wrap gap-2">
                            {userRoles.map(role => (
                                <Tag key={role.id} color="blue">{role.name}</Tag>
                            ))}
                        </div>
                    </Card>
                     <Card>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Allowed Actions</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granted By Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constraints</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {userPermissions.map((perm, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAction(perm.action)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {roles.find(r => r.id === perm.roleId)?.name || 'Unknown Role'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {perm.constraints ? (
                                                    <pre className="text-xs bg-gray-100 p-1 rounded-md">{JSON.stringify(perm.constraints)}</pre>
                                                ) : (
                                                    <span className="text-gray-400 italic">None</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : (
                 <Card>
                    <div className="text-center py-12">No user logged in.</div>
                </Card>
            )}
        </div>
    );
};

export default PermissionsScreen;
