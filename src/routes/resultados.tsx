import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressoVotacao } from "@/components/ProgressoVotacao";
import { cedulaQuery, eleicaoQuery, resultadosQuery, urlFoto, type Opcao } from "@/lib/eleicao";
import { useRealtimeVotacao } from "@/hooks/useRealtimeVotacao";
import { iniciais } from "@/lib/cpf";

export const Route = createFileRoute("/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados ao vivo — Votação Online" },
      {
        name: "description",
        content: "Acompanhe a apuração em tempo real, cargo por cargo, com percentuais e líderes.",
      },
      { property: "og:title", content: "Resultados ao vivo — Votação Online" },
      {
        property: "og:description",
        content: "Acompanhe a apuração em tempo real, cargo por cargo, com percentuais e líderes.",
      },
    ],
  }),
  component: Resultados,
});

function Resultados() {
  useRealtimeVotacao();
  const eleicao = useQuery(eleicaoQuery);
  const cedula = useQuery(cedulaQuery);
  const resultados = useQuery(resultadosQuery);

  const contagem = resultados.data?.contagem ?? {};
  const cargos = cedula.data?.cargos ?? [];
  const opcoes = cedula.data?.opcoes ?? [];
  const aberta = eleicao.data?.status === "aberta";

  return (
    <main className="min-h-screen superficie-civica">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden /> Início
          </Link>
        </Button>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {eleicao.data?.titulo ?? "Resultados"}
            </h1>
            <p className="mt-1 text-muted-foreground">Apuração ao vivo</p>
          </div>
          <Badge
            className={
              aberta
                ? "bg-success text-success-foreground hover:bg-success"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }
          >
            {aberta ? (
              <>
                <Radio className="size-3.5 animate-pulse" aria-hidden /> Ao vivo
              </>
            ) : (
              "Votação encerrada"
            )}
          </Badge>
        </header>

        <div className="mt-6">
          <ProgressoVotacao
            total={resultados.data?.totalVotos ?? 0}
            meta={eleicao.data?.meta_votantes ?? null}
          />
        </div>

        {cedula.isLoading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : cargos.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            Nenhum cargo cadastrado ainda. Assim que o administrador configurar a eleição, os
            resultados aparecem aqui.
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {cargos.map((cargo) => (
              <PainelCargo
                key={cargo.id}
                titulo={cargo.titulo}
                opcoes={opcoes.filter((o) => o.cargo_id === cargo.id)}
                contagem={contagem}
              />
            ))}
          </div>
        )}

        {aberta && (
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link to="/votar">Votar agora</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

function PainelCargo({
  titulo,
  opcoes,
  contagem,
}: {
  titulo: string;
  opcoes: Opcao[];
  contagem: Record<string, number>;
}) {
  const total = opcoes.reduce((soma, o) => soma + (contagem[o.id] ?? 0), 0);
  const ordenadas = [...opcoes].sort((a, b) => (contagem[b.id] ?? 0) - (contagem[a.id] ?? 0));
  const maior = ordenadas.length > 0 ? (contagem[ordenadas[0]!.id] ?? 0) : 0;

  return (
    <section className="rounded-2xl border bg-card p-5 cartao-elevado">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <span className="text-sm text-muted-foreground">
          {total} voto{total === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {ordenadas.map((opcao) => {
          const votos = contagem[opcao.id] ?? 0;
          const pct = total > 0 ? (votos / total) * 100 : 0;
          const lider = total > 0 && votos === maior && votos > 0;
          const foto = urlFoto(opcao.foto_url);

          return (
            <li key={opcao.id}>
              <div className="flex items-center gap-3">
                {opcao.tipo === "candidato" ? (
                  foto ? (
                    <img
                      src={foto}
                      alt={opcao.nome}
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {iniciais(opcao.nome)}
                    </span>
                  )
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed text-xs text-muted-foreground">
                    {opcao.tipo === "branco" ? "BR" : "NU"}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {opcao.nome}
                      {opcao.numero ? (
                        <span className="ml-2 text-xs text-muted-foreground">{opcao.numero}</span>
                      ) : null}
                      {lider && (
                        <Crown
                          className="ml-2 inline size-4 text-accent"
                          aria-label="Liderando"
                        />
                      )}
                    </p>
                    <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {votos} · {pct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        lider
                          ? "h-full rounded-full bg-primary transition-all duration-700 ease-out"
                          : "h-full rounded-full bg-primary/40 transition-all duration-700 ease-out"
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
