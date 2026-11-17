// Lucide line icons (via react-icons), one stroke everywhere.
// SVG strings for the HTML deck, PNG data URIs for the .pptx.
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const lu = require("react-icons/lu");

const ICONS = {
  edge: lu.LuGlobe,
  lock: lu.LuLock,
  network: lu.LuNetwork,
  key: lu.LuKeyRound,
  data: lu.LuDatabase,
  db: lu.LuDatabase,
  files: lu.LuFolderOpen,
  users: lu.LuUsers,
  user: lu.LuUser,
  pin: lu.LuPin,
  code: lu.LuCode,
  shield: lu.LuShield,
  cloud: lu.LuCloud,
  server: lu.LuServer,
  balance: lu.LuScale,
  logs: lu.LuScrollText,
  check: lu.LuCheck,
  arrowUp: lu.LuArrowUp,
  arrowDown: lu.LuArrowDown,
  pause: lu.LuPause,
};

function svg(name, color = "currentColor", size = "1em") {
  const Comp = ICONS[name];
  if (!Comp) throw new Error(`Unknown icon ${name}`);
  return renderToStaticMarkup(React.createElement(Comp, { color, size, strokeWidth: 1.5 }));
}

async function png(name, hex, size = 256) {
  const sharp = require("sharp");
  const buf = await sharp(Buffer.from(svg(name, "#" + hex, size))).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

module.exports = { ICONS, svg, png };
