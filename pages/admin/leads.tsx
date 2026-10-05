import Link from "next/link";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { UserButton } from "@clerk/nextjs";

type Lead = {
  id: string;
  email: string;
  service: string | null;
  timeline: string | null;
  budget: string | null;
  details: string | null;
  summary: string | null;
  createdAt: string;
};

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  requireAdminPage(ctx);

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLeads(data.leads || []);
      })
      .catch(() => setError("Failed to load leads"));
  }, []);

  return (
    <div className="min-h-screen bg-bg text-white px-5 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-fun-gray hover:text-fun-pink">
            ← Admin
          </Link>
          <h1 className="text-3xl font-bold mt-2">Leads</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <ul className="space-y-4">
        {leads.map((lead) => (
          <li key={lead.id} className="rounded-xl border border-fun-gray p-4">
            <p className="font-bold">{lead.email}</p>
            <p className="text-xs text-fun-gray mt-1">
              {new Date(lead.createdAt).toLocaleString()}
              {lead.service ? ` · ${lead.service}` : ""}
              {lead.budget ? ` · ${lead.budget}` : ""}
            </p>
            {lead.summary && (
              <pre className="mt-3 text-xs text-fun-gray whitespace-pre-wrap font-monospace">
                {lead.summary}
              </pre>
            )}
          </li>
        ))}
        {leads.length === 0 && !error && (
          <li className="text-fun-gray text-sm">No leads yet.</li>
        )}
      </ul>
    </div>
  );
}
