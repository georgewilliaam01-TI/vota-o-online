-- =====================================================================
-- Login com Google, senhas livres e admin de teste automático
-- =====================================================================

-- 1) ADMIN DE TESTE AUTOMÁTICO
-- Sempre que a conta com este e-mail entrar (via Google ou e-mail/senha),
-- ela recebe o papel de administrador automaticamente. Assim o dono do
-- projeto já entra como admin, sem precisar do botão "tornar-me admin".
CREATE OR REPLACE FUNCTION public.promover_admin_inicial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'georgewilliaam01@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promover_admin_inicial ON auth.users;
CREATE TRIGGER trg_promover_admin_inicial
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.promover_admin_inicial();

-- Caso a conta já exista neste projeto, promove imediatamente.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'georgewilliaam01@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
