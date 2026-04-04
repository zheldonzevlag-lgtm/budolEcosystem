"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck,
  Mail,
  Phone,
  ArrowUpRight,
  Loader2,
  FileText,
  Eye,
  X,
  RotateCw,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { formatManilaTime } from "@/lib/utils";
import { realtime } from "@/lib/realtime";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [isSavingRotation, setIsSavingRotation] = useState<Record<string, boolean>>({});
  const [rotationTimeouts, setRotationTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [expandedImage, setExpandedImage] = useState<{url: string, type: string, rotation: number} | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchUsers();
    
    // Subscribe to unified realtime telemetry updates instead of legacy hardcoded polling
    return realtime.on("ANY_UPDATE", () => {
      fetchUsers(true);
    });
  }, [filter]);

  useEffect(() => {
    if (selectedUser?.verificationDocs) {
      const initialRotations: Record<string, number> = {};
      selectedUser.verificationDocs.forEach((doc: any) => {
        initialRotations[doc.id] = doc.rotation || 0;
      });
      setRotations(prev => {
        // Merge with existing rotations to preserve optimistic updates if they are still saving
        return { ...prev, ...initialRotations };
      });
    }
  }, [selectedUser]);

  const handleRotate = (docId: string) => {
    const currentRotation = rotations[docId] || 0;
    const newRotation = (currentRotation + 90) % 360;
    
    console.log(`[Rotation] Rotating ${docId}: ${currentRotation} -> ${newRotation}`);
    
    // Optimistic update
    setRotations(prev => ({
      ...prev,
      [docId]: newRotation
    }));

    // Clear existing timeout for this document
    if (rotationTimeouts[docId]) {
      clearTimeout(rotationTimeouts[docId]);
    }

    // Set new timeout to persist after 1 second of inactivity
    const timeout = setTimeout(async () => {
      setIsSavingRotation(prev => ({
        ...prev,
        [docId]: true
      }));

      try {
        const res = await fetch("/api/users", {
          method: "POST",
          body: JSON.stringify({ 
            action: "UPDATE_DOCUMENT_ROTATION", 
            documentId: docId, 
            rotation: newRotation 
          }),
          headers: { "Content-Type": "application/json" }
        });
        
        if (res.ok) {
          // Silent refresh to update the underlying data without closing modal
          await fetchUsers(true);
        }
      } catch (e) {
        console.error("Failed to save rotation:", e);
      } finally {
        setIsSavingRotation(prev => ({
          ...prev,
          [docId]: false
        }));
      }
    }, 1000);

    setRotationTimeouts(prev => ({
      ...prev,
      [docId]: timeout
    }));
  };

  const renderOcrData = (ocrData: any) => {
    if (!ocrData || Object.keys(ocrData).length === 0) {
      return <p className="text-slate-400 italic">No OCR data extracted.</p>;
    }

    const { source, ...rest } = ocrData;
    const hasActualData = Object.keys(rest).length > 0;

    return (
      <div className="space-y-2">
        {hasActualData ? (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(rest).map(([key, value]) => (
              <div key={key} className="bg-white p-2 rounded border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{key}</p>
                <p className="text-xs font-medium text-slate-700 break-all">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
            <Info size={14} />
            <p className="text-[10px] font-medium">Automatic extraction in progress or data not found.</p>
          </div>
        )}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 mt-2">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Engine:</span>
          <span className="text-[9px] font-mono text-slate-400">{source || "Unknown"}</span>
        </div>
      </div>
    );
  };

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/users" : `/api/users?kycStatus=${filter}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setUsers(data);
      
      // Update selectedUser if it exists to refresh its docs/rotation
      if (selectedUser) {
        const updatedSelectedUser = data.find((u: any) => u.id === selectedUser.id);
        if (updatedSelectedUser) {
          setSelectedUser(updatedSelectedUser);
        }
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateKycStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ action: "UPDATE_KYC_STATUS", userId, status }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED": return "bg-green-100 text-green-700 border-green-200";
      case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
      case "REJECTED": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "FULLY_VERIFIED": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "SEMI_VERIFIED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "BASIC": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDocUrl = (doc: any) => {
    if (!doc) return null;
    
    // Handle remote URLs (e.g., from verification service)
    if (doc.remoteUrl) {
      if (doc.remoteUrl.startsWith('http')) {
        return doc.remoteUrl;
      }
      // Prefix with Gateway URL if relative
      const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
      return `${GATEWAY_URL}${doc.remoteUrl.startsWith('/') ? '' : '/'}${doc.remoteUrl}`;
    }

    if (!doc.blobData) return null;

    try {
      let bytes: any = null;
      const bd = doc.blobData;
      
      // 1. Handle Prisma Buffer JSON: { type: 'Buffer', data: [...] }
      if (bd && typeof bd === 'object' && bd.type === 'Buffer' && Array.isArray(bd.data)) {
        bytes = bd.data;
      } 
      // 2. Direct array
      else if (Array.isArray(bd)) {
        bytes = bd;
      }
      // 3. Object with data property (some Prisma versions or manual serialization)
      else if (bd && typeof bd === 'object' && bd.data && Array.isArray(bd.data)) {
        bytes = bd.data;
      }
      // 4. Uint8Array or Buffer-like object with numeric keys
      else if (bd && typeof bd === 'object' && bd[0] !== undefined) {
        bytes = Object.values(bd).filter(v => typeof v === 'number');
      }
      // 5. Base64 or Hex string
      else if (typeof bd === 'string') {
        if (bd.startsWith('data:')) return bd;
        if (bd.startsWith('0x')) { // Hex
          const hex = bd.slice(2);
          const match = hex.match(/.{1,2}/g);
          if (match) bytes = match.map(b => parseInt(b, 16));
        } else if (/^[0-9a-fA-F]+$/.test(bd) && bd.length > 100) { // Hex
          const match = bd.match(/.{1,2}/g);
          if (match) bytes = match.map(b => parseInt(b, 16));
        } else { // Base64
          return `data:image/jpeg;base64,${bd}`;
        }
      }

      if (bytes && bytes.length > 0) {
        const uint8Array = new Uint8Array(bytes);
        
        // Use a more robust conversion method for large arrays
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        return `data:image/jpeg;base64,${window.btoa(binary)}`;
      }
    } catch (e) {
      console.error("KYC Doc Conversion Error:", e);
    }
    return null;
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Verified", value: users.filter(u => u.kycStatus === "VERIFIED").length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending KYC", value: users.filter(u => u.kycStatus === "PENDING").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Rejected", value: users.filter(u => u.kycStatus === "REJECTED").length, icon: UserX, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Verification</h2>
          <p className="text-slate-600">Manage user accounts and KYC compliance verification.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-budolshap-primary/20 w-64"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-budolshap-primary/20"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="NONE">No KYC</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4">KYC Tier</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-budolshap-primary" size={24} />
                      <p className="text-slate-500 font-medium">Loading user database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            {user.firstName} {user.lastName}
                            {user.kycStatus === "VERIFIED" && <ShieldCheck size={14} className="text-blue-500" />}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail size={12} />
                          <span className="text-xs">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={12} />
                          <span className="text-xs">{user.phoneNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        ₱{user.wallet?.balance ? Number(user.wallet.balance).toLocaleString() : "0.00"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">PHP Wallet</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getTierColor(user.kycTier || "BASIC")}`}>
                        {(user.kycTier || "BASIC").replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {formatManilaTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.kycStatus === "PENDING" && (
                          <>
                            <button 
                              onClick={() => updateKycStatus(user.id, "VERIFIED")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve KYC"
                            >
                              <UserCheck size={18} />
                            </button>
                            <button 
                              onClick={() => updateKycStatus(user.id, "REJECTED")}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Reject KYC"
                            >
                              <UserX size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Documents"
                        >
                          <Eye size={18} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="text-slate-200" size={48} />
                      <p className="text-slate-500 font-medium">No users found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-bottom border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Verification Documents</h3>
                  <p className="text-sm text-slate-500">Reviewing {selectedUser.firstName} {selectedUser.lastName}'s submission</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getTierColor(selectedUser.kycTier || "BASIC")}`}>
                  Tier: {(selectedUser.kycTier || "BASIC").replace('_', ' ')}
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedUser.verificationDocs && selectedUser.verificationDocs.length > 0 ? (
                  selectedUser.verificationDocs.map((doc: any) => {
                    const docUrl = getDocUrl(doc);
                    return (
                      <div key={doc.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                              {doc.type}
                            </span>
                            <button 
                              onClick={() => handleRotate(doc.id)}
                              disabled={isSavingRotation[doc.id]}
                              className={`p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors ${isSavingRotation[doc.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Rotate Image"
                            >
                              {isSavingRotation[doc.id] ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RotateCw size={14} />
                              )}
                            </button>
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">
                            Uploaded: {formatManilaTime(doc.createdAt)}
                          </div>
                        </div>
                        <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                          {docUrl ? (
                            <img 
                              src={docUrl} 
                              alt={doc.type} 
                              style={{ transform: `rotate(${rotations[doc.id] || 0}deg)` }}
                              className="max-w-full max-h-full object-contain transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-4 text-center">
                              <FileText size={48} className="mb-2 opacity-20" />
                              <p className="text-xs font-bold uppercase tracking-tighter opacity-50">Document ID: {doc.id.substring(0, 8)}</p>
                              <p className="text-[10px] mt-1 italic">Stored as {doc.blobData ? 'BYTEA' : 'Remote Link'}</p>
                              {!docUrl && doc.blobData && (
                                <div className="mt-2 text-[8px] font-mono opacity-40 break-all max-w-full overflow-hidden">
                                  Debug: {typeof doc.blobData} | {Object.keys(doc.blobData).join(',')} | {Array.isArray(doc.blobData) ? 'Array' : 'Not Array'}
                                </div>
                              )}
                            </div>
                          )}
                          {docUrl && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button 
                                onClick={() => setExpandedImage({ url: docUrl, type: doc.type, rotation: rotations[doc.id] || 0 })}
                                className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-slate-800 shadow-xl hover:scale-110 transition-transform"
                                title="Inspect Image"
                              >
                                <Eye size={24} />
                              </button>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none"></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">OCR Analysis Result</p>
                          {renderOcrData(doc.ocrData)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No documents have been uploaded yet for this user.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-colors"
              >
                Close
              </button>
              {selectedUser.kycStatus === "PENDING" && (
                <>
                  <button 
                    onClick={() => {
                      updateKycStatus(selectedUser.id, "REJECTED");
                      setSelectedUser(null);
                    }}
                    className="px-6 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
                  >
                    Reject KYC
                  </button>
                  <button 
                    onClick={() => {
                      updateKycStatus(selectedUser.id, "VERIFIED");
                      setSelectedUser(null);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                  >
                    Approve KYC
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* High-Resolution Inspection Viewer */}
      {expandedImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white border-b border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Maximize2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Identity Inspection Viewer</h3>
                <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">{expandedImage.type} • Detailed Verification Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 mr-4">
                <button 
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="px-3 text-xs font-mono font-bold w-12 text-center text-blue-400">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setZoom(1)}
                  className="px-3 py-1 hover:bg-slate-700 rounded-md text-[10px] font-bold uppercase tracking-tighter text-slate-400 hover:text-white"
                >
                  Reset
                </button>
              </div>
              <button 
                onClick={() => {
                  setExpandedImage(null);
                  setZoom(1);
                }}
                className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-all border border-rose-500/20"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto flex items-center justify-center p-12 cursor-grab active:cursor-grabbing group">
            <div 
              style={{ 
                transform: `scale(${zoom}) rotate(${expandedImage.rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden bg-slate-900 border border-white/10"
            >
              <img 
                src={expandedImage.url} 
                alt="Verification Detail" 
                className="max-w-[70vw] max-h-[70vh] object-contain"
              />
            </div>
          </div>
          
          <div className="p-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] bg-slate-900/50 border-t border-white/10">
            Internal Security Bureau • Forensic Identity Scrutiny Module
          </div>
        </div>
      )}
    </div>
  );
}
