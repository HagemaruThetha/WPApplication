// Renders react-icons to SVG strings (for the HTML deck) and PNG buffers (for the .pptx).
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const fa = require("react-icons/fa6");

const ICONS = {
  brief: fa.FaClipboardList,
  build: fa.FaCubes,
  proof: fa.FaCircleCheck,
  edge: fa.FaGlobe,
  lock: fa.FaLock,
  network: fa.FaNetworkWired,
  key: fa.FaKey,
  data: fa.FaDatabase,
  db: fa.FaDatabase,
  files: fa.FaFolderOpen,
  users: fa.FaUsers,
  pin: fa.FaThumbtack,
  code: fa.FaCode,
  shield: fa.FaShieldHalved,
  cloud: fa.FaCloud,
  server: fa.FaServer,
  balance: fa.FaScaleBalanced,
  user: fa.FaUserGroup,
  arrowUp: fa.FaArrowUp,
  arrowDown: fa.FaArrowDown,
  pause: fa.FaPause,
};

function svg(name, color = "currentColor", size = 256) {
  const Comp = ICONS[name];
  if (!Comp) throw new Error(`Unknown icon ${name}`);
  return renderToStaticMarkup(React.createElement(Comp, { color, size }));
}

async function png(name, hex, size = 256) {
  const sharp = require("sharp");
  const buf = await sharp(Buffer.from(svg(name, "#" + hex, size))).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

module.exports = { ICONS, svg, png };
