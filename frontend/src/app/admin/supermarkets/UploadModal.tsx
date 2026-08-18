"use client";

import { DragEvent, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { ApiError, Supermarket, UploadResult, uploadSupermarketProducts } from "@/lib/api";

export function UploadModal({
  supermarket,
  onClose,
  onImported,
}: {
  supermarket: Supermarket;
  onClose: () => void;
  onImported: () => void;
}) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleFile(file: File) {
    if (!token) return;
    setIsUploading(true);
    setError(null);
    setResult(null);
    try {
      const uploadResult = await uploadSupermarketProducts(token, supermarket.id, file);
      setResult(uploadResult);
      if (uploadResult.imported > 0) {
        onImported();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a planilha.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <Modal title={`Atualizar preços — ${supermarket.name}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500">
          Envie a planilha de preços para <strong className="text-foreground">{supermarket.name}</strong>
          {" "}({supermarket.unit_name}). Ao concluir, todos os produtos atuais desse supermercado serão
          substituídos pelos itens da nova planilha.
        </p>

        <Alert variant="info">
          Colunas esperadas: <strong>produto</strong>, <strong>preço</strong> e{" "}
          <strong>unidade</strong>. Formatos aceitos: .xlsx, .xls e .csv.
        </Alert>

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-10">
            <Spinner />
            <p className="text-sm text-neutral-500">Enviando e processando a planilha...</p>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging ? "border-vantta-400 bg-vantta-50" : "border-border hover:bg-surface-muted"
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              Arraste a planilha aqui ou clique para selecionar
            </p>
            <p className="text-xs text-neutral-500">.xlsx, .xls ou .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {error ? <Alert variant="error">{error}</Alert> : null}

        {result ? (
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{result.imported} produtos importados</Badge>
              <Badge variant={result.errors.length > 0 ? "warning" : "neutral"}>
                {result.errors.length} erro(s)
              </Badge>
              <Badge variant="neutral">{result.total} linhas na planilha</Badge>
            </div>
            {result.errors.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Linha</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((rowError, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2 text-neutral-500">{rowError.row}</td>
                        <td className="px-3 py-2 text-foreground">{rowError.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
