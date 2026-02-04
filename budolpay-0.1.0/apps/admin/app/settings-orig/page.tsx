import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { 
  Settings, 
  CreditCard, 
  Zap, 
  Bell, 
  ShieldCheck, 
  Search,
  Save,
  Info,
  Lock,
  Globe
} from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; query?: string };
}) {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' }
  });

  const query = searchParams.query?.toLowerCase() || "";
  
  // Filter settings based on query
  const filteredSettings = query 
    ? settings.filter(s => 
        s.key.toLowerCase().includes(query) || 
        (s.description?.toLowerCase().includes(query)) ||
        s.group?.toLowerCase().includes(query)
      )
    : settings;

  // Group settings by their group field
  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const group = setting.group || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, typeof settings>);

  const groups = Object.keys(groupedSettings).sort();

  // Find active providers for the dashboard
  const activeEmailProvider = settings.find(s => s.key === 'NOTIFICATION_EMAIL_PROVIDER')?.value || 'Not Configured';
  const activeSmsProvider = settings.find(s => s.key === 'NOTIFICATION_SMS_PROVIDER')?.value || 'Not Configured';
  const activePaymentProvider = settings.find(s => s.key === 'ACTIVE_PAYMENT_PROVIDER')?.value || 'Not Configured';

  const groupIcons: Record<string, any> = {
    SYSTEM: Globe,
    PAYMENT: CreditCard,
    REALTIME: Zap,
    NOTIFICATION: Bell,
    SECURITY: ShieldCheck,
    OTHER: Settings
  };

  async function updateSetting(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const value = formData.get("value") as string;

    await prisma.systemSetting.update({
      where: { id },
      data: { value },
    });

    // Audit log
    await createAuditLog({
      action: "UPDATE_SYSTEM_SETTING",
      entity: "SystemSetting",
      entityId: id,
      newValue: { value },
    });

    revalidatePath("/settings");
    // Redirect with success param to show notification
    // Note: In a real app we might use a client component for this, 
    // but we can also just rely on the revalidatePath for now.
  }

  return (
    <div className="space-y-12 pb-20">
      {searchParams.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Save className="h-4 w-4" />
          <p className="text-sm font-medium">Settings updated successfully.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-800">System Configuration</h2>
          <p className="text-slate-600">Manage ecosystem-wide parameters, service endpoints, and integration credentials.</p>
        </div>
        <form className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            name="query"
            defaultValue={searchParams.query}
            placeholder="Search settings..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </form>
      </div>

      {/* Provider Quick Setup Dashboard */}
      {!query && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Email Service</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-500 mb-1">Active Provider</h4>
            <p className="text-lg font-bold text-slate-800 capitalize mb-4">{activeEmailProvider}</p>
            <a href="#notification" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group/link">
              Configure Integration
              <Settings className="h-3 w-3 group-hover/link:rotate-90 transition-transform" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">SMS Service</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-500 mb-1">Active Provider</h4>
            <p className="text-lg font-bold text-slate-800 capitalize mb-4">{activeSmsProvider}</p>
            <a href="#notification" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/link">
              Configure Integration
              <Settings className="h-3 w-3 group-hover/link:rotate-90 transition-transform" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">Payment Gateway</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-500 mb-1">Active Provider</h4>
            <p className="text-lg font-bold text-slate-800 capitalize mb-4">{activePaymentProvider}</p>
            <a href="#payment" className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 group/link">
              Configure Integration
              <Settings className="h-3 w-3 group-hover/link:rotate-90 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {groups.map((group) => {
        const Icon = groupIcons[group] || Settings;
        return (
          <section key={group} id={group.toLowerCase()} className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{group} Settings</h3>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedSettings[group].map((setting) => (
                <div key={setting.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow group/card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="font-mono text-[10px] text-blue-600 font-bold uppercase tracking-tight truncate" title={setting.key}>
                        {setting.key}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${setting.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {setting.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {setting.isSecret && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
                            <Lock className="h-2.5 w-2.5" /> Sensitive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-3 leading-relaxed">
                    {setting.description || 'No description provided for this system parameter.'}
                  </p>

                  <form action={updateSetting} className="space-y-3">
                    <input type="hidden" name="id" value={setting.id} />
                    
                    <div className="relative">
                      {/* Specialized Inputs */}
                      {setting.key === 'ACTIVE_PAYMENT_PROVIDER' ? (
                        <select 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                        >
                          <option value="paymongo">PayMongo</option>
                          <option value="xendit">Xendit</option>
                          <option value="dragonpay">Dragonpay</option>
                          <option value="internal">Internal budolPay</option>
                        </select>
                      ) : setting.key === 'REALTIME_METHOD' ? (
                        <select 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                        >
                          <option value="PUSHER">Pusher (Cloud)</option>
                          <option value="SOCKETIO">Socket.io (Self-hosted)</option>
                          <option value="POLLING">Long Polling (Legacy)</option>
                        </select>
                      ) : setting.key === 'NOTIFICATION_EMAIL_PROVIDER' ? (
                        <select 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                        >
                          <option value="resend">Resend</option>
                          <option value="gmail">Gmail (Google Workspace)</option>
                          <option value="sendgrid">SendGrid</option>
                          <option value="smtp">Custom SMTP</option>
                        </select>
                      ) : setting.key === 'NOTIFICATION_SMS_PROVIDER' ? (
                        <select 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                        >
                          <option value="twilio">Twilio</option>
                          <option value="infobip">Infobip</option>
                          <option value="vonage">Vonage</option>
                        </select>
                      ) : setting.key === 'SYSTEM_MAINTENANCE_MODE' ? (
                        <select 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold appearance-none"
                        >
                          <option value="false" className="text-emerald-600">OFF (Operational)</option>
                          <option value="true" className="text-rose-600">ON (Under Maintenance)</option>
                        </select>
                      ) : setting.key.includes('TIMEOUT') || setting.key.includes('DAYS') || setting.key.includes('ATTEMPTS') || setting.key.includes('INTERVAL') || setting.key.includes('PORT') ? (
                        <input 
                          type="number" 
                          name="value" 
                          defaultValue={setting.value}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input 
                          type={setting.isSecret ? "password" : "text"} 
                          name="value" 
                          defaultValue={setting.value}
                          autoComplete="off"
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition shadow-sm text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" /> Save Changes
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
