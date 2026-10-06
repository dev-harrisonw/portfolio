import { api } from "@/lib/fetcher";
import { Button } from "@/components/admin/Form";

export type InvoiceActionStatus = "DRAFT" | "SENT" | "PAID" | "VOID";

type Props = {
  invoice: { id: string; status: InvoiceActionStatus; checkoutUrl: string | null };
  onDone: () => void;
  onError: (message: string) => void;
};

export default function InvoiceActions({ invoice, onDone, onError }: Props) {
  const run = (fn: () => Promise<unknown>) => fn().then(onDone, (e: Error) => onError(e.message));

  if (invoice.status === "VOID") return null;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/admin/invoices/${invoice.id}?format=pdf`}
        className="rounded-full border border-fun-gray-darker px-4 py-2.5 sm:py-2 text-sm hover:border-fun-pink min-h-[44px] sm:min-h-0 inline-flex items-center"
      >
        PDF
      </a>
      {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
        <Button
          variant={invoice.status === "SENT" ? "ghost" : "primary"}
          onClick={() => run(() => api(`/api/admin/invoices/${invoice.id}`, { body: { action: "send" } }))}
        >
          {invoice.status === "DRAFT" ? "Send payment link" : "Resend email"}
        </Button>
      )}
      {invoice.status === "SENT" && (
        <Button
          variant="ghost"
          onClick={() => run(() => api(`/api/admin/invoices/${invoice.id}`, { body: { action: "remind" } }))}
        >
          Remind
        </Button>
      )}
      {invoice.status === "SENT" && invoice.checkoutUrl && (
        <a
          href={invoice.checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-fun-pink px-4 py-2.5 sm:py-2 text-sm font-bold text-white hover:bg-fun-pink-light min-h-[44px] sm:min-h-0 inline-flex items-center"
        >
          Open checkout
        </a>
      )}
      {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
        <>
          <Button
            variant="ghost"
            onClick={() =>
              confirm("Mark this invoice as paid? Use this for bank transfers or cash — Stripe Checkout will be closed.") &&
              run(() => api(`/api/admin/invoices/${invoice.id}`, { body: { action: "pay" } }))
            }
          >
            Mark paid
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              confirm("Void this invoice?") && run(() => api(`/api/admin/invoices/${invoice.id}`, { method: "DELETE" }))
            }
          >
            Void
          </Button>
        </>
      )}
    </div>
  );
}
