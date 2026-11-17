/* global React, ReactDOM, htm, DECK, ICONS */
const html = htm.bind(React.createElement);
const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;
const { meta, slides } = DECK;
const S = Object.fromEntries(slides.map((s) => [s.id, s]));

const Icon = ({ name, style }) =>
  html`<span class="icon" style=${style} aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS[name] }} />`;
const A = ({ i = 0, as = "div", cls = "", style, children }) =>
  React.createElement(as, { className: ("anim " + cls).trim(), style: { "--i": i, ...style } }, children);
const Footer = ({ n }) => html`<div class="footer"><span>${meta.title} · ${meta.presenter}</span><span>${String(n).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</span></div>`;
const Title = ({ children }) => html`<${A} as="h2" cls="title">${children}</${A}>`;

function TitleSlide() {
  const tiers = [["Edge", "CloudFront and WAF"], ["Application", "ALB, EC2 Auto Scaling, EFS"], ["Data", "RDS MySQL, Multi-AZ"]];
  return html`
    <${A} i=${0} cls="t-kicker">Xtremax · Cloud Engineer technical assessment</${A}>
    <${A} i=${1} as="h1" cls="t-title">${meta.title}</${A}>
    <${A} i=${2} cls="t-sub">${meta.subtitle}</${A}>
    <${A} i=${3} cls="t-who"><b>${meta.presenter}</b>${meta.role} · ${meta.date}</${A}>
    <${A} i=${3} cls="path">
      <p class="path-label">HTTPS request path</p>
      <div class="path-rows">${tiers.map(([h, p]) => html`<div key=${h} class="tier"><h3>${h}</h3><p>${p}</p></div>`)}</div>
    </${A}>`;
}

function Summary({ n }) {
  const d = S.summary;
  return html`<div class="pad">
    <${Title}>${d.title}</${Title}>
    <div class="sum">
      <${A} i=${1} cls="rows">${d.rows.map((r) => html`<div key=${r.head}><h3>${r.head}</h3><p>${r.body}</p></div>`)}</${A}>
      <${A} i=${2} cls="figs">${d.stats.map((s, k) => html`
        <div key=${k} class=${"fig" + (k === 0 ? " key" : "")}><span>${s.label}</span><b>${s.value}</b></div>`)}</${A}>
    </div></div><${Footer} n=${n} />`;
}

function Architecture({ n }) {
  const d = S.architecture;
  const tile = (x, y, w, ic, name, sub) => html`
    <div class="tile" style=${{ left: x, top: y, width: w }}><h4><${Icon} name=${ic} />${name}</h4><p>${sub}</p></div>`;
  const zone = (x, w, label) => html`<div class="zone" style=${{ left: x, width: w }}><label>${label}</label></div>`;
  const flow = (x1, x2, label) => html`<div class="flow" style=${{ left: x1, width: x2 - x1 }}><span>${label}</span></div>`;
  return html`<div class="pad"><${Title}>${d.title}</${Title}></div>
    <${A} i=${1} cls="arch">
      <div class="visitors"><${Icon} name="users" />Visitors</div>
      ${zone(164, 220, "Edge, global")}
      <div class="vpc" style=${{ left: 424, width: 728 }}><label>VPC 10.40.0.0/16 · 2 AZs</label></div>
      ${zone(436, 208, "Public subnets")}
      ${zone(676, 248, "Private app subnets")}
      ${zone(956, 184, "Private DB subnets")}
      ${tile(176, 64, 196, "edge", "CloudFront", "HTTP to HTTPS redirect, geo allowlist")}
      ${tile(176, 232, 196, "shield", "AWS WAF", "Managed rules and rate limit")}
      ${tile(448, 64, 184, "balance", "ALB", "HTTPS 443 from CloudFront only")}
      ${tile(448, 232, 184, "network", "NAT", "One per AZ, outbound only")}
      ${tile(688, 64, 224, "server", "EC2 ASG", "WordPress 7.1.4, min 1, max 4, no public IP")}
      ${tile(688, 232, 224, "files", "EFS", "Shared uploads, KMS encrypted")}
      ${tile(968, 64, 160, "data", "RDS", "MySQL, Multi-AZ, encrypted")}
      <div class="note" style=${{ left: 968, top: 248, width: 160 }}>No route to the internet</div>
      ${flow(112, 176, "HTTPS")} ${flow(372, 448, "HTTPS only")} ${flow(632, 688, "HTTP 80")} ${flow(912, 968, "3306")}
    </${A}>
    <${A} i=${2} cls="strip">
      <div><${Icon} name="key" />Secrets Manager and KMS hold the DB password and shared WordPress keys</div>
      <div><${Icon} name="logs" />Flow logs and access logs go to private storage</div>
    </${A}><${Footer} n=${n} />`;
}

function Security({ n }) {
  const d = S.security;
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="sec">
      <${A} i=${1}>${d.layers.map((l) => html`
        <div key=${l.head} class="layer"><${Icon} name=${l.icon} /><h3>${l.head}</h3><p>${l.body}</p></div>`)}</${A}>
      <${A} i=${2} cls="callout"><b>${d.callout.value}</b><h3>${d.callout.label}</h3><p>${d.callout.sub}</p></${A}>
    </div></div><${Footer} n=${n} />`;
}

function Scaling({ n }) {
  const d = S.scaling;
  const [cap, setCap] = useState(1);
  const icons = { in: "arrowDown", hold: "pause", out: "arrowUp" };
  const step = (delta) => (e) => { e.stopPropagation(); setCap((c) => Math.min(4, Math.max(1, c + delta))); };
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="scale">
      <${A} i=${1}>
        <p class="cap">Average CPU over 6 periods of 5 minutes</p>
        <div class="bands">${d.bands.map((b) => html`
          <div key=${b.tone} class=${"band " + b.tone}><${Icon} name=${icons[b.tone]} /><b>${b.label}</b><span>${b.range}</span></div>`)}</div>
        <div class="ticks">${[["0%", 0], ["40%", 40], ["80%", 80], ["100%", 100]].map(([t, p]) => html`<span key=${t} style=${{ left: p + "%" }}>${t}</span>`)}</div>
        <p class="cap" style=${{ marginTop: 24 }}>Auto Scaling group, min 1, max 4</p>
        <div class="nodes">${[1, 2, 3, 4].map((k) => html`
          <div key=${k} class=${"node" + (k <= cap ? " on" : "")}><${Icon} name="server" />${k === 1 ? "always on" : "#" + k}</div>`)}</div>
        <div class="sim">
          <button onClick=${step(1)}>CPU above 80%</button>
          <button onClick=${step(-1)}>CPU below 40%</button>
          <span class="mono">${cap} of 4 running</span>
        </div>
        <p class="live">Live test: alarms forced, group went 1 → 2 → 1 with a healthy replacement</p>
      </${A}>
      <${A} i=${2} cls="res">${d.resilience.map((r) => html`
        <div key=${r.head}><${Icon} name=${r.icon} /><div><h3>${r.head}</h3><p>${r.body}</p></div></div>`)}</${A}>
    </div></div><${Footer} n=${n} />`;
}

function Iac({ n }) {
  const d = S.iac;
  const mod = Object.fromEntries(d.modules.map((m) => [m.id, m]));
  const pos = { network: [0, 140], database: [260, 12], application: [260, 272], waf: [548, 12], cdn: [548, 272] };
  const lines = [[216, 180, 260, 76], [216, 228, 260, 336], [368, 140, 368, 272], [656, 140, 656, 272], [476, 336, 548, 336, 1]];
  return html`<div class="pad"><${Title}>${d.title}</${Title}></div>
    <${A} i=${1} cls="iac">
      <svg class="wires" width="768" height="412" aria-hidden="true">
        <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6b7487" /></marker></defs>
        ${lines.map(([x1, y1, x2, y2, dash], k) => html`<line key=${k} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke="#6b7487" stroke-width="1.5" stroke-dasharray=${dash ? "6 4" : null} marker-end="url(#ah)" />`)}
      </svg>
      <span class="wl" style=${{ left: 0, top: 112 }}>subnet + SG IDs</span>
      <span class="wl" style=${{ left: 376, top: 196 }}>endpoint + secret ARN</span>
      <span class="wl" style=${{ left: 664, top: 196 }}>web ACL ARN</span>
      <span class="wl" style=${{ left: 476, top: 312, width: 72, textAlign: "center" }}>origin</span>
      ${Object.entries(pos).map(([id, [x, y]]) => html`
        <div key=${id} class=${"mod" + (id === "network" ? " root" : "")} style=${{ left: x, top: y }}><h4>${id}</h4><p>${mod[id].body}</p></div>`)}
    </${A}>
    <${A} i=${2} cls="practices"><h3>Same plan on any machine</h3>
      ${d.practices.map((p) => html`<div key=${p}><${Icon} name="check" /><span>${p}</span></div>`)}
    </${A}><${Footer} n=${n} />`;
}

function Validation({ n }) {
  const d = S.validation;
  const [stat, scan, live] = d.columns;
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <div class="val">
      <${A} i=${1} cls="term">
        <header><h3>${live.head}</h3><span>before teardown</span></header>
        ${live.items.map(([a, b], k) => html`<div key=${a} class=${"trow" + (k === 0 ? " key" : "")}><span>${a}</span><b>${b}</b></div>`)}
      </${A}>
      <div class="vstack">${[stat, scan].map((c, k) => html`
        <${A} key=${c.head} i=${k + 2} cls="vbox"><h3>${c.head}</h3>
          ${c.items.map(([a, b]) => html`<div key=${a} class="vrow"><span>${a}</span><b>${b}</b></div>`)}</${A}>`)}</div>
    </div>
    <${A} i=${4} cls="foot"><${Icon} name="check" />${d.footnote}</${A}>
    </div><${Footer} n=${n} />`;
}

function Close() {
  const d = S.close;
  return html`<${A} i=${0} as="h2" cls="c-title">${d.title}</${A}>
    <${A} i=${1} cls="takes">${d.takeaways.map((t) => html`<div key=${t.head} class="take"><h3>${t.head}</h3><p>${t.body}</p></div>`)}</${A}>
    <${A} i=${2} cls="thanks">Thank you<small>Questions welcome · ${meta.presenter}, ${meta.role}</small></${A}>`;
}

function Alt({ n }) {
  const d = S.alt;
  const tile = (x, y, w, h, ic, name, sub, dark) => html`
    <div class=${"atile" + (dark ? " dark" : "")} style=${{ left: x, top: y, width: w, height: h }}><h4><${Icon} name=${ic} />${name}</h4><p>${sub}</p></div>`;
  const flow = (x1, x2, label) => html`<div class="flow" style=${{ left: x1, width: x2 - x1, top: 215 }}><span>${label}</span></div>`;
  return html`<div class="pad"><${Title}>${d.title}</${Title}></div>
    <${A} i=${1} cls="alt">
      ${d.pipelines.map((pl, j) => html`<div key=${pl.name}>
        <p class="lane" style=${{ top: j * 100 }}><b>${pl.name}</b> ${pl.when}</p>
        ${pl.steps.map((st, k) => html`
          <div key=${st.head} class="step" style=${{ left: k * 238, top: j * 100 + 20 }}><h4>${st.head}</h4><p>${st.body}</p></div>
          ${k < pl.steps.length - 1 && html`<div class="chev" style=${{ left: k * 238 + 206, top: j * 100 + 51 }}></div>`}`)}
      </div>`)}
      <div class="pull" style=${{ left: 814, top: 84, height: 76 }}><span>image pull</span></div>
      <p class="lane" style=${{ top: 136 }}><b>Runtime</b></p>
      <div class="visitors" style=${{ top: 160, height: 112, width: 112 }}><${Icon} name="users" />Visitors</div>
      ${tile(160, 160, 200, 112, "edge", "CloudFront + WAF", "Unchanged")}
      ${tile(408, 160, 128, 112, "balance", "ALB", "Unchanged")}
      ${tile(584, 160, 260, 112, "cloud", "ECS on Fargate", "1 to 4 tasks, same CPU alarms", true)}
      ${tile(892, 160, 260, 112, "data", "RDS MySQL", "Multi-AZ, unchanged")}
      ${tile(584, 296, 260, 88, "files", "EFS", "Uploads mounted into every task")}
      ${tile(892, 296, 260, 88, "key", "Secrets Manager", "Injected through the task definition")}
      <div class="pull" style=${{ left: 714, top: 272, height: 24 }}></div>
      ${flow(112, 160, "HTTPS")} ${flow(360, 408, "HTTPS")} ${flow(536, 584, "HTTP")} ${flow(844, 892, "3306")}
      <p class="lane" style=${{ top: 412 }}>${d.footnote}</p>
    </${A}><${Footer} n=${n} />`;
}

function Tradeoff({ n }) {
  const d = S.tradeoff;
  return html`<div class="pad"><${Title}>${d.title}</${Title}>
    <${A} i=${1} cls="ttable">
      <div class="tr th">${d.head.map((h, k) => html`<span key=${k}>${h}</span>`)}</div>
      ${d.rows.map((r) => html`<div key=${r[0]} class="tr"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span></div>`)}
    </${A}>
    <${A} i=${2} cls="verdict">${d.verdict}</${A}>
    </div><${Footer} n=${n} />`;
}

const VIEWS = { title: TitleSlide, summary: Summary, architecture: Architecture, security: Security, scaling: Scaling, iac: Iac, validation: Validation, alt: Alt, tradeoff: Tradeoff, close: Close };
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
    ${notes && html`<aside class="notes"><h5>Speaker notes · slide ${i + 1}</h5>${slides[i].notes}</aside>`}
    ${over && html`<div class="overview" onClick=${(e) => e.target === e.currentTarget && setOver(false)}>
      ${slides.map((_, k) => html`<${Thumb} key=${k} index=${k} cur=${k === i} onPick=${(n) => { go(n); setOver(false); }} />`)}</div>`}
    ${help && html`<div class="help" onClick=${() => setHelp(false)}><div>
      <div><kbd>→</kbd>Next slide, also Space or click</div><div><kbd>←</kbd>Previous slide</div>
      <div><kbd>N</kbd>Speaker notes</div><div><kbd>O</kbd>Overview grid</div>
      <div><kbd>F</kbd>Full screen</div><div><kbd>1–9</kbd>Jump to slide</div>
      <div><kbd>Ctrl/Cmd + P</kbd>Print or save as PDF</div></div></div>`}
    <div class="print-all">${slides.map((_, k) => html`<div key=${k} class="stage"><${Slide} index=${k} active=${false} /></div>`)}</div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
