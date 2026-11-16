// Builds deck.html: a single self-contained file (React, htm, icons and content inlined) that works offline.
// Run: node build-html.js
const fs = require("fs");
const path = require("path");
const { meta, slides } = require("./content.js");
const { ICONS, svg } = require("./icons.js");

const read = (p) => fs.readFileSync(path.join(__dirname, "node_modules", p), "utf8");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

const icons = Object.fromEntries(Object.keys(ICONS).map((k) => [k, svg(k, "currentColor", "1em")]));
const data = { meta, slides };

const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${meta.title}</title>
<meta name="description" content="${meta.subtitle}. ${meta.presenter}, ${meta.role}." />
<style>${fs.readFileSync(path.join(__dirname, "src/styles.css"), "utf8")}</style>
</head>
<body>
<div id="root"></div>
<script>${safe(read("react/umd/react.production.min.js"))}</script>
<script>${safe(read("react-dom/umd/react-dom.production.min.js"))}</script>
<script>${safe(read("htm/dist/htm.umd.js"))}</script>
<script>window.DECK = ${safe(JSON.stringify(data))}; window.ICONS = ${safe(JSON.stringify(icons))};</script>
<script>${safe(fs.readFileSync(path.join(__dirname, "src/app.js"), "utf8"))}</script>
</body>
</html>
`;
const file = path.join(__dirname, "deck.html");
fs.writeFileSync(file, out);
console.log("Wrote", file, (out.length / 1024).toFixed(0) + " KB");
