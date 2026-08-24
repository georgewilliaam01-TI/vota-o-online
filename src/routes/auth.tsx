import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso do administrador — Votação Online" },
      {
        name: "description",
        content:
          "Entre para configurar a eleição, cargos e candidatos. Eleitores não precisam de login.",
      },
      { property: "og:title", content: "Acesso do administrador — Votação Online" },
      {
        property: "og:description",
        content: "Entre para configurar a eleição, cargos e candidatos.",
      },
    ],
  }),
  component: Auth,
});

type Tela = "login" | "esqueci" | "redefinir";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84c.86-2.6 3.29-4.51 6.15-4.51Z"
      />
    </svg>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [tela, setTela] = useState<Tela>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Detecta o retorno do link de recuperação de senha enviado por e-mail.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") {
        setTela("redefinir");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function entrarComGoogle() {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      setCarregando(false);
      toast.error("Não foi possível iniciar o login com o Google.");
    }
    // Em caso de sucesso, o navegador é redirecionado para o Google.
  }

  async function entrar() {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    void navigate({ to: "/admin" });
  }

  async function cadastrar() {
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      void navigate({ to: "/admin" });
    } else {
      toast.success("Conta criada. Confirme seu e-mail para entrar.");
    }
  }

  async function enviarRecuperacao() {
    if (!email) {
      toast.error("Digite o e-mail da conta.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
      return;
    }
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
    setTela("login");
  }

  async function salvarNovaSenha() {
    if (novaSenha.length < 1) {
      toast.error("Digite a nova senha.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha redefinida com sucesso.");
    void navigate({ to: "/admin" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center superficie-civica px-4 py-10">
      <div className="w-full max-w-md">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden /> Início
          </Link>
        </Button>

        <div className="rounded-2xl border bg-card p-6 cartao-elevado">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold">Acesso do administrador</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Somente para administrar a eleição. Eleitores não precisam de login.
          </p>

          {/* ------- TELA: REDEFINIR SENHA (retorno do link do e-mail) ------- */}
          {tela === "redefinir" && (
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-semibold">Defina uma nova senha</h2>
              <div>
                <Label htmlFor="nova-senha">Nova senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full"
                disabled={carregando || novaSenha.length < 1}
                onClick={() => void salvarNovaSenha()}
              >
                {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Salvar nova senha
              </Button>
            </div>
          )}

          {/* ------- TELA: ESQUECI MINHA SENHA ------- */}
          {tela === "esqueci" && (
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-semibold">Recuperar senha</h2>
              <p className="text-sm text-muted-foreground">
                Informe o e-mail da conta. Enviaremos um link para você criar uma nova senha.
              </p>
              <div>
                <Label htmlFor="email-rec">E-mail</Label>
                <Input
                  id="email-rec"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full"
                disabled={carregando || !email}
                onClick={() => void enviarRecuperacao()}
              >
                {carregando ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="size-4" aria-hidden />
                )}
                Enviar link de recuperação
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setTela("login")}>
                Voltar
              </Button>
            </div>
          )}

          {/* ------- TELA: LOGIN / CADASTRO ------- */}
          {tela === "login" && (
            <>
              <Button
                variant="outline"
                className="mt-6 w-full"
                disabled={carregando}
                onClick={() => void entrarComGoogle()}
              >
                <GoogleIcon />
                Entrar com o Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou com e-mail e senha
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="entrar">
                <TabsList className="w-full">
                  <TabsTrigger value="entrar" className="flex-1">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="criar" className="flex-1">
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      autoComplete="current-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && email && senha) void entrar();
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>

                <TabsContent value="entrar">
                  <Button
                    className="mt-4 w-full"
                    disabled={carregando || !email || !senha}
                    onClick={() => void entrar()}
                  >
                    {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    Entrar
                  </Button>
                  <Button
                    variant="link"
                    className="mt-2 h-auto w-full p-0 text-sm text-muted-foreground"
                    onClick={() => setTela("esqueci")}
                  >
                    Esqueci minha senha
                  </Button>
                </TabsContent>
                <TabsContent value="criar">
                  <Button
                    className="mt-4 w-full"
                    disabled={carregando || !email || !senha}
                    onClick={() => void cadastrar()}
                  >
                    {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    Criar conta
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Você pode usar a senha que quiser.
                  </p>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
