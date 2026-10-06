import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type ExpenseCategory } from "@/lib/expenses";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Card, Field, Input, Select, toMinor } from "@/components/admin/Form";

type ExpenseRow = {
  id: string;
  date: string;
  vendor: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  clientId: string | null;
  client: { id: string; name: string } | null;
};

type Props = { expenses: ExpenseRow[]; clients: { id: string; name: string }[] };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const [expenses, clients] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.client.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { props: JSON.parse(JSON.stringify({ expenses, clients })) };
};

export default function ExpensesPage({ expenses: initial, clients }: Props) {
  const router = useRouter();
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const [expenses, setExpenses] = useState(initial);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("SOFTWARE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const minor = toMinor(amount);
    if (!vendor.trim() || minor == null) return;
    setBusy(true);
    setError(null);
    try {
      const { expense } = await api("/api/admin/expenses", {
        body: {
          date: `${date}T00:00:00.000Z`,
          vendor: vendor.trim(),
          category,
          amount: minor,
          description,
          clientId: clientId || null,
        },
      });
      setExpenses((rows) => [expense, ...rows]);
      setVendor("");
      setAmount("");
      setDescription("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const previous = expenses;
    setExpenses((rows) => rows.filter((e) => e.id !== id));
    try {
      await api(`/api/admin/expenses/${id}`, { method: "DELETE" });
    } catch (e) {
      setExpenses(previous);
      setError((e as Error).message);
    }
  };

  return (
    <AdminShell
      title="Expenses"
      wide
      actions={
        <Link href="/admin/finance" className="text-sm text-fun-pink hover:underline">
          Finance dashboard
        </Link>
      }
    >
      <Card className="mb-8">
        <h2 className="font-bold mb-4">Log an expense</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Vendor">
            <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vercel" />
          </Field>
          <Field label="Amount">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="20.00" inputMode="decimal" />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {expenseCategoryLabel[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Client" hint="Optional — recharge later">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">None</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pro plan" />
          </Field>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <Button className="mt-4" disabled={busy || !vendor.trim() || !amount} onClick={add}>
          {busy ? "Saving…" : "Add expense"}
        </Button>
      </Card>

      {expenses.length === 0 ? (
        <Card className="text-fun-gray-light">No expenses yet. Software, hosting, and contractors go here so finance can show a real net.</Card>
      ) : (
        <ul className="space-y-2">
          {expenses.map((e) => (
            <li key={e.id} className="rounded-xl border border-fun-gray-darker px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs text-fun-gray-medium">
                {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-bold">{e.vendor}</span>
                <span className="text-fun-gray-medium"> · {expenseCategoryLabel[e.category]}</span>
                {e.client && (
                  <Link href={`/admin/clients/${e.client.id}`} className="text-fun-pink">
                    {" "}
                    · {e.client.name}
                  </Link>
                )}
                {e.description && <span className="block text-xs text-fun-gray-medium">{e.description}</span>}
              </span>
              <span className="font-monospace text-xs">{formatMoney(e.amount, e.currency)}</span>
              <button type="button" onClick={() => remove(e.id)} className="text-xs text-fun-gray hover:text-red-300">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
