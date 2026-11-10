// Builds the public site from cv.artifact.html:
//   index.html (GSAP inlined from the local clone, works offline), the EN/ES
//   PDFs and og.png (link preview image). Usage: node build.mjs
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SITE = "https://kzgian.github.io/cv/";
const DESC = "Infrastructure Specialist focused on DevOps and cloud engineering on AWS. CI/CD, Terraform, SageMaker.";

const here = import.meta.dirname;
const src = readFileSync(join(here, "cv.artifact.html"), "utf8");
const cut = src.indexOf("</style>") + "</style>".length;
const inline = f => `<script>${readFileSync(join(here, "vendor/GSAP/dist", f), "utf8")}</script>`;
const body = src.slice(cut)
  .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[^/]+\/([\w.]+)"><\/script>/g, (_, f) => inline(f))
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@[^"]+"><\/script>/,
    () => `<script>${readFileSync(join(here, "vendor/lenis/lenis.min.js"), "utf8")}</script>`)
  .replaceAll('rel="noopener" hidden>PDF', 'rel="noopener">PDF'); // the PDF links only work outside the Claude artifact
const out = join(here, "index.html");
writeFileSync(out, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${DESC}">
<meta property="og:type" content="profile">
<meta property="og:title" content="Gianfranco Casetta · Infrastructure Specialist">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}og.png">
<meta name="twitter:card" content="summary_large_image">
${src.slice(0, cut)}
</head>
<body>${body}</body>
</html>
`);
copyFileSync(out, join(here, "Gianfranco-Casetta-CV.html"));

const browser = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find(existsSync);
if (!browser) throw new Error("No Edge/Chrome found for PDF export");
const url = "file:///" + resolve(out).replace(/\\/g, "/");
const run = (...args) => execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--virtual-time-budget=10000", `--user-data-dir=${join(tmpdir(), "cvpdf-profile")}`, ...args], { stdio: "ignore" });
for (const lang of ["en", "es"]) {
  const pdf = join(here, `Gianfranco-Casetta-CV-${lang.toUpperCase()}.pdf`);
  run("--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `${url}?static=1#${lang}`);
  console.log("wrote", pdf);
}
run("--window-size=1200,630", `--screenshot=${join(here, "og.png")}`, `${url}?static=1`);
console.log("wrote og.png");
