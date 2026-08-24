import { Progress } from "@/components/ui/progress";

type Props = {
  total: number;
  meta: number | null;
  compacto?: boolean;
};

export function ProgressoVotacao({ total, meta, compacto = false }: Props) {
  if (!meta || meta <= 0) {
    return (
      <div className="rounded-xl border bg-card p-4 cartao-elevado">
        <p className="text-sm text-muted-foreground">Total de votos registrados</p>
        <p className="font-display text-3xl font-semibold">{total}</p>
      </div>
    );
  }

  const faltam = Math.max(meta - total, 0);
  const pct = Math.min(Math.round((total / meta) * 100), 100);

  return (
    <div className="rounded-xl border bg-card p-4 cartao-elevado sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Votos registrados</p>
          <p className="font-display text-3xl font-semibold leading-none">
            {total}
            <span className="text-base font-normal text-muted-foreground"> / {meta}</span>
          </p>
        </div>
        <p
          className={
            faltam === 0
              ? "text-sm font-semibold text-success"
              : "text-sm font-medium text-muted-foreground"
          }
        >
          {faltam === 0 ? "Meta atingida" : `Faltam ${faltam} voto${faltam === 1 ? "" : "s"}`}
        </p>
      </div>
      <Progress value={pct} className="mt-3 h-3" />
      {!compacto && (
        <p className="mt-2 text-xs text-muted-foreground">
          {pct}% da meta de {meta} votantes
        </p>
      )}
    </div>
  );
}
