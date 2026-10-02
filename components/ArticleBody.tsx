import { getArticle } from "@/lib/data";

// 极简 markdown 渲染（无第三方依赖，保持页面轻、无外部资源）
// 支持：# / ## / ###、> 引用、- 列表、1. 列表、| 表格、**加粗**、[链接](url)、---、图片行直接丢弃（构建期已过滤）
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(md: string): string {
  let s = escapeHtml(md);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return s;
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;

  function closeList() {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  }
  function closeTable() {
    if (inTable) {
      html += "</tbody></table>";
      inTable = false;
      tableHeaderDone = false;
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (t.startsWith("![")) continue; // 图片已在构建期去掉，这里再保险
    if (t === "" ) {
      closeList();
      closeTable();
      continue;
    }
    if (/^---+$/.test(t)) {
      closeList(); closeTable();
      html += "<hr/>";
      continue;
    }
    if (t.startsWith("### ")) { closeList(); closeTable(); html += `<h3>${inline(t.slice(4))}</h3>`; continue; }
    if (t.startsWith("## ")) { closeList(); closeTable(); html += `<h2>${inline(t.slice(3))}</h2>`; continue; }
    if (t.startsWith("# ")) { closeList(); closeTable(); html += `<h1>${inline(t.slice(2))}</h1>`; continue; }
    if (t.startsWith("> ")) { closeList(); closeTable(); html += `<blockquote><p>${inline(t.slice(2))}</p></blockquote>`; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && line.includes("|")) {
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue; // 分隔行
      if (!inTable) {
        closeList();
        html += "<table><thead><tr>";
        for (const c of cells) html += `<th>${inline(c)}</th>`;
        html += "</tr></thead><tbody>";
        inTable = true;
        tableHeaderDone = true;
        continue;
      }
      html += "<tr>";
      for (const c of cells) html += `<td>${inline(c)}</td>`;
      html += "</tr>";
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      closeTable();
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(t.replace(/^[-*]\s+/, ""))}</li>`;
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      closeTable();
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(t.replace(/^\d+\.\s+/, ""))}</li>`;
      continue;
    }
    closeList(); closeTable();
    html += `<p>${inline(t)}</p>`;
  }
  closeList(); closeTable();
  void tableHeaderDone;
  return html;
}

export default function ArticleBody({ id }: { id: string }) {
  const a = getArticle(id);
  if (!a.markdown) return <p className="text-sm text-neutral-400">暂无文章。</p>;
  const html = markdownToHtml(a.markdown);
  return (
    <div>
      {a.source === "zhihu" ? (
        <p className="mb-4 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900">
          长文版（知乎原文改编，图片仅站内查看）· 历史回测，不构成投资建议。
        </p>
      ) : (
        <p className="mb-4 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900">
          长文版（由回测数据自动生成摘要）· 历史回测，不构成投资建议。
        </p>
      )}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
