import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import AdminShell from "@/components/admin/AdminShell";
import ClientForm from "@/components/admin/ClientForm";
import { Button, Card } from "@/components/admin/Form";

type ClientRow = {
  id: string;
  name: string;
  billingEmail: string;
  currency: string;
  hourlyRate: number;
  monthlyHours: number | null;
  rolloverPolicy: string;
  _count: { projects: number; users: number };
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const clients = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true, users: true } } },
  });
  return { props: { clients: JSON.parse(JSON.stringify(clients)) } };
};

const rolloverLabel: Record<string, string> = {
  EXPIRE: "Hours expire",
  ROLLOVER: "Rolls over",
  ROLLOVER_CAPPED: "Rolls over (capped)",
};

export default function ClientsPage({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <AdminShell
      title="Clients"
      actions={!creating && <Button onClick={() => setCreating(true)}>New client</Button>}
    >
      {creating && (
        <Card className="mb-8">
          <ClientForm
            submitLabel="Create client"
            onSubmit={async (values) => {
              const { client } = await api("/api/admin/clients", { body: values });
              router.push(`/admin/clients/${client.id}`);
            }}
          />
        </Card>
      )}

      {clients.length === 0 && !creating ? (
        <Card className="text-center text-fun-gray-light">No clients yet. Create one to start logging time.</Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fun-gray-darker p-5 hover:border-fun-pink transition-colors"
            >
              <div>
                <p className="font-bold">{client.name}</p>
                <p className="text-sm text-fun-gray-medium">{client.billingEmail}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-fun-gray-light">
                <span className="rounded-full bg-fun-gray-darker px-3 py-1">
                  {client.monthlyHours != null ? `${client.monthlyHours}h retainer` : "Pay as you go"}
                </span>
                {client.monthlyHours != null && (
                  <span className="rounded-full bg-fun-gray-darker px-3 py-1">{rolloverLabel[client.rolloverPolicy]}</span>
                )}
                <span className="rounded-full bg-fun-gray-darker px-3 py-1">{formatMoney(client.hourlyRate, client.currency)}/h</span>
                <span className="rounded-full bg-fun-gray-darker px-3 py-1">
                  {client._count.projects} projects · {client._count.users} logins
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
