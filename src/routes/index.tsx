import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Vote,
  Lock,
  Zap,
  ShieldCheck,
  Plus,
  Share2,
  UserCheck,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressoVotacao } from "@/components/ProgressoVotacao";
import { AvisoLgpd } from "@/components/AvisoLgpd";
import { eleicaoQuery, resultadosQuery } from "@/lib/eleicao";
import { useRealtimeVotacao } from "@/hooks/useRealtimeVotacao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crie sua votação online — fácil, rápido e seguro" },
      {
        name: "description",
        content:
          "Monte uma eleição em minutos, compartilhe um link e as pessoas votam só com o CPF. Voto secreto, anônimo e resultados ao vivo.",
      },
      { property: "og:title", content: "Crie sua votação online — fácil, rápido e seguro" },
      {
        property: "og:description",
        content:
          "Monte uma eleição em minutos, compartilhe um link e as pessoas votam só com o CPF. Resultados ao vivo.",
      },
    ],
  }),
  component: Inicio,
});

const BENEFICIOS = [
  {
    icone: ShieldCheck,
    titulo: "Seguro",
    texto:
      "Voto secreto e anônimo. O CPF só valida a elegibilidade e impede voto duplicado — nunca fica ligado à sua escolha (LGPD).",
  },
  {
    icone: Zap,
    titulo: "Rápido",
    texto:
      "Chegou, digitou o CPF e votou. Sem senha, sem e-mail, sem código. Qualquer pessoa usa sem instrução.",
  },
  {
    icone: BarChart3,
    titulo: "Ao vivo",
    texto:
      "Um placar em tempo real: cada voto aparece na hora e fica aberto para todos acompanharem.",
  },
];

const PASSOS = [
  {
    icone: Plus,
    titulo: "Crie a votação",
    texto: "No painel, dê um título e cadastre os cargos e os candidatos.",
  },
  {
    icone: Share2,
    titulo: "Compartilhe o link",
    texto: "Copie o link e mande no WhatsApp, e-mail ou onde quiser.",
  },
  {
    icone: UserCheck,
    titulo: "As pessoas votam",
    texto: "Quem tem o link vota com o CPF, uma vez só — inclusive você.",
  },
  {
    icone: BarChart3,
    titulo: "Acompanhe ao vivo",
    texto: "Os resultados sobem na hora e ficam abertos para todos verem.",
  },
];

const USOS = [
  "Assembleias e sindicatos",
  "Condomínios",
  "Sala de aula e grêmio",
  "Igrejas e ONGs",
  "Empresas e equipes",
  "Clubes e associações",
];

function Inicio() {
  useRealtimeVotacao();
  const eleicao = useQuery(eleicaoQuery);
  const resultados = useQuery(resultadosQuery);

  const aberta = eleicao.data?.status === "aberta";

  return (
    <main className="min-h-screen superficie-civica">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        {/* Topo */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Vote className="size-3.5 text-primary" aria-hidden /> Votação online
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <Lock className="size-4" aria-hidden /> Administração
            </Link>
          </Button>
        </div>

        {/* Hero */}
        <section className="mt-10 sm:mt-14">
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Crie sua votação <span className="text-primary">online</span>.
            <br />
            Fácil, rápido e seguro.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Monte uma eleição em minutos, compartilhe um link e as pessoas votam usando só o CPF. Os
            resultados aparecem ao vivo, na hora.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 px-6 text-base">
              <Link to="/admin">
                <Plus className="size-5" aria-hidden /> Criar minha votação
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14 px-6 text-base">
              <Link to="/votar">
                <Vote className="size-5" aria-hidden /> Votar na eleição atual
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-14 px-5 text-base">
              <a href="#como-funciona">
                <ChevronDown className="size-5" aria-hidden /> Ver como funciona
              </a>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden /> Voto secreto e anônimo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden /> Sem cadastro para votar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden /> Resultados em tempo real
            </span>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="rounded-2xl border bg-card p-5 cartao-elevado">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <b.icone className="size-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold">{b.titulo}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.texto}</p>
            </div>
          ))}
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mt-16 scroll-mt-6">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Como funciona</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Em 4 passos simples
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((p, i) => (
              <div key={p.titulo} className="relative rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p.icone className="size-5 text-primary" aria-hidden />
                </div>
                <h4 className="mt-4 text-base font-bold">{p.titulo}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Perfeito para */}
        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Perfeito para</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Qualquer grupo que precisa decidir junto
          </h2>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {USOS.map((u) => (
              <span
                key={u}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium"
              >
                <span className="mr-1.5 text-primary">•</span>
                {u}
              </span>
            ))}
          </div>
        </section>

        {/* Votação atual */}
        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Votação atual</p>
          <div className="mt-3 rounded-3xl border bg-card p-6 cartao-elevado sm:p-8">
            {eleicao.isLoading ? (
              <Skeleton className="h-10 w-2/3" />
            ) : (
              <>
                <Badge
                  className={
                    aberta
                      ? "bg-success text-success-foreground hover:bg-success"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  {aberta ? "Votação aberta" : "Votação encerrada"}
                </Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {eleicao.data?.titulo ?? "Eleição não configurada"}
                </h2>
                {eleicao.data?.descricao && (
                  <p className="mt-2 max-w-2xl text-muted-foreground">{eleicao.data.descricao}</p>
                )}
              </>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="h-14 text-base" disabled={!aberta}>
                <Link to="/votar">
                  <Vote className="size-5" aria-hidden /> Votar agora
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-14 text-base">
                <Link to="/resultados">
                  <BarChart3 className="size-5" aria-hidden /> Ver resultados ao vivo
                </Link>
              </Button>
            </div>

            <div className="mt-5">
              {resultados.isLoading ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : (
                <ProgressoVotacao
                  total={resultados.data?.totalVotos ?? 0}
                  meta={eleicao.data?.meta_votantes ?? null}
                />
              )}
            </div>

            <div className="mt-5">
              <AvisoLgpd />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
