"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  cuenta_id: z.string().min(1),
  tipo: z.enum(["TELEFONICA", "VISITA"]),
  resultado: z.string().min(1),
  comentario: z.string().optional(),
  fecha_gestion: z.string().optional(),
});

export async function crearGestion(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const parsed = schema.safeParse({
    cuenta_id: formData.get("cuenta_id"),
    tipo: formData.get("tipo"),
    resultado: formData.get("resultado"),
    comentario: formData.get("comentario") || undefined,
    fecha_gestion: formData.get("fecha_gestion") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { cuenta_id, tipo, resultado, comentario, fecha_gestion } = parsed.data;
  const fechaGestion = fecha_gestion ? new Date(fecha_gestion) : new Date();

  try {
    await prisma.$transaction([
      prisma.gestiones.create({
        data: {
          id: crypto.randomUUID(),
          cuenta_id,
          usuario_id: session.user.id,
          tipo,
          resultado,
          comentario,
          fecha_gestion: fechaGestion,
        },
      }),
      prisma.cuentas.update({
        where: { id: cuenta_id },
        data: {
          ultima_gestion: resultado,
          fecha_ultima_gestion: fechaGestion,
        },
      }),
    ]);

    revalidatePath(`/cuentas/${cuenta_id}`);
    return { ok: true };
  } catch {
    return { error: "Error al guardar la gestión" };
  }
}
