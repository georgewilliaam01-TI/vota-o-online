REVOKE EXECUTE ON FUNCTION public.criar_opcoes_especiais() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.tornar_me_admin() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;