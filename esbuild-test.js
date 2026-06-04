const esbuild = require("esbuild");
const fs = require("fs");
const src = fs.readFileSync("src/pages/Home.tsx", "utf-8");
esbuild.transform(src, { loader: "tsx", sourcemap: false }).then(r => {
  console.log("has 鴨肉:", r.code.includes("鴨肉"));
  console.log("has 豬小排:", r.code.includes("豬小排"));
  console.log("has 雞翅:", r.code.includes("雞翅"));
  console.log("has 小卷:", r.code.includes("小卷"));
  console.log("transformed length:", r.code.length);
}).catch(e => console.error(e));
