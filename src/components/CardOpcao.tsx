import { Check, Ban, FileMinus } from "lucide-react";
import { iniciais } from "@/lib/cpf";
import { urlFoto, type Opcao } from "@/lib/eleicao";
import { cn } from "@/lib/utils";

type Props = {
  opcao: Opcao;
  selecionada: boolean;
  onSelecionar: () => void;
};

export function CardOpcao({ opcao, selecionada, onSelecionar }: Props) {
  const foto = urlFoto(opcao.foto_url);
  const especial = opcao.tipo !== "candidato";

  return (
    <button
      type="button"
      onClick={onSelecionar}
      aria-pressed={selecionada}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left cartao-elevado",
        "hover:cartao-elevado-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selecionada ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-6 items-center justify-center rounded-full transition-all",
          selecionada
            ? "scale-100 bg-primary text-primary-foreground opacity-100"
            : "scale-75 bg-muted text-transparent opacity-0",
        )}
        aria-hidden
      >
        <Check className="size-4" />
      </span>

      {especial ? (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted text-muted-foreground">
          {opcao.tipo === "branco" ? (
            <FileMinus className="size-6" aria-hidden />
          ) : (
            <Ban className="size-6" aria-hidden />
          )}
        </span>
      ) : foto ? (
        <img
          src={foto}
          alt={opcao.nome}
          className="size-14 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-lg font-semibold text-secondary-foreground">
          {iniciais(opcao.nome)}
        </span>
      )}

      <span className="min-w-0 flex-1 pr-6">
        <span className="block truncate font-semibold">{opcao.nome}</span>
        {opcao.descricao && (
          <span className="mt-1 block text-sm text-muted-foreground">{opcao.descricao}</span>
        )}
      </span>
    </button>
  );
}
