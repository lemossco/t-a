import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar userName={session.user.name} roles={session.user.roles} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
