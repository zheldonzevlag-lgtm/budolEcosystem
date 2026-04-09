'use client';

import React, { useState } from 'react';

interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface Role {
    id: string;
    name: string;
    permissions: string[];
}

interface PermissionsMatrixProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PermissionsMatrix({
    isOpen,
    onClose
}: PermissionsMatrixProps) {
    // Mock data since parent doesn't provide it
    const [roles, setRoles] = useState<Role[]>([
        { id: 'ADMIN', name: 'Administrator', permissions: ['all'] },
        { id: 'STAFF', name: 'Operations Staff', permissions: ['read_users', 'read_logs'] }
    ]);
    const [permissions] = useState<Permission[]>([
        { id: 'read_users', name: 'View Users', description: 'Can view user list', category: 'Users' },
        { id: 'write_users', name: 'Edit Users', description: 'Can edit users', category: 'Users' },
        { id: 'read_logs', name: 'View Logs', description: 'Can view audit logs', category: 'System' }
    ]);

    const [selectedRole, setSelectedRole] = useState<string | null>('ADMIN');

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    const currentRole = roles.find(r => r.id === selectedRole);

    const handleToggle = (permissionId: string) => {
        if (!selectedRole) return;
        // Mock toggle logic
        setRoles(prev => prev.map(r => {
            if (r.id === selectedRole) {
                const has = r.permissions.includes(permissionId);
                return {
                    ...r,
                    permissions: has
                        ? r.permissions.filter(p => p !== permissionId)
                        : [...r.permissions, permissionId]
                };
            }
            return r;
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Access Control Matrix</h2>
                        <p className="text-sm text-gray-500">Manage role-based permissions and security policies</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        {/* Sidebar - Roles */}
                        <div className="w-full lg:w-64 space-y-2 shrink-0">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Roles</h3>
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border-2 ${selectedRole === role.id
                                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                                            : 'border-transparent hover:bg-gray-50 text-gray-600 font-medium'
                                        }`}
                                >
                                    {role.name}
                                </button>
                            ))}
                        </div>

                        {/* Main Content - Permissions */}
                        <div className="flex-1 space-y-6">
                            {currentRole && Object.entries(permissionsByCategory).map(([category, perms]) => (
                                <div key={category} className="border rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-700 border-b">
                                        {category}
                                    </div>
                                    <div className="divide-y">
                                        {perms.map(permission => {
                                            const hasPermission = currentRole.permissions.includes(permission.id) || currentRole.permissions.includes('all');
                                            return (
                                                <div
                                                    key={permission.id}
                                                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{permission.name}</div>
                                                        <div className="text-sm text-gray-500">{permission.description}</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={hasPermission}
                                                            onChange={() => handleToggle(permission.id)}
                                                            className="sr-only peer"
                                                            disabled={currentRole.permissions.includes('all')}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
