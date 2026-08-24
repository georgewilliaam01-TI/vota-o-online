import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Lock,
  Plus,
  ShieldCheck,
  Vote,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cedulaQuery, eleicaoQuery, resultadosQuery } from "@/lib/eleicao";
import { useRealtimeVotacao } from "@/hooks/useRealtimeVotacao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crie votações online — fácil, rápido e seguro" },
      {
        name: "description",
        content:
          "Configure uma eleição em minutos, compartilhe um link e as pessoas votam só com o CPF. Voto secreto e resultados ao vivo.",
      },
      { property: "og:title", content: "Crie votações online — fácil, rápido e seguro" },
      {
        property: "og:description",
        content:
          "Configure em minutos, compartilhe um link e as pessoas votam só com o CPF. Resultados ao vivo.",
      },
    ],
  }),
  component: Inicio,
});

const HERO_CSS = `
.vt-aurora{position:fixed;inset:-20% -10%;z-index:0;pointer-events:none;filter:blur(60px) saturate(140%)}
.vt-blob{position:absolute;border-radius:50%;mix-blend-mode:screen;opacity:.5}
.vt-b1{width:46vw;height:46vw;left:-8vw;top:-8vw;background:radial-gradient(circle at 30% 30%,#7b53ff,transparent 60%);animation:vtd1 22s ease-in-out infinite}
.vt-b2{width:40vw;height:40vw;right:-6vw;top:0;background:radial-gradient(circle at 60% 40%,#4f7cff,transparent 60%);animation:vtd2 26s ease-in-out infinite}
.vt-b3{width:38vw;height:38vw;left:26vw;top:22vw;background:radial-gradient(circle at 50% 50%,#c250ff,transparent 62%);animation:vtd3 30s ease-in-out infinite}
@keyframes vtd1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(5vw,3vw) scale(1.1)}}
@keyframes vtd2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-4vw,4vw) scale(1.08)}}
@keyframes vtd3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(3vw,-3vw) scale(1.12)}}
.vt-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}
.vt-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 90% at 50% 35%,transparent 52%,rgba(0,0,0,.55) 100%)}
.vt-title{font-size:clamp(40px,6.2vw,96px);line-height:1;letter-spacing:-.04em}
.vt-grad{background:linear-gradient(100deg,#fff 10%,#b9a6ff 55%,#6f8bff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.vt-pulse{animation:vtpulse 1.8s infinite}
@keyframes vtpulse{0%{box-shadow:0 0 0 0 rgba(139,92,246,.6)}70%{box-shadow:0 0 0 8px rgba(139,92,246,0)}100%{box-shadow:0 0 0 0 rgba(139,92,246,0)}}
`;

function iniciais(n: string) {
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Inicio() {
  useRealtimeVotacao();
  const eleicao = useQuery(eleicaoQuery);
  const resultados = useQuery(resultadosQuery);
  const cedula = useQuery(cedulaQuery);
  const [ehAdmin, setEhAdmin] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!ativo || !data.user) return;
      const { data: admin } = await supabase.rpc("is_admin");
      if (ativo) setEhAdmin(Boolean(admin));
    })();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0,
      h = 0,
      parts: { x: number; y: number; r: number; vy: number; vx: number; a: number }[] = [];
    let raf = 0;
    const resize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      parts = Array.from({ length: Math.min(70, Math.floor(w / 20)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.4,
        vy: -(Math.random() * 0.25 + 0.05),
        vx: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.45 + 0.15,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = `rgba(180,170,255,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const aberta = eleicao.data?.status === "aberta";
  const meta = eleicao.data?.meta_votantes ?? null;
  const total = resultados.data?.totalVotos ?? 0;
  const pct = meta ? Math.min(Math.round((total / meta) * 100), 100) : 0;
  const faltam = meta ? Math.max(meta - total, 0) : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />
      <div className="vt-aurora" aria-hidden>
        <div className="vt-blob vt-b1" />
        <div className="vt-blob vt-b2" />
        <div className="vt-blob vt-b3" />
      </div>
      <canvas ref={canvasRef} className="vt-canvas" aria-hidden />
      <div className="vt-vignette" aria-hidden />

      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-5 py-3.5 sm:px-10">
          <div className="flex items-center gap-2.5 font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#5b7cff]">
              <ShieldCheck className="size-4 text-white" aria-hidden />
            </span>
            Votação Online
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <Lock className="size-4" aria-hidden /> Administração
            </Link>
          </Button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1760px] px-5 pb-20 sm:px-10">
        {/* HERO */}
        <section className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.25fr_.75fr] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <span>Plataforma de votação</span>
              <span className="inline-flex items-center gap-2 text-[#cdbcff]">
                <span className="vt-pulse size-[7px] rounded-full bg-primary" /> Ao vivo
              </span>
            </div>
            <h1 className="vt-title mt-4 font-extrabold">
              <span className="vt-grad">Crie votações</span>
              <br />
              <span className="font-light text-[#d9d9ea]">online.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Configure em minutos, compartilhe um link e as pessoas votam só com o CPF. Resultados
              apurados ao vivo, de forma aberta e segura.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-13">
                <Link to="/admin">
                  <Plus className="size-5" aria-hidden /> Criar minha votação
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-13">
                <Link to="/votar">
                  <Vote className="size-5" aria-hidden /> Votar agora
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
              {["Voto secreto", "Sem cadastro", "Resultado na hora"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* painel: real para admin, exemplo para visitante */}
          {ehAdmin ? (
            <PainelReal
              titulo={eleicao.data?.titulo ?? "Sua eleição"}
              aberta={aberta}
              total={total}
              meta={meta}
              faltam={faltam}
              pct={pct}
              cargos={cedula.data?.cargos ?? []}
              opcoes={cedula.data?.opcoes ?? []}
              contagem={resultados.data?.contagem ?? {}}
            />
          ) : (
            <PainelExemplo />
          )}
        </section>

        {/* privacidade em destaque */}
        <div className="mt-6 flex items-start gap-4 rounded-[18px] border border-primary/35 bg-gradient-to-br from-primary/15 to-[#5b7cff]/10 p-6 shadow-[0_20px_50px_-30px] shadow-primary sm:p-7">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#5b7cff] text-white">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <div>
            <b className="block text-[16.5px] font-bold text-white">
              O seu voto é secreto. Ninguém consegue saber em quem você votou.
            </b>
            <p className="mt-1.5 max-w-3xl text-sm text-[#c9cce0]">
              <u className="decoration-primary/70 underline-offset-2">
                O seu CPF não fica salvo no sistema.
              </u>{" "}
              Ele é usado só na hora de entrar, para confirmar que você pode votar e impedir voto
              duplicado. Depois disso, nem o organizador da eleição consegue relacionar você ao seu
              voto.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-[12.5px] font-semibold text-[#cdbcff]">
              {["Voto anônimo", "CPF não é salvo", "Conforme a LGPD"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* faixa de 3 */}
        <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {[
            { i: ShieldCheck, t: "Seguro", d: "Voto anônimo, sem ligação com o CPF." },
            { i: Zap, t: "Rápido", d: "Sem senha, sem e-mail, sem código." },
            { i: Activity, t: "Ao vivo", d: "Cada voto aparece na hora, para todos." },
          ].map((f) => (
            <div key={f.t} className="bg-card/60 p-5 backdrop-blur">
              <span className="flex size-9 items-center justify-center rounded-[10px] border border-border bg-primary/15 text-[#c9bcff]">
                <f.i className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{f.t}</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        {/* como funciona */}
        <section className="mt-11">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a99bff]">
            Como funciona
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {[
              ["1", "Configure", "Cargos e candidatos"],
              ["2", "Compartilhe", "Envie o link"],
              ["3", "Acompanhe", "Apuração ao vivo"],
            ].map(([n, t, d]) => (
              <div
                key={n}
                className="flex min-w-[170px] flex-1 items-start gap-3 rounded-[13px] border border-border bg-card/60 p-4 backdrop-blur"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-primary to-[#5b7cff] text-xs font-bold text-white">
                  {n}
                </span>
                <div>
                  <b className="block text-sm font-semibold">{t}</b>
                  <span className="text-[12.5px] text-muted-foreground">{d}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-11 flex flex-wrap justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <span>Votação Online</span>
          <a href="#" className="inline-flex items-center gap-1.5">
            <ChevronDown className="size-3.5" aria-hidden /> Role para explorar
          </a>
        </div>
      </div>
    </main>
  );
}

function CartaoBase({ children, exemplo }: { children: React.ReactNode; exemplo?: boolean }) {
  return (
    <div
      className={`rounded-[20px] border bg-card/70 p-5 backdrop-blur-xl ${
        exemplo
          ? "border-dashed border-border"
          : "border-border shadow-[0_30px_70px_-30px] shadow-primary/60"
      }`}
    >
      {children}
    </div>
  );
}

function Barra({
  nome,
  width,
  rotulo,
  lider,
}: {
  nome: string;
  width: number;
  rotulo: number;
  lider?: boolean;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2.5">
      <div className="w-[78px] shrink-0 truncate text-[12.5px] text-[#cfd2e2]">{nome}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            lider
              ? "bg-gradient-to-r from-primary to-[#c66bff]"
              : "bg-gradient-to-r from-[#5b7cff] to-primary"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="w-9 text-right text-xs tabular-nums text-muted-foreground">{rotulo}%</div>
    </div>
  );
}

function PainelExemplo() {
  const dem: [string, number][] = [
    ["Candidata A", 58],
    ["Candidato B", 34],
    ["Branco/Nulo", 8],
  ];
  return (
    <CartaoBase exemplo>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-input bg-white/5 px-3 py-1 text-[11.5px] font-semibold text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> Exemplo ilustrativo
        </span>
        <span className="text-[12.5px] text-muted-foreground">Dados fictícios</span>
      </div>
      <div className="mt-3.5 text-[17px] font-bold">Como fica a sua apuração</div>
      <div className="mt-0.5 text-[12.5px] text-muted-foreground">
        Os números reais aparecem aqui para o administrador.
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="text-[23px] font-bold tabular-nums">128</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Votos
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="text-[23px] font-bold tabular-nums">22</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Faltam
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-[12.5px] text-muted-foreground">
          <span>Progresso da meta</span>
          <span>85%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-[#5b7cff] to-[#c66bff]"
            style={{ width: "85%" }}
          />
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-0.5 text-[12.5px] text-muted-foreground">Presidente</div>
        {dem.map(([n, p], i) => (
          <Barra key={n} nome={n} width={p} rotulo={p} lider={i === 0} />
        ))}
      </div>
      <Button asChild className="mt-4 w-full" size="sm">
        <Link to="/admin">
          <Plus className="size-4" aria-hidden /> Criar a minha votação
        </Link>
      </Button>
    </CartaoBase>
  );
}

function PainelReal({
  titulo,
  aberta,
  total,
  meta,
  faltam,
  pct,
  cargos,
  opcoes,
  contagem,
}: {
  titulo: string;
  aberta: boolean;
  total: number;
  meta: number | null;
  faltam: number;
  pct: number;
  cargos: { id: string; titulo: string }[];
  opcoes: { id: string; cargo_id: string; nome: string; tipo: string }[];
  contagem: Record<string, number>;
}) {
  const cg = cargos[0];
  const cands = cg ? opcoes.filter((o) => o.cargo_id === cg.id && o.tipo === "candidato") : [];
  const totalCg = cg
    ? opcoes.filter((o) => o.cargo_id === cg.id).reduce((a, o) => a + (contagem[o.id] ?? 0), 0)
    : 0;
  const maxCg = Math.max(1, ...cands.map((o) => contagem[o.id] ?? 0));

  return (
    <CartaoBase>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1 text-[11.5px] font-semibold ${
            aberta ? "bg-primary/15 text-[#cdbcff]" : "bg-white/5 text-muted-foreground"
          }`}
        >
          <span
            className={`size-[7px] rounded-full ${aberta ? "bg-primary shadow-[0_0_8px] shadow-primary" : "bg-muted-foreground"}`}
          />
          {aberta ? "Votação aberta" : "Encerrada"}
        </span>
        <span className="text-[12.5px] text-muted-foreground">Atualiza em tempo real</span>
      </div>
      <div className="mt-3.5 text-[17px] font-bold">{titulo}</div>
      <div className="mt-0.5 text-[12.5px] text-muted-foreground">
        {cargos.length} cargo(s) ·{" "}
        {opcoes.filter((o) => o.tipo === "candidato").length} candidatos
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="text-[23px] font-bold tabular-nums">{total}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Votos
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <div className="text-[23px] font-bold tabular-nums">{meta ? faltam : "—"}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            {meta ? "Faltam" : "Sem meta"}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-[12.5px] text-muted-foreground">
          <span>Progresso da meta</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-[#5b7cff] to-[#c66bff]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {cg && (
        <div className="mt-4">
          <div className="mb-0.5 text-[12.5px] text-muted-foreground">{cg.titulo}</div>
          {cands.map((o) => {
            const v = contagem[o.id] ?? 0;
            const p = totalCg ? Math.round((v / totalCg) * 100) : 0;
            const lider = v > 0 && v === maxCg;
            return (
              <Barra
                key={o.id}
                nome={o.nome}
                width={totalCg ? Math.max((v / maxCg) * 100, 3) : 0}
                rotulo={p}
                lider={lider}
              />
            );
          })}
        </div>
      )}
      <Button asChild variant="secondary" className="mt-4 w-full" size="sm">
        <Link to="/resultados">
          <BarChart3 className="size-4" aria-hidden /> Ver apuração completa
        </Link>
      </Button>
    </CartaoBase>
  );
}
