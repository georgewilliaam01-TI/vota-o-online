import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const consultaSchema = z.object({ cpf: z.string().min(11).max(20) });

const votoSchema = z.object({
  cpf: z.string().min(11).max(20),
  escolhas: z
    .array(z.object({ cargo_id: z.string().uuid(), opcao_id: z.string().uuid() }))
    .min(1)
    .max(50),
});

export const consultarCpf = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultaSchema.parse(data))
  .handler(async ({ data }) => {
    const { cpfValido, somenteDigitos } = await import("./cpf");
    const { hashCpf } = await import("./voto.server");
    const digitos = somenteDigitos(data.cpf);

    if (!cpfValido(digitos)) {
      return { ok: false as const, motivo: "cpf_invalido" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: eleicao } = await supabaseAdmin
      .from("eleicao")
      .select("status")
      .order("criado_em", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!eleicao || eleicao.status !== "aberta") {
      return { ok: false as const, motivo: "votacao_encerrada" as const };
    }

    const { data: jaVotou, error } = await supabaseAdmin.rpc("cpf_ja_votou", {
      p_cpf_hash: hashCpf(digitos),
    });
    if (error) throw new Error("Não foi possível validar o CPF agora.");
    if (jaVotou) return { ok: false as const, motivo: "cpf_ja_votou" as const };

    return { ok: true as const };
  });

export const enviarVoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => votoSchema.parse(data))
  .handler(async ({ data }) => {
    const { cpfValido, somenteDigitos } = await import("./cpf");
    const { hashCpf, traduzirErroVoto } = await import("./voto.server");
    const digitos = somenteDigitos(data.cpf);

    if (!cpfValido(digitos)) {
      return { ok: false as const, motivo: "cpf_invalido" as const };
    }

    const cargos = new Set(data.escolhas.map((e) => e.cargo_id));
    if (cargos.size !== data.escolhas.length) {
      return { ok: false as const, motivo: "escolhas_invalidas" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: protocolo, error } = await supabaseAdmin.rpc("registrar_voto", {
      p_cpf_hash: hashCpf(digitos),
      p_escolhas: data.escolhas,
    });

    if (error) return { ok: false as const, motivo: traduzirErroVoto(error.message) };
    return { ok: true as const, protocolo: protocolo as string, data: new Date().toISOString() };
  });
