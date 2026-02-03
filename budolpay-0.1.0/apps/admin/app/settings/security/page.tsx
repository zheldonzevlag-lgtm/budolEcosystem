import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ShieldAlert, Lock, ShieldCheck, Shield, Key, Eye, Clock, Ban, AlertTriangle } from "lucide-react";
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

export default async function SecuritySettingsPage() {
  const allSettings = await prisma.systemSetting.findMany({
    where: {
      group: 'SECURITY'
    }
  });

  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  async function saveSecuritySettings(formData: FormData) {
    "use server";
    
    const currentUser = await getCurrentUser();
    
    const updates = [
      { key: 'SECURITY_AUTH_MAX_ATTEMPTS', value: formData.get("maxAttempts") as string },
      { key: 'SECURITY_AUTH_LOCKOUT_DURATION', value: formData.get("lockoutDuration") as string },
      { key: 'SECURITY_SESSION_IDLE_TIMEOUT', value: formData.get("idleTimeout") as string },
      { key: 'SECURITY_SESSION_ABSOLUTE_TIMEOUT', value: formData.get("absoluteTimeout") as string },
      { key: 'SECURITY_PASSWORD_MIN_LENGTH', value: formData.get("minPasswordLength") as string },
      { key: 'SECURITY_PASSWORD_REQUIRE_SPECIAL', value: formData.get("requireSpecial") === "on" ? "true" : "false" },
      { key: 'SECURITY_PASSWORD_EXPIRY_DAYS', value: formData.get("passwordExpiry") as string },
      { key: 'SECURITY_MFA_ENFORCED', value: formData.get("enforceMfa") === "on" ? "true" : "false" },
      { key: 'SECURITY_RATE_LIMIT_GLOBAL', value: formData.get("globalRateLimit") as string },
      { key: 'SECURITY_RATE_LIMIT_AUTH', value: formData.get("authRateLimit") as string }
    ];

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value || '' },
        create: { 
          key: update.key, 
          value: update.value || '',
          group: 'SECURITY',
          description: `Security setting for ${update.key}`
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_SECURITY_POLICY",
        entity: "SystemSetting",
        entityId: "SECURITY_CONFIG",
        userId: currentUser?.id,
        newValue: { updates: updates.map(u => u.key) },
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

    revalidatePath("/settings/security");
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 bg-slate-50/30 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Compliance Hardening</h1>
          <p className="text-slate-500 font-medium">Configure PCI DSS, BSP, and NPC compliant security protocols.</p>
        </div>
      </div>

      <form action={saveSecuritySettings} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Authentication Policy */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Authentication Policy</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Login Attempts</label>
                <input 
                  type="number"
                  name="maxAttempts"
                  defaultValue={settingsMap['SECURITY_AUTH_MAX_ATTEMPTS'] || '5'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase">Attempts before lockout.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lockout Duration (min)</label>
                <input 
                  type="number"
                  name="lockoutDuration"
                  defaultValue={settingsMap['SECURITY_AUTH_LOCKOUT_DURATION'] || '30'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase">Temporary ban period.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Enforce MFA</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Mandatory for all admin users.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                name="enforceMfa" 
                defaultChecked={settingsMap['SECURITY_MFA_ENFORCED'] === 'true'}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Session Management</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle Timeout (minutes)</label>
              <input 
                type="number"
                name="idleTimeout"
                defaultValue={settingsMap['SECURITY_SESSION_IDLE_TIMEOUT'] || '15'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">PCI DSS Requirement 8.1.8: Idle timeout.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absolute Timeout (hours)</label>
              <input 
                type="number"
                name="absoluteTimeout"
                defaultValue={settingsMap['SECURITY_SESSION_ABSOLUTE_TIMEOUT'] || '24'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Maximum session duration regardless of activity.</p>
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Key className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Password Policy</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Length</label>
                <input 
                  type="number"
                  name="minPasswordLength"
                  defaultValue={settingsMap['SECURITY_PASSWORD_MIN_LENGTH'] || '12'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry (Days)</label>
                <input 
                  type="number"
                  name="passwordExpiry"
                  defaultValue={settingsMap['SECURITY_PASSWORD_EXPIRY_DAYS'] || '90'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Require Special Characters</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Numbers, Symbols, and Uppercase.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                name="requireSpecial" 
                defaultChecked={settingsMap['SECURITY_PASSWORD_REQUIRE_SPECIAL'] === 'true'}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Ban className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Rate Limiting (WAF)</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rate Limit (req/min)</label>
              <input 
                type="number"
                name="globalRateLimit"
                defaultValue={settingsMap['SECURITY_RATE_LIMIT_GLOBAL'] || '1000'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Applies to all public API endpoints.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Rate Limit (req/min)</label>
              <input 
                type="number"
                name="authRateLimit"
                defaultValue={settingsMap['SECURITY_RATE_LIMIT_AUTH'] || '10'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase">Strict limit for login and OTP endpoints.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Compliance Warning</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Changes here affect system-wide security and may impact user accessibility.</p>
            </div>
          </div>
          <SubmitButton className="px-12 py-4 rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all">
            Deploy Security Policy
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
