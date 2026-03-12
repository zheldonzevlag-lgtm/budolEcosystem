'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Clock, Image, Video, Layers, Loader2, Package, RotateCcw } from 'lucide-react';

export default function DraftListModal({ isOpen, onClose, drafts, onSelectDraft, onDeleteDraft, isLoading }) {
    const [deletingId, setDeletingId] = useState(null);

    if (!isOpen) return null;

    const handleRestore = (e, draftId) => {
        e.stopPropagation();
        onSelectDraft(draftId);
    };

    const handleDelete = async (e, draftId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this draft?')) {
            setDeletingId(draftId);
            await onDeleteDraft(draftId);
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Your Drafts</h2>
                        <p className="text-sm text-gray-500">
                            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved locally
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-gray-600">Loading drafts...</span>
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No drafts yet</h3>
                            <p className="text-gray-500 mt-1">
                                Your saved drafts will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    onClick={() => onSelectDraft(draft.id)}
                                    className="flex gap-4 p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                                        {draft.thumbnail ? (
                                            <img 
                                                src={draft.thumbnail} 
                                                alt={draft.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {draft.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDate(draft._updatedAt)}</span>
                                        </div>
                                        
                                        {/* Media counts */}
                                        <div className="flex items-center gap-4 mt-2">
                                            {(draft._preview?.imageCount > 0 || draft._preview?.variantCount > 0) && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Image className="w-3 h-3" />
                                                    <span>{draft._preview?.imageCount || 0} images</span>
                                                </div>
                                            )}
                                            {draft._preview?.videoCount > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Video className="w-3 h-3" />
                                                    <span>{draft._preview?.videoCount} videos</span>
                                                </div>
                                            )}
                                            {draft._preview?.variantCount > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Layers className="w-3 h-3" />
                                                    <span>{draft._preview?.variantCount} variants</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-center relative z-10">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Restore clicked for draft:', draft.id);
                                                handleRestore(e, draft.id);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Restore</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, draft.id)}
                                            disabled={deletingId === draft.id}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === draft.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        Drafts are saved locally in your browser. They won't be accessible from other devices.
                    </p>
                </div>
            </div>
        </div>
    );
}
