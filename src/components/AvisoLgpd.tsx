import { ShieldCheck } from "lucide-react";

export function AvisoLgpd() {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <p>
        <strong className="text-foreground">Seu voto é secreto e o CPF não fica salvo.</strong> Ele
        é usado apenas na hora de entrar, para confirmar que você pode votar e impedir voto
        duplicado. Depois disso, nem o organizador da eleição consegue relacionar você ao seu voto.
      </p>
    </div>
  );
}
