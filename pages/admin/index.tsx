import Link from "next/link";
import { GetServerSideProps } from "next";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { UserButton } from "@clerk/nextjs";

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  requireAdminPage(ctx);

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-bg text-white px-5 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-fun-pink text-sm uppercase tracking-widest">Admin</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="grid gap-3">
        <Link href="/admin/posts">
          <a className="block rounded-xl border border-fun-gray p-4 hover:border-fun-pink transition-colors">
            <span className="font-bold">Posts</span>
            <p className="text-sm text-fun-gray mt-1">
              Create and publish blog articles
            </p>
          </a>
        </Link>
        <Link href="/admin/leads">
          <a className="block rounded-xl border border-fun-gray p-4 hover:border-fun-pink transition-colors">
            <span className="font-bold">Leads</span>
            <p className="text-sm text-fun-gray mt-1">
              Hire enquiries from the guided assistant
            </p>
          </a>
        </Link>
        <Link href="/">
          <a className="text-sm text-fun-pink hover:underline mt-4 inline-block">
            ← Back to site
          </a>
        </Link>
      </div>
    </div>
  );
}
