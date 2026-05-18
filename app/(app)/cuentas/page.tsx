import { prisma } from "@/lib/prisma";
import { formatMXN, safeDecrypt } from "@/lib/format";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Suspense } from "react";

const PAGE_SIZE = 50;

async function CuentasTable({
  q,
  page,
  clienteId,
}: {
  q: string;
  page: number;
  clienteId?: string;
}) {
  const where = {
    ...(clienteId ? { cliente_id: clienteId } : {}),
    ...(q
      ? {
          OR: [
            { folio: { contains: q, mode: "insensitive" as const } },
            { numero_credito: { contains: q, mode: "insensitive" as const } },
            { contrato: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [cuentas, total] = await Promise.all([
    prisma.cuentas.findMany({
      where,
      select: {
        id: true,
        folio: true,
        nombre_cliente: true,
        saldo_vencido: true,
        dias_atraso: true,
        estatus_telefonico: true,
        estatus_judicial: true,
        ultima_gestion: true,
        fecha_ultima_gestion: true,
        clientes: { select: { nombre_corto: true } },
      },
      orderBy: { dias_atraso: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.cuentas.count({ where }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} cuenta{total !== 1 ? "s" : ""}
          {q && ` · búsqueda: "${q}"`}
        </p>
        <p className="text-sm text-muted-foreground">
          Página {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Saldo vencido</TableHead>
              <TableHead className="text-right">Días</TableHead>
              <TableHead>Últ. gestión</TableHead>
              <TableHead>Estatus tel.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              cuentas.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell className="font-mono text-xs">
                    <Link href={`/cuentas/${c.id}`} className="hover:underline">
                      {c.folio}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/cuentas/${c.id}`} className="hover:underline">
                      {safeDecrypt(c.nombre_cliente as Buffer | null)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.clientes.nombre_corto}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMXN(c.saldo_vencido)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        c.dias_atraso > 180
                          ? "text-destructive font-medium"
                          : c.dias_atraso > 90
                          ? "text-yellow-600"
                          : ""
                      }
                    >
                      {c.dias_atraso}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.ultima_gestion ?? "—"}
                  </TableCell>
                  <TableCell>
                    {c.estatus_telefonico && (
                      <Badge variant="secondary" className="text-xs">
                        {c.estatus_telefonico}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-2 mt-4">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) })}`}
              className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
            >
              ← Anterior
            </Link>
          )}
          {page * PAGE_SIZE < total && (
            <Link
              href={`?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) })}`}
              className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; cliente?: string };
}) {
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <Suspense>
          <SearchInput placeholder="Buscar por folio, crédito, contrato..." />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground py-10 text-center">
            Cargando...
          </div>
        }
      >
        <CuentasTable q={q} page={page} clienteId={searchParams.cliente} />
      </Suspense>
    </div>
  );
}
