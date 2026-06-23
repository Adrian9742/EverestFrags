/**
 * App.tsx — roteamento principal do EverestFrags
 *
 * Rotas:
 *   /login         → público (Login)
 *   /auth/callback → público (SteamCallback — processa redirect do Steam OpenID)
 *   /              → público (Dashboard/Ranking)
 *   /matches       → público (histórico)
 *   /matches/:id   → público (detalhes da partida)
 *   /matches/new   → admin (adicionar partida)
 *   /sort          → público (sorteio)
 *
 * AuthProvider envolve tudo para que qualquer componente acesse useAuth().
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { SteamCallback } from "./pages/SteamCallback";
import { Dashboard } from "./pages/Dashboard";
import { Matches } from "./pages/Matches";
import { AddMatch } from "./pages/AddMatch";
import { Sort } from "./pages/Sort";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<SteamCallback />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/new" element={<AdminRoute><AddMatch /></AdminRoute>} />
          <Route path="/sort" element={<Sort />} />
          {/* Rota curinga — redireciona para o dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
