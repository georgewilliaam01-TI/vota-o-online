import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Eleicao = {
  id: string;
  titulo: string;
  descricao: string | null;
  meta_votantes: number | null;
  status: string;
};

export type Cargo = {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
};

export type Opcao = {
  id: string;
  cargo_id: string;
  tipo: string;
  nome: string;
  numero: string | null;
  descricao: string | null;
  foto_url: string | null;
  ordem: number;
};

export async function buscarEleicao(): Promise<Eleicao | null> {
  const { data, error } = await supabase
    .from("eleicao")
    .select("id, titulo, descricao, meta_votantes, status")
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Eleicao | null;
}

export async function buscarCedula(): Promise<{ cargos: Cargo[]; opcoes: Opcao[] }> {
  const [{ data: cargos, error: e1 }, { data: opcoes, error: e2 }] = await Promise.all([
    supabase.from("cargos").select("id, titulo, descricao, ordem").order("ordem"),
    supabase
      .from("opcoes")
      .select("id, cargo_id, tipo, nome, numero, descricao, foto_url, ordem")
      .order("ordem"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { cargos: (cargos ?? []) as Cargo[], opcoes: (opcoes ?? []) as Opcao[] };
}

export async function buscarResultados(): Promise<{
  totalVotos: number;
  contagem: Record<string, number>;
}> {
  const [{ count, error: e1 }, { data: escolhas, error: e2 }] = await Promise.all([
    supabase.from("cedulas").select("id", { count: "exact", head: true }),
    supabase.from("cedula_escolhas").select("opcao_id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const contagem: Record<string, number> = {};
  for (const linha of escolhas ?? []) {
    const id = (linha as { opcao_id: string }).opcao_id;
    contagem[id] = (contagem[id] ?? 0) + 1;
  }
  return { totalVotos: count ?? 0, contagem };
}

export const eleicaoQuery = queryOptions({
  queryKey: ["eleicao"],
  queryFn: buscarEleicao,
});

export const cedulaQuery = queryOptions({
  queryKey: ["cedula"],
  queryFn: buscarCedula,
});

export const resultadosQuery = queryOptions({
  queryKey: ["resultados"],
  queryFn: buscarResultados,
});

export function urlFoto(caminho: string | null): string | null {
  if (!caminho) return null;
  if (caminho.startsWith("http")) return caminho;
  return supabase.storage.from("candidatos").getPublicUrl(caminho).data.publicUrl;
}
