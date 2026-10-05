import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import AdminShell from "@/components/admin/AdminShell";
import ClientForm, { type ClientFormValues } from "@/components/admin/ClientForm";
import ProjectPanel, { type ProjectRow } from "@/components/admin/ProjectPanel";
import { Button, Card, Input } from "@/components/admin/Form";

type ClientDetail = ClientFormValues & {
  id: string;
  users: { id: string; email: string; clerkUserId: string | null }[];
  projects: ProjectRow[];
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const client = await prisma.client.findUnique({
    where: { id: String(ctx.params?.id) },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      projects: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        include: { tasks: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] } },
      },
    },
  });
  if (!client) return { notFound: true };
  return { props: { client: JSON.parse(JSON.stringify(client)) } };
};

export default function ClientDetailPage({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const [projectName, setProjectName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [exportMonth, setExportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <AdminShell
      eyebrow="Client"
      title={client.name}
      actions={
        <div className="flex gap-2">
          <Link href={`/admin/time?client=${client.id}`} className="rounded-full border border-fun-gray-darker px-4 py-2 text-sm hover:border-fun-pink">
            Log time
          </Link>
          <Button
            variant="danger"
            onClick={() =>
              confirm(`Archive ${client.name}? Their history and invoices are kept.`) &&
              api(`/api/admin/clients/${client.id}`, { method: "DELETE" }).then(() => router.push("/admin/clients"))
            }
          >
            Archive
          </Button>
        </div>
      }
    >
      {(error || notice) && <p className={`mb-6 text-sm ${error ? "text-red-400" : "text-fun-pink"}`}>{error || notice}</p>}

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Projects &amp; tasks</h2>
        <div className="grid gap-4">
          {client.projects.map((project) => (
            <ProjectPanel key={project.id} project={project} currency={client.currency} onChange={refresh} />
          ))}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/api/admin/projects", { body: { clientId: client.id, name: projectName } });
              setProjectName("");
            });
          }}
        >
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="New project name" />
          <Button type="submit" disabled={!projectName.trim()}>
            Add project
          </Button>
        </form>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-1">Portal logins</h2>
        <p className="text-sm text-fun-gray-medium mb-4">People at {client.name} who can sign in to see hours, work completed and invoices.</p>
        <Card>
          {client.users.length > 0 && (
            <ul className="mb-4 divide-y divide-fun-gray-darker">
              {client.users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{user.email}</span>
                  <span className="flex items-center gap-3">
                    <span className={user.clerkUserId ? "text-fun-pink" : "text-fun-gray-medium"}>
                      {user.clerkUserId ? "Active" : "Invited"}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-fun-gray-medium hover:text-red-300"
                      onClick={() => run(() => api(`/api/admin/clients/${client.id}/users?userId=${user.id}`, { method: "DELETE" }))}
                    >
                      Revoke
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const result = await api(`/api/admin/clients/${client.id}/users`, { body: { email: inviteEmail } });
                setInviteEmail("");
                setNotice(result.linked ? "Existing account linked." : result.invited ? "Invitation sent." : "Login added. The invitation email failed, so ask them to sign up.");
              });
            }}
          >
            <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@client.com" />
            <Button type="submit" variant="ghost" disabled={!inviteEmail.trim()}>
              Invite
            </Button>
          </form>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Exports</h2>
        <Card className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={exportMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setExportMonth(e.target.value)}
            className="rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2 text-sm"
            aria-label="Period starting in"
          />
          {(["csv", "pdf"] as const).map((format) => (
            <a
              key={format}
              href={`/api/admin/exports/timesheet?clientId=${client.id}&period=${exportMonth}&format=${format}`}
              className="rounded-full border border-fun-gray-darker px-4 py-2 text-sm hover:border-fun-pink"
            >
              {format === "pdf" ? "Timesheet PDF" : "Entries CSV"}
            </a>
          ))}
          <Link href={`/portal?client=${client.id}`} className="ml-auto text-sm text-fun-pink hover:underline">
            Preview their portal →
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Billing settings</h2>
        <Card>
          <ClientForm
            initial={client}
            submitLabel="Save settings"
            onSubmit={async (values) => {
              await api(`/api/admin/clients/${client.id}`, { method: "PUT", body: values });
              refresh();
            }}
          />
        </Card>
      </section>
    </AdminShell>
  );
}
