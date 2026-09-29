/* JSX 텍스트의 곧은 따옴표를 타이포그래피 따옴표로 (react/no-unescaped-entities · 한글 조판) */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) yield* walk(f); else if (f.endsWith(".tsx")) yield f; } }
let n = 0;
for (const file of walk("src")) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const t = node.getText(sf);
      if (/["']/.test(t)) {
        let dq = 0, sq = 0;
        const out = t.replace(/"/g, () => (dq++ % 2 === 0 ? "“" : "”")).replace(/'/g, () => (sq++ % 2 === 0 ? "‘" : "’"));
        edits.push([node.getStart(sf), node.getEnd(), out]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  let out = src; for (const [s, e, t] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + t + out.slice(e);
  fs.writeFileSync(file, out); n += edits.length;
}
console.log("JSX text nodes with quotes fixed:", n);
