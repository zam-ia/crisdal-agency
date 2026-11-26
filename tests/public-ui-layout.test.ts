import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("home and events share one coverage layout with independent headings",()=>{
 for(const p of ["app/page.tsx","app/eventos/page.tsx"])assert.match(read(p),/<CoverageSection\s*\/>/);
 const component=read("app/ui/marketing/coverage-section.tsx");
 assert.ok(component.includes('<span className={styles.label}>Cobertura</span>'));
 assert.ok(component.includes('<h3>{pack.name}</h3>'));
 const css=read("app/ui/marketing/coverage-section.module.css");
 assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/max-width:42rem/);
 assert.match(css,/prefers-reduced-motion:no-preference/);
});
test("home portfolio preview renders supplied public work with an actionable empty state",()=>{
 const home=read("app/page.tsx"),preview=read("app/ui/marketing/portfolio-preview.tsx");
 assert.ok(home.includes("safePublicPortfolio()"));
 assert.ok(home.includes("events.slice(0, 3).map(toPublicPortfolioCard)"));
 assert.ok(preview.includes("projects.map(project=>"));
 assert.ok(preview.includes("Solicitar referencias"));
 assert.doesNotMatch(preview,/<iframe/);
});
test("package selection clears when changing categories and uses configured contact",()=>{
 const c=read("app/paquetes/package-catalog.tsx");
 assert.ok(c.includes("visible.find((item)=>item.id===selected)"));
 assert.ok(c.includes('setLine("events");setSelected(null)'));
 assert.ok(c.includes("phone={publicSite.brand.whatsapp}"));
});
