import { prisma } from "@/lib/prisma";
import { formatDateTime, safeDecrypt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/search-input";
import Link from "next/link";
import { Suspense } from "react";

const PAGE_SIZE = 100;

async function GestionesTable({ q, page }: { q: string; page: number }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const where = {
    fecha_gestion: { gte: hoy },
    ...(q
      ? {
          OR: [
            { resultado: { contains: q, mode: "insensitive" as const } },
            { comentario: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [gestiones, total] = await Promise.all([
    prisma.gestiones.findMany({
      where,
      orderBy: { fecha_gestion: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        cuentas: {
          select: {
            id: true,
            folio: true,
            nombre_cliente: true,
          },
        },
        usuarios: { select: { nombre: true, apellidos: true } },
      },
    }),
    prisma.gestiones.count({ where }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} gestión{total !== 1 ? "es" : ""} hoy
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Comentario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gestiones.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-10"
                >
                  Sin gestiones hoy
                </TableCell>
              </TableRow>
            ) : (
              gestiones.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="text-xs whitespace-nowrap tabular-nums">
                    {formatDateTime(g.fecha_gestion)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/cuentas/${g.cuentas.id}`}
                      className="hover:underline text-sm font-medium"
                    >
                      {safeDecrypt(g.cuentas.nombre_cliente as Buffer | null)}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground">
                      {g.cuentas.folio}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={g.tipo === "TELEFONICA" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {g.tipo === "TELEFONICA" ? "Tel." : "Visita"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {g.resultado?.replace(/_/g, " ") ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {g.usuarios
                      ? `${g.usuarios.nombre} ${g.usuarios.apellidos}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {g.comentario ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default async function GestionesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestiones</h1>
          <p className="text-sm text-muted-foreground">Actividad de hoy</p>
        </div>
        <Suspense>
          <SearchInput placeholder="Filtrar por resultado o comentario..." />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground py-10 text-center">
            Cargando...
          </div>
        }
      >
        <GestionesTable q={q} page={page} />
      </Suspense>
    </div>
  );
}
