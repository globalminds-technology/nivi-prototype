import { redirect } from "next/navigation";
import { connection } from "next/server";
import { container } from "@/infrastructure/di/container";
import { AdminHeader } from "@/components/admin/admin-header";

export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await container.adminAuth.getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader adminEmail={session.email} hideZohoBooks={session.hideZohoBooks} />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
