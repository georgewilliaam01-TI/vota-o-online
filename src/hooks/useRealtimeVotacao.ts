import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Mantém eleição e resultados atualizados ao vivo. */
export function useRealtimeVotacao() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidar = () => {
      void queryClient.invalidateQueries({ queryKey: ["resultados"] });
      void queryClient.invalidateQueries({ queryKey: ["eleicao"] });
    };

    const channel = supabase
      .channel("votacao-ao-vivo")
      .on("postgres_changes", { event: "*", schema: "public", table: "cedulas" }, invalidar)
      .on("postgres_changes", { event: "*", schema: "public", table: "cedula_escolhas" }, invalidar)
      .on("postgres_changes", { event: "*", schema: "public", table: "eleicao" }, invalidar)
      .subscribe();

    const intervalo = window.setInterval(invalidar, 8000);

    return () => {
      window.clearInterval(intervalo);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
