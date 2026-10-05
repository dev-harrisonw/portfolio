import { useState } from "react";
import { api } from "@/lib/fetcher";
import { portalStatus, portalStatusLabel, portalStatusTone, relativeDay } from "@/lib/clients";
import { Button, Input } from "@/components/admin/Form";

export type PortalUser = { id: string; email: string; clerkUserId: string | null; createdAt: string };

type Props = {
  clientId: string;
  clientName: string;
  billingEmail: string;
  siteUrl: string;
  users: PortalUser[];
  onUsersChange: (users: PortalUser[]) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export default function PortalPeople({ clientId, clientName, billingEmail, siteUrl, users, onUsersChange, onNotice, onError }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const status = portalStatus(users);
  const signInUrl = `${siteUrl}/sign-in?redirect_url=/portal`;
  const billingInvited = users.some((u) => u.email === billingEmail.toLowerCase());

  const invite = async (target: string) => {
    setBusy(true);
    onError("");
    try {
      const result = await api<{ user: PortalUser; invited: boolean; linked: boolean; already?: boolean }>(
        `/api/admin/clients/${clientId}/users`,
        { body: { email: target } }
      );
      setEmail("");
      const createdAt = result.user.createdAt ?? new Date().toISOString();
      onUsersChange([...users.filter((u) => u.id !== result.user.id && u.email !== result.user.email), { ...result.user, createdAt }]);
      if (result.already) onNotice("They already have portal access. Send them the sign-in link.");
      else if (result.linked) onNotice("They already have an account — they can sign in to the portal now.");
      else if (result.invited) onNotice("Invitation email sent. They'll land on the portal after signing up.");
      else onNotice("Access granted, but Clerk didn't send the email. Send them the sign-in link below.");
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 sm:p-5 h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">Portal access</h2>
          <p className="text-sm text-fun-gray-medium mt-1">
            Invite people at {clientName} to see hours, progress, and invoices. They sign in with Clerk and land on{" "}
            <span className="text-fun-gray-light">/portal</span>.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs shrink-0 ${portalStatusTone[status]}`}>{portalStatusLabel[status]}</span>
      </div>

      {users.length === 0 ? (
        <p className="mt-4 text-sm text-yellow-300">Nobody at this client can sign in yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-fun-gray-darker">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="font-medium break-all">{user.email}</span>
                {user.email === billingEmail.toLowerCase() && (
                  <span className="ml-2 text-[11px] uppercase tracking-wider text-fun-gray-medium">Billing</span>
                )}
                <span className="block text-xs text-fun-gray-medium">
                  {user.clerkUserId ? "Signed in" : `Invited ${relativeDay(user.createdAt)}`}
                </span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                {!user.clerkUserId && (
                  <button type="button" className="text-xs text-fun-pink hover:underline" disabled={busy} onClick={() => invite(user.email)}>
                    Resend
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-fun-gray-medium hover:text-red-300"
                  onClick={() =>
                    confirm(`Revoke portal access for ${user.email}?`) &&
                    api(`/api/admin/clients/${clientId}/users?userId=${user.id}`, { method: "DELETE" }).then(
                      () => onUsersChange(users.filter((u) => u.id !== user.id)),
                      (e) => onError(e.message)
                    )
                  }
                >
                  Revoke
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) invite(email);
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={billingEmail || "name@client.com"}
          aria-label="Invite email"
        />
        <Button type="submit" disabled={busy || !email.trim()}>
          {busy ? "Inviting…" : "Invite"}
        </Button>
      </form>

      {!billingInvited && billingEmail && (
        <button
          type="button"
          className="mt-3 text-sm text-fun-pink hover:underline"
          disabled={busy}
          onClick={() => invite(billingEmail)}
        >
          Invite billing contact ({billingEmail})
        </button>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-fun-gray-darker px-3 py-2 text-xs hover:border-fun-pink min-h-[44px] sm:min-h-0"
          onClick={() => copyText(signInUrl).then(() => onNotice("Sign-in link copied."))}
        >
          Copy sign-in link
        </button>
        <a
          href={`/portal?client=${clientId}`}
          className="rounded-full border border-fun-gray-darker px-3 py-2 text-xs hover:border-fun-pink min-h-[44px] sm:min-h-0 inline-flex items-center"
        >
          Preview as them
        </a>
      </div>
    </section>
  );
}
