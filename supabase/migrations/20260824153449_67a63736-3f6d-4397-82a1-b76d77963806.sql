-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.existe_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.tornar_me_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nao_autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  RETURN true;
END;
$$;

-- ELEICAO
CREATE TABLE public.eleicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT 'Eleição',
  descricao text,
  meta_votantes integer,
  status text NOT NULL DEFAULT 'encerrada' CHECK (status IN ('aberta','encerrada')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eleicao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eleicao TO authenticated;
GRANT ALL ON public.eleicao TO service_role;
ALTER TABLE public.eleicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eleicao_public_read" ON public.eleicao FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "eleicao_admin_all" ON public.eleicao FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CARGOS
CREATE TABLE public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleicao_id uuid NOT NULL REFERENCES public.eleicao(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cargos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargos_public_read" ON public.cargos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cargos_admin_all" ON public.cargos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- OPCOES
CREATE TABLE public.opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'candidato' CHECK (tipo IN ('candidato','branco','nulo')),
  nome text NOT NULL,
  numero text,
  descricao text,
  foto_url text,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opcoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opcoes TO authenticated;
GRANT ALL ON public.opcoes TO service_role;
ALTER TABLE public.opcoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opcoes_public_read" ON public.opcoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "opcoes_admin_all" ON public.opcoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- branco/nulo automáticos
CREATE OR REPLACE FUNCTION public.criar_opcoes_especiais()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.opcoes (cargo_id, tipo, nome, descricao, ordem)
  VALUES (NEW.id, 'branco', 'Voto em branco', 'Não escolher nenhum candidato', 9998),
         (NEW.id, 'nulo', 'Voto nulo', 'Anular o voto para este cargo', 9999);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_criar_opcoes_especiais AFTER INSERT ON public.cargos
FOR EACH ROW EXECUTE FUNCTION public.criar_opcoes_especiais();

-- CEDULAS ANONIMAS
CREATE TABLE public.cedulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text NOT NULL UNIQUE,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cedulas TO anon, authenticated;
GRANT ALL ON public.cedulas TO service_role;
ALTER TABLE public.cedulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cedulas_public_read" ON public.cedulas FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.cedula_escolhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula_id uuid NOT NULL REFERENCES public.cedulas(id) ON DELETE CASCADE,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  opcao_id uuid NOT NULL REFERENCES public.opcoes(id) ON DELETE CASCADE,
  UNIQUE (cedula_id, cargo_id)
);
GRANT SELECT ON public.cedula_escolhas TO anon, authenticated;
GRANT ALL ON public.cedula_escolhas TO service_role;
ALTER TABLE public.cedula_escolhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cedula_escolhas_public_read" ON public.cedula_escolhas FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_escolhas_cargo ON public.cedula_escolhas(cargo_id);
CREATE INDEX idx_escolhas_opcao ON public.cedula_escolhas(opcao_id);

-- VOTANTES (apenas hash do CPF, sem leitura)
CREATE TABLE public.votantes (
  cpf_hash text PRIMARY KEY,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.votantes TO service_role;
ALTER TABLE public.votantes ENABLE ROW LEVEL SECURITY;
-- sem policies: ninguém lê ou escreve pela API

-- Já votou?
CREATE OR REPLACE FUNCTION public.cpf_ja_votou(p_cpf_hash text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.votantes WHERE cpf_hash = p_cpf_hash);
$$;
REVOKE EXECUTE ON FUNCTION public.cpf_ja_votou(text) FROM public, anon, authenticated;

-- Registro atômico do voto
CREATE OR REPLACE FUNCTION public.registrar_voto(p_cpf_hash text, p_escolhas jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_eleicao public.eleicao%ROWTYPE;
  v_protocolo text;
  v_cedula_id uuid;
  v_total_cargos int;
  v_item jsonb;
  v_cargo_id uuid;
  v_opcao_id uuid;
  v_qtd int;
BEGIN
  SELECT * INTO v_eleicao FROM public.eleicao ORDER BY criado_em LIMIT 1;
  IF v_eleicao.id IS NULL THEN RAISE EXCEPTION 'eleicao_inexistente'; END IF;
  IF v_eleicao.status <> 'aberta' THEN RAISE EXCEPTION 'votacao_encerrada'; END IF;

  SELECT count(*) INTO v_total_cargos FROM public.cargos WHERE eleicao_id = v_eleicao.id;
  IF v_total_cargos = 0 THEN RAISE EXCEPTION 'sem_cargos'; END IF;

  SELECT count(DISTINCT (e->>'cargo_id')::uuid) INTO v_qtd
  FROM jsonb_array_elements(p_escolhas) e;
  IF v_qtd <> v_total_cargos OR jsonb_array_length(p_escolhas) <> v_total_cargos THEN
    RAISE EXCEPTION 'escolhas_invalidas';
  END IF;

  BEGIN
    INSERT INTO public.votantes (cpf_hash) VALUES (p_cpf_hash);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'cpf_ja_votou';
  END;

  v_protocolo := upper(encode(gen_random_bytes(6), 'hex'));
  INSERT INTO public.cedulas (protocolo) VALUES (v_protocolo) RETURNING id INTO v_cedula_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_escolhas) LOOP
    v_cargo_id := (v_item->>'cargo_id')::uuid;
    v_opcao_id := (v_item->>'opcao_id')::uuid;
    IF NOT EXISTS (
      SELECT 1 FROM public.opcoes o JOIN public.cargos c ON c.id = o.cargo_id
      WHERE o.id = v_opcao_id AND o.cargo_id = v_cargo_id AND c.eleicao_id = v_eleicao.id
    ) THEN
      RAISE EXCEPTION 'opcao_invalida';
    END IF;
    INSERT INTO public.cedula_escolhas (cedula_id, cargo_id, opcao_id)
    VALUES (v_cedula_id, v_cargo_id, v_opcao_id);
  END LOOP;

  RETURN v_protocolo;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.registrar_voto(text, jsonb) FROM public, anon, authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cedula_escolhas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cedulas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eleicao;

-- Seed inicial
INSERT INTO public.eleicao (titulo, descricao, status, meta_votantes)
VALUES ('Eleição', 'Configure sua eleição no painel do administrador.', 'encerrada', NULL);