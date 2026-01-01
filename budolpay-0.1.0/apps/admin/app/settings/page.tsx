import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany();

  async function updateSetting(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const value = formData.get("value") as string;

    await prisma.systemSetting.update({
      where: { id },
      data: { value },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "CHANGE_ENV_VAR",
        entity: "SystemSetting",
        entityId: id,
        newValue: { value },
      }
    });

    revalidatePath("/settings");
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-slate-800">Environment Variables</h2>
      <p className="text-slate-600 mb-8">Manage system-wide configuration and service endpoints.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-bottom border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Variable Key</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Value</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {settings.map((setting) => (
              <tr key={setting.id}>
                <td className="px-6 py-4 font-mono text-sm text-green-600">{setting.key}</td>
                <td className="px-6 py-4">
                  <form action={updateSetting} className="flex gap-2">
                    <input type="hidden" name="id" value={setting.id} />
                    {setting.key === 'ACTIVE_PAYMENT_PROVIDER' ? (
                      <select 
                        name="value" 
                        defaultValue={setting.value}
                        className="border border-slate-300 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="paymongo">PayMongo</option>
                        <option value="xendit">Xendit</option>
                        <option value="dragonpay">Dragonpay</option>
                        <option value="internal">Internal budolPay</option>
                      </select>
                    ) : (
                      <input 
                        type={setting.isSecret ? "password" : "text"} 
                        name="value" 
                        defaultValue={setting.value}
                        className="border border-slate-300 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                    <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition">Save</button>
                  </form>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{setting.description}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${setting.isSecret ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {setting.isSecret ? 'Secret' : 'Public'}
                  </span>
                </td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No settings found. Add them to the database to manage them here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
