import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressoVotacao } from "@/components/ProgressoVotacao";
import {
  cedulaQuery,
  eleicaoQuery,
  resultadosQuery,
  urlFoto,
  type Cargo,
  type Opcao,
} from "@/lib/eleicao";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — Votação Online" },
      {
        name: "description",
        content: "Configure a eleição, cargos, candidatos e acompanhe a apuração.",
      },
      { property: "og:title", content: "Painel do administrador — Votação Online" },
      { property: "og:description", content: "Configure a eleição, cargos e candidatos." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ehAdmin, setEhAdmin] = useState<boolean | null>(null);
  const [temAdmin, setTemAdmin] = useState<boolean>(true);

  const eleicao = useQuery(eleicaoQuery);
  const cedula = useQuery(cedulaQuery);
  const resultados = useQuery(resultadosQuery);

  async function verificarPapel() {
    const [{ data: admin }, { data: existe }] = await Promise.all([
      supabase.rpc("is_admin"),
      supabase.rpc("existe_admin"),
    ]);
    setEhAdmin(Boolean(admin));
    setTemAdmin(Boolean(existe));
  }

  useEffect(() => {
    void verificarPapel();
  }, []);

  function recarregar() {
    void queryClient.invalidateQueries();
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (ehAdmin === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  if (!ehAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center superficie-civica px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center cartao-elevado">
          <ShieldCheck className="mx-auto size-10 text-primary" aria-hidden />
          <h1 className="mt-3 text-2xl font-bold">Acesso restrito</h1>
          {temAdmin ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Esta conta não é administradora desta eleição.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Ainda não existe nenhum administrador. Você pode assumir esse papel agora.
              </p>
              <Button
                className="mt-4 w-full"
                onClick={async () => {
                  const { error } = await supabase.rpc("tornar_me_admin");
                  if (error) {
                    toast.error("Não foi possível tornar-se administrador.");
                    return;
                  }
                  toast.success("Você agora é o administrador.");
                  await verificarPapel();
                }}
              >
                Tornar-me administrador
              </Button>
            </>
          )}
          <Button variant="ghost" className="mt-3 w-full" onClick={() => void sair()}>
            <LogOut className="size-4" aria-hidden /> Sair
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen superficie-civica">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Painel do administrador</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/resultados">
                <BarChart3 className="size-4" aria-hidden /> Resultados
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void sair()}>
              <LogOut className="size-4" aria-hidden /> Sair
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <ProgressoVotacao
            total={resultados.data?.totalVotos ?? 0}
            meta={eleicao.data?.meta_votantes ?? null}
            compacto
          />
        </div>

        <Tabs defaultValue="eleicao" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="eleicao" className="flex-1">
              Eleição
            </TabsTrigger>
            <TabsTrigger value="cargos" className="flex-1">
              Cargos e candidatos
            </TabsTrigger>
            <TabsTrigger value="links" className="flex-1">
              Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eleicao" className="mt-4">
            <FormEleicao eleicao={eleicao.data ?? null} onSalvo={recarregar} />
          </TabsContent>

          <TabsContent value="cargos" className="mt-4">
            <GestaoCargos
              eleicaoId={eleicao.data?.id ?? null}
              cargos={cedula.data?.cargos ?? []}
              opcoes={cedula.data?.opcoes ?? []}
              onMudou={recarregar}
            />
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <Links />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function FormEleicao({
  eleicao,
  onSalvo,
}: {
  eleicao: { id: string; titulo: string; descricao: string | null; meta_votantes: number | null; status: string } | null;
  onSalvo: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [meta, setMeta] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!eleicao) return;
    setTitulo(eleicao.titulo);
    setDescricao(eleicao.descricao ?? "");
    setMeta(eleicao.meta_votantes ? String(eleicao.meta_votantes) : "");
  }, [eleicao]);

  if (!eleicao) return <Skeleton className="h-64 w-full rounded-2xl" />;

  async function salvar(campos: Record<string, unknown>) {
    setSalvando(true);
    const { error } = await supabase
      .from("eleicao")
      .update({ ...campos, atualizado_em: new Date().toISOString() })
      .eq("id", eleicao!.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    toast.success("Configuração salva.");
    onSalvo();
  }

  const aberta = eleicao.status === "aberta";

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 cartao-elevado">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Configuração da eleição</h2>
        <Badge
          className={
            aberta
              ? "bg-success text-success-foreground hover:bg-success"
              : "bg-muted text-muted-foreground hover:bg-muted"
          }
        >
          {aberta ? "Aberta" : "Encerrada"}
        </Badge>
      </div>

      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={500}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="meta">Quantas pessoas vão votar? (meta de votantes)</Label>
        <Input
          id="meta"
          inputMode="numeric"
          placeholder="Opcional"
          value={meta}
          onChange={(e) => setMeta(e.target.value.replace(/\D/g, "").slice(0, 7))}
          className="mt-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={salvando || !titulo.trim()}
          onClick={() =>
            void salvar({
              titulo: titulo.trim(),
              descricao: descricao.trim() || null,
              meta_votantes: meta ? Number(meta) : null,
            })
          }
        >
          {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Salvar
        </Button>
        {aberta ? (
          <Button variant="destructive" onClick={() => void salvar({ status: "encerrada" })}>
            Encerrar votação
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void salvar({ status: "aberta" })}>
            Abrir votação
          </Button>
        )}
      </div>
    </div>
  );
}

function GestaoCargos({
  eleicaoId,
  cargos,
  opcoes,
  onMudou,
}: {
  eleicaoId: string | null;
  cargos: Cargo[];
  opcoes: Opcao[];
  onMudou: () => void;
}) {
  const [novoCargo, setNovoCargo] = useState("");

  async function criarCargo() {
    if (!eleicaoId || !novoCargo.trim()) return;
    const { error } = await supabase.from("cargos").insert({
      eleicao_id: eleicaoId,
      titulo: novoCargo.trim(),
      ordem: cargos.length,
    });
    if (error) {
      toast.error("Não foi possível criar o cargo.");
      return;
    }
    setNovoCargo("");
    toast.success("Cargo criado com Branco e Nulo automáticos.");
    onMudou();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl border bg-card p-4 cartao-elevado">
        <Input
          placeholder="Novo cargo (ex.: Presidente)"
          value={novoCargo}
          maxLength={80}
          onChange={(e) => setNovoCargo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void criarCargo();
          }}
        />
        <Button onClick={() => void criarCargo()} disabled={!novoCargo.trim()}>
          <Plus className="size-4" aria-hidden /> Adicionar
        </Button>
      </div>

      {cargos.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
          Nenhum cargo cadastrado ainda.
        </p>
      ) : (
        cargos.map((cargo) => (
          <BlocoCargo
            key={cargo.id}
            cargo={cargo}
            opcoes={opcoes.filter((o) => o.cargo_id === cargo.id)}
            onMudou={onMudou}
          />
        ))
      )}
    </div>
  );
}

function BlocoCargo({
  cargo,
  opcoes,
  onMudou,
}: {
  cargo: Cargo;
  opcoes: Opcao[];
  onMudou: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(cargo.titulo);
  const [descricao, setDescricao] = useState(cargo.descricao ?? "");
  const [ordem, setOrdem] = useState(String(cargo.ordem));

  const candidatos = useMemo(() => opcoes.filter((o) => o.tipo === "candidato"), [opcoes]);

  async function salvarCargo() {
    const { error } = await supabase
      .from("cargos")
      .update({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        ordem: Number(ordem) || 0,
      })
      .eq("id", cargo.id);
    if (error) {
      toast.error("Não foi possível salvar o cargo.");
      return;
    }
    setEditando(false);
    onMudou();
  }

  async function removerCargo() {
    const { error } = await supabase.from("cargos").delete().eq("id", cargo.id);
    if (error) {
      toast.error("Não foi possível remover o cargo.");
      return;
    }
    toast.success("Cargo removido.");
    onMudou();
  }

  return (
    <section className="rounded-2xl border bg-card p-5 cartao-elevado">
      <div className="flex items-start justify-between gap-3">
        {editando ? (
          <div className="flex-1 space-y-2">
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
            <Textarea
              value={descricao}
              placeholder="Descrição do cargo"
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={300}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor={`ordem-${cargo.id}`} className="text-xs">
                Ordem
              </Label>
              <Input
                id={`ordem-${cargo.id}`}
                className="w-24"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <Button size="sm" onClick={() => void salvarCargo()}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">{cargo.titulo}</h3>
            {cargo.descricao && (
              <p className="text-sm text-muted-foreground">{cargo.descricao}</p>
            )}
          </div>
        )}

        {!editando && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditando(true)}>
              <Pencil className="size-4" aria-hidden />
              <span className="sr-only">Editar cargo</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => void removerCargo()}>
              <Trash2 className="size-4 text-destructive" aria-hidden />
              <span className="sr-only">Remover cargo</span>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {candidatos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum candidato ainda. Branco e Nulo já estão incluídos automaticamente.
          </p>
        )}
        {candidatos.map((opcao) => (
          <LinhaCandidato key={opcao.id} opcao={opcao} onMudou={onMudou} />
        ))}
      </div>

      <FormCandidato cargoId={cargo.id} ordem={candidatos.length} onMudou={onMudou} />
    </section>
  );
}

function LinhaCandidato({ opcao, onMudou }: { opcao: Opcao; onMudou: () => void }) {
  const foto = urlFoto(opcao.foto_url);
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      {foto ? (
        <img src={foto} alt={opcao.nome} className="size-10 rounded-lg object-cover" />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground">
          {opcao.nome.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{opcao.nome}</p>
        {opcao.descricao && (
          <p className="truncate text-xs text-muted-foreground">{opcao.descricao}</p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={async () => {
          const { error } = await supabase.from("opcoes").delete().eq("id", opcao.id);
          if (error) {
            toast.error("Não foi possível remover.");
            return;
          }
          onMudou();
        }}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden />
        <span className="sr-only">Remover candidato</span>
      </Button>
    </div>
  );
}

function FormCandidato({
  cargoId,
  ordem,
  onMudou,
}: {
  cargoId: string;
  ordem: number;
  onMudou: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    if (!nome.trim()) return;
    setSalvando(true);
    let fotoUrl: string | null = null;

    if (arquivo) {
      const caminho = `${cargoId}/${crypto.randomUUID()}-${arquivo.name.replace(/[^\w.-]/g, "")}`;
      const { error: erroUpload } = await supabase.storage
        .from("candidatos")
        .upload(caminho, arquivo, { upsert: true });
      if (erroUpload) {
        setSalvando(false);
        toast.error("Não foi possível enviar a foto.");
        return;
      }
      const { data } = await supabase.storage
        .from("candidatos")
        .createSignedUrl(caminho, 60 * 60 * 24 * 365 * 5);
      fotoUrl = data?.signedUrl ?? null;
    }

    const { error } = await supabase.from("opcoes").insert({
      cargo_id: cargoId,
      tipo: "candidato",
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      foto_url: fotoUrl,
      ordem,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível adicionar o candidato.");
      return;
    }
    setNome("");
    setDescricao("");
    setArquivo(null);
    onMudou();
  }

  return (
    <div className="mt-4 grid gap-2 rounded-xl border border-dashed p-3 sm:grid-cols-2">
      <Input
        placeholder="Nome do candidato"
        value={nome}
        maxLength={80}
        onChange={(e) => setNome(e.target.value)}
      />
      <Input
        placeholder="Descrição curta (opcional)"
        value={descricao}
        maxLength={140}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        className="sm:col-span-2"
      />
      <Button
        className="sm:col-span-2"
        onClick={() => void adicionar()}
        disabled={salvando || !nome.trim()}
      >
        {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        Adicionar candidato
      </Button>
    </div>
  );
}

function Links() {
  const [origem, setOrigem] = useState("");
  useEffect(() => setOrigem(window.location.origin), []);

  const itens = [
    { rotulo: "Link de votação", url: `${origem}/votar` },
    { rotulo: "Link de resultados", url: `${origem}/resultados` },
  ];

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <div key={item.rotulo} className="rounded-2xl border bg-card p-4 cartao-elevado">
          <p className="text-sm font-medium">{item.rotulo}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input readOnly value={item.url} className="flex-1 font-mono text-xs" />
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(item.url);
                toast.success("Link copiado.");
              }}
            >
              <Copy className="size-4" aria-hidden /> Copiar
            </Button>
            <Button asChild variant="outline">
              <a href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden /> Abrir
              </a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
