import { createHash } from "crypto";

/**
 * Hash irreversível do CPF. O hash é a única coisa persistida para impedir
 * voto duplo — ele nunca é ligado ao conteúdo da cédula.
 */
export function hashCpf(cpfDigitos: string): string {
  const pepper = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_URL"] ?? "";
  return createHash("sha256").update(`votacao:${pepper}:${cpfDigitos}`).digest("hex");
}

export type MotivoVoto =
  | "cpf_invalido"
  | "cpf_ja_votou"
  | "votacao_encerrada"
  | "escolhas_invalidas"
  | "erro";

export function traduzirErroVoto(mensagem: string): MotivoVoto {
  if (mensagem.includes("cpf_ja_votou")) return "cpf_ja_votou";
  if (mensagem.includes("votacao_encerrada") || mensagem.includes("eleicao_inexistente"))
    return "votacao_encerrada";
  if (
    mensagem.includes("escolhas_invalidas") ||
    mensagem.includes("opcao_invalida") ||
    mensagem.includes("sem_cargos")
  )
    return "escolhas_invalidas";
  return "erro";
}
