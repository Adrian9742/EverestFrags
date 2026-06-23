/**
 * ProtectedRoute — redireciona para /login se não estiver autenticado
 * AdminRoute     — redireciona para / se não for admin
 *
 * Uso no App.tsx:
 *   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
 *   <Route path="/admin"   element={<AdminRoute><Admin /></AdminRoute>} />
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { player, isLoading } = useAuth();
  if (isLoading) return null;
  if (!player) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { player, isAdmin, isLoading } = useAuth();
  if (isLoading) return null;
  if (!player) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
