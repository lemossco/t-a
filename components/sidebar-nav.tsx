"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  Phone,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cuentas", label: "Cuentas", icon: CreditCard },
  { href: "/cola", label: "Cola de trabajo", icon: ClipboardList },
  { href: "/gestiones", label: "Gestiones", icon: Phone },
];

const adminItems = [
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

interface SidebarNavProps {
  roles: string[];
}

export function SidebarNav({ roles }: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = roles.some((r) => ["ADMIN", "SUPERVISOR"].includes(r));

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}

      {isAdmin && (
        <>
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administración
            </p>
          </div>
          {adminItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
