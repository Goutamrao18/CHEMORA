// Tiny dependency-free static server for local preview (mimics Vercel: /dir -> /dir/, /dir/ -> index.html).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? 4173);
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".mp4":"video/mp4",
  ".webmanifest":"application/manifest+json", ".wasm":"application/wasm", ".xml":"application/xml", ".txt":"text/plain; charset=utf-8" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let file = path.join(dir, decodeURIComponent(url.pathname));
  if (!file.startsWith(dir)) { res.writeHead(403).end("Forbidden"); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith("/")) { res.writeHead(308, { Location: url.pathname + "/" }).end(); return; }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) {
    const nf = path.join(dir, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(fs.existsSync(nf) ? fs.readFileSync(nf) : "Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ${dir} at http://localhost:${port}/`));
