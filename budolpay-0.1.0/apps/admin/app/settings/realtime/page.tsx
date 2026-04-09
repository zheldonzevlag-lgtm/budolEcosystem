import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Zap, Activity, Globe, Save, MessageSquare, ShieldAlert } from "lucide-react";
import RealtimeMethodSelector from "@/components/RealtimeMethodSelector";
import { SubmitButton } from "@/components/SubmitButton";
import { createAuditLog } from "@/lib/audit";
import { clearSettingsCache, triggerRealtimeEvent } from "@/lib/realtime-server";

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
      // v43.3 Fix: Only update if the value was actually sent in the form.
      // If the field was conditionally unmounted, it will be null.
      // Skipping nulls ensures we don't overwrite saved config with empty strings.
      if (update.value === null) {
        console.log(`[Realtime-Config] Skipping update for ${update.key} to preserve existing setting.`);
        continue;
      }

      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value as string },
        create: { 
          key: update.key, 
          value: update.value as string,
          group: 'REALTIME',
          description: `Setting for ${update.key}`
        }
      });
    }

    // Clear the server-side cache so the next trigger uses the new config
    clearSettingsCache();

    // Trigger a specific event for clients to re-initialize their websocket connections
    await triggerRealtimeEvent('admin', 'REALTIME_CONFIG_CHANGED', {
      method,
      timestamp: new Date().toISOString()
    });

    // IMPORTANT: Clear the server-side cache in budolshap so it picks up the new config immediately
    try {
      const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
      const SHAP_URL = process.env.SHAP_URL || `http://${LOCAL_IP}:3000`;
      
      await fetch(`${SHAP_URL}/api/system/realtime`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cookies().get('budolpay_token')?.value}`
        },
        body: JSON.stringify({ 
          provider: method,
          pusherAppId,
          pusherKey,
          pusherSecret,
          pusherCluster,
          socketUrl: socketioUrl,
          swrPollingInterval: parseInt(swrInterval) || 10000
        })
      });
    } catch (e: any) {
      console.warn("[Realtime] Failed to update Shap settings:", e.message);
    }

    // Audit log for the update action
    await createAuditLog({
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
        {/* Method Selection & Configuration */}
        <RealtimeMethodSelector 
          initialMethod={currentMethod} 
          settings={settingsMap}
        />

        <div className="pt-6 flex flex-col gap-6">
          <SubmitButton className="w-full py-4 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-[0.1em] shadow-lg shadow-slate-200">
            Save Configuration
          </SubmitButton>
          <p className="text-[11px] text-slate-400 font-bold text-center">Changes apply immediately to new connections.</p>
        </div>
      </form>
    </div>
  );
}
