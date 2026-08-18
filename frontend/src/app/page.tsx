import { VanttaLogo } from "@/components/brand/VanttaLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border px-6 py-4">
        <VanttaLogo />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fundação do design system
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Base visual do Vantta: tokens de marca e componentes reutilizáveis.
            As telas de negócio (auth, dashboard, listas, comparação) chegam
            nas próximas etapas.
          </p>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Comparar preços</Button>
            <Button variant="secondary">Ver detalhes</Button>
            <Button variant="ghost">Cancelar</Button>
            <Spinner />
          </div>

          <Input label="E-mail" placeholder="voce@exemplo.com" />

          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Melhor preço</Badge>
            <Badge variant="neutral">3 supermercados</Badge>
            <Badge variant="info">Novo</Badge>
            <Badge variant="warning">Preço desatualizado</Badge>
          </div>

          <Alert variant="success" title="Você economizou R$ 42,30">
            Comparado ao supermercado mais caro da sua lista.
          </Alert>
        </Card>

        <EmptyState
          title="Você ainda não criou nenhuma lista"
          description="Monte sua primeira lista de compras para comparar preços entre os supermercados cadastrados."
          action={<Button variant="primary">Criar lista</Button>}
        />
      </main>
    </div>
  );
}
