/* global React, ReactDOM, htm, DECK, ICONS */
const html = htm.bind(React.createElement);
const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;
const { meta, slides } = DECK;
const S = Object.fromEntries(slides.map((s) => [s.id, s]));

const Svg = ({ name, style }) =>
  html`<span style=${{ display: "contents", ...style }} dangerouslySetInnerHTML=${{ __html: ICONS[name] }} />`;
const Icon = ({ name, size = 56, bg, fg }) =>
  html`<span class="icon" style=${{ width: size, height: size, background: bg, color: fg }}><${Svg} name=${name} /></span>`;
const A = ({ i = 0, as = "div", cls = "", style, children }) =>
  React.createElement(as, { className: ("anim " + cls).trim(), style: { "--i": i, ...style } }, children);
const Footer = ({ n }) => html`<div class="footer"><span>${meta.title} · ${meta.presenter}</span><span>${n}</span></div>`;
const Title = ({ children }) => html`<${A} as="h2" cls="title">${children}</${A}>`;

function TitleSlide() {
  const tiers = [["edge", "Edge", "CloudFront · WAF"], ["server", "Application", "ALB · EC2 Auto Scaling · EFS"], ["data", "Data", "RDS MySQL Multi-AZ"]];
  return html`
    <${A} i=${0} cls="t-kicker">${meta.kicker}</${A}>
    <${A} i=${1} as="h1" cls="t-title">${meta.title}</${A}>
    <${A} i=${2} cls="t-sub">${meta.subtitle}</${A}>
    <${A} i=${3} cls="t-who"><b>${meta.presenter}</b><br />${meta.role} · ${meta.date}</${A}>
    ${tiers.map(([ic, h, p], k) => html`
      <${A} key=${h} i=${k + 3} cls="tier card" style=${{ left: 821 + k * 24, top: 154 + k * 139 }}>
        <${Icon} name=${ic} size=${66} bg="var(--orange)" fg="var(--ink)" />
        <div><h3>${h}</h3><p>${p}</p></div>
      </${A}>`)}`;
}

function Summary({ n }) {
  const d = S.summary;
  return html`<div class="pad">
    <${Title}>${d.title}</${Title}>
    <div class="sum">
      <div class="rows">${d.rows.map((r, k) => html`
        <${A} key=${k} i=${k + 1} cls="row"><${Icon} name=${r.icon} size=${68} bg="var(--tint)" fg="var(--deep)" />
          <div><h3>${r.head}</h3><p>${r.body}</p></div></${A}>`)}</div>
      <div class="stats">${d.stats.map((s, k) => html`
        <${A} key=${k} i=${k + 2} cls="stat card"><b>${s.value}</b><span>${s.label}</span></${A}>`)}</div>
    </div></div><${Footer} n=${n} />`;
}

function Architecture({ n }) {
  const d = S.architecture;
  const tile = (x, y, w, ic, name, sub, i) => html`
    <${A} i=${i} cls="tile" style=${{ left: x, top: y, width: w }}>
      <h4><${Icon} name=${ic} size=${40} bg="var(--pale)" fg="var(--deep)" />${name}</h4><p>${sub}</p></${A}>`;
  const zone = (x, w, label, i) => html`<${A} i=${i} cls="zone" style=${{ left: x, width: w }}><label>${label}</label></${A}>`;
  const flow = (x1, x2, label, delay) => html`
    <div class="flow" style=${{ left: x1, width: x2 - x1 }}><span>${label}</span><i style=${{ animationDelay: delay + "s" }}></i></div>`;
  return html`<div class="pad"><${Title}>${d.title}</${Title}></div>
    <div class="arch">
      <${A} i=${1} cls="visitors"><${Icon} name="user" size=${48} bg="var(--orange)" fg="var(--ink)" />Visitors</${A}>
      ${zone(168, 221, "EDGE · GLOBAL", 1)}
      <${A} i=${2} cls="vpc" style=${{ left: 427, width: 737 }}><label>VPC 10.40.0.0/16 · 2 AZs</label></${A}>
      ${zone(442, 211, "PUBLIC SUBNETS", 2)}
      ${zone(682, 250, "PRIVATE APP SUBNETS", 3)}
      ${zone(960, 190, "PRIVATE DB", 4)}
      ${tile(182, 67, 192, "edge", "CloudFront", "HTTP→HTTPS redirect, geo allowlist", 2)}
      ${tile(182, 235, 192, "shield", "AWS WAF", "Managed rules + rate limit", 3)}
      ${tile(456, 67, 182, "balance", "ALB", "HTTPS 443 from CloudFront only", 3)}
      ${tile(456, 235, 182, "network", "NAT", "One per AZ, outbound only", 4)}
      ${tile(696, 67, 221, "server", "EC2 ASG", "WordPress 7.1.4, min 1 / max 4, no public IP", 4)}
      ${tile(696, 235, 221, "files", "EFS", "Shared uploads, KMS encrypted", 5)}
      ${tile(974, 67, 162, "data", "RDS", "MySQL, Multi-AZ, encrypted", 5)}
      <${A} i=${6} style=${{ position: "absolute", left: 974, top: 250, width: 160, fontSize: 13, fontStyle: "italic", color: "var(--muted)" }}>No route to the internet</${A}>
      ${flow(120, 182, "HTTPS", 0)} ${flow(374, 456, "HTTPS only", 0.5)} ${flow(638, 696, "HTTP 80", 1)} ${flow(917, 974, "3306", 1.5)}
    </div>
    <${A} i=${7} cls="strip">
      <div><${Icon} name="key" size=${36} bg="var(--pale)" fg="var(--deep)" />Secrets Manager + KMS: DB password and shared WordPress keys</div>
      <div><${Icon} name="proof" size=${36} bg="var(--pale)" fg="var(--deep)" />Flow logs, ALB and CloudFront access logs to private storage</div>
    </${A}><${Footer} n=${n} />`;
}

function Security({ n }) {
  const d = S.security;
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="sec">
      <div class="layers">${d.layers.map((l, k) => html`
        <${A} key=${k} i=${k + 1} cls="layer"><${Icon} name=${l.icon} size=${60} bg="var(--ink)" fg="var(--orange)" /><h3>${l.head}</h3><p>${l.body}</p></${A}>`)}</div>
      <${A} i=${3} cls="callout card"><b>${d.callout.value}</b><h3>${d.callout.label}</h3><p>${d.callout.sub}</p></${A}>
    </div></div><${Footer} n=${n} />`;
}

function Scaling({ n }) {
  const d = S.scaling;
  const [cap, setCap] = useState(1);
  const icons = { in: "arrowDown", hold: "pause", out: "arrowUp" };
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="scale">
      <div>
        <${A} i=${1}>
          <p class="cap">Average CPU, judged over 6 × 5-minute periods (30 minutes)</p>
          <div class="bands">${d.bands.map((b) => html`
            <div key=${b.tone} class=${"band " + b.tone}><${Svg} name=${icons[b.tone]} /><b>${b.label}</b><span>${b.range}</span></div>`)}</div>
          <div class="ticks">${[["0%", 0], ["40%", 40], ["80%", 80], ["100%", 100]].map(([t, p]) => html`<span key=${t} style=${{ left: p + "%" }}>${t}</span>`)}</div>
        </${A}>
        <${A} i=${2} style=${{ marginTop: 22 }}>
          <p class="cap">Auto Scaling group capacity: min 1, max 4</p>
          <div class="nodes">${[1, 2, 3, 4].map((k) => html`
            <div key=${k} class=${"node" + (k <= cap ? " on" : "")}><${Svg} name="server" style=${{ color: k <= cap ? "var(--orange)" : "var(--slate)" }} />${k === 1 ? "always on" : "#" + k}</div>`)}</div>
          <div class="sim">
            <button onClick=${(e) => { e.stopPropagation(); setCap((c) => Math.min(4, c + 1)); }}>CPU above 80% ↑</button>
            <button onClick=${(e) => { e.stopPropagation(); setCap((c) => Math.max(1, c - 1)); }}>CPU below 40% ↓</button>
            <span>Try it: capacity stays between 1 and 4</span>
          </div>
          <p style=${{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", margin: "12px 0 0" }}>Live test: alarms driven, group scaled 1 → 2 → 1 with a healthy replacement</p>
        </${A}>
      </div>
      <div class="res">${d.resilience.map((r, k) => html`
        <${A} key=${k} i=${k + 2} cls="resc card"><${Icon} name=${r.icon} size=${58} bg="var(--ink)" fg="var(--orange)" /><div><h3>${r.head}</h3><p>${r.body}</p></div></${A}>`)}</div>
    </div></div><${Footer} n=${n} />`;
}

function Iac({ n }) {
  const d = S.iac;
  const mod = Object.fromEntries(d.modules.map((m) => [m.id, m]));
  const pos = { network: [0, 141], database: [259, 12], application: [259, 271], waf: [547, 12], cdn: [547, 271] };
  const lines = [[216, 181, 259, 77], [216, 230, 259, 336], [367, 142, 367, 271], [655, 142, 655, 271], [475, 336, 547, 336, 1]];
  return html`<div class="pad"><${Title}>${d.title}</${Title}></div>
    <div class="iac">
      <${A} i=${3} as="div" style=${{ position: "absolute", inset: 0 }}>
        <svg class="wires" width="780" height="420" aria-hidden="true">
          <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#3d4f63" /></marker></defs>
          ${lines.map(([x1, y1, x2, y2, dash], k) => html`<line key=${k} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke="#3d4f63" stroke-width="2" stroke-dasharray=${dash ? "6 5" : null} marker-end="url(#ah)" />`)}
        </svg>
        <span class="wl" style=${{ left: 0, top: 112 }}>subnet + SG IDs</span>
        <span class="wl" style=${{ left: 377, top: 195 }}>endpoint + secret ARN</span>
        <span class="wl" style=${{ left: 665, top: 200 }}>web ACL ARN</span>
        <span class="wl" style=${{ left: 475, top: 312, width: 72, textAlign: "center" }}>ALB origin</span>
      </${A}>
      ${Object.entries(pos).map(([id, [x, y]], k) => html`
        <${A} key=${id} i=${k} cls=${"mod" + (id === "network" ? " root" : "")} style=${{ left: x, top: y }}><h4>${id}</h4><p>${mod[id].body}</p></${A}>`)}
    </div>
    <div class="practices"><${A} i=${4} as="h3">Built to be rerun</${A}>
      ${d.practices.map((p, k) => html`<${A} key=${k} i=${k + 5}><${Svg} name="proof" style=${{ color: "var(--teal)" }} /><span>${p}</span></${A}>`)}
    </div><${Footer} n=${n} />`;
}

function Validation({ n }) {
  const d = S.validation;
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="val">${d.columns.map((c, k) => {
      const dark = k === 2;
      return html`<${A} key=${k} i=${k + 1} cls=${"vcol card" + (dark ? " dark" : "")}>
        <header><${Icon} name=${c.icon} size=${58} bg=${dark ? "var(--orange)" : "var(--ink)"} fg=${dark ? "var(--ink)" : "var(--orange)"} /><h3>${c.head}</h3></header>
        ${c.items.map(([a, b]) => html`<div key=${a} class="vitem"><span>${a}</span><b>${b}</b></div>`)}
      </${A}>`;
    })}</div>
    <${A} i=${4} cls="foot"><${Svg} name="proof" style=${{ color: "var(--teal)" }} />${d.footnote}</${A}>
    </div><${Footer} n=${n} />`;
}

function Close() {
  const d = S.close;
  return html`<${A} i=${0} as="h2" cls="c-title">${d.title}</${A}>
    <div class="takes">${d.takeaways.map((t, k) => html`
      <${A} key=${k} i=${k + 1} cls="take card"><em>${String(k + 1).padStart(2, "0")}</em><h3>${t.head}</h3><p>${t.body}</p></${A}>`)}</div>
    <${A} i=${4} cls="thanks">Thank you. Questions welcome.<small>${meta.presenter} · ${meta.role}</small></${A}>`;
}

const VIEWS = { title: TitleSlide, summary: Summary, architecture: Architecture, security: Security, scaling: Scaling, iac: Iac, validation: Validation, close: Close };
const DARK = new Set(["title", "close"]);

function Slide({ index, active }) {
  const s = slides[index];
  const View = VIEWS[s.id];
  return html`<section class=${"slide" + (DARK.has(s.id) ? " dark" : "") + (active ? " active" : "")} aria-label=${"Slide " + (index + 1)}>
    <${View} n=${index + 1} /></section>`;
}

function useFit(ref, pad) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      setScale(Math.min((r.width - pad) / 1280, (r.height - pad) / 720));
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(ref.current);
    return () => ro.disconnect();
  }, [pad]);
  return scale;
}

function Thumb({ index, cur, onPick }) {
  const ref = useRef(null);
  const [k, setK] = useState(0.25);
  useLayoutEffect(() => { if (ref.current) setK(ref.current.clientWidth / 1280); }, []);
  return html`<div ref=${ref} class=${"thumb" + (cur ? " cur" : "")} onClick=${() => onPick(index)}>
    <div class="stage" style=${{ transform: `scale(${k})` }}><${Slide} index=${index} active=${false} /></div><b>${index + 1}</b></div>`;
}

function App() {
  const fromHash = () => Math.min(slides.length - 1, Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  const [i, setI] = useState(fromHash);
  const [notes, setNotes] = useState(false);
  const [over, setOver] = useState(false);
  const [help, setHelp] = useState(false);
  const vp = useRef(null);
  const scale = useFit(vp, 40);

  const go = useCallback((n) => setI((c) => Math.min(slides.length - 1, Math.max(0, typeof n === "function" ? n(c) : n))), []);
  useEffect(() => { history.replaceState(null, "", "#" + (i + 1)); document.title = `${meta.title} (${i + 1}/${slides.length})`; }, [i]);
  useEffect(() => {
    const onHash = () => go(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); go((c) => c + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); go((c) => c - 1); }
      else if (k === "Home") go(0);
      else if (k === "End") go(slides.length - 1);
      else if (k === "n" || k === "N") setNotes((v) => !v);
      else if (k === "o" || k === "O" || k === "Escape") setOver((v) => (k === "Escape" ? false : !v));
      else if (k === "f" || k === "F") toggleFs();
      else if (k === "?") setHelp((v) => !v);
      else if (/^[1-9]$/.test(k)) go(+k - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // swipe
  const touch = useRef(null);
  const onTouchStart = (e) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go((c) => c + (dx < 0 ? 1 : -1));
    touch.current = null;
  };
  const onClick = (e) => {
    if (e.target.closest("button, a, .tile")) return;
    go((c) => c + (e.clientX > window.innerWidth / 3 ? 1 : -1));
  };
  const toggleFs = () => {
    try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (_) {}
  };

  return html`
    <div class="viewport" ref=${vp} onClick=${onClick} onTouchStart=${onTouchStart} onTouchEnd=${onTouchEnd}
         style=${{ bottom: notes ? "34vh" : 0 }}>
      <div class="stage" style=${{ transform: `scale(${scale})` }}>
        <${Slide} key=${i} index=${i} active=${true} />
      </div>
    </div>
    <div class="progress" style=${{ width: ((i + 1) / slides.length) * 100 + "%" }}></div>
    <nav class="hud" aria-label="Deck controls">
      <button onClick=${() => go((c) => c - 1)} aria-label="Previous slide">←</button>
      <button onClick=${() => setOver(true)} aria-label="Overview">${i + 1} / ${slides.length}</button>
      <button onClick=${() => go((c) => c + 1)} aria-label="Next slide">→</button>
      <button onClick=${() => setNotes((v) => !v)}>Notes</button>
      <button onClick=${toggleFs}>Full screen</button>
      <button onClick=${() => setHelp(true)} aria-label="Keyboard shortcuts">?</button>
    </nav>
    ${notes && html`<aside class="notes"><h5>SPEAKER NOTES · SLIDE ${i + 1}</h5>${slides[i].notes}</aside>`}
    ${over && html`<div class="overview" onClick=${(e) => e.target === e.currentTarget && setOver(false)}>
      ${slides.map((_, k) => html`<${Thumb} key=${k} index=${k} cur=${k === i} onPick=${(n) => { go(n); setOver(false); }} />`)}</div>`}
    ${help && html`<div class="help" onClick=${() => setHelp(false)}><div>
      <div><kbd>→ / Space</kbd>Next   <kbd>←</kbd>Previous</div>
      <div><kbd>N</kbd>Speaker notes</div><div><kbd>O</kbd>Overview grid</div>
      <div><kbd>F</kbd>Full screen</div><div><kbd>1–8</kbd>Jump to slide</div>
      <div><kbd>Ctrl/Cmd + P</kbd>Print or save as PDF</div></div></div>`}
    <div class="print-all">${slides.map((_, k) => html`<div key=${k} class="stage"><${Slide} index=${k} active=${false} /></div>`)}</div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
