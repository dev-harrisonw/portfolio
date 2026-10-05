import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "../utility/Skeleton";

type RepoFile = { path: string; size: number; sha: string };

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
};

function pickDefaultFile(files: RepoFile[]) {
  const names = files.map((f) => f.path);
  const preferred = names.find((p) => /^readme(\.|$)/i.test(p.split("/").pop() || ""));
  if (preferred) return preferred;
  const index = names.find((p) =>
    /^(index\.(html|js|tsx|ts|jsx|php)|app\.(js|tsx|ts|jsx)|main\.(py|js|ts))$/i.test(p.split("/").pop() || "")
  );
  return index || names[0] || null;
}

function skipFile(path: string) {
  return /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp4|pdf|zip|map)$/i.test(path);
}

function buildTree(files: RepoFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    if (skipFile(file.path)) continue;
    const parts = file.path.split("/").filter(Boolean);
    let level = root;
    let prefix = "";
    parts.forEach((name, i) => {
      prefix = prefix ? `${prefix}/${name}` : name;
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === name && n.type === (isFile ? "file" : "dir"));
      if (!node) {
        node = isFile ? { name, path: prefix, type: "file" } : { name, path: prefix, type: "dir", children: [] };
        level.push(node);
      }
      if (!isFile) level = node.children!;
    });
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(root);
  return root;
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      if (node.path.toLowerCase().includes(q)) out.push(node);
      continue;
    }
    const children = filterTree(node.children || [], q);
    if (children.length || node.name.toLowerCase().includes(q)) {
      out.push({ ...node, children });
    }
  }
  return out;
}

function ancestorDirs(path: string) {
  const parts = path.split("/");
  const dirs: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    dirs.push(parts.slice(0, i + 1).join("/"));
  }
  return dirs;
}

function extOf(path: string) {
  const name = path.split("/").pop() || "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function FolderRow({
  node,
  depth,
  activePath,
  expanded,
  onToggle,
  onOpen,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  const open = expanded.has(node.path);
  const pad = { paddingLeft: 8 + depth * 14 };

  if (node.type === "file") {
    const active = activePath === node.path;
    return (
      <button
        type="button"
        onClick={() => onOpen(node.path)}
        title={node.path}
        style={pad}
        className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[13px] leading-5 truncate ${
          active ? "bg-fun-pink-dark text-white" : "text-fun-gray-light hover:bg-white/5 hover:text-white"
        }`}
      >
        <FileGlyph />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(node.path)}
        style={pad}
        className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[13px] leading-5 text-fun-gray-light hover:bg-white/5 hover:text-white"
        aria-expanded={open}
      >
        <Chevron open={open} />
        <FolderGlyph open={open} />
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {open &&
        node.children?.map((child) => (
          <FolderRow
            key={child.path}
            node={child}
            depth={depth + 1}
            activePath={activePath}
            expanded={expanded}
            onToggle={onToggle}
            onOpen={onOpen}
          />
        ))}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={`shrink-0 text-fun-gray-medium transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path fill="currentColor" d="M3.2 1.2 7.5 5 3.2 8.8V1.2z" />
    </svg>
  );
}

function FolderGlyph({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0 text-fun-pink/80" aria-hidden>
      {open ? (
        <path
          fill="currentColor"
          d="M1.75 3A1.75 1.75 0 0 0 0 4.75v6.5C0 12.22.78 13 1.75 13h12.5c.97 0 1.75-.78 1.75-1.75V6.75A1.75 1.75 0 0 0 14.25 5H7.5L6.3 3.4A1.75 1.75 0 0 0 4.9 2.75H1.75Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.22.78 14 1.75 14h12.5c.97 0 1.75-.78 1.75-1.75v-6.5A1.75 1.75 0 0 0 14.25 4H6.85l-.9-1.2A1.75 1.75 0 0 0 4.55 2H1.75Z"
        />
      )}
    </svg>
  );
}

function FileGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="ml-[10px] shrink-0 text-fun-gray-medium" aria-hidden>
      <path
        fill="currentColor"
        d="M2 1.75C2 .78 2.78 0 3.75 0h6.69c.4 0 .78.16 1.06.44l2.06 2.06c.28.28.44.66.44 1.06v10.69A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25Zm8.25 1.19L9.06 1.75H3.75a.25.25 0 0 0-.25.25v12.5c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25Z"
      />
    </svg>
  );
}

function RepoCodeBrowser({ repo, githubUrl }: { repo: string; githubUrl?: string }) {
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  const [branch, setBranch] = useState("main");
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

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
        const list: RepoFile[] = data.files || [];
        const initial = pickDefaultFile(list);
        setBranch(data.branch || "main");
        setFiles(list);
        setActivePath(initial);
        setExpanded(new Set(initial ? ancestorDirs(initial) : []));
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
    fetch(`/api/github-repo-file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(activePath)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setContent(data.error ? `// ${data.error}` : data.content || "");
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

  const tree = useMemo(() => buildTree(files || []), [files]);
  const visible = useMemo(() => filterTree(tree, filter.trim().toLowerCase()), [tree, filter]);
  const lines = content == null ? [] : content.split("\n");
  const gutter = String(Math.max(lines.length, 1)).length;

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openFile = (path: string) => {
    setActivePath(path);
    setExpanded((prev) => {
      const next = new Set(prev);
      ancestorDirs(path).forEach((dir) => next.add(dir));
      return next;
    });
  };

  const copy = async () => {
    if (content == null) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filtering = filter.trim().length > 0;
  const expandedForRender = useMemo(() => {
    if (!filtering) return expanded;
    const all = new Set(expanded);
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.type === "dir") {
          all.add(n.path);
          walk(n.children || []);
        }
      });
    };
    walk(visible);
    return all;
  }, [filtering, expanded, visible]);

  return (
    <section className="mt-12 text-left">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl font-bold">Source</h2>
          <p className="text-sm text-fun-gray mt-0.5">
            <span className="font-monospace text-xs text-white">{repo}</span>
            <span className="text-fun-gray-medium"> @{branch}</span>
          </p>
        </div>
        <a
          href={githubUrl || `https://github.com/${repo}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-fun-pink hover:underline"
        >
          Open on GitHub →
        </a>
      </div>

      <div className="code-browser rounded-xl border border-fun-gray-darker overflow-hidden bg-[#0d1117] min-h-[480px] grid md:grid-cols-[260px_1fr] text-left">
        <aside className="border-b md:border-b-0 md:border-r border-fun-gray-darker bg-black/30">
          <div className="p-2 border-b border-fun-gray-darker">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter files…"
              className="w-full rounded-md bg-black/40 border border-fun-gray-darker px-2 py-1.5 text-xs text-left text-white outline-none focus:border-fun-pink"
            />
          </div>
          <div className="max-h-56 md:max-h-[560px] overflow-y-auto py-1 font-monospace">
            {!files && (
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            )}
            {files && error && <p className="p-3 text-sm text-fun-gray">{error}</p>}
            {files &&
              !error &&
              visible.map((node) => (
                <FolderRow
                  key={node.path}
                  node={node}
                  depth={0}
                  activePath={activePath}
                  expanded={expandedForRender}
                  onToggle={toggle}
                  onOpen={openFile}
                />
              ))}
            {files && !error && visible.length === 0 && (
              <p className="p-3 text-xs text-fun-gray-medium">No matching files.</p>
            )}
          </div>
        </aside>

        <div className="min-w-0 min-h-[280px] max-h-[560px] overflow-auto text-left">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-fun-gray-darker bg-[#0d1117]/95 px-3 py-2">
            <p className="min-w-0 truncate font-monospace text-xs text-fun-gray-light text-left">
              {activePath || "Select a file"}
              {activePath && extOf(activePath) && (
                <span className="ml-2 text-fun-gray-medium">{extOf(activePath)}</span>
              )}
            </p>
            {content != null && !loadingFile && (
              <button type="button" onClick={copy} className="shrink-0 text-xs text-fun-gray-medium hover:text-white">
                {copied ? "Copied" : "Copy"}
              </button>
            )}
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
            <table className="w-max min-w-full text-left font-monospace text-[12.5px] leading-6">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-white/[0.03]">
                    <td
                      className="select-none align-top text-right text-fun-gray-medium/80 pr-4 pl-3 border-r border-white/5"
                      style={{ width: `${gutter + 2}ch` }}
                    >
                      {i + 1}
                    </td>
                    <td className="pl-4 pr-6 text-left text-white/90 whitespace-pre">{line.length ? line : " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

export default RepoCodeBrowser;
