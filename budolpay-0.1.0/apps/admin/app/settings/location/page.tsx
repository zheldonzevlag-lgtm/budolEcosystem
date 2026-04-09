import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import LocationSettingsClient from "./LocationSettingsClient";
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

export default async function MapSettingsPage() {
  const allSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'MAPS_ACTIVE_PROVIDER',
          'MAPS_GEOAPIFY_KEY',
          'MAPS_GOOGLE_MAPS_KEY',
          'MAPS_RADAR_KEY'
        ]
      }
    }
  });

  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  async function saveMapSettings(formData: FormData) {
    "use server";
    
    const currentUser = await getCurrentUser();
    
    const provider = formData.get("mapProvider") as string;
    const googleKey = formData.get("googleMapsApiKey") as string;
    const geoapifyKey = formData.get("geoapifyApiKey") as string;
    const radarKey = formData.get("radarApiKey") as string;

    const updates = [
      { key: 'MAPS_ACTIVE_PROVIDER', value: provider },
      { key: 'MAPS_GOOGLE_MAPS_KEY', value: googleKey },
      { key: 'MAPS_GEOAPIFY_KEY', value: geoapifyKey },
      { key: 'MAPS_RADAR_KEY', value: radarKey }
    ];

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value || '' },
        create: { 
          key: update.key, 
          value: update.value || '',
          group: 'MAPS',
          description: `Setting for ${update.key}`
        }
      });
    }

    // Audit log
    await createAuditLog({
      action: "UPDATE_MAP_CONFIG",
      entity: "SystemSetting",
      entityId: "MAP_CONFIG",
      userId: currentUser?.id,
      newValue: { provider },
      metadata: {
        actor: currentUser?.email || "Unknown",
        ssoId: currentUser?.ssoId || null,
        compliance: {
          pci_dss: "10.2.2",
          bsp: "Circular 808"
        }
      }
    });

    revalidatePath("/settings/location");
  }

  return (
    <LocationSettingsClient 
      initialSettings={settingsMap} 
      saveAction={saveMapSettings} 
    />
  );
}
