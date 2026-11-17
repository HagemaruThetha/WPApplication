// Builds School_WordPress_on_AWS.pptx from content.js.  Run: node build-pptx.js
// Design pass follows unslop by Damir Sokolovsky (@heydamir), CC BY 4.0: ink neutrals, one orange
// that marks the HTTPS request path and at most one key figure per slide, line icons in the muted
// text colour, hairlines instead of cards where a list will do.
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("./lib/apply_theme.js");
const { meta, slides } = require("./content.js");
const { png } = require("./icons.js");

const OUT = path.join(__dirname, "School_WordPress_on_AWS.pptx");

const THEME = {
  name: "Ink Runbook",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "111827", // primary text
    lt1: "FFFFFF",
    dk2: "4B5565", // secondary text
    lt2: "ECEFF4", // raised surface
    accent1: "FF9900", // the one accent: request path, key figure
    accent2: "B45309", // accent as text on white
    accent3: "0B0D14", // dark slide background
    accent4: "6B7487", // muted text and icons
    accent5: "11141C", // dark card
    accent6: "A3A9B8", // secondary text on dark
    hlink: "B45309",
    folHlink: "6B7487",
  },
};
const HEX = THEME.colors;
const LINE = "DDE1E7"; // hairline on light
const DLINE = "262A33"; // hairline on dark
const RAISED2 = "DDE2EA";
const MONO = "Courier New";

const W = 13.333;
const M = 0.667; // 64px side margin
const CW = W - 2 * M;
const px = (v) => v / 96;

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = meta.title;
  pres.author = meta.presenter;
  pres.subject = meta.kicker;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- Layouts ----------
  pres.defineSlideMaster({
    title: "Title Dark",
    background: { color: C.accent3 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: M, y: 1.5, w: 7, h: 0.3, fontSize: 11, color: C.accent6, fontFace: MONO, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 1.85, w: 6.9, h: 1.7, fontSize: 48, bold: false, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: M, y: 3.75, w: 7.2, h: 0.6, fontSize: 18, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "presenter", type: "body", x: M, y: 5.5, w: 6.2, h: 0.7, fontSize: 14, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content",
    background: { color: C.background1 },
    margin: [0.5, M, 0.6, M],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.42, w: CW, h: 1.17, fontSize: 30, bold: false, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: `${meta.title} · ${meta.presenter}`, options: { x: M, y: 7.0, w: 8, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent4, margin: 0 } } },
    ],
    slideNumber: { x: W - M - 0.6, y: 7.0, w: 0.6, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent4, align: "right", margin: 0 },
  });
  pres.defineSlideMaster({
    title: "Closing Dark",
    background: { color: C.accent3 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.9, w: CW, h: 1.0, fontSize: 40, bold: false, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    ],
  });

  const S = Object.fromEntries(slides.map((s) => [s.id, s]));
  const T = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, valign: "top", ...opts });
  const rect = (slide, x, y, w, h, fill, name, opts = {}) =>
    slide.addShape(opts.radius === 0 ? pres.shapes.RECTANGLE : pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: opts.radius ?? 0.12, fill: fill ? { color: fill } : { type: "none" }, line: opts.line || { type: "none" }, objectName: name,
    });
  const hair = (slide, x, y, w, color = LINE, name = "hairline") =>
    slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 0.75 }, objectName: name });
  const icon = async (slide, name, x, y, size = 0.21, hex = HEX.accent4) =>
    slide.addImage({ data: await png(name, hex), x, y, w: size, h: size, altText: name + " icon", objectName: name + " icon" });

  // ---------- 1. Title ----------
  pres.addSection({ title: "Introduction" });
  {
    const s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Introduction" });
    s.addText("Xtremax · Cloud Engineer technical assessment", { placeholder: "kicker" });
    s.addText(meta.title, { placeholder: "title" });
    s.addText(meta.subtitle, { placeholder: "subtitle" });
    s.addText([{ text: meta.presenter, options: { color: C.background1, fontSize: 16, breakLine: true } }, { text: `${meta.role} · ${meta.date}` }], { placeholder: "presenter" });

    const px0 = 8.42, rw = 4.25, rh = 1.0, gap = 0.33, y0 = 1.85;
    T(s, "HTTPS request path", { x: px0, y: 1.5, w: 3, h: 0.25, fontSize: 10, fontFace: MONO, color: C.accent4 });
    s.addShape(pres.shapes.LINE, { x: 8.11, y: y0 + rh / 2, w: 0, h: 2 * (rh + gap), line: { color: HEX.accent1, width: 2 }, objectName: "request path" });
    [["Edge", "CloudFront and WAF"], ["Application", "ALB, EC2 Auto Scaling, EFS"], ["Data", "RDS MySQL, Multi-AZ"]].forEach(([h, p], k) => {
      const y = y0 + k * (rh + gap);
      rect(s, px0, y, rw, rh, C.accent5, `Tier ${h}`, { line: { color: DLINE, width: 0.75 } });
      s.addShape(pres.shapes.OVAL, { x: 8.06, y: y + rh / 2 - 0.05, w: 0.1, h: 0.1, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `path node ${h}` });
      T(s, h, { x: px0 + 0.25, y: y + 0.2, w: rw - 0.5, h: 0.3, fontSize: 16, color: C.background1 });
      T(s, p, { x: px0 + 0.25, y: y + 0.52, w: rw - 0.5, h: 0.3, fontSize: 13, color: C.accent6 });
    });
    s.addNotes(S.title.notes);
  }

  // ---------- 2. Executive summary ----------
  pres.addSection({ title: "Summary" });
  {
    const d = S.summary;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Summary" });
    s.addText(d.title, { placeholder: "title" });
    const lw = 6.75, rh = 1.25, y0 = 1.95;
    d.rows.forEach((r, k) => {
      const y = y0 + k * rh;
      hair(s, M, y, lw);
      T(s, r.head, { x: M, y: y + 0.22, w: lw, h: 0.32, fontSize: 18, color: C.text1 });
      T(s, r.body, { x: M, y: y + 0.58, w: lw, h: 0.6, fontSize: 14, color: C.text2 });
    });
    hair(s, M, y0 + 3 * rh, lw);

    const fx = 8.08, fw = W - M - fx, fh = 1.08;
    rect(s, fx, y0, fw, 4 * fh + 0.16, C.background2, "figures panel", { radius: 0.17 });
    d.stats.forEach((st, k) => {
      const y = y0 + 0.08 + k * fh;
      if (k) hair(s, fx + 0.25, y, fw - 0.5, "D3D8E0");
      T(s, st.label, { x: fx + 0.25, y, w: 2.2, h: fh, fontSize: 14, color: C.text2, valign: "middle" });
      T(s, st.value, { x: fx + 2.3, y, w: fw - 2.55, h: fh, fontSize: 32, color: k === 0 ? C.accent2 : C.text1, align: "right", valign: "middle" });
    });
    s.addNotes(d.notes);
  }

  // ---------- 3. Architecture ----------
  pres.addSection({ title: "Solution" });
  {
    const d = S.architecture;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    const ox = M, oy = px(168);
    const X = (v) => ox + px(v), Y = (v) => oy + px(v);
    const zone = (x, w, label) => {
      rect(s, X(x), Y(0), px(w), px(412), C.background2, label + " zone", { radius: 0.2 });
      T(s, label, { x: X(x) + 0.13, y: Y(14), w: px(w) - 0.2, h: 0.25, fontSize: 10, color: C.accent4 });
    };
    const tile = async (x, y, w, ic, name, sub) => {
      rect(s, X(x), Y(y), px(w), px(136), C.background1, name + " tile", { radius: 0.08, line: { color: LINE, width: 0.75 } });
      await icon(s, ic, X(x) + 0.17, Y(y) + 0.19, 0.19);
      T(s, name, { x: X(x) + 0.44, y: Y(y) + 0.15, w: px(w) - 0.55, h: 0.28, fontSize: 13, color: C.text1, valign: "middle" });
      T(s, sub, { x: X(x) + 0.17, y: Y(y) + 0.55, w: px(w) - 0.3, h: 0.8, fontSize: 11, color: C.text2 });
    };
    const flow = (x1, x2, label) => {
      const y = Y(132);
      s.addShape(pres.shapes.LINE, { x: X(x1), y, w: px(x2 - x1), h: 0, line: { color: HEX.accent1, width: 2, endArrowType: "triangle" }, objectName: "request path " + label });
      T(s, label, { x: X(x1) - 0.1, y: y - 0.3, w: px(x2 - x1) + 0.2, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent2, align: "center", valign: "bottom" });
    };

    rect(s, X(0), Y(64), px(112), px(136), C.text1, "Visitors", { radius: 0.08 });
    await icon(s, "users", X(56) - 0.11, Y(96), 0.22, HEX.accent6);
    T(s, "Visitors", { x: X(0), y: Y(136), w: px(112), h: 0.3, fontSize: 13, color: C.background1, align: "center" });

    zone(164, 220, "Edge, global");
    rect(s, X(424), Y(-8), px(728), px(428), null, "VPC boundary", { radius: 0.25, line: { color: HEX.accent4, width: 0.75, dashType: "dash" } });
    T(s, "VPC 10.40.0.0/16 · 2 AZs", { x: X(424), y: Y(428), w: 4, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent4 });
    zone(436, 208, "Public subnets");
    zone(676, 248, "Private app subnets");
    zone(956, 184, "Private DB subnets");
    await tile(176, 64, 196, "edge", "CloudFront", "HTTP to HTTPS redirect, geo allowlist");
    await tile(176, 232, 196, "shield", "AWS WAF", "Managed rules and rate limit");
    await tile(448, 64, 184, "balance", "ALB", "HTTPS 443 from CloudFront only");
    await tile(448, 232, 184, "network", "NAT", "One per AZ, outbound only");
    await tile(688, 64, 224, "server", "EC2 ASG", "WordPress 7.1.4, min 1, max 4, no public IP");
    await tile(688, 232, 224, "files", "EFS", "Shared uploads, KMS encrypted");
    await tile(968, 64, 160, "data", "RDS", "MySQL, Multi-AZ, encrypted");
    T(s, "No route to the internet", { x: X(968), y: Y(248), w: px(160), h: 0.5, fontSize: 11, color: C.accent4 });
    flow(112, 176, "HTTPS");
    flow(372, 448, "HTTPS only");
    flow(632, 688, "HTTP 80");
    flow(912, 968, "3306");

    const strip = [["key", "Secrets Manager and KMS hold the DB password and shared WordPress keys"], ["logs", "Flow logs and access logs go to private storage"]];
    for (let k = 0; k < strip.length; k++) {
      const x = M + k * 6.6;
      await icon(s, strip[k][0], x, 6.53, 0.19);
      T(s, strip[k][1], { x: x + 0.3, y: 6.5, w: 6.1, h: 0.25, fontSize: 12, color: C.text2, valign: "middle" });
    }
    s.addNotes(d.notes);
  }

  // ---------- 4. Security ----------
  {
    const d = S.security;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    const lw = 7.0, rh = 0.92, y0 = 1.95;
    for (let k = 0; k < d.layers.length; k++) {
      const l = d.layers[k], y = y0 + k * rh;
      hair(s, M, y, lw);
      await icon(s, l.icon, M, y + rh / 2 - 0.1, 0.21);
      T(s, l.head, { x: M + 0.4, y, w: 1.3, h: rh, fontSize: 16, color: C.text1, valign: "middle" });
      T(s, l.body, { x: M + 1.85, y, w: lw - 1.85, h: rh, fontSize: 14, color: C.text2, valign: "middle" });
    }
    hair(s, M, y0 + 5 * rh, lw);
    const cx = 8.42, cw = W - M - cx;
    rect(s, cx, y0, cw, 4.6, C.accent3, "callout panel", { radius: 0.17 });
    T(s, d.callout.value, { x: cx + 0.4, y: y0 + 0.3, w: cw - 0.8, h: 1.7, fontSize: 120, color: C.accent1 });
    T(s, d.callout.label, { x: cx + 0.4, y: y0 + 2.3, w: cw - 0.8, h: 0.45, fontSize: 20, color: C.background1 });
    T(s, d.callout.sub, { x: cx + 0.4, y: y0 + 2.9, w: cw - 0.8, h: 0.8, fontSize: 14, color: C.accent6 });
    s.addNotes(d.notes);
  }

  // ---------- 5. Scaling ----------
  {
    const d = S.scaling;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    const bx = M, bw = 7.1, by = 2.3, bh = 1.33;
    T(s, "Average CPU over 6 periods of 5 minutes", { x: bx, y: 1.95, w: bw, h: 0.3, fontSize: 14, color: C.text1 });
    const segs = [[0, 0.4, RAISED2, "arrowDown", C.text1], [0.4, 0.8, HEX.lt2, "pause", C.text2], [0.8, 1.0, HEX.accent1, "arrowUp", C.text1]];
    for (let k = 0; k < segs.length; k++) {
      const [a, b, fill, ic, txt] = segs[k];
      const x = bx + a * bw + (k ? 0.01 : 0), w = (b - a) * bw - 0.02;
      rect(s, x, by, w, bh, fill, "band " + d.bands[k].label, { radius: 0 });
      await icon(s, ic, x + 0.17, by + 0.17, 0.21, k === 1 ? HEX.dk2 : HEX.dk1);
      T(s, d.bands[k].label, { x: x + 0.17, y: by + 0.62, w: w - 0.3, h: 0.3, fontSize: 15, color: txt });
      T(s, d.bands[k].range, { x: x + 0.17, y: by + 0.94, w: w - 0.3, h: 0.25, fontSize: 11, fontFace: MONO, color: txt });
    }
    [["0%", 0, "left"], ["40%", 0.4, "center"], ["80%", 0.8, "center"], ["100%", 1, "right"]].forEach(([t, f, al]) =>
      T(s, t, { x: al === "left" ? bx : al === "right" ? bx + bw - 0.8 : bx + f * bw - 0.4, y: by + bh + 0.08, w: 0.8, h: 0.22, fontSize: 9, fontFace: MONO, color: C.accent4, align: al })
    );
    T(s, "Auto Scaling group, min 1, max 4", { x: bx, y: 4.2, w: bw, h: 0.3, fontSize: 14, color: C.text1 });
    for (let k = 0; k < 4; k++) {
      const x = bx + k * 1.25, y = 4.55, on = k === 0;
      rect(s, x, y, 1.08, 1.0, on ? C.text1 : null, "instance " + (k + 1), { line: on ? undefined : { color: HEX.accent4, width: 0.75, dashType: "dash" } });
      await icon(s, "server", x + 0.42, y + 0.2, 0.25, on ? HEX.accent6 : HEX.accent4);
      T(s, on ? "always on" : `#${k + 1}`, { x, y: y + 0.6, w: 1.08, h: 0.25, fontSize: 9, fontFace: MONO, color: on ? C.accent6 : C.accent4, align: "center" });
    }
    T(s, "Live test: alarms forced, group went 1 → 2 → 1 with a healthy replacement", { x: bx, y: 5.8, w: bw, h: 0.3, fontSize: 12, color: C.text2 });

    const rx = 8.5, rw = W - M - rx, rh = 1.1;
    for (let k = 0; k < d.resilience.length; k++) {
      const r = d.resilience[k], y = 1.95 + k * rh;
      hair(s, rx, y, rw);
      await icon(s, r.icon, rx, y + 0.22, 0.21);
      T(s, r.head, { x: rx + 0.4, y: y + 0.18, w: rw - 0.4, h: 0.3, fontSize: 15, color: C.text1 });
      T(s, r.body, { x: rx + 0.4, y: y + 0.5, w: rw - 0.4, h: 0.55, fontSize: 12, color: C.text2 });
    }
    hair(s, rx, 1.95 + 4 * rh, rw);
    s.addNotes(d.notes);
  }

  // ---------- 6. Terraform modules ----------
  pres.addSection({ title: "Delivery" });
  {
    const d = S.iac;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Delivery" });
    s.addText(d.title, { placeholder: "title" });
    const ox = M, oy = px(176);
    const X = (v) => ox + px(v), Y = (v) => oy + px(v);
    const mod = Object.fromEntries(d.modules.map((m) => [m.id, m]));
    const pos = { network: [0, 140], database: [260, 12], application: [260, 272], waf: [548, 12], cdn: [548, 272] };
    const wire = (x1, y1, x2, y2, dashed) =>
      s.addShape(pres.shapes.LINE, {
        x: X(Math.min(x1, x2)), y: Y(Math.min(y1, y2)), w: px(Math.abs(x2 - x1)), h: px(Math.abs(y2 - y1)), flipV: y2 < y1,
        line: { color: HEX.accent4, width: 1.25, endArrowType: "triangle", dashType: dashed ? "dash" : "solid" }, objectName: "module wire",
      });
    wire(216, 180, 260, 76);
    wire(216, 228, 260, 336);
    wire(368, 140, 368, 272);
    wire(656, 140, 656, 272);
    wire(476, 336, 548, 336, true);
    const wl = (t, x, y, w = 1.8, align = "left") => T(s, t, { x: X(x), y: Y(y), w, h: 0.22, fontSize: 9, fontFace: MONO, color: C.accent4, align });
    wl("subnet + SG IDs", 0, 112);
    wl("endpoint + secret ARN", 376, 196);
    wl("web ACL ARN", 664, 196);
    wl("origin", 476, 312, px(72), "center");
    for (const [id, [x, y]] of Object.entries(pos)) {
      const dark = id === "network";
      rect(s, X(x), Y(y), px(216), px(128), dark ? C.text1 : C.background2, "module " + id, { radius: 0.12 });
      T(s, id, { x: X(x) + 0.17, y: Y(y) + 0.15, w: px(216) - 0.34, h: 0.28, fontSize: 14, fontFace: MONO, color: dark ? C.background1 : C.text1 });
      T(s, mod[id].body, { x: X(x) + 0.17, y: Y(y) + 0.5, w: px(216) - 0.34, h: 0.75, fontSize: 11, color: dark ? C.accent6 : C.text2 });
    }
    const pxl = 9.17, pw = W - M - pxl;
    T(s, "Same plan on any machine", { x: pxl, y: 1.95, w: pw, h: 0.35, fontSize: 16, color: C.text1 });
    for (let k = 0; k < d.practices.length; k++) {
      const y = 2.45 + k * 0.95;
      await icon(s, "check", pxl, y + 0.04, 0.19);
      T(s, d.practices[k], { x: pxl + 0.32, y, w: pw - 0.32, h: 0.75, fontSize: 14, color: C.text2 });
      hair(s, pxl, y + 0.85, pw);
    }
    s.addNotes(d.notes);
  }

  // ---------- 7. Testing ----------
  {
    const d = S.validation;
    const [stat, scan, live] = d.columns;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Delivery" });
    s.addText(d.title, { placeholder: "title" });
    const tx = M, tw = 7.08, ty = 1.95, th = 4.5;
    rect(s, tx, ty, tw, th, C.accent3, "live results panel", { radius: 0.17 });
    T(s, live.head, { x: tx + 0.33, y: ty + 0.3, w: 4, h: 0.32, fontSize: 16, color: C.background1 });
    T(s, "before teardown", { x: tx + tw - 2.33, y: ty + 0.34, w: 2, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent4, align: "right" });
    live.items.forEach(([a, b], k) => {
      const y = ty + 0.85 + k * 0.56;
      hair(s, tx + 0.33, y, tw - 0.66, DLINE);
      T(s, a, { x: tx + 0.33, y, w: 3, h: 0.56, fontSize: 12, fontFace: MONO, color: C.accent6, valign: "middle" });
      T(s, b, { x: tx + 3.33, y, w: tw - 3.66, h: 0.56, fontSize: 12, fontFace: MONO, color: k === 0 ? C.accent1 : C.background1, align: "right", valign: "middle" });
    });
    const vx = tx + tw + 0.25, vw = W - M - vx, vh = 2.17;
    [stat, scan].forEach((c, k) => {
      const y = ty + k * (vh + 0.16);
      rect(s, vx, y, vw, vh, C.background2, c.head + " panel", { radius: 0.17 });
      T(s, c.head, { x: vx + 0.25, y: y + 0.22, w: vw - 0.5, h: 0.3, fontSize: 15, color: C.text1 });
      c.items.forEach(([a, b], j) => {
        const ry = y + 0.65 + j * 0.47;
        hair(s, vx + 0.25, ry, vw - 0.5, "D3D8E0");
        T(s, a, { x: vx + 0.25, y: ry, w: 1.6, h: 0.47, fontSize: 12, color: C.text2, valign: "middle" });
        T(s, b, { x: vx + 1.75, y: ry, w: vw - 2.0, h: 0.47, fontSize: 11, fontFace: MONO, color: C.text1, align: "right", valign: "middle" });
      });
    });
    await icon(s, "check", M, 6.62, 0.19);
    T(s, d.footnote, { x: M + 0.32, y: 6.58, w: CW - 0.32, h: 0.27, fontSize: 12, color: C.text2, valign: "middle" });
    s.addNotes(d.notes);
  }

  // ---------- 8. Alternative design (proposal) ----------
  pres.addSection({ title: "Trade-off" });
  {
    const d = S.alt;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Trade-off" });
    s.addText(d.title, { placeholder: "title" });
    const ox = M, oy = px(156);
    const X = (v) => ox + px(v), Y = (v) => oy + px(v);
    const lane = (name, rest, y) =>
      T(s, [{ text: name + "  ", options: { color: C.text1 } }, { text: rest || "", options: { color: C.accent4 } }], { x: X(0), y: Y(y) - 0.02, w: CW, h: 0.2, fontSize: 10 });
    d.pipelines.forEach((pl, j) => {
      lane(pl.name, pl.when, j * 100);
      pl.steps.forEach((st, k) => {
        const x = X(k * 238), y = Y(j * 100 + 20);
        rect(s, x, y, px(200), px(64), C.background2, pl.name + " step " + st.head, { radius: 0.1 });
        T(s, st.head, { x: x + 0.15, y: y + 0.1, w: px(200) - 0.3, h: 0.24, fontSize: 12, color: C.text1 });
        T(s, st.body, { x: x + 0.15, y: y + 0.36, w: px(200) - 0.3, h: 0.22, fontSize: 10, color: C.text2 });
        if (k < pl.steps.length - 1)
          s.addShape(pres.shapes.LINE, { x: X(k * 238 + 204), y: Y(j * 100 + 52), w: px(28), h: 0, line: { color: HEX.accent4, width: 1.25, endArrowType: "triangle" }, objectName: "pipeline arrow" });
      });
    });
    const vline = (x, y, h, name) => s.addShape(pres.shapes.LINE, { x: X(x), y: Y(y), w: 0, h: px(h), line: { color: HEX.accent4, width: 1, dashType: "dash" }, objectName: name });
    vline(814, 84, 76, "image pull");
    T(s, "image pull", { x: X(822), y: Y(108), w: 1.2, h: 0.2, fontSize: 9, fontFace: MONO, color: C.accent4 });
    lane("Runtime", "", 136);

    rect(s, X(0), Y(160), px(112), px(112), C.text1, "Visitors", { radius: 0.08 });
    await icon(s, "users", X(56) - 0.11, Y(180), 0.22, HEX.accent6);
    T(s, "Visitors", { x: X(0), y: Y(220), w: px(112), h: 0.28, fontSize: 13, color: C.background1, align: "center" });
    const tile = async (x, y, w, h, ic, name, sub, dark) => {
      rect(s, X(x), Y(y), px(w), px(h), dark ? C.text1 : C.background1, name + " tile", { radius: 0.08, line: dark ? undefined : { color: LINE, width: 0.75 } });
      await icon(s, ic, X(x) + 0.17, Y(y) + 0.17, 0.19, dark ? HEX.accent6 : HEX.accent4);
      T(s, name, { x: X(x) + 0.44, y: Y(y) + 0.13, w: px(w) - 0.55, h: 0.28, fontSize: 13, color: dark ? C.background1 : C.text1, valign: "middle" });
      T(s, sub, { x: X(x) + 0.17, y: Y(y) + 0.48, w: px(w) - 0.3, h: px(h) - 0.55, fontSize: 11, color: dark ? C.accent6 : C.text2 });
    };
    await tile(160, 160, 200, 112, "edge", "CloudFront + WAF", "Unchanged");
    await tile(408, 160, 128, 112, "balance", "ALB", "Unchanged");
    await tile(584, 160, 260, 112, "cloud", "ECS on Fargate", "1 to 4 tasks, same CPU alarms", true);
    await tile(892, 160, 260, 112, "data", "RDS MySQL", "Multi-AZ, unchanged");
    await tile(584, 296, 260, 88, "files", "EFS", "Uploads mounted into every task");
    await tile(892, 296, 260, 88, "key", "Secrets Manager", "Injected through the task definition");
    vline(714, 272, 24, "EFS mount");
    [[112, 160, "HTTPS"], [360, 408, "HTTPS"], [536, 584, "HTTP"], [844, 892, "3306"]].forEach(([a, b, l]) => {
      const y = Y(216);
      s.addShape(pres.shapes.LINE, { x: X(a), y, w: px(b - a), h: 0, line: { color: HEX.accent1, width: 2, endArrowType: "triangle" }, objectName: "request path " + l });
      T(s, l, { x: X(a) - 0.1, y: y - 0.3, w: px(b - a) + 0.2, h: 0.25, fontSize: 9, fontFace: MONO, color: C.accent2, align: "center", valign: "bottom" });
    });
    T(s, d.footnote, { x: X(0), y: Y(412), w: CW, h: 0.25, fontSize: 10, color: C.accent4 });
    s.addNotes(d.notes);
  }

  // ---------- 9. Trade-off table ----------
  {
    const d = S.tradeoff;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Trade-off" });
    s.addText(d.title, { placeholder: "title" });
    const cols = [[M, 2.1], [M + 2.5, 4.55], [M + 7.45, 4.55]];
    d.head.forEach((h, k) => T(s, h, { x: cols[k][0], y: 1.85, w: cols[k][1], h: 0.3, fontSize: 10, fontFace: MONO, color: C.accent4, valign: "middle" }));
    const rh = 0.55, y0 = 2.2;
    d.rows.forEach((r, j) => {
      const y = y0 + j * rh;
      hair(s, M, y, CW);
      r.forEach((cell, k) => T(s, cell, { x: cols[k][0], y, w: cols[k][1], h: rh, fontSize: k ? 13 : 14, color: k ? C.text2 : C.text1, valign: "middle" }));
    });
    hair(s, M, y0 + d.rows.length * rh, CW);
    T(s, d.verdict, { x: M, y: y0 + d.rows.length * rh + 0.3, w: CW, h: 0.45, fontSize: 16, color: C.text1, valign: "middle" });
    s.addNotes(d.notes);
  }

  // ---------- 8. Close ----------
  pres.addSection({ title: "Close" });
  {
    const d = S.close;
    const s = pres.addSlide({ masterName: "Closing Dark", sectionTitle: "Close" });
    s.addText(d.title, { placeholder: "title" });
    const lw = CW, rh = 0.92, y0 = 2.25;
    d.takeaways.forEach((t, k) => {
      const y = y0 + k * rh;
      hair(s, M, y, lw, DLINE);
      T(s, t.head, { x: M, y, w: 2.5, h: rh, fontSize: 20, color: C.background1, valign: "middle" });
      T(s, t.body, { x: M + 2.5, y, w: lw - 2.5, h: rh, fontSize: 15, color: C.accent6, valign: "middle" });
    });
    hair(s, M, y0 + 3 * rh, lw, DLINE);
    T(s, "Thank you", { x: M, y: 5.6, w: CW, h: 0.5, fontSize: 26, color: C.background1 });
    T(s, `Questions welcome · ${meta.presenter}, ${meta.role}`, { x: M, y: 6.15, w: CW, h: 0.3, fontSize: 14, color: C.accent6 });
    s.addNotes(d.notes);
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
