import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "BudolShap. - Admin",
    description: "BudolShap. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
