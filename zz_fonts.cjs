// تنزيل خطوط Cairo من Google وتخزينها محليًا داخل public/fonts/cairo.
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const css = fs.readFileSync("./zz_cairo.css", "utf8");
  const outDir = path.join(process.cwd(), "public", "fonts", "cairo");
  fs.mkdirSync(outDir, { recursive: true });

  const blocks = css.split("@font-face").slice(1).map((b) => `@font-face${b.split("}")[0]}}`);
  const local = [];
  let n = 0;

  for (const block of blocks) {
    const url = block.match(/url\((https:\/\/[^)]+)\)/)[1];
    const weight = block.match(/font-weight:\s*(\d+)/)[1];
    const style = block.match(/font-style:\s*(\w+)/)[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)[1].trim();
    const file = `cairo-${weight}-${style}-${++n}.woff2`;

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`download failed ${url}: ${res.status}`);

    fs.writeFileSync(path.join(outDir, file), Buffer.from(await res.arrayBuffer()));
    local.push(
      `@font-face{font-family:'Cairo';font-style:${style};font-weight:${weight};font-display:swap;` +
        `src:url('/fonts/cairo/${file}') format('woff2');unicode-range:${range};}`
    );
  }

  fs.writeFileSync(path.join(process.cwd(), "public", "fonts", "cairo.css"), `${local.join("\n")}\n`);
  console.log(`downloaded ${n} font files`);
}

main();
