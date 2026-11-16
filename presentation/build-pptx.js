// Builds School_WordPress_on_AWS.pptx from content.js.  Run: node build-pptx.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("./lib/apply_theme.js");
const { meta, slides } = require("./content.js");
const { png } = require("./icons.js");

const OUT = path.join(__dirname, "School_WordPress_on_AWS.pptx");

const THEME = {
  name: "Cloud Ink",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B1F33", // ink
    lt1: "FFFFFF",
    dk2: "3D4F63", // muted text
    lt2: "EEF2F7", // card tint
    accent1: "FF9900", // AWS orange
    accent2: "0E8C7E", // teal: pass / scale in
    accent3: "C2410C", // deep orange: numbers on white
    accent4: "8A9BB0", // slate
    accent5: "16324F", // navy panel on dark
    accent6: "FFE7C2", // pale orange
    hlink: "C2410C",
    folHlink: "8A9BB0",
  },
};
const HEX = THEME.colors;

const W = 13.333;
const M = 0.6; // side margin
const CW = W - 2 * M; // content width

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
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: M, y: 1.55, w: 7.4, h: 0.45, fontSize: 14, bold: true, color: C.accent1, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 2.05, w: 7.4, h: 1.75, fontSize: 48, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: M, y: 3.9, w: 7.2, h: 0.9, fontSize: 20, color: C.background2, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "presenter", type: "body", x: M, y: 5.55, w: 7.2, h: 0.8, fontSize: 16, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ],
  });

  pres.defineSlideMaster({
    title: "Content",
    background: { color: C.background1 },
    margin: [0.5, M, 0.6, M],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.4, w: CW, h: 1.15, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: `${meta.title}  ·  ${meta.presenter}`, options: { x: M, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 } } },
    ],
    slideNumber: { x: W - M - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: "right", margin: 0 },
  });

  pres.defineSlideMaster({
    title: "Closing Dark",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.9, w: CW, h: 1.2, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    ],
  });

  const S = Object.fromEntries(slides.map((s) => [s.id, s]));
  const T = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, valign: "top", ...opts });
  const iconCircle = async (slide, name, x, y, d, fill, iconHex, objectName) => {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: objectName + " circle" });
    const pad = d * 0.27;
    slide.addImage({ data: await png(name, iconHex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name + " icon", objectName: objectName + " icon" });
  };
  const card = (slide, x, y, w, h, fill, objectName, line) =>
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: line || { type: "none" }, objectName });

  // ---------- 1. Title ----------
  pres.addSection({ title: "Introduction" });
  {
    const s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Introduction" });
    s.addText(meta.kicker, { placeholder: "kicker" });
    s.addText(meta.title, { placeholder: "title" });
    s.addText(meta.subtitle, { placeholder: "subtitle" });
    s.addText(
      [
        { text: meta.presenter, options: { bold: true, color: C.background1, breakLine: true } },
        { text: `${meta.role}  ·  ${meta.date}` },
      ],
      { placeholder: "presenter" }
    );
    // Motif: the three tiers as stacked tiles
    const tiers = [
      ["edge", "Edge", "CloudFront · WAF"],
      ["server", "Application", "ALB · EC2 Auto Scaling · EFS"],
      ["data", "Data", "RDS MySQL Multi-AZ"],
    ];
    for (let i = 0; i < tiers.length; i++) {
      const [ic, head, sub] = tiers[i];
      const x = 8.55 + i * 0.25, y = 1.6 + i * 1.45, w = 4.0, h = 1.2;
      card(s, x, y, w, h, C.accent5, `Tier ${head}`);
      await iconCircle(s, ic, x + 0.25, y + 0.25, 0.7, C.accent1, HEX.dk1, `Tier ${head}`);
      T(s, head, { x: x + 1.15, y: y + 0.22, w: 2.7, h: 0.4, fontSize: 18, bold: true, color: C.background1 });
      T(s, sub, { x: x + 1.15, y: y + 0.62, w: 2.7, h: 0.4, fontSize: 13, color: C.background2 });
    }
    s.addNotes(S.title.notes);
  }

  // ---------- 2. Executive summary ----------
  pres.addSection({ title: "Summary" });
  {
    const d = S.summary;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Summary" });
    s.addText(d.title, { placeholder: "title" });
    for (let i = 0; i < d.rows.length; i++) {
      const r = d.rows[i], y = 1.9 + i * 1.62;
      await iconCircle(s, r.icon, M, y, 0.72, C.background2, HEX.accent3, r.head);
      T(s, r.head, { x: M + 1.0, y: y - 0.02, w: 5.7, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
      T(s, r.body, { x: M + 1.0, y: y + 0.4, w: 5.7, h: 0.95, fontSize: 14, color: C.text2 });
    }
    const tw = 2.45, th = 2.35, gx = 0.3, x0 = W - M - 2 * tw - gx;
    d.stats.forEach((st, i) => {
      const x = x0 + (i % 2) * (tw + gx), y = 1.9 + Math.floor(i / 2) * (th + 0.3);
      card(s, x, y, tw, th, C.text1, `Stat ${st.label}`);
      T(s, st.value, { x: x + 0.25, y: y + 0.35, w: tw - 0.5, h: 0.95, fontSize: 40, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
      T(s, st.label, { x: x + 0.25, y: y + 1.35, w: tw - 0.5, h: 0.8, fontSize: 14, color: C.background2 });
    });
    s.addNotes(d.notes);
  }

  // ---------- 3. Architecture ----------
  pres.addSection({ title: "Solution" });
  {
    const d = S.architecture;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    const zy = 1.75, zh = 4.3, rowY = 2.45, th = 1.4, row2 = 4.2;
    const zone = (x, w, label, fill, name) => {
      card(s, x, zy, w, zh, fill, name);
      T(s, label, { x: x + 0.15, y: zy + 0.12, w: w - 0.3, h: 0.35, fontSize: 11, bold: true, color: C.text2, charSpacing: 1 });
    };
    const tile = async (x, y, w, icon, name, sub) => {
      card(s, x, y, w, th, C.background1, name + " tile", { color: HEX.accent4, width: 0.75 });
      await iconCircle(s, icon, x + 0.14, y + 0.16, 0.42, C.accent6, HEX.accent3, name);
      T(s, name, { x: x + 0.64, y: y + 0.18, w: w - 0.74, h: 0.4, fontSize: 14, bold: true, color: C.text1, valign: "middle" });
      T(s, sub, { x: x + 0.14, y: y + 0.68, w: w - 0.26, h: 0.66, fontSize: 11, color: C.text2 });
    };
    const arrow = (x1, x2, label) => {
      const y = rowY + th / 2;
      s.addShape(pres.shapes.LINE, { x: x1, y, w: x2 - x1, h: 0, line: { color: HEX.dk1, width: 1.5, endArrowType: "triangle" }, objectName: "flow " + label });
      T(s, label, { x: x1 - 0.1, y: y - 0.55, w: x2 - x1 + 0.2, h: 0.48, fontSize: 10, bold: true, color: C.accent3, align: "center", valign: "bottom" });
    };

    // visitors
    card(s, M, rowY, 1.25, th, C.text1, "Visitors");
    await iconCircle(s, "user", M + 0.37, rowY + 0.2, 0.5, C.accent1, HEX.dk1, "Visitors");
    T(s, "Visitors", { x: M, y: rowY + 0.82, w: 1.25, h: 0.4, fontSize: 13, bold: true, color: C.background1, align: "center" });

    zone(2.35, 2.3, "EDGE · GLOBAL", C.background2, "Edge zone");
    await tile(2.5, rowY, 2.0, "edge", "CloudFront", "HTTP→HTTPS redirect, geo allowlist");
    await tile(2.5, row2, 2.0, "shield", "AWS WAF", "Managed rules + rate limit");

    // VPC wrapper
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.05, y: zy - 0.0, w: W - M - 5.05, h: zh, rectRadius: 0.12, fill: { type: "none" }, line: { color: HEX.dk1, width: 1, dashType: "dash" }, objectName: "VPC boundary" });
    T(s, "VPC 10.40.0.0/16  ·  2 AZs", { x: 5.05, y: zy + zh + 0.06, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.text2 });

    zone(5.2, 2.2, "PUBLIC SUBNETS", C.background2, "Public zone");
    await tile(5.35, rowY, 1.9, "balance", "ALB", "HTTPS 443 from CloudFront only");
    await tile(5.35, row2, 1.9, "network", "NAT", "One per AZ, outbound only");

    zone(7.7, 2.6, "PRIVATE APP SUBNETS", C.background2, "App zone");
    await tile(7.85, rowY, 2.3, "server", "EC2 ASG", "WordPress 7.1.4, min 1 / max 4, no public IP");
    await tile(7.85, row2, 2.3, "files", "EFS", "Shared uploads, KMS encrypted");

    zone(10.6, W - M - 10.6 - 0.15, "PRIVATE DB", C.background2, "DB zone");
    await tile(10.75, rowY, W - M - 10.75 - 0.3, "data", "RDS", "MySQL, Multi-AZ, encrypted");
    T(s, "No route to the internet", { x: 10.75, y: row2 + 0.2, w: 1.7, h: 0.8, fontSize: 12, italic: true, color: C.text2 });

    arrow(M + 1.25, 2.5, "HTTPS");
    arrow(4.5, 5.35, "HTTPS only");
    arrow(7.25, 7.85, "HTTP 80");
    arrow(10.15, 10.75, "3306");

    // support strip
    const chips = [
      ["key", "Secrets Manager + KMS: DB password and shared WordPress keys"],
      ["proof", "Flow logs, ALB and CloudFront access logs to private storage"],
    ];
    for (let i = 0; i < chips.length; i++) {
      const x = M + i * 6.2;
      await iconCircle(s, chips[i][0], x, 6.45, 0.38, C.accent6, HEX.accent3, "support " + i);
      T(s, chips[i][1], { x: x + 0.5, y: 6.45, w: 5.6, h: 0.38, fontSize: 12, color: C.text2, valign: "middle" });
    }
    s.addNotes(d.notes);
  }

  // ---------- 4. Security ----------
  {
    const d = S.security;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    for (let i = 0; i < d.layers.length; i++) {
      const l = d.layers[i], y = 1.85 + i * 0.98;
      await iconCircle(s, l.icon, M, y, 0.62, C.text1, HEX.accent1, l.head);
      T(s, l.head, { x: M + 0.85, y: y + 0.13, w: 1.45, h: 0.4, fontSize: 16, bold: true, color: C.text1 });
      T(s, l.body, { x: M + 2.3, y: y + 0.02, w: 5.3, h: 0.85, fontSize: 14, color: C.text2, valign: "middle" });
    }
    const px = 8.85, pw = W - M - px;
    card(s, px, 1.85, pw, 4.85, C.text1, "Callout panel");
    T(s, d.callout.value, { x: px + 0.4, y: 2.1, w: pw - 0.8, h: 1.7, fontSize: 110, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
    T(s, d.callout.label, { x: px + 0.4, y: 3.95, w: pw - 0.8, h: 0.9, fontSize: 22, bold: true, color: C.background1 });
    T(s, d.callout.sub, { x: px + 0.4, y: 5.0, w: pw - 0.8, h: 1.2, fontSize: 14, color: C.background2 });
    s.addNotes(d.notes);
  }

  // ---------- 5. Scaling ----------
  {
    const d = S.scaling;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Solution" });
    s.addText(d.title, { placeholder: "title" });
    const bx = M, bw = 7.3, by = 2.35, bh = 1.45;
    T(s, "Average CPU, judged over 6 × 5-minute periods (30 minutes)", { x: bx, y: 1.8, w: bw, h: 0.4, fontSize: 14, bold: true, color: C.text1 });
    const segs = [
      [0, 0.4, C.accent2, HEX.lt1, "arrowDown", C.background1],
      [0.4, 0.8, C.background2, HEX.dk1, "pause", C.text1],
      [0.8, 1.0, C.accent1, HEX.dk1, "arrowUp", C.text1],
    ];
    segs.forEach(([a, b, fill], i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: bx + a * bw, y: by, w: (b - a) * bw, h: bh, fill: { color: fill }, line: { color: HEX.lt1, width: 2 }, objectName: "band " + d.bands[i].label });
    });
    for (let i = 0; i < segs.length; i++) {
      const [a, b, , iconHex, ic, txt] = segs[i];
      const x = bx + a * bw + 0.2, w = (b - a) * bw - 0.4;
      s.addImage({ data: await png(ic, iconHex), x, y: by + 0.22, w: 0.32, h: 0.32, altText: d.bands[i].label, objectName: "band icon " + i });
      T(s, d.bands[i].label, { x, y: by + 0.62, w, h: 0.4, fontSize: 16, bold: true, color: txt });
      T(s, d.bands[i].range, { x, y: by + 0.98, w, h: 0.35, fontSize: 13, color: txt });
    }
    [["0%", 0], ["40%", 0.4], ["80%", 0.8], ["100%", 1]].forEach(([t, f]) =>
      T(s, t, { x: bx + f * bw - 0.4, y: by + bh + 0.08, w: 0.8, h: 0.3, fontSize: 11, color: C.text2, align: "center" })
    );

    T(s, "Auto Scaling group capacity: min 1, max 4", { x: bx, y: 4.45, w: bw, h: 0.4, fontSize: 14, bold: true, color: C.text1 });
    for (let i = 0; i < 4; i++) {
      const x = bx + i * 1.3, y = 4.95;
      card(s, x, y, 1.1, 1.0, i === 0 ? C.text1 : C.background2, "instance " + (i + 1), i === 0 ? undefined : { color: HEX.accent4, width: 1, dashType: "dash" });
      s.addImage({ data: await png("server", i === 0 ? HEX.accent1 : HEX.accent4), x: x + 0.37, y: y + 0.18, w: 0.36, h: 0.36, altText: "instance", objectName: "instance icon " + i });
      T(s, i === 0 ? "always on" : `#${i + 1}`, { x, y: y + 0.6, w: 1.1, h: 0.3, fontSize: 11, color: i === 0 ? C.background2 : C.text2, align: "center" });
    }
    T(s, "Live test: alarms driven, group scaled 1 → 2 → 1 with a healthy replacement", { x: bx, y: 6.15, w: bw, h: 0.4, fontSize: 13, italic: true, color: C.text2 });

    const rx = 8.45, rw = W - M - rx;
    for (let i = 0; i < d.resilience.length; i++) {
      const r = d.resilience[i], y = 1.8 + i * 1.2;
      card(s, rx, y, rw, 1.05, C.background2, r.head + " card");
      await iconCircle(s, r.icon, rx + 0.2, y + 0.22, 0.6, C.text1, HEX.accent1, r.head);
      T(s, r.head, { x: rx + 1.0, y: y + 0.12, w: rw - 1.15, h: 0.35, fontSize: 15, bold: true, color: C.text1 });
      T(s, r.body, { x: rx + 1.0, y: y + 0.45, w: rw - 1.15, h: 0.56, fontSize: 12, color: C.text2 });
    }
    s.addNotes(d.notes);
  }

  // ---------- 6. IaC ----------
  pres.addSection({ title: "Delivery" });
  {
    const d = S.iac;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Delivery" });
    s.addText(d.title, { placeholder: "title" });
    const mod = Object.fromEntries(d.modules.map((m) => [m.id, m]));
    const nw = 2.25, nh = 1.35;
    const pos = { network: [M, 3.35], database: [3.3, 2.0], application: [3.3, 4.7], waf: [6.3, 2.0], cdn: [6.3, 4.7] };
    const line = (x1, y1, x2, y2, label, lx, ly, dashed) => {
      s.addShape(pres.shapes.LINE, {
        x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
        flipV: (y2 < y1) !== (x2 < x1),
        line: { color: HEX.dk2, width: 1.5, endArrowType: x2 < x1 || (x1 === x2 && y2 < y1) ? undefined : "triangle", beginArrowType: x2 < x1 ? "triangle" : undefined, dashType: dashed ? "dash" : "solid" },
        objectName: "edge " + label,
      });
      if (label) T(s, label, { x: lx, y: ly, w: 1.7, h: 0.3, fontSize: 10, bold: true, color: C.accent3 });
    };
    line(M + nw, 3.75, 3.3, 2.67, "subnet + SG IDs", M, 2.95);
    line(M + nw, 4.35, 3.3, 5.37, "", 0, 0);
    line(3.3 + nw / 2, 2.0 + nh, 3.3 + nw / 2, 4.7, "", 0, 0);
    T(s, "endpoint + secret ARN", { x: 3.3 + nw / 2 + 0.1, y: 3.75, w: 1.6, h: 0.5, fontSize: 10, bold: true, color: C.accent3 });
    line(6.3 + nw / 2, 2.0 + nh, 6.3 + nw / 2, 4.7, "", 0, 0);
    T(s, "web ACL ARN", { x: 6.3 + nw / 2 + 0.1, y: 3.85, w: 1.2, h: 0.3, fontSize: 10, bold: true, color: C.accent3 });
    line(3.3 + nw, 5.37, 6.3, 5.37, "", 0, 0, true);
    T(s, "ALB origin", { x: 3.3 + nw, y: 5.0, w: 6.3 - 3.3 - nw, h: 0.3, fontSize: 10, bold: true, color: C.accent3, align: "center" });
    for (const [id, [x, y]] of Object.entries(pos)) {
      const dark = id === "network";
      card(s, x, y, nw, nh, dark ? C.text1 : C.background2, "module " + id);
      T(s, id, { x: x + 0.18, y: y + 0.14, w: nw - 0.36, h: 0.38, fontSize: 16, bold: true, color: dark ? C.accent1 : C.text1, fontFace: "Courier New" });
      T(s, mod[id].body, { x: x + 0.18, y: y + 0.55, w: nw - 0.36, h: 0.75, fontSize: 12, color: dark ? C.background2 : C.text2 });
    }

    const px = 9.0, pw = W - M - px;
    T(s, "Built to be rerun", { x: px, y: 2.0, w: pw, h: 0.45, fontSize: 18, bold: true, color: C.text1 });
    for (let i = 0; i < d.practices.length; i++) {
      const y = 2.65 + i * 1.15;
      s.addImage({ data: await png("proof", HEX.accent2), x: px, y: y + 0.03, w: 0.34, h: 0.34, altText: "check", objectName: "practice check " + i });
      T(s, d.practices[i], { x: px + 0.5, y, w: pw - 0.5, h: 0.95, fontSize: 14, color: C.text2 });
    }
    s.addNotes(d.notes);
  }

  // ---------- 7. Validation ----------
  {
    const d = S.validation;
    const s = pres.addSlide({ masterName: "Content", sectionTitle: "Delivery" });
    s.addText(d.title, { placeholder: "title" });
    const gap = 0.3, cw = (CW - 2 * gap) / 3, cy = 1.85, ch = 4.4;
    for (let i = 0; i < d.columns.length; i++) {
      const col = d.columns[i], x = M + i * (cw + gap), dark = i === 2;
      card(s, x, cy, cw, ch, dark ? C.text1 : C.background2, col.head + " column");
      await iconCircle(s, col.icon, x + 0.3, cy + 0.3, 0.6, dark ? C.accent1 : C.text1, dark ? HEX.dk1 : HEX.accent1, col.head);
      T(s, col.head, { x: x + 1.05, y: cy + 0.38, w: cw - 1.2, h: 0.45, fontSize: 18, bold: true, color: dark ? C.background1 : C.text1 });
      col.items.forEach(([k, v], j) => {
        const y = cy + 1.15 + j * 0.78;
        T(s, k, { x: x + 0.3, y, w: cw - 0.6, h: 0.3, fontSize: 12, color: dark ? C.background2 : C.text2 });
        T(s, v, { x: x + 0.3, y: y + 0.28, w: cw - 0.6, h: 0.4, fontSize: 16, bold: true, color: dark ? C.accent1 : C.text1 });
      });
    }
    s.addImage({ data: await png("proof", HEX.accent2), x: M, y: 6.47, w: 0.3, h: 0.3, altText: "check", objectName: "footnote check" });
    T(s, d.footnote, { x: M + 0.45, y: 6.42, w: CW - 0.45, h: 0.4, fontSize: 14, color: C.text2, valign: "middle" });
    s.addNotes(d.notes);
  }

  // ---------- 8. Close ----------
  pres.addSection({ title: "Close" });
  {
    const d = S.close;
    const s = pres.addSlide({ masterName: "Closing Dark", sectionTitle: "Close" });
    s.addText(d.title, { placeholder: "title" });
    const gap = 0.3, cw = (CW - 2 * gap) / 3;
    d.takeaways.forEach((t, i) => {
      const x = M + i * (cw + gap), y = 2.6;
      card(s, x, y, cw, 2.3, C.accent5, t.head + " takeaway");
      T(s, String(i + 1).padStart(2, "0"), { x: x + 0.35, y: y + 0.3, w: 1, h: 0.5, fontSize: 24, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
      T(s, t.head, { x: x + 0.35, y: y + 0.85, w: cw - 0.7, h: 0.45, fontSize: 20, bold: true, color: C.background1 });
      T(s, t.body, { x: x + 0.35, y: y + 1.35, w: cw - 0.7, h: 0.8, fontSize: 14, color: C.background2 });
    });
    T(s, "Thank you. Questions welcome.", { x: M, y: 5.55, w: CW, h: 0.6, fontSize: 24, bold: true, color: C.accent1 });
    T(s, `${meta.presenter}  ·  ${meta.role}`, { x: M, y: 6.2, w: CW, h: 0.4, fontSize: 14, color: C.background2 });
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
