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

  v_protocolo := upper(replace(gen_random_uuid()::text, '-', ''));
  v_protocolo := substr(v_protocolo, 1, 4) || '-' || substr(v_protocolo, 5, 4) || '-' || substr(v_protocolo, 9, 4);

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