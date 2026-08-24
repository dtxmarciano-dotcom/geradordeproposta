"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  Supermarket,
  createSupermarket,
  deleteSupermarket,
  listSupermarkets,
  updateSupermarket,
  uploadSupermarketLogo,
} from "@/lib/api";
import { UploadModal } from "./UploadModal";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupermarketsPage() {
  const { token } = useAuth();
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editingTarget, setEditingTarget] = useState<Supermarket | "new" | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Supermarket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listSupermarkets(token);
      setSupermarkets(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os supermercados.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleDelete(supermarket: Supermarket) {
    if (!token) return;
    if (!window.confirm(`Excluir "${supermarket.name}"? Os preços cadastrados serão removidos.`)) {
      return;
    }
    setDeletingId(supermarket.id);
    setError(null);
    try {
      await deleteSupermarket(token, supermarket.id);
      setSuccessMessage(`"${supermarket.name}" foi excluído.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o supermercado.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Supermercados</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cadastre supermercados e mantenha os preços atualizados via planilha.
          </p>
        </div>
        <Button onClick={() => setEditingTarget("new")}>Novo supermercado</Button>
      </div>

      {successMessage ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : supermarkets.length === 0 ? (
        <EmptyState
          title="Nenhum supermercado cadastrado ainda"
          description="Cadastre o primeiro e comece a montar sua base de preços."
          action={<Button onClick={() => setEditingTarget("new")}>Cadastrar supermercado</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {supermarkets.map((supermarket) => (
            <Card key={supermarket.id} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                {supermarket.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={supermarket.logo_url}
                    alt={`Logo de ${supermarket.name}`}
                    className="h-12 w-12 shrink-0 rounded-lg border border-neutral-200 object-contain bg-white"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-[10px] text-neutral-400">
                    Sem logo
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-foreground">{supermarket.name}</h3>
                  <p className="text-sm text-neutral-500">{supermarket.unit_name}</p>
                  <p className="mt-2 text-xs text-neutral-400">
                    Atualizado em {formatDate(supermarket.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setUploadTarget(supermarket)}>
                  Enviar planilha
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditingTarget(supermarket)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === supermarket.id}
                  onClick={() => handleDelete(supermarket)}
                >
                  {deletingId === supermarket.id ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingTarget ? (
        <SupermarketFormModal
          target={editingTarget}
          onClose={() => setEditingTarget(null)}
          onSaved={(message) => {
            setEditingTarget(null);
            setSuccessMessage(message);
            load();
          }}
        />
      ) : null}

      {uploadTarget ? (
        <UploadModal
          supermarket={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onImported={() => load()}
        />
      ) : null}
    </div>
  );
}

function SupermarketFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: Supermarket | "new";
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { token } = useAuth();
  const isNew = target === "new";
  const [name, setName] = useState(isNew ? "" : target.name);
  const [unitName, setUnitName] = useState(isNew ? "" : target.unit_name);
  const [logoUrl, setLogoUrl] = useState(isNew ? "" : (target.logo_url ?? ""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  async function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isNew || !token) return;

    setIsUploadingLogo(true);
    setLogoError(null);
    try {
      const updated = await uploadSupermarketLogo(token, target.id, file);
      setLogoUrl(updated.logo_url ?? "");
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        unit_name: unitName,
        logo_url: logoUrl.trim() ? logoUrl.trim() : null,
      };
      if (isNew) {
        await createSupermarket(token, payload);
        onSaved("Supermercado cadastrado com sucesso.");
      } else {
        await updateSupermarket(token, target.id, payload);
        onSaved("Supermercado atualizado com sucesso.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o supermercado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isNew ? "Novo supermercado" : "Editar supermercado"} onClose={onClose}>
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
          label="Unidade"
          placeholder="Ex.: Unidade Centro"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          required
          disabled={isSubmitting}
        />
        {isNew ? (
          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
            Você poderá enviar a imagem da logomarca depois, editando o supermercado
            recém-criado.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Logomarca</span>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`Logo de ${target.name}`}
                  className="h-12 w-12 rounded-lg border border-neutral-200 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400">
                  Sem logo
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-foreground hover:bg-neutral-50">
                {isUploadingLogo ? "Enviando..." : "Escolher imagem"}
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={isUploadingLogo || isSubmitting}
                  onChange={handleLogoFileChange}
                />
              </label>
            </div>
            <p className="text-xs text-neutral-400">PNG, JPG, WEBP ou SVG, até 2MB.</p>
            {logoError ? (
              <Alert variant="error" className="mt-1">
                {logoError}
              </Alert>
            ) : null}
          </div>
        )}
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
