import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { clearSettingsCache } from "@/lib/realtime-server";

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

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany();
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const localIP = process.env.LOCAL_IP || '192.168.1.17';

  async function updateSetting(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const value = formData.get("value") as string;
    const appId = formData.get("appId") as string;
    const isActive = formData.get("isActive") === "on";

    const currentUser = await getCurrentUser();

    await prisma.systemSetting.update({
      where: { id },
      data: { 
        value,
        appId: appId || null,
        isActive
      },
    });
    
    // Clear server-side realtime cache to pick up new settings
    clearSettingsCache();

    // Audit log
    await createAuditLog({
      action: "CHANGE_ENV_VAR",
      entity: "SystemSetting",
      entityId: id,
      userId: currentUser?.id,
      newValue: { value, appId, isActive },
      metadata: {
        actor: currentUser?.email || "Unknown",
        ssoId: currentUser?.ssoId || null,
        compliance: {
          pci_dss: "10.2.2",
          bsp: "Circular 808"
        }
      }
    });

    revalidatePath("/settings/environment");
  }

  async function addSetting(formData: FormData) {
    "use server";
    const key = formData.get("key") as string;
    const value = formData.get("value") as string;
    const appId = formData.get("appId") as string;
    const isSecret = formData.get("isSecret") === "on";
    const description = formData.get("description") as string;

    const currentUser = await getCurrentUser();

    const newSetting = await prisma.systemSetting.create({
      data: {
        key,
        value,
        appId: appId || null,
        isSecret,
        description,
        isActive: true
      }
    });

    // Clear server-side realtime cache to pick up new settings
    clearSettingsCache();

    // Audit log
    await createAuditLog({
      action: "ADD_ENV_VAR",
      entity: "SystemSetting",
      entityId: newSetting.id,
      userId: currentUser?.id,
      newValue: { key, value, appId, isSecret, description },
      metadata: {
        actor: currentUser?.email || "Unknown",
        ssoId: currentUser?.ssoId || null,
        compliance: {
          pci_dss: "10.2.2",
          bsp: "Circular 808"
        }
      }
    });

    revalidatePath("/settings/environment");
  }

  async function syncToVercel() {
    "use server";
    const currentUser = await getCurrentUser();
    
    const settings = await prisma.systemSetting.findMany({
      where: { isActive: true }
    });
    
    console.log(`[Vercel Sync] Starting sync of ${settings.length} variables...`);
    
    // Simulate API calls
    for (const setting of settings) {
      console.log(`[Vercel Sync] Pushing ${setting.key} (Scope: ${setting.appId || 'GLOBAL'})...`);
    }
    
    // Audit log for the sync action
    await createAuditLog({
      action: "SYNC_VERCEL",
      entity: "SystemSetting",
      entityId: "multiple",
      userId: currentUser?.id,
      newValue: { count: settings.length, timestamp: new Date().toISOString() },
      metadata: {
        compliance: {
          pci_dss: "10.2.2",
          bsp: "Circular 808"
        }
      }
    });

    revalidatePath("/settings/environment");
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* System Environment Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">System Environment</h1>
          <p className="text-slate-500 mt-1">Active configuration and service parameters for BudolPay Master Controller.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-${isProd ? 'indigo' : 'emerald'}-50 text-${isProd ? 'indigo' : 'emerald'}-700 rounded-lg text-xs font-bold uppercase tracking-wider`}>
            <div className={`w-2 h-2 rounded-full bg-${isProd ? 'indigo' : 'emerald'}-500 animate-pulse`}></div>
            {isProd ? 'Production / Vercel' : `Local Development (${localIP})`}
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <form action={syncToVercel}>
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Sync to Vercel
            </button>
          </form>
        </div>
      </div>

      {/* Ecosystem Control Center Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Control Center</h2>
        </div>


        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">Add New Setting</h3>
          </div>
          <form action={addSetting} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">KEY</label>
              <input name="key" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="API_URL" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">VALUE</label>
              <input name="value" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="http://192.168.1.17:8000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">APP ID</label>
              <select name="appId" className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="">Global</option>
                <option value="budolpay">BudolPay</option>
                <option value="budolshap">BudolShap</option>
                <option value="budolid">BudolID</option>
              </select>
            </div>
            <div className="flex items-center gap-4 h-10">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" name="isSecret" className="rounded border-slate-300 text-green-600 focus:ring-green-500" />
                Secret
              </label>
            </div>
            <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-900 transition font-medium">Add Setting</button>
            <div className="lg:col-span-5">
              <label className="block text-xs font-medium text-slate-500 mb-1">DESCRIPTION</label>
              <input name="description" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Endpoint for the SSO service" />
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">App / Key</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Value</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {settings.map((setting) => (
                <tr key={setting.id} className={setting.isActive ? "" : "opacity-50 grayscale"}>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      {setting.appId || "GLOBAL"}
                    </div>
                    <div className="font-mono text-sm text-green-600">{setting.key}</div>
                    <div className="text-xs text-slate-500 mt-1">{setting.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <form id={`form-${setting.id}`} action={updateSetting} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={setting.id} />
                      <input 
                        type={setting.isSecret ? "password" : "text"} 
                        name="value" 
                        defaultValue={setting.value}
                        className="border border-slate-300 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex gap-2 items-center">
                        <select name="appId" defaultValue={setting.appId || ""} className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50">
                          <option value="">GLOBAL</option>
                          <option value="budolpay">BUDOLPAY</option>
                          <option value="budolshap">BUDOLSHAP</option>
                          <option value="budolid">BUDOLID</option>
                        </select>
                        <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                          <input type="checkbox" name="isActive" defaultChecked={setting.isActive} className="w-3 h-3 rounded border-slate-300" />
                          Active
                        </label>
                      </div>
                    </form>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${setting.isSecret ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {setting.isSecret ? 'Secret' : 'Public'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button form={`form-${setting.id}`} type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded text-xs hover:bg-green-700 transition font-bold">SAVE</button>
                  </td>
                </tr>
              ))}
              {settings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No settings found. Add them to manage them here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
