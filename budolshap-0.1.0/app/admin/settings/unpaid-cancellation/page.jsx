import AdminCancellationSettings from '@/components/admin/settings/AdminCancellationSettings'

export const metadata = {
    title: 'Unpaid Order Cancellation | Admin',
    description: 'Configure automated cancellation for unpaid orders'
}

export default function UnpaidCancellationPage() {
    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">System Maintenance</h1>
                <p className="text-slate-500">Manage automated cleanup tasks for the platform</p>
            </div>

            <AdminCancellationSettings />
        </div>
    )
}
