import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Loader2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardOpcao } from "@/components/CardOpcao";
import { AvisoLgpd } from "@/components/AvisoLgpd";
import { cedulaQuery, eleicaoQuery } from "@/lib/eleicao";
import { cpfValido, mascaraCpf, somenteDigitos } from "@/lib/cpf";
import { consultarCpf, enviarVoto } from "@/lib/votacao.functions";

export const Route = createFileRoute("/votar")({
  head: () => ({
    meta: [
      { title: "Votar — Votação Online" },
      {
        name: "description",
        content: "Digite seu CPF, escolha seus candidatos e confirme. Leva menos de um minuto.",
      },
      { property: "og:title", content: "Votar — Votação Online" },
      {
        property: "og:description",
        content: "Digite seu CPF, escolha seus candidatos e confirme. Leva menos de um minuto.",
      },
    ],
  }),
  component: Votar,
});

type Etapa = "cpf" | "cedula" | "revisao" | "comprovante";

const MENSAGENS: Record<string, string> = {
  cpf_invalido: "CPF inválido. Confira os números digitados.",
  cpf_ja_votou: "Este CPF já votou.",
  votacao_encerrada: "A votação está encerrada no momento.",
  escolhas_invalidas: "Escolha uma opção para cada cargo antes de confirmar.",
  erro: "Não foi possível registrar o voto. Tente novamente.",
};

function Votar() {
  const eleicao = useQuery(eleicaoQuery);
  const cedula = useQuery(cedulaQuery);
  const validarCpf = useServerFn(consultarCpf);
  const registrarVoto = useServerFn(enviarVoto);

  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  const [comprovante, setComprovante] = useState<{ protocolo: string; data: string } | null>(null);

  const cargos = useMemo(() => cedula.data?.cargos ?? [], [cedula.data]);
  const opcoes = cedula.data?.opcoes ?? [];
  const aberta = eleicao.data?.status === "aberta";
  const cargoAtual = cargos[indice];
  const faltando = cargos.filter((c) => !escolhas[c.id]);

  async function avancarCpf() {
    setErro(null);
    if (!cpfValido(cpf)) {
      setErro(MENSAGENS["cpf_invalido"]!);
      return;
    }
    setCarregando(true);
    try {
      const resultado = await validarCpf({ data: { cpf: somenteDigitos(cpf) } });
      if (!resultado.ok) {
        setErro(MENSAGENS[resultado.motivo] ?? MENSAGENS["erro"]!);
        return;
      }
      setEtapa("cedula");
      setIndice(0);
    } catch {
      setErro(MENSAGENS["erro"]!);
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar() {
    setErro(null);
    setCarregando(true);
    try {
      const resultado = await registrarVoto({
        data: {
          cpf: somenteDigitos(cpf),
          escolhas: cargos.map((c) => ({ cargo_id: c.id, opcao_id: escolhas[c.id]! })),
        },
      });
      if (!resultado.ok) {
        setErro(MENSAGENS[resultado.motivo] ?? MENSAGENS["erro"]!);
        toast.error(MENSAGENS[resultado.motivo] ?? MENSAGENS["erro"]!);
        return;
      }
      setComprovante({ protocolo: resultado.protocolo, data: resultado.data });
      setCpf("");
      setEtapa("comprovante");
    } catch {
      setErro(MENSAGENS["erro"]!);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen superficie-civica">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 nao-imprimir">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden /> Início
          </Link>
        </Button>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          {eleicao.data?.titulo ?? "Votação"}
        </h1>

        {!aberta && etapa !== "comprovante" && !eleicao.isLoading && (
          <Alert className="mt-6">
            <AlertDescription>
              A votação está encerrada. Você ainda pode{" "}
              <Link to="/resultados" className="font-semibold underline">
                ver os resultados
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {etapa === "cpf" && aberta && (
          <section className="mt-6 anima-etapa space-y-5">
            <div className="rounded-2xl border bg-card p-5 cartao-elevado">
              <Label htmlFor="cpf" className="text-base">
                Digite seu CPF para começar
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem cadastro, sem e-mail e sem senha.
              </p>
              <Input
                id="cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void avancarCpf();
                }}
                className="mt-4 h-14 text-center font-mono text-xl tracking-widest"
              />
              {erro && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    {erro}
                    {erro === MENSAGENS["cpf_ja_votou"] && (
                      <Link to="/resultados" className="font-semibold underline">
                        Ver resultados
                      </Link>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="mt-4 h-12 w-full text-base"
                onClick={() => void avancarCpf()}
                disabled={carregando}
              >
                {carregando ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
                Continuar <ArrowRight className="size-5" aria-hidden />
              </Button>
            </div>
            <AvisoLgpd />
          </section>
        )}

        {etapa === "cedula" && (
          <section className="mt-6 anima-etapa">
            {cedula.isLoading ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : cargos.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
                Nenhum cargo cadastrado nesta eleição.
              </p>
            ) : cargoAtual ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">
                    Cargo {indice + 1} de {cargos.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {faltando.length === 0
                      ? "Todos os cargos escolhidos"
                      : `Faltam escolher: ${faltando.map((c) => c.titulo).join(", ")}`}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">{cargoAtual.titulo}</h2>
                {cargoAtual.descricao && (
                  <p className="mt-1 text-muted-foreground">{cargoAtual.descricao}</p>
                )}

                <div key={cargoAtual.id} className="mt-5 space-y-3 anima-etapa">
                  {opcoes
                    .filter((o) => o.cargo_id === cargoAtual.id)
                    .map((opcao) => (
                      <CardOpcao
                        key={opcao.id}
                        opcao={opcao}
                        selecionada={escolhas[cargoAtual.id] === opcao.id}
                        onSelecionar={() =>
                          setEscolhas((prev) => ({ ...prev, [cargoAtual.id]: opcao.id }))
                        }
                      />
                    ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => (indice === 0 ? setEtapa("cpf") : setIndice(indice - 1))}
                  >
                    <ArrowLeft className="size-4" aria-hidden /> Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!escolhas[cargoAtual.id]}
                    onClick={() =>
                      indice + 1 < cargos.length ? setIndice(indice + 1) : setEtapa("revisao")
                    }
                  >
                    {indice + 1 < cargos.length ? "Próximo cargo" : "Revisar voto"}
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </>
            ) : null}
          </section>
        )}

        {etapa === "revisao" && (
          <section className="mt-6 anima-etapa">
            <h2 className="text-2xl font-semibold">Revise suas escolhas</h2>
            <ul className="mt-4 space-y-3">
              {cargos.map((cargo, i) => {
                const opcao = opcoes.find((o) => o.id === escolhas[cargo.id]);
                return (
                  <li
                    key={cargo.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 cartao-elevado"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {cargo.titulo}
                      </p>
                      <p className="truncate font-semibold">{opcao?.nome ?? "—"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIndice(i);
                        setEtapa("cedula");
                      }}
                    >
                      Corrigir
                    </Button>
                  </li>
                );
              })}
            </ul>

            {erro && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEtapa("cedula")}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={carregando || faltando.length > 0}
                onClick={() => void confirmar()}
              >
                {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Confirmar voto
              </Button>
            </div>
          </section>
        )}

        {etapa === "comprovante" && comprovante && (
          <section className="mt-6 anima-etapa rounded-2xl border bg-card p-6 text-center cartao-elevado">
            <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Voto registrado com sucesso</h2>
            <p className="mt-1 text-muted-foreground">Obrigado por participar.</p>

            <div className="mt-6 rounded-xl border border-dashed p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Protocolo</p>
              <p className="font-mono text-2xl font-bold tracking-widest">
                {comprovante.protocolo}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(comprovante.data).toLocaleString("pt-BR")}
              </p>
            </div>

            <p className="mx-auto mt-4 flex max-w-md items-start gap-2 text-left text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Seu voto é secreto. Este protocolo comprova a participação e não revela em quem você
              votou.
            </p>

            <div className="mt-6 flex flex-col gap-3 nao-imprimir sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden /> Imprimir/Salvar comprovante
              </Button>
              <Button asChild className="flex-1">
                <Link to="/resultados">
                  <BarChart3 className="size-4" aria-hidden /> Ver resultados ao vivo
                </Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
