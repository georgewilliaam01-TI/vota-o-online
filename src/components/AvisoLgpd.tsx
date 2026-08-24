import { ShieldCheck } from "lucide-react";

export function AvisoLgpd() {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <p>
        <strong className="text-foreground">Privacidade (LGPD):</strong> o CPF é usado apenas para
        validar a elegibilidade e impedir voto duplicado. Ele é guardado de forma criptografada e
        sem qualquer ligação com o conteúdo do voto. Seu voto é secreto e anônimo.
      </p>
    </div>
  );
}
