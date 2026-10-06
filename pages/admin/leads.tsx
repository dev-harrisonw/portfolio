import Link from "next/link";
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/admin/Form";
import { LEAD_STATUSES, leadStatusLabel, leadStatusTone, type LeadStatus } from "@/lib/leads";

type Lead = {
  id: string;
  email: string;
  service: string | null;
  timeline: string | null;
  budget: string | null;
  details: string | null;
  summary: string | null;
  notes: string;
  status: LeadStatus;
  convertedClientId: string | null;
  convertedClient: { id: string; name: string } | null;
  createdAt: string;
};

type Props = {
  leads: Lead[];
  thisWeek: number;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { convertedClient: { select: { id: true, name: true } } },
  });
  const thisWeek = leads.filter((lead) => lead.createdAt >= weekAgo).length;
  return { props: JSON.parse(JSON.stringify({ leads, thisWeek })) };
};

function LeadCard({
  lead,
  onStatus,
  onNotes,
  onConvert,
  converting,
}: {
  lead: Lead;
  onStatus: (id: string, status: LeadStatus) => void;
  onNotes: (id: string, notes: string) => void;
  onConvert: (id: string) => void;
  converting: boolean;
}) {
  const [notes, setNotes] = useState(lead.notes);
  return (
    <li className="rounded-xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold truncate">{lead.email}</p>
          <p className="text-xs text-fun-gray mt-1">
            {new Date(lead.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {lead.service ? ` · ${lead.service}` : ""}
            {lead.budget ? ` · ${lead.budget}` : ""}
            {lead.timeline ? ` · ${lead.timeline}` : ""}
          </p>
        </div>
        <select
          value={lead.status}
          onChange={(e) => onStatus(lead.id, e.target.value as LeadStatus)}
          className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider outline-none bg-transparent border-0 cursor-pointer ${leadStatusTone[lead.status]}`}
          aria-label="Lead status"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabel[s]}
            </option>
          ))}
        </select>
      </div>
      {lead.summary && (
        <pre className="mt-3 text-xs text-fun-gray whitespace-pre-wrap font-monospace">{lead.summary}</pre>
      )}
      {lead.details && !lead.summary && (
        <p className="mt-3 text-sm text-fun-gray-light">{lead.details}</p>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== lead.notes) onNotes(lead.id, notes);
        }}
        placeholder="Notes"
        rows={2}
        className="mt-3 w-full rounded-lg bg-black/20 border border-fun-gray-darker px-2 py-1.5 text-xs outline-none focus:border-fun-pink"
      />
      {lead.convertedClient ? (
        <Link href={`/admin/clients/${lead.convertedClient.id}`} className="mt-2 inline-block text-xs text-fun-pink hover:underline">
          Client: {lead.convertedClient.name}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onConvert(lead.id)}
          disabled={converting}
          className="mt-2 text-xs text-fun-pink hover:underline disabled:opacity-40"
        >
          {converting ? "Creating…" : "Create client"}
        </button>
      )}
    </li>
  );
}

export default function AdminLeads({ leads: initial, thisWeek }: Props) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const [converting, setConverting] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(LEAD_STATUSES.map((s) => [s, [] as Lead[]])) as Record<LeadStatus, Lead[]>;
    for (const lead of leads) map[lead.status].push(lead);
    return map;
  }, [leads]);

  const visible = filter === "all" ? leads : grouped[filter];

  const onStatus = async (id: string, status: LeadStatus) => {
    const previous = leads;
    setLeads((rows) => rows.map((l) => (l.id === id ? { ...l, status } : l)));
    setError(null);
    try {
      await api(`/api/admin/leads/${id}`, { method: "PATCH", body: { status } });
    } catch (e) {
      setLeads(previous);
      setError((e as Error).message);
    }
  };

  const onNotes = async (id: string, notes: string) => {
    const previous = leads;
    setLeads((rows) => rows.map((l) => (l.id === id ? { ...l, notes } : l)));
    try {
      await api(`/api/admin/leads/${id}`, { method: "PATCH", body: { notes } });
    } catch (e) {
      setLeads(previous);
      setError((e as Error).message);
    }
  };

  const onConvert = async (id: string) => {
    setConverting(id);
    setError(null);
    try {
      const data = await api(`/api/admin/leads/${id}/convert`, { method: "POST" });
      setLeads((rows) =>
        rows.map((l) =>
          l.id === id
            ? { ...l, status: "WON", convertedClientId: data.client.id, convertedClient: { id: data.client.id, name: data.client.name } }
            : l
        )
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConverting(null);
    }
  };

  return (
    <AdminShell title="Leads" wide>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <button type="button" onClick={() => setFilter("all")} className="text-left">
          <Card className={filter === "all" ? "border-fun-pink" : ""}>
            <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">This week</p>
            <p className="text-2xl font-bold font-monospace mt-1">{thisWeek}</p>
            <p className="text-xs text-fun-gray-medium mt-1">{leads.length} total</p>
          </Card>
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className="text-left">
            <Card className={filter === s ? "border-fun-pink" : ""}>
              <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">{leadStatusLabel[s]}</p>
              <p className="text-2xl font-bold font-monospace mt-1">{leads.filter((l) => l.status === s).length}</p>
            </Card>
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {filter === "all" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {LEAD_STATUSES.map((s) => (
            <section key={s} className="min-w-0">
              <h2 className="text-xs uppercase tracking-wider text-fun-gray-light mb-3 flex items-center justify-between">
                {leadStatusLabel[s]}
                <span className="font-monospace">{grouped[s].length}</span>
              </h2>
              <ul className="space-y-3">
                {grouped[s].length === 0 ? (
                  <li className="text-xs text-fun-gray-medium rounded-xl border border-dashed border-fun-gray-darker px-3 py-6 text-center">
                    Empty
                  </li>
                ) : (
                  grouped[s].map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatus={onStatus}
                      onNotes={onNotes}
                      onConvert={onConvert}
                      converting={converting === lead.id}
                    />
                  ))
                )}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-3 max-w-3xl">
          {visible.length === 0 ? (
            <li className="text-fun-gray text-sm">No leads in this stage.</li>
          ) : (
            visible.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatus={onStatus}
                onNotes={onNotes}
                onConvert={onConvert}
                converting={converting === lead.id}
              />
            ))
          )}
        </ul>
      )}
    </AdminShell>
  );
}
