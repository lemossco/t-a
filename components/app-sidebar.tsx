import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";

interface AppSidebarProps {
  userName: string;
  roles: string[];
}

export function AppSidebar({ userName, roles }: AppSidebarProps) {
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <div className="size-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">T</span>
        </div>
        <span className="font-semibold text-sm">Torrado System</span>
      </div>

      <SidebarNav roles={roles} />

      <div className="mt-auto border-t px-3 py-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-1.5">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-medium">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{roles[0] ?? "—"}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
