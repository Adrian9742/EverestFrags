/**
 * AuthContext — contexto global de autenticação
 *
 * Armazena o player logado e o token no localStorage.
 * Injeta o token em todas as chamadas via api/client.ts (que lê localStorage diretamente).
 *
 * Hook useAuth() para consumir o contexto em qualquer componente.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, type PlayerPublic } from "../api/client";

interface AuthContextType {
  player: PlayerPublic | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (nickname: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar, valida o token salvo no localStorage
  useEffect(() => {
    const token = localStorage.getItem("ef_token");
    const savedPlayer = localStorage.getItem("ef_player");
    if (token && savedPlayer) {
      try {
        setPlayer(JSON.parse(savedPlayer));
      } catch {
        localStorage.removeItem("ef_token");
        localStorage.removeItem("ef_player");
      }
    }
    setIsLoading(false);
  }, []);

  async function login(nickname: string, password: string) {
    const res = await authApi.login(nickname, password);
    localStorage.setItem("ef_token", res.access_token);
    localStorage.setItem("ef_player", JSON.stringify(res.player));
    setPlayer(res.player);
  }

  function logout() {
    authApi.logout().catch(() => {}); // fire-and-forget
    localStorage.removeItem("ef_token");
    localStorage.removeItem("ef_player");
    setPlayer(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        player,
        isAdmin: player?.role === "admin",
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
