"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-4" />
      Cerrar sesión
    </Button>
  );
}
