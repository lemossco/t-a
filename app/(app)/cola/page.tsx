import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { safeDecrypt, formatMXN } from "@/lib/format";
import type { Prisma } from "@prisma/client";

type ColaItem = Prisma.cola_trabajoGetPayload<{
  include: {
    cuentas: {
      select: {
        id: true;
        folio: true;
        nombre_cliente: true;
        saldo_vencido: true;
        dias_atraso: true;
        ultima_gestion: true;
        fecha_ultima_gestion: true;
      };
    };
    clientes: { select: { nombre_corto: true } };
  };
}>;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const BUCKET_COLOR: Record<string, string> = {
  CALIENTE: "bg-red-100 text-red-700 border-red-200",
  TIBIO: "bg-orange-100 text-orange-700 border-orange-200",
  FRIO: "bg-blue-100 text-blue-700 border-blue-200",
  PERDIDO: "bg-gray-100 text-gray-500 border-gray-200",
};

export default async function ColaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agente = await prisma.agentes.findUnique({
    where: { usuario_id: session.user.id },
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cola = agente
    ? await prisma.cola_trabajo.findMany({
        where: {
          agente_id: agente.id,
          fecha_cola: hoy,
          gestionada: false,
        },
        orderBy: { posicion: "asc" },
        include: {
          cuentas: {
            select: {
              id: true,
              folio: true,
              nombre_cliente: true,
              saldo_vencido: true,
              dias_atraso: true,
              ultima_gestion: true,
              fecha_ultima_gestion: true,
            },
          },
          clientes: { select: { nombre_corto: true } },
        },
      })
    : ([] as ColaItem[]);

  const pendientes = cola.length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cola de trabajo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Intl.DateTimeFormat("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
          {" · "}
          {pendientes} cuenta{pendientes !== 1 ? "s" : ""} pendiente
          {pendientes !== 1 ? "s" : ""}
        </p>
      </div>

      {!agente ? (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Tu usuario no tiene un agente asignado.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Contacta al administrador para que configure tu perfil de agente.
          </p>
        </div>
      ) : cola.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground font-medium">¡Cola vacía!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay cuentas asignadas para hoy o ya gestionaste todas.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Saldo vencido</TableHead>
                <TableHead className="text-right">Días</TableHead>
                <TableHead>Score / Bucket</TableHead>
                <TableHead>Últ. gestión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cola.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40">
                  <TableCell className="text-muted-foreground text-xs">
                    {item.posicion}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/cuentas/${item.cuentas.id}`}
                      className="hover:underline font-medium"
                    >
                      {safeDecrypt(
                        item.cuentas.nombre_cliente as Buffer | null
                      )}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.cuentas.folio}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.clientes.nombre_corto}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMXN(item.cuentas.saldo_vencido)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        item.cuentas.dias_atraso > 180
                          ? "text-destructive font-medium"
                          : ""
                      }
                    >
                      {item.cuentas.dias_atraso}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.bucket && (
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${
                          BUCKET_COLOR[item.bucket] ?? ""
                        }`}
                      >
                        {item.bucket}
                        {item.score != null && (
                          <span className="ml-1 opacity-70">
                            {Number(item.score).toFixed(0)}
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.cuentas.ultima_gestion ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
