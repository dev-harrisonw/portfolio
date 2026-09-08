import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "../utility/Skeleton";

type RepoFile = { path: string; size: number; sha: string };

function pickDefaultFile(files: RepoFile[]) {
  const readme = files.find((f) => /^readme(\.|$)/i.test(f.path.split("/").pop() || ""));
  if (readme) return readme.path;
  const index = files.find((f) =>
    /^(index\.(html|js|tsx|ts|jsx|php)|app\.(js|tsx|ts|jsx)|main\.(py|js|ts))$/i.test(
      f.path.split("/").pop() || ""
    )
  );
  return index?.path || files[0]?.path || null;
}

function RepoCodeBrowser({
  repo,
  githubUrl,
}: {
  repo: string;
  githubUrl?: string;
}) {
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  const [branch, setBranch] = useState("main");
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/github-repo-tree?repo=${encodeURIComponent(repo)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setFiles([]);
          return;
        }
        setBranch(data.branch || "main");
        setFiles(data.files || []);
        setActivePath(pickDefaultFile(data.files || []));
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load repository");
          setFiles([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => {
    if (!activePath) return;
    let cancelled = false;
    setLoadingFile(true);
    setContent(null);
    fetch(
      `/api/github-repo-file?repo=${encodeURIComponent(
        repo
      )}&path=${encodeURIComponent(activePath)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setContent(`// ${data.error}`);
        } else {
          setContent(data.content || "");
        }
        setLoadingFile(false);
      })
      .catch(() => {
        if (!cancelled) {
          setContent("// Failed to load file");
          setLoadingFile(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repo, activePath]);

  const filtered = useMemo(() => {
    if (!files) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, filter]);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl font-bold">Source browser</h2>
          <p className="text-sm text-fun-gray">
            A read-only bootleg of GitHub&apos;s file view for{" "}
            <span className="text-white font-monospace text-xs">{repo}</span>
            {branch ? ` @ ${branch}` : ""}
          </p>
        </div>
        {(githubUrl || repo) && (
          <a
            href={githubUrl || `https://github.com/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-fun-pink hover:underline"
          >
            Open on GitHub →
          </a>
        )}
      </div>

      <div className="rounded-xl border border-fun-gray overflow-hidden bg-black/20 min-h-[420px] grid md:grid-cols-[240px_1fr]">
        <div className="border-b md:border-b-0 md:border-r border-fun-gray">
          <div className="p-2 border-b border-fun-gray">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter files…"
              className="w-full rounded-md bg-bg border border-fun-gray px-2 py-1.5 text-xs text-white outline-none focus:border-fun-pink"
            />
          </div>
          <div className="max-h-64 md:max-h-[480px] overflow-y-auto text-xs font-monospace">
            {!files && (
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            )}
            {files && error && (
              <p className="p-3 text-fun-gray">{error}</p>
            )}
            {filtered.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setActivePath(file.path)}
                className={`block w-full text-left px-3 py-1.5 truncate transition-colors ${
                  activePath === file.path
                    ? "bg-fun-pink-dark text-white"
                    : "text-fun-gray hover:bg-white/5 hover:text-white"
                }`}
                title={file.path}
              >
                {file.path}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-[280px] max-h-[480px] overflow-auto">
          <div className="sticky top-0 z-10 border-b border-fun-gray bg-bg/95 px-3 py-2 text-xs font-monospace text-fun-gray">
            {activePath || "Select a file"}
          </div>
          {loadingFile && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-9/12" />
            </div>
          )}
          {!loadingFile && content !== null && (
            <pre className="p-4 text-xs leading-relaxed text-white/90 font-monospace whitespace-pre-wrap break-words">
              {content}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}

export default RepoCodeBrowser;
