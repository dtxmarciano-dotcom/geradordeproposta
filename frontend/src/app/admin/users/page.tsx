"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import {
  AdminUser,
  ApiError,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/lib/api";

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<AdminUser | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await listUsers(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os usuários.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleToggleStatus(user: AdminUser) {
    if (!token) return;
    setBusyId(user.id);
    setError(null);
    try {
      const nextStatus = user.status === "active" ? "inactive" : "active";
      await updateUser(token, user.id, { status: nextStatus });
      setSuccessMessage(
        nextStatus === "active" ? `"${user.name}" foi reativado.` : `"${user.name}" foi desativado.`
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível alterar o status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!token) return;
    if (!window.confirm(`Excluir "${user.name}"? Essa ação não pode ser desfeita.`)) return;
    setBusyId(user.id);
    setError(null);
    try {
      await deleteUser(token, user.id);
      setSuccessMessage(`"${user.name}" foi excluído.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o usuário.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gerencie quem pode acessar o Vantta e com qual perfil.
          </p>
        </div>
        <Button onClick={() => setEditingTarget("new")}>Novo usuário</Button>
      </div>

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado ainda"
          description="Cadastre o primeiro usuário para liberar o acesso ao Vantta."
          action={<Button onClick={() => setEditingTarget("new")}>Cadastrar usuário</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">
                    {user.name}
                    {user.id === currentUser?.id ? (
                      <span className="ml-2 text-xs text-neutral-400">(você)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "info" : "neutral"}>
                      {user.role === "admin" ? "Administrador" : "Usuário"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "active" ? "success" : "warning"}>
                      {user.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditingTarget(user)}>
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === user.id}
                        onClick={() => handleDelete(user)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTarget ? (
        <UserFormModal
          target={editingTarget}
          onClose={() => setEditingTarget(null)}
          onSaved={(message) => {
            setEditingTarget(null);
            setSuccessMessage(message);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function UserFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: AdminUser | "new";
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { token } = useAuth();
  const isNew = target === "new";
  const [name, setName] = useState(isNew ? "" : target.name);
  const [email, setEmail] = useState(isNew ? "" : target.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">(isNew ? "user" : target.role);
  const [status, setStatus] = useState<"active" | "inactive">(isNew ? "active" : target.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (isNew) {
        await createUser(token, { name, email, password, role });
        onSaved("Usuário cadastrado com sucesso.");
      } else {
        await updateUser(token, target.id, {
          name,
          email,
          role,
          status,
          password: password.trim() ? password : undefined,
        });
        onSaved("Usuário atualizado com sucesso.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o usuário.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "Novo usuário" : "Editar usuário"} onClose={onClose}>
      {error ? (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={isNew ? "Senha" : "Nova senha (opcional)"}
          type="password"
          placeholder={isNew ? "Mínimo de 8 caracteres" : "Deixe em branco para manter a atual"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={isNew}
          disabled={isSubmitting}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="role">
            Perfil
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-vantta-400 focus:border-transparent"
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {!isNew ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-vantta-400 focus:border-transparent"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
