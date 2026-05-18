"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { crearGestion } from "@/app/actions/gestiones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const RESULTADOS_TELEFONICA = [
  "LOCALIZADO",
  "NO_LOCALIZADO",
  "PROMESA_PAGO",
  "CUELGA",
  "NUMERO_INCORRECTO",
  "BUZON_VOZ",
  "CONTACTO_REFERENCIA",
  "ACUERDO_PAGO",
  "RECHAZO_PAGO",
  "NUMERO_APAGADO",
];

const RESULTADOS_VISITA = [
  "DOMICILIO_LOCALIZADO",
  "DOMICILIO_NO_ENCONTRADO",
  "NO_HABITADO",
  "NEGATIVA_RECIBIR",
  "ACUERDO_PAGO",
  "PROMESA_PAGO",
  "CAMBIO_DOMICILIO",
  "INFORMACION_REFERENCIA",
];

export function NuevaGestionDialog({ cuentaId }: { cuentaId: string }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"TELEFONICA" | "VISITA">("TELEFONICA");
  const [resultado, setResultado] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const resultados = tipo === "TELEFONICA" ? RESULTADOS_TELEFONICA : RESULTADOS_VISITA;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("tipo", tipo);
    formData.set("resultado", resultado);

    startTransition(async () => {
      const res = await crearGestion(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Gestión registrada");
        setOpen(false);
        setResultado("");
        formRef.current?.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Registrar gestión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva gestión</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <input type="hidden" name="cuenta_id" value={cuentaId} />

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as "TELEFONICA" | "VISITA");
                setResultado("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TELEFONICA">Telefónica</SelectItem>
                <SelectItem value="VISITA">Visita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Resultado *</Label>
            <Select value={resultado} onValueChange={setResultado} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar resultado..." />
              </SelectTrigger>
              <SelectContent>
                {resultados.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comentario">Comentario</Label>
            <textarea
              id="comentario"
              name="comentario"
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha_gestion">Fecha y hora</Label>
            <Input
              id="fecha_gestion"
              name="fecha_gestion"
              type="datetime-local"
              defaultValue={new Date(
                Date.now() - new Date().getTimezoneOffset() * 60000
              )
                .toISOString()
                .slice(0, 16)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !resultado}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
