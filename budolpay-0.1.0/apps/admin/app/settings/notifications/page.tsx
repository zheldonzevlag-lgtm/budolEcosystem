import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MessageSquare, Mail, ShieldCheck, Key, Settings, Server, Globe, Loader2, Check } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { createAuditLog } from "@/lib/audit";

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

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function maskRecipient(value: string) {
  if (!value) return "unknown";
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${user?.[0] || "*"}***@${domain || ""}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}

function getTestFeedback(testStatus?: string) {
  switch (testStatus) {
    case "email_sent":
      return { tone: "success", message: "Test email sent using the active email provider configuration." };
    case "email_failed":
      return { tone: "error", message: "Test email failed. Check the active email provider settings and credentials." };
    case "email_invalid":
      return { tone: "error", message: "Enter a valid email address for the email test." };
    case "sms_sent":
      return { tone: "success", message: "Test SMS/OTP sent using the active SMS provider configuration." };
    case "sms_failed":
      return { tone: "error", message: "Test SMS/OTP failed. Check the active SMS provider settings and credentials." };
    case "sms_invalid":
      return { tone: "error", message: "Enter a valid phone number for the SMS test." };
    default:
      return null;
  }
}

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedSearchParams = searchParams && "then" in searchParams ? await searchParams : (searchParams || {});
  const testParam = readSearchParam((resolvedSearchParams as Record<string, string | string[] | undefined>).test);
  const currentUser = await getCurrentUser();
  const allSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: 'NOTIFICATION_'
      }
    }
  });

  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const activeEmailProvider = settingsMap['NOTIFICATION_EMAIL_PROVIDER'] || 'SMTP';
  const activeSmsProvider = settingsMap['NOTIFICATION_SMS_PROVIDER'] || 'TWILIO';
  const testFeedback = getTestFeedback(testParam);

  async function updateSetting(formData: FormData) {
    "use server";
    const currentUser = await getCurrentUser();
    
    const group = formData.get("group") as string;
    const providerKey = group === 'EMAIL' ? 'NOTIFICATION_EMAIL_PROVIDER' : 'NOTIFICATION_SMS_PROVIDER';
    const providerValue = formData.get("provider") as string;
    
    const updates: { key: string; value: string }[] = [
      { key: providerKey, value: providerValue }
    ];

    formData.forEach((value, key) => {
      if (key !== 'group' && key !== 'provider' && typeof value === 'string') {
        updates.push({ key, value });
      }
    });

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { 
          key: update.key, 
          value: update.value,
          group: group === 'EMAIL' ? 'NOTIFICATION' : 'NOTIFICATION',
          description: `Setting for ${update.key}`
        }
      });
    }

    // Audit log
    await createAuditLog({
      action: `UPDATE_NOTIFICATION_${group}_CONFIG`,
      entity: "SystemSetting",
      entityId: "NOTIFICATION_CONFIG",
      userId: currentUser?.id,
      newValue: { group, provider: providerValue },
      metadata: {
        actor: currentUser?.email || "Unknown",
        ssoId: currentUser?.ssoId || null,
        compliance: {
          pci_dss: "10.2.2",
          bsp: "Circular 808"
        }
      }
    });

    revalidatePath("/settings/notifications");
  }

  async function sendTestNotification(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();
    const notifications = require("@budolpay/notifications");
    const type = String(formData.get("type") || "").toUpperCase();
    const recipient = String(formData.get("recipient") || "").trim();

    const redirectWithStatus = (status: string) => {
      redirect(`/settings/notifications?test=${status}`);
    };

    if (type === "EMAIL") {
      const isValidEmail = recipient.includes("@");
      if (!isValidEmail) {
        redirectWithStatus("email_invalid");
      }

      const success = await notifications.sendEmail(
        recipient,
        "budolPay Notification Test",
        "This is a test email from the active budolPay notification provider.",
        `<p>This is a test email from the active <strong>budolPay</strong> notification provider.</p>`
      );

      await createAuditLog({
        action: success ? "TEST_NOTIFICATION_EMAIL_SUCCESS" : "TEST_NOTIFICATION_EMAIL_FAILED",
        entity: "SystemSetting",
        entityId: "NOTIFICATION_TEST",
        userId: currentUser?.id,
        newValue: { type: "EMAIL", recipient: maskRecipient(recipient), provider: activeEmailProvider } as any,
        metadata: {
          actor: currentUser?.email || "Unknown",
          compliance: {
            pci_dss: "10.2.2",
            bsp: "Circular 808"
          }
        }
      });

      redirectWithStatus(success ? "email_sent" : "email_failed");
    }

    if (type === "SMS") {
      const sanitized = recipient.replace(/\s/g, "");
      const isValidPhone = /^[+0-9]+$/.test(sanitized);
      if (!isValidPhone) {
        redirectWithStatus("sms_invalid");
      }

      const success = await notifications.sendSMS(
        recipient,
        "budolPay test OTP: 123456. This confirms the active SMS provider configuration."
      );

      await createAuditLog({
        action: success ? "TEST_NOTIFICATION_SMS_SUCCESS" : "TEST_NOTIFICATION_SMS_FAILED",
        entity: "SystemSetting",
        entityId: "NOTIFICATION_TEST",
        userId: currentUser?.id,
        newValue: { type: "SMS", recipient: maskRecipient(recipient), provider: activeSmsProvider } as any,
        metadata: {
          actor: currentUser?.email || "Unknown",
          compliance: {
            pci_dss: "10.2.2",
            bsp: "Circular 808"
          }
        }
      });

      redirectWithStatus(success ? "sms_sent" : "sms_failed");
    }

    redirect("/settings/notifications");
  }

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Settings</h1>
        <p className="text-slate-500 font-medium">Configure and manage your delivery providers individually</p>
      </div>

      {testFeedback && (
        <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3 ${
          testFeedback.tone === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {testFeedback.tone === "success" ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-bold">{testFeedback.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Send Test Email</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Uses active provider: {activeEmailProvider}</p>
            </div>
          </div>
          <form action={sendTestNotification} className="space-y-3">
            <input type="hidden" name="type" value="EMAIL" />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Email</label>
              <input
                name="recipient"
                type="email"
                defaultValue={currentUser?.email || settingsMap["NOTIFICATION_EMAIL_SENDER"] || ""}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@example.com"
              />
            </div>
            <SubmitButton className="w-full py-3 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest">
              <Server className="w-3.5 h-3.5 mr-2" /> Send Test Email
            </SubmitButton>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Send Test SMS / OTP</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Uses active provider: {activeSmsProvider}</p>
            </div>
          </div>
          <form action={sendTestNotification} className="space-y-3">
            <input type="hidden" name="type" value="SMS" />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Phone</label>
              <input
                name="recipient"
                type="text"
                defaultValue={currentUser?.phoneNumber || ""}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+639171234567"
              />
            </div>
            <SubmitButton className="w-full py-3 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest">
              <Key className="w-3.5 h-3.5 mr-2" /> Send Test SMS / OTP
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* EMAIL PROVIDERS SECTION */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2 mb-6 border-b border-slate-200 pb-4">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Email Providers</h2>
          </div>

          <div className="space-y-6">
            {/* Google Mail / SMTP */}
            <div className={`bg-white rounded-2xl shadow-sm border p-8 space-y-6 transition-all ${activeEmailProvider === 'SMTP' ? 'border-blue-500 ring-1 ring-blue-500 shadow-blue-100/50 shadow-xl' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Google Mail / SMTP</h3>
                    <p className="text-[11px] text-slate-500 font-bold">Standard SMTP Integration</p>
                  </div>
                </div>
                {activeEmailProvider === 'SMTP' ? (
                  <span className="px-3 py-1 bg-blue-600 text-[10px] font-black text-white rounded-full uppercase tracking-tighter">Active</span>
                ) : (
                  <form action={updateSetting}>
                    <input type="hidden" name="group" value="EMAIL" />
                    <input type="hidden" name="provider" value="SMTP" />
                    <SubmitButton variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Use This</SubmitButton>
                  </form>
                )}
              </div>
              
              <form action={updateSetting} className="space-y-4">
                <input type="hidden" name="group" value="EMAIL" />
                <input type="hidden" name="provider" value="SMTP" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
                    <input name="NOTIFICATION_EMAIL_SMTP_HOST" defaultValue={settingsMap['NOTIFICATION_EMAIL_SMTP_HOST']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Port</label>
                    <input name="NOTIFICATION_EMAIL_SMTP_PORT" defaultValue={settingsMap['NOTIFICATION_EMAIL_SMTP_PORT']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Email</label>
                  <input name="NOTIFICATION_EMAIL_SENDER" defaultValue={settingsMap['NOTIFICATION_EMAIL_SENDER']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                  <input name="NOTIFICATION_EMAIL_SMTP_USER" defaultValue={settingsMap['NOTIFICATION_EMAIL_SMTP_USER']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <input type="password" name="NOTIFICATION_EMAIL_SMTP_PASS" defaultValue={settingsMap['NOTIFICATION_EMAIL_SMTP_PASS']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <SubmitButton className="w-full py-3 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest mt-2">
                  <Settings className="w-3.5 h-3.5 mr-2" /> Save Google Settings
                </SubmitButton>
              </form>
            </div>

            {/* Brevo */}
            <div className={`bg-white rounded-2xl shadow-sm border p-8 space-y-6 transition-all ${activeEmailProvider === 'BREVO' ? 'border-blue-500 ring-1 ring-blue-500 shadow-blue-100/50 shadow-xl' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Brevo</h3>
                    <p className="text-[11px] text-slate-500 font-bold">Transactional Email Service</p>
                  </div>
                </div>
                {activeEmailProvider === 'BREVO' ? (
                  <span className="px-3 py-1 bg-blue-600 text-[10px] font-black text-white rounded-full uppercase tracking-tighter">Active</span>
                ) : (
                  <form action={updateSetting}>
                    <input type="hidden" name="group" value="EMAIL" />
                    <input type="hidden" name="provider" value="BREVO" />
                    <SubmitButton variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Use This</SubmitButton>
                  </form>
                )}
              </div>
              <form action={updateSetting} className="space-y-4">
                <input type="hidden" name="group" value="EMAIL" />
                <input type="hidden" name="provider" value="BREVO" />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brevo API Key</label>
                  <input type="password" name="NOTIFICATION_BREVO_API_KEY" defaultValue={settingsMap['NOTIFICATION_BREVO_API_KEY']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Email</label>
                  <input name="NOTIFICATION_EMAIL_SENDER" defaultValue={settingsMap['NOTIFICATION_EMAIL_SENDER']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <SubmitButton className="w-full py-3 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest mt-2">
                   Save Brevo Settings
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>

        {/* SMS PROVIDERS SECTION */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2 mb-6 border-b border-slate-200 pb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">SMS Providers</h2>
          </div>

          <div className="space-y-6">
            {/* Viber */}
            <div className={`bg-white rounded-2xl shadow-sm border p-6 space-y-4 transition-all ${activeSmsProvider === 'VIBER' ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-emerald-100/50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Viber</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Viber Business Messaging</p>
                  </div>
                </div>
                {activeSmsProvider === 'VIBER' ? (
                  <span className="px-3 py-1 bg-emerald-600 text-[9px] font-black text-white rounded-full uppercase tracking-tighter">Active</span>
                ) : (
                  <form action={updateSetting}>
                    <input type="hidden" name="group" value="SMS" />
                    <input type="hidden" name="provider" value="VIBER" />
                    <SubmitButton variant="outline" className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Use This</SubmitButton>
                  </form>
                )}
              </div>
              <form action={updateSetting} className="space-y-4">
                <input type="hidden" name="group" value="SMS" />
                <input type="hidden" name="provider" value="VIBER" />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viber API Key</label>
                  <input type="password" name="NOTIFICATION_VIBER_API_KEY" defaultValue={settingsMap['NOTIFICATION_VIBER_API_KEY']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <SubmitButton className="w-full py-2.5 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest">
                  Save Viber Settings
                </SubmitButton>
              </form>
            </div>

            {/* iTextMo */}
            <div className={`bg-white rounded-2xl shadow-sm border p-6 space-y-4 transition-all ${activeSmsProvider === 'ITEXTMO' ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-emerald-100/50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">iTextMo</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Local PH SMS Provider</p>
                  </div>
                </div>
                {activeSmsProvider === 'ITEXTMO' ? (
                  <span className="px-3 py-1 bg-emerald-600 text-[9px] font-black text-white rounded-full uppercase tracking-tighter">Active</span>
                ) : (
                  <form action={updateSetting}>
                    <input type="hidden" name="group" value="SMS" />
                    <input type="hidden" name="provider" value="ITEXTMO" />
                    <SubmitButton variant="outline" className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Use This</SubmitButton>
                  </form>
                )}
              </div>
              <form action={updateSetting} className="space-y-4">
                <input type="hidden" name="group" value="SMS" />
                <input type="hidden" name="provider" value="ITEXTMO" />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">iTextMo API Key</label>
                  <input type="password" name="NOTIFICATION_ITEXTMO_API_KEY" defaultValue={settingsMap['NOTIFICATION_ITEXTMO_API_KEY']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Code</label>
                  <input name="NOTIFICATION_ITEXTMO_CLIENT_CODE" defaultValue={settingsMap['NOTIFICATION_ITEXTMO_CLIENT_CODE']} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <SubmitButton className="w-full py-2.5 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest">
                  Save iTextMo Settings
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
