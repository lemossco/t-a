import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { safeDecrypt, formatMXN, formatDate, formatDateTime } from "@/lib/format";
import { NuevaGestionDialog } from "@/components/nueva-gestion-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function CuentaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cuenta = await prisma.cuentas.findUnique({
    where: { id: params.id },
    include: {
      clientes: { select: { nombre: true, nombre_corto: true } },
      gestiones: {
        orderBy: { fecha_gestion: "desc" },
        take: 100,
        include: { usuarios: { select: { nombre: true, apellidos: true } } },
      },
      pagos: {
        orderBy: { fecha_pago: "desc" },
        take: 50,
        include: { usuarios: { select: { nombre: true, apellidos: true } } },
      },
      promesas: {
        orderBy: { created_at: "desc" },
        take: 50,
      },
      telefonos: {
        orderBy: { calificacion: "desc" },
      },
      domicilios: true,
      asignaciones_cuenta: {
        include: { agentes: { include: { usuarios: true } } },
      },
    },
  });

  if (!cuenta) notFound();

  const nombreCliente = safeDecrypt(cuenta.nombre_cliente as Buffer | null);

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href="/cuentas"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-1"
        >
          <ChevronLeft className="size-4" />
          Cuentas
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{nombreCliente}</h1>
            <span className="font-mono text-sm text-muted-foreground">
              {cuenta.folio}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cuenta.clientes.nombre} · {cuenta.producto ?? "—"}
          </p>
        </div>
        <NuevaGestionDialog cuentaId={cuenta.id} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-destructive">
              {formatMXN(cuenta.saldo_vencido)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatMXN(cuenta.saldo_total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Días de atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xl font-bold ${
                cuenta.dias_atraso > 180 ? "text-destructive" : ""
              }`}
            >
              {cuenta.dias_atraso}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">
              {formatMXN(cuenta.total_pagado)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gestiones">
        <TabsList>
          <TabsTrigger value="gestiones">
            Gestiones ({cuenta.gestiones.length})
          </TabsTrigger>
          <TabsTrigger value="pagos">
            Pagos ({cuenta.pagos.length})
          </TabsTrigger>
          <TabsTrigger value="promesas">
            Promesas ({cuenta.promesas.length})
          </TabsTrigger>
          <TabsTrigger value="info">Datos</TabsTrigger>
        </TabsList>

        {/* Gestiones */}
        <TabsContent value="gestiones" className="mt-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Comentario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuenta.gestiones.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin gestiones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  cuenta.gestiones.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(g.fecha_gestion)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            g.tipo === "TELEFONICA" ? "secondary" : "outline"
                          }
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
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos" className="mt-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuenta.pagos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  cuenta.pagos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">
                        {formatDate(p.fecha_pago)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMXN(p.monto)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.canal_pago ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.estatus === "VALIDADO" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.estatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.referencia ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Promesas */}
        <TabsContent value="promesas" className="mt-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compromiso</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Comentario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuenta.promesas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin promesas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  cuenta.promesas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">
                        {formatDate(p.fecha_compromiso)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMXN(p.monto_prometido)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.estatus === "CUMPLIDA"
                              ? "default"
                              : p.estatus === "INCUMPLIDA"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.estatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.comentario ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Datos */}
        <TabsContent value="info" className="mt-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard title="Crédito">
              <InfoRow label="Folio" value={cuenta.folio} />
              <InfoRow label="Nº crédito" value={cuenta.numero_credito} />
              <InfoRow label="Contrato" value={cuenta.contrato} />
              <InfoRow label="Cartera" value={cuenta.cartera} />
              <InfoRow label="Producto" value={cuenta.producto} />
              <InfoRow
                label="Inicio crédito"
                value={formatDate(cuenta.fecha_inicio_credito)}
              />
              <InfoRow
                label="Fin crédito"
                value={formatDate(cuenta.fecha_final_credito)}
              />
            </InfoCard>

            <InfoCard title="Saldos">
              <InfoRow
                label="Saldo vencido"
                value={formatMXN(cuenta.saldo_vencido)}
              />
              <InfoRow
                label="Saldo total"
                value={formatMXN(cuenta.saldo_total)}
              />
              <InfoRow
                label="Saldo por vencer"
                value={formatMXN(cuenta.saldo_total_por_vencer)}
              />
              <InfoRow
                label="Gastos cobranza"
                value={formatMXN(cuenta.gastos_cobranza)}
              />
              <InfoRow
                label="Total pagado"
                value={formatMXN(cuenta.total_pagado)}
              />
              <InfoRow
                label="Descuento"
                value={formatMXN(cuenta.descuento)}
              />
              <InfoRow label="Días atraso" value={String(cuenta.dias_atraso)} />
              <InfoRow
                label="Meses vencidos"
                value={String(cuenta.meses_vencidos)}
              />
            </InfoCard>

            <InfoCard title="Datos del titular">
              <InfoRow label="Nombre" value={nombreCliente} />
              <InfoRow
                label="F. nacimiento"
                value={formatDate(cuenta.fecha_nacimiento)}
              />
              <InfoRow
                label="Correo"
                value={safeDecrypt(cuenta.correo_electronico as Buffer | null)}
              />
              <InfoRow label="Calle" value={cuenta.calle_numero} />
              <InfoRow label="Colonia" value={cuenta.colonia} />
              <InfoRow
                label="Municipio"
                value={cuenta.municipio_delegacion}
              />
              <InfoRow label="Estado" value={cuenta.estado} />
              <InfoRow label="C.P." value={cuenta.codigo_postal} />
            </InfoCard>

            {cuenta.telefonos.length > 0 && (
              <InfoCard title="Teléfonos">
                {cuenta.telefonos.map((t) => (
                  <InfoRow
                    key={t.id}
                    label={t.tipo ?? t.nombre ?? "—"}
                    value={safeDecrypt(t.telefono as Buffer)}
                  />
                ))}
              </InfoCard>
            )}

            {cuenta.asignaciones_cuenta && (
              <InfoCard title="Agente asignado">
                <InfoRow
                  label="Nombre"
                  value={`${cuenta.asignaciones_cuenta.agentes.usuarios.nombre} ${cuenta.asignaciones_cuenta.agentes.usuarios.apellidos}`}
                />
                <InfoRow
                  label="Tipo"
                  value={cuenta.asignaciones_cuenta.agentes.tipo}
                />
                <InfoRow
                  label="Desde"
                  value={formatDate(
                    cuenta.asignaciones_cuenta.fecha_asignacion
                  )}
                />
              </InfoCard>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}
