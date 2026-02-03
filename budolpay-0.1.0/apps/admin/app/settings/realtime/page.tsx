import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Zap, Activity, Globe, Save, MessageSquare, ShieldAlert } from "lucide-react";
import RealtimeMethodSelector from "@/components/RealtimeMethodSelector";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = 'force-dynamic';

// Helper to get current user from SSO
async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('budolpay_token')?.value;
  if (!token) return null;

  try {
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
    const response = await fetch(`${ssoUrl}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.valid || !data.user) return null;

    // Verify user exists in local database to avoid foreign key violations (PCI DSS 10.2.2)
    const localUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: data.user.id },
          { email: data.user.email }
        ]
      }
    });

    if (localUser) {
      return localUser;
    }

    // Return SSO user data but ensure ID is null if not found locally to prevent FK crash
    return { ...data.user, id: null, ssoId: data.user.id };
  } catch (e) {
    return null;
  }
}

export default async function RealtimeSettingsPage() {
  const allSettings = await prisma.systemSetting.findMany({
    where: {
      group: 'REALTIME'
    }
  });

  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const currentMethod = settingsMap['REALTIME_METHOD'] || 'SWR';

  async function saveRealtimeSettings(formData: FormData) {
    "use server";
    
    const currentUser = await getCurrentUser();
    
    const method = formData.get("realtimeMethod") as string;
    const pusherAppId = formData.get("pusherAppId") as string;
    const pusherKey = formData.get("pusherKey") as string;
    const pusherSecret = formData.get("pusherSecret") as string;
    const pusherCluster = formData.get("pusherCluster") as string;
    const socketioUrl = formData.get("socketioUrl") as string;
    const swrInterval = formData.get("swrInterval") as string;

    const updates = [
      { key: 'REALTIME_METHOD', value: method },
      { key: 'REALTIME_PUSHER_APP_ID', value: pusherAppId },
      { key: 'REALTIME_PUSHER_KEY', value: pusherKey },
      { key: 'REALTIME_PUSHER_SECRET', value: pusherSecret },
      { key: 'REALTIME_PUSHER_CLUSTER', value: pusherCluster },
      { key: 'REALTIME_SOCKETIO_URL', value: socketioUrl },
      { key: 'REALTIME_SWR_REFRESH_INTERVAL', value: swrInterval }
    ];

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value || '' },
        create: { 
          key: update.key, 
          value: update.value || '',
          group: 'REALTIME',
          description: `Setting for ${update.key}`
        }
      });
    }

    // Audit log for the update action
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_REALTIME_CONFIG",
        entity: "SystemSetting",
        entityId: "REALTIME_CONFIG",
        userId: currentUser?.id,
        newValue: { method, swrInterval },
        metadata: {
          actor: currentUser?.email || "Unknown",
          ssoId: currentUser?.ssoId || null,
          compliance: {
            pci_dss: "10.2.2",
            bsp: "Circular 808"
          }
        }
      }
    });

    revalidatePath("/settings/realtime");
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Realtime Updates</h1>
        <p className="text-slate-500 font-medium">Configure how the system handles live data synchronization and notifications.</p>
      </div>

      <form action={saveRealtimeSettings} className="space-y-8">
        {/* Method Selection */}
        <RealtimeMethodSelector initialMethod={currentMethod} />

        {/* Dynamic Configuration Section */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 space-y-10">
          {currentMethod === 'PUSHER' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                  Pusher Configuration
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-black rounded-full ml-2 tracking-tighter">Required</span>
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">App ID</label>
                  <input 
                    name="pusherAppId"
                    placeholder="Enter App ID"
                    defaultValue={settingsMap['REALTIME_PUSHER_APP_ID']}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key</label>
                    <input 
                      name="pusherKey"
                      placeholder="Enter Key"
                      defaultValue={settingsMap['REALTIME_PUSHER_KEY']}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cluster</label>
                    <input 
                      name="pusherCluster"
                      placeholder="e.g. ap1"
                      defaultValue={settingsMap['REALTIME_PUSHER_CLUSTER']}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret</label>
                  <input 
                    type="password"
                    name="pusherSecret"
                    placeholder="Enter Secret (hidden)"
                    defaultValue={settingsMap['REALTIME_PUSHER_SECRET']}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {currentMethod === 'SOCKETIO' && (
            <div className="space-y-8">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                Socket.io Configuration
              </h3>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server URL</label>
                <input 
                  name="socketioUrl"
                  placeholder="https://your-socket-server.com"
                  defaultValue={settingsMap['REALTIME_SOCKETIO_URL']}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {currentMethod === 'SWR' && (
            <div className="space-y-8">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                Polling Configuration
              </h3>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refresh Interval (ms)</label>
                <input 
                  type="number"
                  name="swrInterval"
                  placeholder="3000"
                  defaultValue={settingsMap['REALTIME_SWR_REFRESH_INTERVAL']}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
            <SubmitButton className="w-full py-4 rounded-xl bg-slate-900 text-sm font-black uppercase tracking-[0.1em] shadow-lg shadow-slate-200">
              Save Configuration
            </SubmitButton>
            <p className="text-[11px] text-slate-400 font-bold text-center">Changes apply immediately to new connections.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
