// Builds mockups/lead-dashboard.html: a clickable PREVIEW of the planned lead-management dashboard,
// filled from the invented practice workbook data/leads/Lead_Practice.xlsx.
// It is a look-and-feel mockup only (one self-contained file, no network); the real pages come later.
// Run: node scripts/make-lead-mockup.js
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Optional: node scripts/make-lead-mockup.js <your workbook.xlsx> <output.html>
const SRC = path.resolve(process.argv[2] || path.join(root, 'data/leads/Lead_Practice.xlsx'));
const OUT = path.resolve(process.argv[3] || path.join(root, 'mockups/lead-dashboard.html'));
const PRACTICE = path.basename(SRC) === 'Lead_Practice.xlsx';

const iso = v => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? null : String(v).trim());
const sheets = await readXlsxFile(SRC);
const table = name => {
  const s = sheets.find(x => x.sheet === name);
  if (!s || !s.data.length) return [];
  const head = s.data[0].map(h => String(h ?? '').trim());
  // skip empty rows; trim text
  return s.data.slice(1).filter(r => r.some(v => v !== null && v !== ''))
    .map(r => Object.fromEntries(head.map((h, i) => [h, h.endsWith('_date') ? iso(r[i]) : typeof r[i] === 'string' ? r[i].trim() : r[i]])));
};
const data = { leads: table('Leads'), cases: table('Cases'), payments: table('Payments'), freebies: table('Freebies') };
const BANNER = 'data:image/png;base64,' + readFileSync(path.join(root, 'scripts/assets/header-banner.png')).toString('base64'); // cartoon header, embedded so the page stays one file
const json = JSON.stringify(data).replace(/</g, '\\u003c');
// the shared workbook layout + .xlsx writer, embedded so "Save to Excel" works offline
const LW_SRC = readFileSync(path.join(root, 'scripts/lead-workbook.js'), 'utf8').replace(/^export /gm, '');
// a short signature of this data: edits kept in the browser belong to this exact version of the workbook
let sigH = 5381; for (let i = 0; i < json.length; i++) sigH = ((sigH * 33) ^ json.charCodeAt(i)) >>> 0;
const SIG = path.basename(SRC) + ':' + sigH.toString(36);

const html = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${PRACTICE ? 'Lead dashboard · mockup' : 'Kay · My Leads'}</title>
<style>
:root {
  color-scheme: light;
  --brand: #E9A98E; --on-brand: #4A3426; --brand-deep: #C98A6B; --brand-soft: #F8E3DA; --brand-ink: #8A4E36; --brand-ink-2: #A8664C;
  --gold: #E7B98A; --page: #F6F0E4; --surface: #FFFDF6; --surface-2: #F5EEDF; --border: #EADFCB;
  --ink: #4A3426; --ink-2: #6B5242; --muted: #9A8776; --btn: #E9B8A4; --btn-ink: #4A3426;
  --hot: #C9644A; --hot-bg: #F9DDD4; --cold: #4F7DAA; --cold-bg: #D9E6F3;
  --good: #5B8F54; --overdue: #CC4F44; --critical-fill: #D8695C;
  --grid: #EFE5D3;
  --glow: 0 6px 18px rgba(120, 90, 60, 0.10);
  --font: ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.55 var(--font); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { margin: 0 0 8px; line-height: 1.25; }
h1 { font-size: 26px; } h2 { font-size: 17px; font-weight: 650; } h3 { font-size: 14px; font-weight: 650; }
.muted { color: var(--muted); } .small { font-size: 13px; } .num { font-variant-numeric: tabular-nums; }
.ribbon { color: var(--muted); font-size: 12.5px; margin: 6px 0 0; }
.page-head { max-width: 1280px; margin: 16px auto 6px; height: 230px; position: relative; background-color: #FEFBF1; background-repeat: no-repeat; background-position: center; background-size: auto 100%; border-radius: 26px; box-shadow: var(--glow); container-type: inline-size; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
.page-head h1 { font-size: 44px; margin: 0; letter-spacing: .5px; line-height: 1.1; }
.page-head p { margin: 3px 0 0; color: var(--ink-2); font-size: 14px; }
.page-head p.sub-title { font-size: 20px; font-weight: 650; letter-spacing: 1px; }
.ribbon { color: var(--muted); font-size: 12.5px; max-width: 1280px; margin: 0 auto 14px; padding: 0 22px; text-align: center; }
@media (max-width: 960px) {
  .cal { display: none; }
  .page-head { height: auto; aspect-ratio: 1140 / 334; background-size: 100% 100%; }
  .page-head h1 { font-size: 6.5cqw; } .page-head p { font-size: 1.9cqw; } .page-head p.sub-title { font-size: 2.6cqw; }
}
.cal { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); background: #A9C3E0; color: #fff; border-radius: 24px; padding: 8px 10px 9px; box-shadow: var(--glow); width: 190px; }
.cal .ch { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 12.5px; margin-bottom: 3px; }
.cal .ch button { font: inherit; background: rgba(255,255,255,.3); color: #fff; border: 0; border-radius: 50%; width: 20px; height: 20px; font-size: 13px; cursor: pointer; line-height: 1; padding: 0; }
.cal .cg { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; text-align: center; font-size: 10.5px; }
.cal .cg .w { font-size: 9.5px; opacity: .8; }
.cal .cg .d { position: relative; padding: 2px 0 5px; border-radius: 7px; }
.cal .cg .d.today { background: #fff; color: #3F6590; font-weight: 700; }
.cal .cg .d.dot::after { content: ""; position: absolute; left: 50%; bottom: 1px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: #FFE3A8; }
.cal .cg .d.today.dot::after { background: #E39B7C; }
.cal .note { display: none; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 0 16px 32px; max-width: 1280px; margin: 0 auto; }
nav { display: flex; flex-wrap: wrap; gap: 12px; }
nav a { flex: 1 1 150px; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 18px 12px; border-radius: 22px; color: var(--ink); text-decoration: none; font-weight: 650; box-shadow: var(--glow); background: var(--surface); }
nav a:nth-child(1) { background: #FFFAEB; } nav a:nth-child(2) { background: #D6E4F2; } nav a:nth-child(3) { background: #CFE6E3; }
nav a:nth-child(4) { background: #F5D5CF; } nav a:nth-child(5) { background: #E6DEF5; } nav a:nth-child(6) { background: #F7E6BF; } nav a:nth-child(7) { background: #D8EAD2; }
nav a:hover { transform: translateY(-2px); }
nav a.active { outline: 2.5px solid var(--brand-deep); outline-offset: 2px; }
.count { background: rgba(255,255,255,.75); border-radius: 999px; padding: 0 8px; font-size: 12px; font-weight: 600; }
.count.alert { background: var(--critical-fill); color: #fff; }
main { min-width: 0; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; margin: 4px 0 14px; }
.head h1 { margin: 0; }
.rd { background: var(--brand); color: var(--on-brand); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 650; }
.card { background: var(--surface); border-radius: 20px; padding: 18px 20px; min-width: 0; box-shadow: var(--glow); }
.card + .card, .tiles + .card, .grid + .card, .card + .grid { margin-top: 16px; }
.tiles { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 16px; }
.tile { background: var(--surface); border-radius: 20px; padding: 16px 18px; box-shadow: var(--glow); }
.tile .label { font-size: 13px; color: var(--ink-2); }
.tile .value { font-size: 30px; font-weight: 700; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
.tile .foot { font-size: 12.5px; color: var(--muted); }
.tile.hero { background: #D6E4F2; } .tile.hero .label, .tile.hero .foot { color: #55728F; } .tile.hero .value { color: #3F6590; font-size: 40px; }
.tile.alert { background: #F5D5CF; } .tile.alert .label, .tile.alert .foot { color: #8A4E36; } .tile.alert .value { color: #8A3B2B; }
@media (min-width: 1100px) { .tiles { grid-template-columns: repeat(6, minmax(0, 1fr)); } .tile.hero { grid-column: span 2; } }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); }
/* funnel */
.funnel { display: grid; grid-template-columns: minmax(90px, 190px) 1fr auto; gap: 7px 12px; align-items: center; font-size: 13.5px; }
.funnel .lbl { color: var(--ink-2); }
.bar { height: 18px; background: var(--grid); border-radius: 6px; overflow: hidden; }
.bar > i { display: block; height: 100%; background: linear-gradient(90deg, #F2C8B4, #E39B7C); border-radius: 6px; }
.bar.cold > i { background: var(--cold); }
.funnel .v { text-align: right; white-space: nowrap; }
.funnel .v small { color: var(--muted); margin-left: 6px; }
/* tags */
.tag { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 0 7px; border-radius: 999px; line-height: 18px; }
.tag.hot { background: var(--hot-bg); color: var(--hot); } .tag.cold { background: var(--cold-bg); color: var(--cold); }
.tag.won { background: #DDEBD4; color: var(--good); } .tag.lost { background: var(--surface-2); color: var(--muted); }
.tag.proc { background: #F8E6C8; color: #B7782B; } .tag.inst { background: #D9E6F3; color: #4F7DAA; } .tag.bad { background: #F9D9D4; color: var(--overdue); }
.prod { --pc: var(--brand); display: inline-block; font-size: 12.5px; font-weight: 650; padding: 1px 9px; border-radius: 999px; border: 1px solid var(--pc); color: color-mix(in srgb, var(--pc) 45%, #4A3426); background: color-mix(in srgb, var(--pc) 22%, transparent); white-space: nowrap; }
.tablewrap { overflow-x: auto; }
table.cases td { vertical-align: middle; } table.cases tr { cursor: pointer; } table.cases tr:hover td { background: var(--surface-2); }
table.cases tr.cont td { border-top: 0; padding-top: 2px; }
table.cases .nm { font-weight: 650; } table.cases .sub { font-size: 12px; color: var(--muted); }
tr.zero td { color: var(--muted); }
.count:empty { display: none; }
@media (max-width: 560px) { .list li { flex-wrap: wrap; } .list .grow { flex: 1 1 60%; } .list .when { margin-left: auto; } }
.card.warn { box-shadow: 0 0 0 1px var(--overdue); margin-bottom: 16px; } .card.warn h2 { color: var(--overdue); }
.tag.own { background: #DDEBD4; color: #4F8548; } .tag.agent { background: #E6DEF5; color: #7A64B0; }
.filters .sep { width: 1px; align-self: stretch; background: var(--border); margin: 0 4px; }
.paybar { display: flex; align-items: center; gap: 8px; margin: 4px 0 2px; } .paybar .bar { flex: 1; max-width: 160px; height: 8px; }
table.sched { margin: 6px 0 2px; font-size: 12.5px; } table.sched td { padding: 3px 6px; border-top: 1px solid var(--border); }
table.sched tr.late td { color: var(--overdue); } table.sched tr.due td { color: var(--muted); }
.od { color: var(--overdue); font-weight: 650; }
/* lists */
.list { list-style: none; margin: 0; padding: 0; }
.list li { display: flex; align-items: center; gap: 10px; padding: 10px 4px; border-top: 1px solid var(--border); cursor: pointer; }
.list li:first-child { border-top: 0; }
.list li:hover { background: var(--surface-2); border-radius: 10px; }
.list .grow { flex: 1; min-width: 0; }
.list .sub { font-size: 12.5px; color: var(--muted); }
.list .when { font-size: 13px; white-space: nowrap; text-align: right; }
.group-h { font-size: 13px; font-weight: 700; margin: 14px 0 4px; color: var(--ink-2); }
.group-h:first-child { margin-top: 0; }
/* kanban */
.board { display: grid; grid-auto-flow: column; grid-auto-columns: 210px; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.col { background: var(--surface); box-shadow: var(--glow); border-radius: 18px; padding: 12px; min-height: 160px; }
.col h3 { display: flex; justify-content: space-between; gap: 6px; font-size: 13px; }
.col h3 .n { color: var(--muted); font-weight: 600; }
.kcard { background: var(--surface-2); border-radius: 12px; padding: 9px 10px; margin-top: 8px; cursor: pointer; font-size: 13px; }
.kcard:hover { outline: 1.5px solid var(--brand); }
.kcard .nm { font-weight: 650; }
.kcard .meta { color: var(--muted); font-size: 12px; }
.kcard.stuck { box-shadow: inset 3px 0 0 var(--overdue); }
.filters { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.pill { font: inherit; font-size: 13px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); padding: 5px 12px; border-radius: 999px; cursor: pointer; }
.pill.active { background: var(--btn); color: var(--btn-ink); border-color: transparent; font-weight: 600; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th, td { text-align: left; padding: 8px 6px; border-top: 1px solid var(--border); }
th { color: var(--muted); font-weight: 600; font-size: 12.5px; border-top: 0; }
td.r, th.r { text-align: right; }
/* drawer */
.back { position: fixed; inset: 0; background: rgba(74,52,38,.35); z-index: 40; }
.drawer { position: fixed; top: 8px; right: 8px; bottom: 8px; width: min(440px, calc(100% - 16px)); background: var(--surface); border-radius: 20px; z-index: 41; overflow: auto; padding: 22px; }
.drawer .x { float: right; font: inherit; font-size: 20px; background: var(--surface-2); color: var(--ink); border: 0; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; }
.tl { list-style: none; padding: 0; margin: 10px 0 0; }
.tl li { display: flex; gap: 10px; padding: 5px 0; font-size: 13.5px; color: var(--muted); }
.tl li .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--border); margin-top: 5px; flex: none; }
.tl li.done { color: var(--ink); } .tl li.done .dot { background: var(--brand); border-color: var(--brand); }
.tl li .d { margin-left: auto; font-variant-numeric: tabular-nums; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 13.5px; margin: 12px 0; }
dt { color: var(--muted); }
[hidden] { display: none !important; }
@media (max-width: 820px) {
  .layout { padding: 0 12px 24px; }
  nav a { flex-basis: 45%; padding: 14px 8px; }
  h1, .page-head h1 { font-size: 24px; }
}
/* ---- features from the shared version, in this design ---- */
.gcard { background: var(--surface); border-radius: 20px; padding: 16px 18px; box-shadow: var(--glow); min-width: 0; position: relative; }
.gcard h2 { display: flex; align-items: center; gap: 6px; }
.gi { display: inline-grid; place-items: center; } .gicon { width: 22px; height: 22px; }
.stats { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 16px; }
.stat { padding-bottom: 8px; border-top: 3px solid var(--c); }
.stat-top { display: flex; gap: 12px; align-items: flex-start; }
.stat .gi { width: 40px; height: 40px; border-radius: 14px; background: color-mix(in srgb, var(--c) 18%, transparent); flex: none; }
.stat .label { font-size: 13px; color: var(--ink-2); } .stat .value { font-size: 30px; font-weight: 750; line-height: 1.15; } .stat .foot { font-size: 12.5px; color: var(--muted); }
.spark { display: block; width: 100%; height: 42px; margin-top: 6px; }
.card-h { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; } .card-h h2 { margin: 0; }
.link { color: var(--brand-ink); font-size: 13px; text-decoration: none; white-space: nowrap; font-weight: 650; }
.pipe-card { margin-bottom: 16px; }
.pipe-meta { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: var(--ink-2); } .pipe-meta b { font-size: 16px; } .vsep { width: 1px; height: 16px; background: var(--border); }
.stages { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
@media (min-width: 1100px) { .stages { grid-template-columns: repeat(8, minmax(0, 1fr)); } }
.stage { display: flex; flex-direction: column; gap: 2px; padding: 12px 12px 10px; border-radius: 18px; text-decoration: none; color: var(--ink); background: var(--sc); box-shadow: var(--glow); }
.stage:hover { transform: translateY(-2px); }
.stage-n { font-size: 12px; font-weight: 650; min-height: 2.5em; } .stage b { font-size: 26px; line-height: 1.1; } .stage small { color: var(--ink-2); }
.grow3 { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); margin-bottom: 16px; }
@media (min-width: 1100px) { .grow3.b { grid-template-columns: 260px 1fr 1fr; align-items: stretch; }
  .grow3.b > .gcard { height: 260px; display: flex; flex-direction: column; } .grow3.b > .gcard > h2 { flex: none; }
  .grow3.b .bars { flex: 1; min-height: 0; max-height: 190px; } .grow3.b > .gcard > div:has(.bars) { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .grow3.b .month { flex: 1; align-content: center; gap: 8px 12px; margin-top: 0; } .grow3.b .month b { font-size: 20px; } .grow3.b .month small { font-size: 11.5px; line-height: 1.25; } .grow3.b .month .gicon { width: 18px; height: 18px; }
  .grow3.b > .conv-card { aspect-ratio: auto; } }
.conv-card { align-self: start; aspect-ratio: 1 / 1; display: flex; flex-direction: column; } .conv-card h2 { font-size: 13px; margin-bottom: 4px; }
.conv-sq { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 0; } .conv-sq .ring { width: 116px; height: 116px; }
.conv-mini { width: 100%; max-width: 210px; } .minibars { width: 100%; height: auto; display: block; }
@media (max-width: 1099px) { .conv-card { aspect-ratio: auto; } }
.ring-v { fill: var(--ink); font-size: 24px; font-weight: 750; } .ring-s { fill: var(--muted); font-size: 11px; }
.bars { width: 100%; height: auto; display: block; } .bar-v { fill: var(--ink-2); font-size: 11px; } .bar-l { fill: var(--muted); font-size: 11px; }
.legend { display: flex; gap: 14px; font-size: 12px; color: var(--muted); margin-bottom: 4px; } .legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
.month { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 6px; } .month > div { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; } .month b { font-size: 24px; } .month small { color: var(--muted); }
.section-h { margin: 6px 0 12px; color: var(--ink-2); }
.act-card { margin-top: 16px; }
.feed { list-style: none; padding: 0; margin: 0; } .feed li { display: flex; gap: 10px; align-items: baseline; padding: 6px 0; font-size: 13px; cursor: pointer; } .feed small { color: var(--muted); width: 74px; flex: none; }
.dotg { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); flex: none; align-self: center; }
.sys-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-deep); flex: none; }
/* leads table */
.tbar { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: flex-end; margin-bottom: 12px; }
.tbar input[type=search] { flex: 1 1 240px; font: inherit; font-size: 14px; color: var(--ink); background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 8px 12px; }
.tbar input:focus, .fsel select:focus, .ein:focus { outline: 2px solid var(--brand); outline-offset: 1px; }
.fsel { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--muted); letter-spacing: 0.04em; }
.fsel select { font: inherit; font-size: 13px; color: var(--ink); background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 7px 10px; }
table.saas th { position: sticky; top: 0; background: var(--surface); white-space: nowrap; }
table.saas th.sortable { cursor: pointer; user-select: none; } table.saas th.on { color: var(--brand-ink); } table.saas th .arrow { font-size: 10px; }
table.saas tbody tr { cursor: pointer; } table.saas tbody tr:hover td { background: var(--surface-2); }
table.saas td { vertical-align: top; } table.saas .nm { font-weight: 650; } table.saas .sub { font-size: 12px; color: var(--muted); }
.tfoot { margin-top: 10px; font-size: 12.5px; color: var(--muted); }
/* editing */
.edit { margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--border); }
.ebox { border: 1px solid var(--border); border-radius: 14px; padding: 8px 12px; margin-top: 10px; background: var(--surface-2); }
.ebox summary { cursor: pointer; font-weight: 700; color: var(--brand-ink); }
.erow { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: flex-end; margin-top: 10px; }
.elbl { display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; color: var(--muted); flex: 1 1 130px; min-width: 0; }
.ein { font: inherit; font-size: 13.5px; color: var(--ink); background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 6px 8px; width: 100%; color-scheme: light; }
textarea.ein { resize: vertical; }
.picker { display: flex; flex-direction: column; gap: 6px; }
.echk { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.ebtn { font: inherit; font-weight: 700; font-size: 13px; color: var(--ink); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px; cursor: pointer; white-space: nowrap; }
.ebtn.go { background: var(--btn); border-color: transparent; }
.ebtn.ghost { background: transparent; } .ebtn.warn { color: var(--overdue); border-color: var(--overdue); }
.ebtn:hover { filter: brightness(0.96); }
.editbar { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 39; display: flex; align-items: center; gap: 10px; width: min(760px, calc(100% - 24px)); padding: 10px 14px; border-radius: 18px; background: #FFFAEB; box-shadow: 0 0 0 1.5px var(--brand), 0 10px 30px rgba(120, 90, 60, 0.25); font-size: 13.5px; }
.editbar .grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.newlead { float: right; margin-top: 2px; }
</style>
</head>
<body>
<div class="page-head" style="background-image:url('${BANNER}')">
  <h1>Kay</h1><p class="sub-title">My Leads</p><p>Welcome back, Kay! Keep every lead in view.</p>
  <div class="cal" id="cal"></div>
</div>
<p class="ribbon">${PRACTICE ? '<strong>Mockup</strong> · shows the planned lead dashboard with invented practice data (Lead_Practice.xlsx). Not the real version yet.' : 'Your own data from ' + path.basename(SRC).replace(/[<>&"]/g, '') + ' · stays on this computer; not uploaded.'}</p>
<script>document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('cal'),now=new Date(),ym=[now.getFullYear(),now.getMonth()];
  var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function key(y,m,d){return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');}
  function todo(){var o={};(DATA.leads||[]).forEach(function(l){var st=String(l.status||'').trim().toLowerCase();if(l.next_action_date&&st!=='won'&&st!=='lost'){(o[l.next_action_date]=o[l.next_action_date]||[]).push(l.name+(l.next_action?': '+l.next_action:''));}});return o;}
  function draw(){
    var y=ym[0],m=ym[1],td=todo(),first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();
    box.textContent='';
    var ch=document.createElement('div');ch.className='ch';
    var pv=document.createElement('button');pv.textContent='\u2039';pv.onclick=function(){ym=m?[y,m-1]:[y-1,11];draw();};
    var nx=document.createElement('button');nx.textContent='\u203A';nx.onclick=function(){ym=m<11?[y,m+1]:[y+1,0];draw();};
    var t=document.createElement('span');t.textContent=MN[m]+' '+y;
    ch.append(pv,t,nx);box.append(ch);
    var g=document.createElement('div');g.className='cg';
    ['S','M','T','W','T','F','S'].forEach(function(w){var e=document.createElement('div');e.className='w';e.textContent=w;g.append(e);});
    for(var i=0;i<first;i++)g.append(document.createElement('div'));
    for(var d=1;d<=n;d++){var e=document.createElement('div'),k=key(y,m,d);e.className='d';e.textContent=d;
      if(y===now.getFullYear()&&m===now.getMonth()&&d===now.getDate())e.classList.add('today');
      if(td[k]){e.classList.add('dot');e.title=td[k].join('\n');}
      g.append(e);}
    box.append(g);
    var nt=document.createElement('div');nt.className='note';nt.textContent='Dot = a next action is due';box.append(nt);
  }
  draw();
});</script>
<div class="layout">
  <nav id="nav">
    <a href="#overview" data-page="overview">Overview</a>
    <a href="#leads" data-page="leads">Leads <span class="count" id="c-leads"></span></a>
    <a href="#board" data-page="board">Lead board <span class="count" id="c-board"></span></a>
    <a href="#cases" data-page="cases">Cases <span class="count" id="c-cases"></span></a>
    <a href="#aftersales" data-page="aftersales">After-sales <span class="count" id="c-after"></span></a>
    <a href="#followup" data-page="followup">Follow-ups <span class="count alert" id="c-follow"></span></a>
    <a href="#cold" data-page="cold">COLD &amp; Telegram <span class="count" id="c-cold"></span></a>
  </nav>
  <main>
    <section id="p-overview"></section>
    <section id="p-leads" hidden></section>
    <section id="p-board" hidden></section>
    <section id="p-cases" hidden></section>
    <section id="p-aftersales" hidden></section>
    <section id="p-followup" hidden></section>
    <section id="p-cold" hidden></section>
  </main>
</div>
<div id="drawer-root"></div>
<div id="editbar" class="editbar" hidden></div>
<script>
const ORIGINAL = ${json};
const SRC_NAME = ${JSON.stringify(path.basename(SRC))};
const PRACTICE_FILE = ${PRACTICE};
const LW = (() => {
${LW_SRC}
return { workbookFiles, zipFiles, LAYOUT, AUTO, HOT_NEXT, COLD_NEXT, NEXT_ACTIONS };
})();
// ---- edits made on this page are kept in this browser until you save them to Excel ----
const STORE_KEY = 'lead-edits:' + ${JSON.stringify(SIG)};
let STORE = null;
try { STORE = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { STORE = null; }
const RAW = STORE && STORE.data ? STORE.data : JSON.parse(JSON.stringify(ORIGINAL));
const DATA = JSON.parse(JSON.stringify(RAW));
DATA.leads.forEach((l, i) => { l._i = i; }); DATA.cases.forEach((c, i) => { c._i = i; }); DATA.payments.forEach((p, i) => { p._i = i; });
const HOT = [['h01_phone_date','Phone number received'],['h02_form_sent_date','Google Form sent'],['h03_call_date','First call stage'],['h04_docs_date','Docs collection stage'],['h05_checking_date','Bank Checking stage'],['h06_proposal_date','Proposal stage'],['h07_appointment_date','Appointment stage'],['h08_followup_date','Follow up & closing']];
const PRODUCTS = ['BCS', 'BCS settlement', 'CCS', 'Goal Loan', 'Home Fin', 'SME Loan', 'Fin Account', 'Card Master', 'Biz Assist', 'Financial Workshop'];
const INSTALLMENT_PRODUCTS = ['BCS', 'BCS settlement', 'CCS'];
// one colour per product (warm colours = the three that allow installment)
const PRODUCT_COLORS = { 'BCS': '#FF7A6B', 'BCS settlement': '#FFA94D', 'CCS': '#FFD84D', 'Goal Loan': '#A8E05F', 'Home Fin': '#3DD6C6',
  'SME Loan': '#5AA9FF', 'Fin Account': '#A98BFF', 'Card Master': '#FF6FB5', 'Biz Assist': '#D9D9D9', 'Financial Workshop': '#C9A27A' };
const prodTag = p => h('span', { class: 'prod', style: PRODUCT_COLORS[p] ? '--pc:' + PRODUCT_COLORS[p] : null }, p);
const OWNER = 'Kay Au'; // agent = Chris means your own case; any other agent passed the case to you
const isOwn = l => !l.agent || String(l.agent).trim().toLowerCase() === OWNER.toLowerCase();
const SOURCES = { 'All sources': () => true, ['Own (' + OWNER + ')']: isOwn, 'From agents': l => !isOwn(l) };
const COLD = [['c1_telegram_promoted_date','Telegram group promoted'],['c2_telegram_joined_date','Joined Telegram group'],['c3_upgraded_hot_date','Upgraded to HOT']];

// ---- helpers (text only, never innerHTML with data) ----
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = d => { if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '—'; const [y, m, dd] = d.split('-'); return Number(dd) + ' ' + MONTHS[Number(m) - 1]; };

// ---- derived facts ----
// (payment due dates are plans, not events, so only paid dates count)
const allDates = DATA.leads.concat(DATA.cases).flatMap(l => Object.entries(l).filter(([k, v]) => k.endsWith('_date') && k !== 'next_action_date' && v).map(([, v]) => v))
  .concat(DATA.payments.map(p => p.paid_date).filter(Boolean));
const RD = allDates.sort().at(-1) || '2000-01-01'; // reporting date = latest recorded event in the file (placeholder when empty)
for (const l of DATA.leads) {
  // forgiving about how things were typed: hot/HOT, won/Won, blank status = Active
  l.category = String(l.category || '').trim().toUpperCase() === 'COLD' ? 'COLD' : String(l.category || '').trim() ? 'HOT' : (l.phone ? 'HOT' : 'COLD');
  l.status = ({ active: 'Active', won: 'Won', lost: 'Lost' })[String(l.status || '').trim().toLowerCase()] || 'Active';
  l.name = l.name || l.lead_id || '(no name)';
  l.platform = l.platform || '—';
  l.first_contact_date = l.first_contact_date || l.h01_phone_date || '';
  l.stage = 0; l.stageDate = null;
  HOT.forEach(([k], i) => { if (l[k]) { l.stage = i + 1; l.stageDate = l[k]; } });
  l.coldStep = 0; COLD.forEach(([k], i) => { if (l[k]) l.coldStep = i + 1; });
  l.lastDate = [l.first_contact_date, ...HOT.map(s => l[s[0]]), ...COLD.map(s => l[s[0]])].filter(Boolean).sort().at(-1);
  l.idle = days(l.lastDate, RD);
  l.active = l.status === 'Active';
  l.cases = [];
}
// cases: one row per product a customer closed
const byId = new Map(DATA.leads.map(l => [l.lead_id, l]));
for (const c of DATA.cases) {
  c.lead = byId.get(c.lead_id);
  c.isInstallment = String(c.installment || '').trim().toLowerCase() === 'yes';
  // installment cases close only when every payment is paid; the others when the fee is collected
  c.plan = DATA.payments.filter(p => c.case_id && p.case_id === c.case_id).sort((a, b) => a.due_date.localeCompare(b.due_date));
  c.total = c.plan.reduce((s, p) => s + Number(p.amount || 0), 0);
  c.paid = c.plan.filter(p => p.paid_date).reduce((s, p) => s + Number(p.amount || 0), 0);
  c.next = c.plan.find(p => !p.paid_date) || null;
  c.overduePays = c.plan.filter(p => !p.paid_date && p.due_date < RD);
  c.closedDate = c.isInstallment ? (c.plan.length && !c.next ? c.plan.map(p => p.paid_date).sort().at(-1) : null) : (c.fee_collected_date || null);
  c.state = c.closedDate ? 'Closed' : c.processing_date ? 'Processing' : 'Not started';
  c.badInstallment = c.isInstallment && !INSTALLMENT_PRODUCTS.includes(c.product);
  if (c.lead) c.lead.cases.push(c);
}
const cases = DATA.cases.filter(c => c.lead);
const leads = DATA.leads;
const hot = leads.filter(l => l.category === 'HOT');
const cold = leads.filter(l => l.category === 'COLD');
const activeHot = hot.filter(l => l.active);
const won = hot.filter(l => l.status === 'Won');
const lost = hot.filter(l => l.status === 'Lost');
const month = RD.slice(0, 7);
const newThisMonth = leads.filter(l => l.first_contact_date.startsWith(month));
const closedThisMonth = cases.filter(c => (c.closedDate || '').startsWith(month));
const processing = cases.filter(c => c.state !== 'Closed');
const needProduct = won.filter(l => !l.cases.length); // marked Won but nothing on the Cases sheet yet
// after-sales: customers whose products are all closed (fee fully collected)
const afterSales = won.filter(l => l.cases.length && l.cases.every(c => c.state === 'Closed'));
for (const l of afterSales) l.allClosedDate = l.cases.map(c => c.closedDate).sort().at(-1);
const afterSalesDue = afterSales.filter(l => !l.coi_date || !l.telegram_promoted_date);
const RM = n => 'RM ' + Number(n).toLocaleString('en-MY');
// customers who already closed (cases in processing / after-sales) are routine follow-ups: no red marks
// Closed customers (Won) have no next action: only when something was last done for them.
// Last action = the latest of last_action_date and every dated event on their cases, payments and after-sales.
for (const l of won) {
  l.lastActionDate = [l.last_action_date, l.h08_followup_date, l.coi_date, l.telegram_promoted_date,
    ...l.cases.flatMap(c => [c.closed_date, c.processing_date, c.closedDate, ...c.plan.map(p => p.paid_date)])].filter(Boolean).sort().at(-1) || null;
}
const ago = d => { if (!d) return 'no date yet'; const n = days(d, RD); return n <= 0 ? 'today' : n === 1 ? '1 day ago' : n + ' days ago'; };
const follow = leads.filter(l => l.status !== 'Won' && l.next_action_date).sort((a, b) => a.next_action_date.localeCompare(b.next_action_date));
const caseFollow = won.slice().sort((a, b) => (a.lastActionDate || '').localeCompare(b.lastActionDate || '')); // longest ago first
const overdue = follow.filter(l => l.next_action_date < RD);
const today = follow.filter(l => l.next_action_date === RD);
const STUCK = 7;
const stuck = activeHot.filter(l => l.idle >= STUCK).sort((a, b) => b.idle - a.idle);

function catTag(l) {
  if (l.status === 'Won') return h('span', { class: 'tag won' }, 'Won');
  if (l.status === 'Lost') return h('span', { class: 'tag lost' }, 'Lost');
  return h('span', { class: 'tag ' + (l.category === 'HOT' ? 'hot' : 'cold') }, l.category);
}
const stageName = l => l.status === 'Won' && !l.cases.length ? 'Won · no product added yet' : l.status === 'Won' ? 'Closed ' + l.cases.length + (l.cases.length === 1 ? ' product' : ' products')
  : l.category === 'HOT' ? (l.stage ? HOT[l.stage - 1][1] : '—') : (l.coldStep ? COLD[l.coldStep - 1][1] : 'PM only');
// who the case belongs to: your own, or passed on by an agent
function srcTag(l) {
  if (l.category !== 'HOT' && !l.agent) return null;
  return isOwn(l) ? h('span', { class: 'tag own' }, 'Own case') : h('span', { class: 'tag agent' }, 'Agent: ' + l.agent);
}
let sourceFilter = 'All sources';
function sourcePills(list) {
  return Object.keys(SOURCES).map(f => h('button', { class: 'pill src' + (f === sourceFilter ? ' active' : ''), onclick: () => { sourceFilter = f; render(); } }, f + ' (' + list.filter(SOURCES[f]).length + ')'));
}
function caseState(c) {
  return h('span', { class: 'tag ' + (c.state === 'Closed' ? 'won' : 'proc') }, c.state === 'Closed' ? 'Closed' : 'Processing');
}
function instTag(c) {
  if (c.badInstallment) return h('span', { class: 'tag bad', title: 'Installment is only for ' + INSTALLMENT_PRODUCTS.join(', ') }, '! Installment not allowed');
  return c.isInstallment ? h('span', { class: 'tag inst' }, 'Installment') : null;
}
function whenText(d, calm) {
  const n = days(RD, d);
  if (n < 0) return calm ? fmt(d) + ' (' + -n + (n === -1 ? ' day ago)' : ' days ago)') : h('span', { class: 'od' }, '! ' + -n + (n === -1 ? ' day' : ' days') + ' overdue');
  if (n === 0) return calm ? 'Today' : h('span', { class: 'od' }, 'Today');
  return fmt(d) + ' (in ' + n + (n === 1 ? ' day)' : ' days)');
}
function leadRow(l, right) {
  return h('li', { onclick: () => openLead(l) },
    catTag(l),
    h('div', { class: 'grow' }, h('div', null, l.name, ' ', srcTag(l)), h('div', { class: 'sub' }, stageName(l) + ' · ' + l.platform + (l.status === 'Won' ? (l.last_action ? ' · Last: ' + l.last_action : '') : l.next_action ? ' · Next: ' + l.next_action : ''))),
    h('div', { class: 'when' }, right));
}
function pageHead(title, extra) {
  return h('div', { class: 'head' }, h('h1', null, title), h('span', { class: 'rd' }, 'Reporting date ' + fmt(RD)), extra ? h('span', { class: 'muted small' }, extra) : null);
}
function tile(label, value, foot, cls) {
  return h('div', { class: 'tile ' + (cls || '') }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value), h('div', { class: 'foot' }, foot));
}
function funnel(rows, cls) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return h('div', { class: 'funnel' }, rows.flatMap(([label, n, note]) => [
    h('div', { class: 'lbl' }, label),
    h('div', { class: 'bar ' + (cls || '') }, h('i', { style: 'width:' + Math.max(2, n / max * 100) + '%' })),
    h('div', { class: 'v num' }, n, note ? h('small', null, note) : null),
  ]));
}

// ---- pages ----
// ---- game-style Overview helpers (all numbers come from the workbook) ----
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
let gradId = 0;
const addD = (iso, n) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
// how many dated events fall in each of the last n weeks up to the reporting date (oldest first)
function weekly(dates, n = 8, weigh) {
  return Array.from({ length: n }, (_, k) => {
    const to = addD(RD, -7 * (n - 1 - k)), from = addD(to, -6);
    return dates.filter(d => d.date >= from && d.date <= to).reduce((s, d) => s + (weigh ? weigh(d) : 1), 0);
  });
}
function spark(values, color) {
  const w = 120, hgt = 40, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [i * (w / Math.max(1, values.length - 1)), hgt - 4 - (v / max) * (hgt - 10)]);
  const id = 'g' + (++gradId);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return sv('svg', { viewBox: '0 0 ' + w + ' ' + hgt, class: 'spark', 'aria-hidden': 'true' },
    sv('defs', null, sv('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, sv('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 0.45 }), sv('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }))),
    sv('path', { d: line + ' L' + w + ' ' + hgt + ' L0 ' + hgt + ' Z', fill: 'url(#' + id + ')' }),
    sv('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    sv('circle', { cx: pts.at(-1)[0], cy: pts.at(-1)[1], r: 3, fill: color }));
}
// small original line icons
const ICONS = {
  people: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 19c0-3 3-5 6-5s6 2 6 5M14 14.5c2.5-.4 6 1 6 4.5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM15 9l5-5',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.8 2.8L16.5 9.5',
  coins: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v5c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 10v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  flow: 'M10 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4zM12 7v5M5 17v-3h14v3',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  form: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  chat: 'M4 5h16v11H9l-5 4zM8 10h.01M12 10h.01M16 10h.01',
  folder: 'M3 6h6l2 2h10v11H3zM3 10h18',
  bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  shake: 'M3 12l4-4 4 2 3-2 7 4-6 6-3-2-2 2-3-3zM11 10l3 3',
};
const icon = (name, color) => sv('svg', { viewBox: '0 0 24 24', class: 'gicon', 'aria-hidden': 'true' }, sv('path', { d: ICONS[name], fill: 'none', stroke: color || 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
// five tiny monthly bars with month labels, for the compact conversion card
function miniBars(groups) {
  const w = 200, hh = 44, max = Math.max(1, ...groups.map(g => g.values[0])), bw = w / groups.length;
  return sv('svg', { viewBox: '0 0 ' + w + ' ' + (hh + 26), class: 'minibars' },
    groups.map((g, i) => { const v = g.values[0], bh = Math.max(2, v / max * hh), x = i * bw + bw * 0.28;
      return [sv('rect', { x: x.toFixed(1), y: (hh - bh + 10).toFixed(1), width: (bw * 0.44).toFixed(1), height: bh.toFixed(1), rx: 3, fill: v ? '#E9A98E' : 'rgba(120,90,60,0.10)' }),
        v ? sv('text', { x: (x + bw * 0.22).toFixed(1), y: (hh - bh + 6).toFixed(1), 'text-anchor': 'middle', class: 'bar-v' }, v) : null,
        sv('text', { x: (x + bw * 0.22).toFixed(1), y: hh + 24, 'text-anchor': 'middle', class: 'bar-l' }, g.label)]; }));
}
function ring(pct, label, sub) {
  const R = 52, C = 2 * Math.PI * R, id = 'g' + (++gradId);
  return sv('svg', { viewBox: '0 0 140 140', class: 'ring' },
    sv('defs', null, sv('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, sv('stop', { offset: 0, 'stop-color': '#E9A98E' }), sv('stop', { offset: 1, 'stop-color': '#8FB1D9' }))),
    sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: '#EFE5D3', 'stroke-width': 12 }),
    sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: 'url(#' + id + ')', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': (C * Math.min(1, pct / 100)).toFixed(1) + ' ' + C.toFixed(1), transform: 'rotate(-90 70 70)' }),
    sv('text', { x: 70, y: 72, 'text-anchor': 'middle', class: 'ring-v' }, label), sv('text', { x: 70, y: 94, 'text-anchor': 'middle', class: 'ring-s' }, sub));
}
// bars: [{label, values:[...]}], colours per series
function barChart(groups, colors, legend) {
  const w = 360, hgt = 170, max = Math.max(1, ...groups.flatMap(g => g.values)), gw = w / Math.max(1, groups.length), bw = Math.min(26, gw / (colors.length + 1.2));
  return h('div', null,
    legend ? h('div', { class: 'legend' }, legend.map((t, i) => h('span', null, h('i', { style: 'background:' + colors[i] }), t))) : null,
    sv('svg', { viewBox: '0 0 ' + w + ' ' + (hgt + 22), class: 'bars' },
      groups.flatMap((g, gi) => g.values.map((v, si) => {
        const bh = (v / max) * (hgt - 24), x = gi * gw + gw / 2 - (colors.length * bw) / 2 + si * bw + 2, y = hgt - bh;
        return [sv('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (bw - 4).toFixed(1), height: Math.max(1, bh).toFixed(1), rx: 3, fill: colors[si] }),
          sv('text', { x: (x + (bw - 4) / 2).toFixed(1), y: (y - 5).toFixed(1), 'text-anchor': 'middle', class: 'bar-v' }, v)];
      }).concat([sv('text', { x: (gi * gw + gw / 2).toFixed(1), y: hgt + 16, 'text-anchor': 'middle', class: 'bar-l' }, g.label)])),
      sv('line', { x1: 0, y1: hgt, x2: w, y2: hgt, stroke: '#EADFCB' })));
}
function activity(limit = 7) {
  const ev = [];
  for (const l of leads) {
    HOT.forEach(([k, label]) => { if (l[k]) ev.push([l[k], l, label]); });
    COLD.forEach(([k, label]) => { if (l[k]) ev.push([l[k], l, label]); });
    if (l.coi_date) ev.push([l.coi_date, l, 'Converted to COI']);
    if (l.telegram_promoted_date) ev.push([l.telegram_promoted_date, l, 'Telegram group promoted']);
  }
  for (const c of cases) {
    ev.push([c.closed_date, c.lead, 'Closed ' + c.product]);
    if (c.closedDate) ev.push([c.closedDate, c.lead, c.product + ' case closed']);
    for (const p of c.plan) if (p.paid_date) ev.push([p.paid_date, c.lead, 'Installment ' + RM(p.amount) + ' paid']);
  }
  return ev.filter(e => e[0]).sort((a, b) => b[0].localeCompare(a[0])).slice(0, limit);
}
// soft pastel colours, one per step, warm to cool towards closing
const STAGE_COLORS = ['#F7E6BF', '#F8DCCB', '#F5D5CF', '#EFD3E3', '#E6DEF5', '#D6E4F2', '#CFE6E3', '#D8EAD2'];
const STAGE_ICONS = ['phone', 'form', 'chat', 'folder', 'bank', 'bulb', 'calendar', 'shake'];

function overview() {
  const reached = HOT.map(([k], i) => hot.filter(l => l.stage >= i + 1).length);
  const rows = HOT.map(([, label], i) => [label, reached[i], i ? Math.round(reached[i] / Math.max(1, reached[i - 1]) * 100) + '%' : '']);
  rows.push(['Closed (at least 1 product)', won.length, Math.round(won.length / Math.max(1, reached[7]) * 100) + '%']);
  const closeRate = Math.round(won.length / Math.max(1, hot.length) * 100);
  const byPlatform = [...new Set(leads.map(l => l.platform))].map(p => {
    const ls = leads.filter(l => l.platform === p);
    return [p, ls.length, 'HOT ' + ls.filter(l => l.category === 'HOT').length + ' · won ' + ls.filter(l => l.status === 'Won').length];
  }).sort((a, b) => b[1] - a[1]);
  // stat cards with 8-week trends
  const ev = (list, key) => list.filter(x => x[key]).map(x => ({ date: x[key], x }));
  const newLeadsW = weekly(ev(leads, 'first_contact_date'));
  const movesW = weekly(hot.flatMap(l => HOT.map(([k]) => l[k]).filter(Boolean).map(date => ({ date }))));
  const closedW = weekly(cases.filter(c => c.closedDate).map(c => ({ date: c.closedDate })));
  const paid = cases.flatMap(c => c.plan.filter(p => p.paid_date).map(p => ({ date: p.paid_date, amount: Number(p.amount) })));
  const paidW = weekly(paid, 8, d => d.amount);
  const owed = cases.filter(c => c.isInstallment && c.state !== 'Closed').reduce((s, c) => s + c.total - c.paid, 0);
  const statCard = (ic, color, label, value, foot, spk) => h('div', { class: 'gcard stat', style: '--c:' + color }, h('div', { class: 'stat-top' }, h('span', { class: 'gi', style: 'color:' + color }, icon(ic, color)), h('div', null, h('div', { class: 'label' }, label), h('div', { class: 'value num' }, value), h('div', { class: 'foot' }, foot))), spk);
  // conversion by month: customers who closed in each of the last 5 months
  const months = Array.from({ length: 5 }, (_, i) => { const d = new Date(Date.parse(RD.slice(0, 7) + '-01')); d.setUTCMonth(d.getUTCMonth() - (4 - i)); return d.toISOString().slice(0, 7); });
  const wonMonth = l => (l.cases.map(c => c.closed_date).filter(Boolean).sort()[0] || '').slice(0, 7);
  const monthBars = months.map(m => ({ label: MONTHS[Number(m.slice(5)) - 1], values: [won.filter(l => wonMonth(l) === m).length] }));
  // lead sources: total vs closed (top 3 + others)
  const plats = [...new Set(leads.map(l => l.platform))].map(p => ({ p, n: leads.filter(l => l.platform === p).length })).sort((a, b) => b.n - a.n);
  const top = plats.slice(0, 3).map(x => x.p);
  const srcGroups = top.map(p => ({ label: p, values: [leads.filter(l => l.platform === p).length, leads.filter(l => l.platform === p && l.status === 'Won').length] }));
  if (plats.length > 3) srcGroups.push({ label: 'Others', values: [leads.filter(l => !top.includes(l.platform)).length, leads.filter(l => !top.includes(l.platform) && l.status === 'Won').length] });
  // this month
  const wonThisMonth = won.filter(l => wonMonth(l) === RD.slice(0, 7));
  const daysToClose = wonThisMonth.map(l => days(l.first_contact_date, l.cases.map(c => c.closed_date).sort()[0])).filter(n => n >= 0);
  const avgClose = daysToClose.length ? Math.round(daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length) : null;
  const productsThisMonth = cases.filter(c => (c.closed_date || '').startsWith(RD.slice(0, 7))).length;

  return [
    h('div', { class: 'stats' },
      statCard('people', '#7FA6CF', 'Total leads', leads.length, '+' + newThisMonth.length + ' this month', spark(newLeadsW, '#7FA6CF')),
      statCard('target', '#D8975A', 'Active pipeline', activeHot.length, Math.round(activeHot.length / Math.max(1, hot.length) * 100) + '% of HOT leads', spark(movesW, '#D8975A')),
      statCard('check', '#6FB58F', 'Case Closed this month', closedThisMonth.length, processing.length + ' still processing', spark(closedW, '#6FB58F'))),
    h('div', { class: 'gcard pipe-card' }, h('div', { class: 'card-h' }, h('h2', null, h('span', { class: 'gi' }, icon('flow', '#D8975A')), ' Sales pipeline'),
        h('div', { class: 'pipe-meta' }, h('span', null, h('b', { class: 'num' }, activeHot.length), ' active leads'), h('span', { class: 'vsep' }), h('a', { href: '#board', class: 'link' }, 'View board →'))),
      h('div', { class: 'stages' }, HOT.map(([, label], i) => {
        const n = activeHot.filter(l => l.stage === i + 1).length;
        return h('a', { href: '#board', class: 'stage', style: '--sc:' + STAGE_COLORS[i], title: (i + 1) + '. ' + label },
          h('span', { class: 'stage-n' }, (i + 1) + '. ' + label), h('b', { class: 'num' }, n), h('small', { class: 'num' }, Math.round(n / Math.max(1, activeHot.length) * 100) + '%'));
      }))),
    h('div', { class: 'grow3 b' },
      h('div', { class: 'gcard conv-card' }, h('h2', null, 'Lead conversion rate'),
        h('div', { class: 'conv-sq' }, ring(closeRate, closeRate + '%', won.length + ' / ' + hot.length + ' HOT'),
          h('div', { class: 'conv-mini', title: 'Customers closed per month' }, miniBars(monthBars)))),
      h('div', { class: 'gcard' }, h('h2', null, 'Lead source performance'), barChart(srcGroups, ['#8FB1D9', '#E9A98E'], ['Total leads', 'Closed'])),
      h('div', { class: 'gcard' }, h('h2', null, 'This month'),
        h('div', { class: 'month' },
          [['people', newThisMonth.length, 'New leads'], ['check', wonThisMonth.length, 'Customers closed'], ['target', productsThisMonth, 'Products closed'], ['bolt', avgClose == null ? '—' : avgClose + 'd', 'Avg. days to close']]
            .map(([ic, v, t]) => h('div', null, h('span', { class: 'gi gold' }, icon(ic, '#D8975A')), h('b', { class: 'num' }, v), h('small', null, t)))))),

    h('h2', { class: 'section-h' }, 'More details'),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'HOT conversion funnel'), h('p', { class: 'muted small' }, 'How many leads reached each step; the % is how many moved on from the step before.'), funnel(rows)),
      h('div', { class: 'card' },
        h('h2', null, 'Stuck leads'),
        h('p', { class: 'muted small' }, 'Active HOT leads with no progress for ' + STUCK + '+ days.'),
        stuck.length ? h('ul', { class: 'list' }, stuck.slice(0, 8).map(l => leadRow(l, h('span', { class: 'od' }, l.idle + ' days idle')))) : h('p', { class: 'muted' }, 'None.'),
        h('h2', { style: 'margin-top:18px' }, 'Lead sources'),
        funnel(byPlatform, 'cold'))),
    h('div', { class: 'card' }, h('h2', null, 'Own cases and agents'), h('p', { class: 'muted small' }, 'Agent = who brought the customer. ' + OWNER + ' = your own case; anyone else passed the case to you.'),
      h('div', { class: 'tablewrap' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'Agent'), h('th', { class: 'r' }, 'HOT leads'), h('th', { class: 'r' }, 'Active'), h('th', { class: 'r' }, 'Won'), h('th', { class: 'r' }, 'Products closed'), h('th', { class: 'r' }, 'Close rate'))),
        h('tbody', null, [...new Set(hot.map(l => isOwn(l) ? OWNER : l.agent))].sort((a, b) => (b === OWNER) - (a === OWNER) || a.localeCompare(b)).map(a => {
          const ls = hot.filter(l => (isOwn(l) ? OWNER : l.agent) === a);
          const w = ls.filter(l => l.status === 'Won');
          return h('tr', null, h('td', null, a === OWNER ? h('span', { class: 'tag own' }, 'Own case · ' + OWNER) : h('span', { class: 'tag agent' }, a)),
            h('td', { class: 'r num' }, ls.length), h('td', { class: 'r num' }, ls.filter(l => l.active).length), h('td', { class: 'r num' }, w.length),
            h('td', { class: 'r num' }, w.reduce((s, l) => s + l.cases.length, 0)), h('td', { class: 'r num' }, Math.round(w.length / Math.max(1, ls.length) * 100) + '%'));
        }))))),
  ];
}
// ---- Leads: a clean, searchable, sortable table ----
const tbl = { q: '', status: 'All', category: 'All', source: 'All', agent: 'All', sort: 'first', dir: -1 }; // newest leads first
const agentOf = l => (isOwn(l) ? OWNER : l.agent);
// idle: days since anything happened (closed customers: since their last action)
const idleOf = l => (l.status === 'Won' && l.lastActionDate ? Math.max(0, days(l.lastActionDate, RD)) : l.idle);
const actionDate = l => (l.status === 'Won' ? l.lastActionDate : l.next_action_date) || '';
const SORTS = {
  name: l => String(l.name).toLowerCase(), status: l => l.status, stage: l => (l.status === 'Won' ? 20 : l.category === 'HOT' ? 10 + l.stage : l.coldStep),
  source: l => String(l.platform).toLowerCase(), agent: l => String(agentOf(l) || '').toLowerCase(), first: l => l.first_contact_date || '',
  action: l => actionDate(l) || '9999', idle: idleOf,
};
function leadsPage() {
  const opt = (key, values) => h('label', { class: 'fsel' }, h('span', null, key[0].toUpperCase() + key.slice(1)),
    h('select', { onchange: e => { tbl[key] = e.target.value; render(); } }, ['All', ...values].map(v => { const o = h('option', { value: v }, v); if (v === tbl[key]) o.selected = true; return o; })));
  const q = tbl.q.trim().toLowerCase();
  const rows = leads.filter(l => (tbl.status === 'All' || l.status === tbl.status) && (tbl.category === 'All' || l.category === tbl.category)
      && (tbl.source === 'All' || l.platform === tbl.source) && (tbl.agent === 'All' || agentOf(l) === tbl.agent)
      && (!q || [l.name, l.lead_id, l.problem, l.phone, l.platform, l.agent].some(v => String(v || '').toLowerCase().includes(q))))
    .sort((a, b) => { const x = SORTS[tbl.sort](a), y = SORTS[tbl.sort](b); return (x < y ? -1 : x > y ? 1 : 0) * tbl.dir; });
  const th = (key, label, cls) => h('th', { class: 'sortable' + (cls ? ' ' + cls : '') + (tbl.sort === key ? ' on' : ''), onclick: () => { if (tbl.sort === key) tbl.dir = -tbl.dir; else { tbl.sort = key; tbl.dir = 1; } render(); } },
    label, h('span', { class: 'arrow' }, tbl.sort === key ? (tbl.dir > 0 ? ' ▲' : ' ▼') : ''));
  const search = h('input', { type: 'search', id: 'lead-q', placeholder: 'Search name, ID, phone, problem…', value: tbl.q, oninput: e => { tbl.q = e.target.value; render(); const i = document.getElementById('lead-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  const uniq = f => [...new Set(leads.map(f).filter(Boolean))].sort();
  return [h('div', { class: 'newlead' }, btn('+ New lead', openNewLead, 'go')), pageHead('Leads', 'Every lead and customer in one table. Click a row for details.'),
    h('div', { class: 'gcard' },
      h('div', { class: 'tbar' }, search, opt('status', ['Active', 'Won', 'Lost']), opt('category', ['HOT', 'COLD']), opt('source', uniq(l => l.platform)), opt('agent', uniq(agentOf)),
        h('button', { class: 'pill', onclick: () => { Object.assign(tbl, { q: '', status: 'All', category: 'All', source: 'All', agent: 'All' }); render(); } }, 'Clear')),
      h('div', { class: 'tablewrap' }, h('table', { class: 'saas' },
        h('thead', null, h('tr', null, th('name', 'Lead'), th('status', 'Status'), th('stage', 'Stage'), th('source', 'Source'), th('agent', 'Agent'), th('first', 'First contact'), th('action', 'Next / last action'), th('idle', 'Idle', 'r'))),
        h('tbody', null, rows.map(l => h('tr', { onclick: () => openLead(l) },
          h('td', null, h('div', { class: 'nm' }, l.name), h('div', { class: 'sub' }, l.lead_id + (l.problem ? ' · ' + l.problem : ''))),
          h('td', null, catTag(l)),
          h('td', { class: 'small' }, stageName(l)),
          h('td', { class: 'small' }, l.platform),
          h('td', null, srcTag(l)),
          h('td', { class: 'small num' }, fmt(l.first_contact_date)),
          h('td', { class: 'small' }, l.status === 'Won' ? [h('div', null, l.last_action || 'Last action'), h('div', { class: 'sub' }, ago(l.lastActionDate))] : l.next_action ? [h('div', null, l.next_action), h('div', { class: 'sub' }, whenText(l.next_action_date))] : h('span', { class: 'muted' }, '—')),
          h('td', { class: 'r num small' + (l.active && l.idle >= STUCK ? ' od' : '') }, idleOf(l) + 'd')))))),
      h('div', { class: 'tfoot' }, 'Showing ' + rows.length + ' of ' + leads.length + (rows.length !== leads.length ? ' (filtered)' : ''))),
    h('div', { class: 'gcard act-card' }, h('h2', null, h('span', { class: 'gi gold' }, icon('bolt', '#D8975A')), ' Recent activity'),
      h('ul', { class: 'feed' }, activity(12).map(([d, l, what]) => h('li', { onclick: () => l && openLead(l) }, h('span', { class: 'dotg' }), h('small', null, ago(d)), h('span', { class: 'grow' }, what + (l ? ' · ' + l.name : ''))))))];
}
let boardFilter = 'Active';
function board() {
  const bySource = hot.filter(SOURCES[sourceFilter]);
  const shown = bySource.filter(l => boardFilter === 'All' || l.status === boardFilter);
  const filters = h('div', { class: 'filters' }, ['Active', 'Won', 'Lost', 'All'].map(f =>
    h('button', { class: 'pill' + (f === boardFilter ? ' active' : ''), onclick: () => { boardFilter = f; render(); } }, f + ' (' + (f === 'All' ? bySource.length : bySource.filter(l => l.status === f).length) + ')')),
    h('span', { class: 'sep' }), sourcePills(hot.filter(l => boardFilter === 'All' || l.status === boardFilter)));
  const cols = HOT.map(([, label], i) => {
    const ls = shown.filter(l => l.stage === i + 1).sort((a, b) => b.idle - a.idle);
    return h('div', { class: 'col' }, h('h3', null, h('span', null, (i + 1) + '. ' + label), h('span', { class: 'n' }, ls.length)),
      ls.map(l => h('div', { class: 'kcard' + (l.active && l.idle >= STUCK ? ' stuck' : ''), onclick: () => openLead(l) },
        h('div', { class: 'nm' }, l.name),
        h('div', null, srcTag(l)),
        h('div', { class: 'meta' }, l.platform + ' · ' + l.idle + ' days at this step'),
        l.next_action_date ? h('div', { class: 'meta' }, whenText(l.next_action_date)) : null)));
  });
  return [pageHead('Lead board', 'HOT leads by stage; red left edge = idle ' + STUCK + '+ days'), filters, h('div', { class: 'board' }, cols)];
}
let caseFilter = 'All';
function casesPage() {
  const installment = cases.filter(c => c.isInstallment);
  const owing = installment.filter(c => c.state !== 'Closed').sort((a, b) => (b.overduePays.length - a.overduePays.length) || ((a.next && a.next.due_date) || '').localeCompare((b.next && b.next.due_date) || ''));
  const overduePays = installment.flatMap(c => c.overduePays);
  const multi = won.filter(l => l.cases.length > 1);
  const FILTERS = { All: () => true, Processing: c => c.state !== 'Closed', Closed: c => c.state === 'Closed', Installment: c => c.isInstallment };
  const srcCases = cases.filter(c => SOURCES[sourceFilter](c.lead));
  const filters = h('div', { class: 'filters' }, Object.keys(FILTERS).map(f =>
    h('button', { class: 'pill' + (f === caseFilter ? ' active' : ''), onclick: () => { caseFilter = f; render(); } }, f + ' (' + srcCases.filter(FILTERS[f]).length + ')')),
    h('span', { class: 'sep' }), sourcePills(won.filter(l => l.cases.some(FILTERS[caseFilter]))));
  // one block per customer, one line per product they closed
  const customers = won.filter(SOURCES[sourceFilter]).filter(l => l.cases.some(FILTERS[caseFilter]))
    .sort((a, b) => (a.cases.every(c => c.state === 'Closed') - b.cases.every(c => c.state === 'Closed')) || a.cases[0].closed_date.localeCompare(b.cases[0].closed_date));
  const rows = customers.flatMap(l => l.cases.filter(FILTERS[caseFilter]).map((c, i) => h('tr', { class: i ? 'cont' : 'first', onclick: () => openLead(l) },
    h('td', null, i ? '' : h('div', null, h('div', { class: 'nm' }, l.name), h('div', null, srcTag(l)), h('div', { class: 'sub' }, l.lead_id + ' · ' + l.cases.length + (l.cases.length === 1 ? ' product' : ' products') + ' · consultant ' + (l.consultant || OWNER)))),
    h('td', null, prodTag(c.product)),
    h('td', null, caseState(c)),
    h('td', { class: 'num small' }, c.state === 'Closed' ? 'Fee collected ' + fmt(c.closedDate) : c.processing_date ? 'Since ' + fmt(c.processing_date) + ' (' + days(c.processing_date, RD) + ' days)' : 'Closed ' + fmt(c.closed_date)),
    h('td', null, instTag(c), c.isInstallment && c.plan.length ? payBar(c) : null))));
  const prodRows = PRODUCTS.map(p => {
    const cs = cases.filter(c => c.product === p);
    return h('tr', { class: cs.length ? '' : 'zero' }, h('td', null, prodTag(p), INSTALLMENT_PRODUCTS.includes(p) ? h('span', { class: 'muted small' }, ' · installment OK') : null),
      h('td', { class: 'r num' }, cs.filter(c => c.state !== 'Closed').length), h('td', { class: 'r num' }, cs.filter(c => c.state === 'Closed').length), h('td', { class: 'r num' }, cs.filter(c => c.isInstallment).length));
  });
  return [pageHead('Cases', 'From case processing onwards: one line per product a customer closed'),
    needProduct.length ? h('div', { class: 'card warn' }, h('h2', null, '! Won, but no product added yet (' + needProduct.length + ')'),
      h('p', { class: 'muted small' }, 'Add one row per product on the Cases sheet (same lead_id), with closed_date and processing_date.'),
      h('ul', { class: 'list' }, needProduct.map(l => leadRow(l, l.lead_id)))) : null,
    h('div', { class: 'tiles' },
      tile('Cases in processing', processing.length, 'of ' + cases.length + ' cases', 'hero'),
      tile('Case Closed this month', closedThisMonth.length, 'Fee collected'),
      tile('Customers', won.length, multi.length + ' closed more than 1 product'),
      tile('Installment still owed', RM(owing.reduce((s, c) => s + c.total - c.paid, 0)), owing.length + ' cases paying'),
      tile('Installments overdue', overduePays.length, overduePays.length ? RM(overduePays.reduce((s, p) => s + Number(p.amount), 0)) + ' not paid on time' : 'All on time', overduePays.length ? 'alert' : '')),
    h('div', { class: 'card' }, h('h2', null, 'Customers and products'), filters,
      h('div', { class: 'tablewrap' }, h('table', { class: 'cases' }, h('thead', null, h('tr', null, h('th', null, 'Customer'), h('th', null, 'Product'), h('th', null, 'Status'), h('th', null, 'When'), h('th', null, 'Fee'))), h('tbody', null, rows)))),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'By product'),
        h('table', null, h('thead', null, h('tr', null, h('th', null, 'Product'), h('th', { class: 'r' }, 'Processing'), h('th', { class: 'r' }, 'Closed'), h('th', { class: 'r' }, 'Installment'))), h('tbody', null, prodRows))),
      h('div', { class: 'card' }, h('h2', null, 'Installments'), h('p', { class: 'muted small' }, 'The case closes only when the last installment is paid.'),
        h('ul', { class: 'list' }, owing.concat(installment.filter(c => c.state === 'Closed')).map(c => h('li', { onclick: () => openLead(c.lead) },
          h('div', { class: 'grow' }, h('div', null, c.lead.name, ' ', prodTag(c.product)), payBar(c),
            h('div', { class: 'sub' }, c.next ? 'Next: ' + RM(c.next.amount) + (c.plan.at(-1) === c.next ? ' (final)' : '') + ' due ' + fmt(c.next.due_date) : 'Fully paid ' + fmt(c.closedDate))),
          h('div', { class: 'when' }, c.overduePays.length ? h('span', { class: 'od' }, '! ' + c.overduePays.length + ' overdue') : c.next ? whenText(c.next.due_date) : caseState(c)))))))];
}
// paid / total with a small bar
function payBar(c) {
  const pct = c.total ? Math.round(c.paid / c.total * 100) : 0;
  return h('div', { class: 'paybar' }, h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.max(2, pct) + '%' })),
    h('span', { class: 'small num' }, RM(c.paid) + ' / ' + RM(c.total) + ' · ' + c.plan.filter(p => p.paid_date).length + ' of ' + c.plan.length + ' paid'));
}
let afterFilter = 'To do';
function afterSalesPage() {
  const FILTERS = { 'To do': l => !l.coi_date || !l.telegram_promoted_date, Done: l => l.coi_date && l.telegram_promoted_date, All: () => true };
  const coi = afterSales.filter(l => l.coi_date), tg = afterSales.filter(l => l.telegram_promoted_date);
  const waiting = won.filter(l => !afterSales.includes(l));
  const filters = h('div', { class: 'filters' }, Object.keys(FILTERS).map(f =>
    h('button', { class: 'pill' + (f === afterFilter ? ' active' : ''), onclick: () => { afterFilter = f; render(); } }, f + ' (' + afterSales.filter(FILTERS[f]).length + ')')));
  const mark = (d, label) => d ? h('span', { class: 'tag won' }, '✓ ' + label + ' · ' + fmt(d)) : h('span', { class: 'tag proc' }, 'Not yet');
  const rows = afterSales.filter(FILTERS[afterFilter]).sort((a, b) => a.allClosedDate.localeCompare(b.allClosedDate)).map(l => h('tr', { onclick: () => openLead(l) },
    h('td', null, h('div', { class: 'nm' }, l.name), h('div', { class: 'sub' }, l.cases.map(c => [prodTag(c.product), ' ']))),
    h('td', { class: 'num small' }, fmt(l.allClosedDate), h('div', { class: 'sub' }, days(l.allClosedDate, RD) + ' days ago')),
    h('td', null, mark(l.coi_date, 'COI')),
    h('td', null, mark(l.telegram_promoted_date, 'Promoted'))));
  return [pageHead('After-sales', 'After every product is closed: convert the customer to a COI and promote the Telegram group'),
    h('div', { class: 'tiles' },
      tile('After-sales to do', afterSalesDue.length, 'of ' + afterSales.length + ' customers with all cases closed', afterSalesDue.length ? 'alert' : 'hero'),
      tile('Converted to COI', coi.length + ' / ' + afterSales.length, Math.round(coi.length / Math.max(1, afterSales.length) * 100) + '%'),
      tile('Telegram promoted', tg.length + ' / ' + afterSales.length, Math.round(tg.length / Math.max(1, afterSales.length) * 100) + '%'),
      tile('Both done', afterSales.filter(FILTERS.Done).length, 'COI + Telegram'),
      tile('Not ready yet', waiting.length, 'Customers with a case still processing')),
    h('div', { class: 'card' }, h('h2', null, 'Customers'), filters,
      rows.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'cases' }, h('thead', null, h('tr', null, h('th', null, 'Customer'), h('th', null, 'All cases closed'), h('th', null, 'COI'), h('th', null, 'Telegram group'))), h('tbody', null, rows)))
        : h('p', { class: 'muted' }, 'None.'))];
}
function followup() {
  const next7 = follow.filter(l => l.next_action_date > RD && days(RD, l.next_action_date) <= 7);
  const later = follow.filter(l => days(RD, l.next_action_date) > 7);
  const group = (title, ls, calm) => ls.length ? [h('div', { class: 'group-h' }, title + ' (' + ls.length + ')'), h('ul', { class: 'list' }, ls.map(l => leadRow(l, whenText(l.next_action_date, calm))))] : [];
  return [pageHead('Follow-ups', 'Sorted by next-action date'),
    h('div', { class: 'card' }, follow.length ? [group('Overdue', overdue), group('Today', today), group('Next 7 days', next7), group('Later', later)].flat() : h('p', { class: 'muted' }, 'No lead follow-ups.')),
    caseFollow.length ? h('div', { class: 'card' }, h('h2', null, 'Closed customers: last action'), h('p', { class: 'muted small' }, 'No next action for customers who already closed, only how long ago something was last done. Longest ago first.'),
      h('ul', { class: 'list' }, caseFollow.map(l => leadRow(l, h('span', { class: 'muted' }, 'Last action ' + ago(l.lastActionDate)))))) : null];
}
function coldPage() {
  const pool = leads.filter(l => l.c1_telegram_promoted_date || l.category === 'COLD');
  const rows = [['PM only (all COLD leads)', pool.length], ...COLD.map(([k, label]) => [label, pool.filter(l => l[k]).length])];
  const byFreebie = [...new Set(DATA.freebies.map(f => f.freebie))].map(name => {
    const fs = DATA.freebies.filter(f => f.freebie === name);
    const people = [...new Set(fs.map(f => f.lead_id))];
    const up = people.filter(id => leads.find(l => l.lead_id === id)?.c3_upgraded_hot_date);
    return { name, sent: fs.length, people: people.length, up: up.length };
  }).sort((a, b) => b.sent - a.sent);
  const waiting = cold.filter(l => l.next_action).sort((a, b) => a.next_action_date.localeCompare(b.next_action_date));
  return [pageHead('COLD & Telegram', 'Leads without contact details, nurtured into HOT through the Telegram group and freebies'),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'COLD conversion'), funnel(rows, 'cold')),
      h('div', { class: 'card' }, h('h2', null, 'Freebie results'),
        h('table', null, h('thead', null, h('tr', null, h('th', null, 'Freebie'), h('th', { class: 'r' }, 'Sent'), h('th', { class: 'r' }, 'People'), h('th', { class: 'r' }, 'Later HOT'))),
          h('tbody', null, byFreebie.map(f => h('tr', null, h('td', null, f.name), h('td', { class: 'r num' }, f.sent), h('td', { class: 'r num' }, f.people), h('td', { class: 'r num' }, f.up))))))),
    h('div', { class: 'card' }, h('h2', null, 'To promote / remind to join'), waiting.length ? h('ul', { class: 'list' }, waiting.map(l => leadRow(l, whenText(l.next_action_date)))) : h('p', { class: 'muted' }, 'None.'))];
}

// ---- lead drawer ----
function openLead(l) {
  const root = document.getElementById('drawer-root');
  const close = () => { root.replaceChildren(); };
  const steps = (l.c1_telegram_promoted_date ? COLD : []).concat(l.category === 'HOT' ? HOT : (l.c1_telegram_promoted_date ? [] : COLD));
  root.replaceChildren(
    h('div', { class: 'back', onclick: close }),
    h('aside', { class: 'drawer' },
      h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '×'),
      h('h2', null, l.name), catTag(l),
      h('dl', null,
        h('dt', null, 'Lead ID'), h('dd', null, l.lead_id),
        h('dt', null, 'Source'), h('dd', null, l.platform + ', first contact ' + fmt(l.first_contact_date)),
        l.category === 'HOT' || l.agent ? [h('dt', null, 'Agent'), h('dd', null, isOwn(l) ? [OWNER, ' ', srcTag(l)] : srcTag(l)), h('dt', null, 'Consultant'), h('dd', null, l.consultant || OWNER)] : null,
        l.phone ? [h('dt', null, 'Phone'), h('dd', null, l.phone)] : null,
        l.problem ? [h('dt', null, 'Problem'), h('dd', null, l.problem)] : null,
        h('dt', null, 'Now'), h('dd', null, stageName(l)),
        l.status === 'Won' ? [h('dt', null, 'Last action'), h('dd', null, (l.last_action ? l.last_action + ' · ' : '') + (l.lastActionDate ? fmt(l.lastActionDate) + ' (' + ago(l.lastActionDate) + ')' : 'no date yet'))]
          : l.next_action ? [h('dt', null, 'Next'), h('dd', null, l.next_action, ' · ', whenText(l.next_action_date))] : null,
        l.lost_reason ? [h('dt', null, 'Lost because'), h('dd', null, l.lost_reason)] : null),
      h('h3', null, 'Progress'),
      h('ul', { class: 'tl' }, steps.map(([k, label]) => h('li', { class: l[k] ? 'done' : '' }, h('span', { class: 'dot' }), label, h('span', { class: 'd' }, l[k] ? fmt(l[k]) : '')))),
      l.cases.length ? [
        h('h3', { style: 'margin-top:16px' }, 'Products closed'),
        h('ul', { class: 'list' }, l.cases.map(c => h('li', { style: 'cursor:default' },
          h('div', { class: 'grow' }, h('div', null, prodTag(c.product), ' ', instTag(c)),
            h('div', { class: 'sub' }, 'Closed ' + fmt(c.closed_date) + (c.processing_date ? ' · processing ' + fmt(c.processing_date) : '') + (c.closedDate ? ' · fee collected ' + fmt(c.closedDate) : '')),
            c.isInstallment && c.plan.length ? [payBar(c), h('table', { class: 'sched' }, h('tbody', null, c.plan.map(p => h('tr', { class: p.paid_date ? '' : p.due_date < RD ? 'late' : 'due' },
              h('td', null, fmt(p.due_date)), h('td', { class: 'r num' }, RM(p.amount)),
              h('td', { class: 'small' }, p.paid_date ? '✓ paid ' + fmt(p.paid_date) : p.due_date < RD ? '! overdue' : 'due'))))) ] : null),
          caseState(c)))),
        h('h3', { style: 'margin-top:16px' }, 'After-sales'),
        h('ul', { class: 'tl' },
          h('li', { class: l.coi_date ? 'done' : '' }, h('span', { class: 'dot' }), 'Converted to COI', h('span', { class: 'd' }, l.coi_date ? fmt(l.coi_date) : '')),
          h('li', { class: l.telegram_promoted_date ? 'done' : '' }, h('span', { class: 'dot' }), 'Telegram group promoted', h('span', { class: 'd' }, l.telegram_promoted_date ? fmt(l.telegram_promoted_date) : '')))] : null,
      editPanel(l))
  );
}
addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('drawer-root').replaceChildren(); });

// ---- editing on the page (kept in this browser until "Save to Excel") ----
const pad2 = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }; // only a default for date boxes you fill in
function commit(what, reopen) {
  const changes = ((STORE && !STORE.saved && STORE.changes) || []).concat([what]);
  STORE = { data: RAW, changes, saved: false };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); }
  catch (e) { alert('This browser would not keep the change (' + e.message + '). Nothing was changed.'); return; }
  try { if (reopen != null) sessionStorage.setItem('lead-reopen', String(reopen)); } catch (e) {}
  location.reload();
}
const nextId = (rows, key, prefix) => {
  const max = rows.reduce((m, r) => { const x = new RegExp('^' + prefix + '-(\\d+)$').exec(String(r[key] || '')); return x ? Math.max(m, Number(x[1])) : m; }, 0);
  return prefix + '-' + String(max + 1).padStart(4, '0');
};
const ensureCaseId = i => { if (!RAW.cases[i].case_id) RAW.cases[i].case_id = nextId(RAW.cases, 'case_id', 'C'); return RAW.cases[i].case_id; };
// small form helpers
const inp = (type, value, attrs) => h('input', Object.assign({ type, value: value == null ? '' : value, class: 'ein' }, attrs || {}));
const sel = (options, value) => { const s = h('select', { class: 'ein' }, options.map(o => { const op = h('option', { value: o }, o); if (o === value) op.selected = true; return op; })); return s; };
const row = (...kids) => h('div', { class: 'erow' }, kids);
const btn = (label, fn, cls) => h('button', { class: 'ebtn' + (cls ? ' ' + cls : ''), onclick: fn }, label);
const lbl = (text, el) => h('label', { class: 'elbl' }, h('span', null, text), el);
const box = (title, open, ...kids) => { const d = h('details', { class: 'ebox' }, h('summary', null, title), kids); if (open) d.open = true; return d; };

const OTHER = 'Other…';
function suggestNext(l) { return l.category === 'COLD' ? LW.COLD_NEXT[Math.min(l.coldStep, LW.COLD_NEXT.length - 1)] : LW.HOT_NEXT[Math.min(Math.max(l.stage, 1) - 1, LW.HOT_NEXT.length - 1)]; }
function nextPicker(current, suggestion) {
  const choices = LW.NEXT_ACTIONS.slice();
  const known = current && choices.includes(current);
  const s = sel([...choices, OTHER], known ? current : current ? OTHER : suggestion);
  const own = inp('text', known ? '' : (current || ''), { placeholder: 'Type the next action' });
  const sync = () => { own.hidden = s.value !== OTHER; };
  s.addEventListener('change', () => { sync(); if (s.value === OTHER) own.focus(); });
  sync();
  return { el: h('div', { class: 'picker' }, s, own), value: () => (s.value === OTHER ? own.value.trim() : s.value) };
}
function editPanel(l) {
  const L = RAW.leads[l._i];
  const parts = [];
  // 1) move forward
  if (l.status === 'Active' && l.category === 'HOT') {
    const nxt = HOT[l.stage];
    const d1 = inp('date', todayISO());
    if (nxt) parts.push(row(lbl('Step done on', d1), btn('✓ ' + nxt[1], () => { L[nxt[0]] = d1.value; commit(l.name + ': ' + nxt[1], l._i); }, 'go')));
    if (l.stage) parts.push(row(h('span', { class: 'muted small' }, 'Now at: ' + HOT[l.stage - 1][1]), btn('Undo last step', () => { delete L[HOT[l.stage - 1][0]]; commit(l.name + ': undo ' + HOT[l.stage - 1][1], l._i); }, 'ghost')));
  }
  if (l.status === 'Active' && l.category === 'COLD') {
    const nxt = COLD[l.coldStep];
    const d1 = inp('date', todayISO());
    if (nxt && nxt[0] !== 'c3_upgraded_hot_date') parts.push(row(lbl('Done on', d1), btn('✓ ' + nxt[1], () => { L[nxt[0]] = d1.value; commit(l.name + ': ' + nxt[1], l._i); }, 'go')));
    const d2 = inp('date', todayISO());
    parts.push(row(lbl('Gave contact details on', d2), btn('⬆ Upgrade to HOT', () => { L.c3_upgraded_hot_date = d2.value; L.category = 'HOT'; L.h01_phone_date = L.h01_phone_date || d2.value; commit(l.name + ': upgraded to HOT', l._i); }, 'go')));
  }
  // 2) next action (open leads) or last action (closed customers)
  if (l.status === 'Won') {
    const t = inp('text', L.last_action, { placeholder: 'What you did' }), d = inp('date', todayISO());
    parts.push(row(lbl('Last action', t), lbl('Date', d), btn('Save', () => { L.last_action = t.value.trim(); L.last_action_date = d.value; commit(l.name + ': last action', l._i); })));
  } else if (l.status === 'Active') {
    const t = nextPicker(L.next_action, suggestNext(l)), d = inp('date', L.next_action_date || todayISO());
    parts.push(row(lbl('Next action', t.el), lbl('Date', d), btn('Save', () => { const v = t.value(); if (v) L.next_action = v; else delete L.next_action; L.next_action_date = d.value; commit(l.name + ': next action', l._i); })));
  }
  const blocks = [box('Update progress', true, parts.length ? parts : h('p', { class: 'muted small' }, 'Nothing to move forward here.'))];
  // 3) closing: add a product (marks the lead Won)
  if (l.category === 'HOT' && l.status !== 'Lost') {
    const p = sel(PRODUCTS, PRODUCTS[0]), dc = inp('date', todayISO()), dp = inp('date', ''), ins = h('input', { type: 'checkbox' });
    const note = h('span', { class: 'muted small' }, 'Installment is only for ' + INSTALLMENT_PRODUCTS.join(', '));
    blocks.push(box(l.status === 'Won' ? 'Add another product' : 'Closed! Add the product', l.status === 'Active' && l.stage >= 7,
      row(lbl('Product', p), lbl('Closed on', dc), lbl('Processing from', dp)),
      row(h('label', { class: 'echk' }, ins, ' Fee paid by installment'), note),
      row(btn('Add product' + (l.status === 'Won' ? '' : ' and mark Won'), () => {
        if (ins.checked && !INSTALLMENT_PRODUCTS.includes(p.value)) { alert('Installment is only for ' + INSTALLMENT_PRODUCTS.join(', ') + '.'); return; }
        const c = { case_id: nextId(RAW.cases, 'case_id', 'C'), lead_id: L.lead_id, product: p.value, closed_date: dc.value };
        if (dp.value) c.processing_date = dp.value; if (ins.checked) c.installment = 'Yes';
        RAW.cases.push(c);
        if (L.status !== 'Won') { L.status = 'Won'; if (L.next_action) { L.last_action = L.next_action; L.last_action_date = L.next_action_date; delete L.next_action; delete L.next_action_date; } if (!L.h08_followup_date) L.h08_followup_date = dc.value; }
        commit(l.name + ': closed ' + p.value, l._i);
      }, 'go'))));
  }
  // 4) each product: processing, fee, installments
  l.cases.forEach(c => {
    const C = RAW.cases[c._i], items = [];
    if (!c.processing_date) { const d = inp('date', todayISO()); items.push(row(lbl('Processing from', d), btn('Start processing', () => { C.processing_date = d.value; commit(l.name + ': ' + c.product + ' processing', l._i); }))); }
    if (!c.isInstallment && !c.fee_collected_date) { const d = inp('date', todayISO()); items.push(row(lbl('Fee collected on', d), btn('✓ Fee collected (close case)', () => { C.fee_collected_date = d.value; commit(l.name + ': ' + c.product + ' fee collected', l._i); }, 'go'))); }
    if (c.isInstallment) {
      c.plan.filter(pm => !pm.paid_date).forEach(pm => { const d = inp('date', todayISO()); items.push(row(h('span', { class: 'small' }, 'Due ' + fmt(pm.due_date) + ' · ' + RM(pm.amount)), lbl('Paid on', d), btn('✓ Paid', () => { RAW.payments[pm._i].paid_date = d.value; commit(l.name + ': ' + c.product + ' installment paid', l._i); }, 'go'))); });
      const dd = inp('date', ''), am = inp('number', '', { min: 0, step: 50, placeholder: 'RM' });
      items.push(row(lbl('New installment due', dd), lbl('Amount (RM)', am), btn('Add installment', () => {
        if (!dd.value || !(Number(am.value) > 0)) { alert('Fill in the due date and an amount.'); return; }
        RAW.payments.push({ case_id: ensureCaseId(c._i), due_date: dd.value, amount: Number(am.value) });
        commit(l.name + ': ' + c.product + ' installment added', l._i);
      })));
    }
    if (items.length) blocks.push(box(c.product + ' · ' + (c.state === 'Closed' ? 'closed' : 'processing'), true, items));
  });
  // 5) after-sales
  if (l.status === 'Won') {
    const items = [];
    if (!l.coi_date) { const d = inp('date', todayISO()); items.push(row(lbl('On', d), btn('✓ Converted to COI', () => { L.coi_date = d.value; commit(l.name + ': COI', l._i); }, 'go'))); }
    if (!l.telegram_promoted_date) { const d = inp('date', todayISO()); items.push(row(lbl('On', d), btn('✓ Telegram group promoted', () => { L.telegram_promoted_date = d.value; commit(l.name + ': Telegram promoted', l._i); }, 'go'))); }
    if (items.length) blocks.push(box('After-sales', false, items));
  }
  // 6) lost
  if (l.status === 'Active') {
    const r = inp('text', '', { placeholder: 'Why (e.g. no reply)' });
    blocks.push(box('Mark as lost', false, row(lbl('Reason', r), btn('Mark lost', () => { L.status = 'Lost'; L.lost_reason = r.value.trim(); commit(l.name + ': lost', l._i); }, 'warn'))));
  } else if (l.status === 'Lost') {
    blocks.push(box('Reopen', false, row(btn('Reopen this lead', () => { L.status = 'Active'; commit(l.name + ': reopened', l._i); }))));
  }
  // 7) details
  const f = { name: inp('text', L.name), phone: inp('text', L.phone), platform: inp('text', L.platform), agent: inp('text', L.agent || ''), problem: inp('text', L.problem), notes: h('textarea', { class: 'ein', rows: 2 }, L.notes || '') };
  blocks.push(box('Edit details', false,
    row(lbl('Name', f.name), lbl('Phone', f.phone)), row(lbl('Source', f.platform), lbl('Agent (' + OWNER + ' = own case)', f.agent)),
    row(lbl('Problem', f.problem)), row(lbl('Notes', f.notes)),
    row(btn('Save details', () => { for (const k of Object.keys(f)) { const v = f[k].value.trim(); if (v) L[k] = v; else delete L[k]; } commit(l.name + ': details', l._i); }))));
  return h('div', { class: 'edit' }, h('h3', null, 'Update'), blocks);
}

function openNewLead() {
  const root = document.getElementById('drawer-root');
  const close = () => root.replaceChildren();
  const f = { name: inp('text', ''), category: sel(['HOT', 'COLD'], 'HOT'), platform: inp('text', ''), phone: inp('text', ''), problem: inp('text', ''), agent: inp('text', OWNER), first: inp('date', todayISO()), next: nextPicker('', LW.HOT_NEXT[0]), nextd: inp('date', todayISO()) };
  f.category.addEventListener('change', () => { const s = f.next.el.querySelector('select'); if (s.value === LW.HOT_NEXT[0] || s.value === LW.COLD_NEXT[0]) s.value = f.category.value === 'COLD' ? LW.COLD_NEXT[0] : LW.HOT_NEXT[0]; });
  root.replaceChildren(h('div', { class: 'back', onclick: close }), h('aside', { class: 'drawer' },
    h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '×'), h('h2', null, 'New lead'),
    h('div', { class: 'edit' },
      row(lbl('Name', f.name), lbl('HOT / COLD', f.category)), row(lbl('Source', f.platform), lbl('Phone (HOT)', f.phone)),
      row(lbl('Problem', f.problem)), row(lbl('Agent (' + OWNER + ' = own case)', f.agent), lbl('First contact', f.first)),
      row(lbl('Next action', f.next.el), lbl('Date', f.nextd)),
      row(btn('Add lead', () => {
        if (!f.name.value.trim()) { alert('Please fill in a name.'); return; }
        const L = { lead_id: nextId(RAW.leads, 'lead_id', 'L'), name: f.name.value.trim(), platform: f.platform.value.trim(), first_contact_date: f.first.value, category: f.category.value, status: 'Active', agent: f.agent.value.trim() || OWNER, consultant: OWNER };
        if (f.phone.value.trim()) L.phone = f.phone.value.trim(); if (f.problem.value.trim()) L.problem = f.problem.value.trim();
        if (f.category.value === 'HOT') L.h01_phone_date = f.first.value;
        if (f.next.value()) { L.next_action = f.next.value(); L.next_action_date = f.nextd.value; }
        RAW.leads.push(L);
        commit('New lead: ' + L.name, RAW.leads.length - 1);
      }, 'go')))));
}

// ---- Save to Excel ----
const deflateRaw = async raw => new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
// remembers which file Save to Excel writes to (IndexedDB can keep a file handle; localStorage cannot)
const HANDLE_KEY = 'xlsx:' + SRC_NAME;
function handleDb() { return new Promise((ok, no) => { const r = indexedDB.open('lead-dashboard', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); }
async function handleDo(mode, fn) { try { const db = await handleDb(); return await new Promise(ok => { const q = fn(db.transaction('files', mode).objectStore('files')); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); } catch (e) { return null; } }
const handleGet = () => handleDo('readonly', st => st.get(HANDLE_KEY));
const handlePut = fh => handleDo('readwrite', st => st.put(fh, HANDLE_KEY));
const handleDel = () => handleDo('readwrite', st => st.delete(HANDLE_KEY));
async function saveToExcel() {
  const sheets = { Leads: RAW.leads, Cases: RAW.cases, Payments: RAW.payments, Freebies: RAW.freebies };
  const clean = {}, extra = {};
  for (const [sheet, rows] of Object.entries(sheets)) {
    const known = new Set(LW.LAYOUT[sheet].map(c => c[0])), auto = LW.AUTO[sheet] || {};
    extra[sheet] = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => !known.has(k) && !(k in auto));
    clean[sheet] = rows.map(r => { const o = {}; for (const [k, v] of Object.entries(r)) if (!(k in auto) && v !== null && v !== '') o[k] = v; return o; }).filter(o => Object.keys(o).length);
  }
  const files = LW.workbookFiles({ leads: clean.Leads, cases: clean.Cases, payments: clean.Payments, freebies: clean.Freebies, extra,
    title: PRACTICE_FILE ? 'Lead practice workbook (' + SRC_NAME + ')' : 'Lead workbook (' + SRC_NAME + ')',
    subtitle: PRACTICE_FILE ? 'Every name, phone number and problem here is invented practice data.' : 'Your own leads. Keep this file on your computer: it holds personal details and is never uploaded to GitHub.' });
  const blob = new Blob([await LW.zipFiles(files, deflateRaw)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  let how = 'downloaded';
  if (window.showSaveFilePicker) {
    try {
      // after the first save, write straight back to the same file (its handle is kept in this browser)
      let fh = await handleGet();
      if (fh && (await fh.requestPermission({ mode: 'readwrite' })) !== 'granted') fh = null;
      if (!fh) {
        if (!confirm('Next, choose where to save.\n\nGo to: Desktop > Lead Dashboard > data > leads\nPick ' + SRC_NAME + ' and choose Replace. (Do NOT save into Documents.)\n\n\u63a5\u4e0b\u6765\u9009\u62e9\u6587\u4ef6\uff1a\u684c\u9762 > Lead Dashboard > data > leads > ' + SRC_NAME + '\uff0c\u6309 Replace\uff08\u4e0d\u8981\u5b58\u5728 Documents\uff09\u3002\n\nAfter this first time, Save to Excel writes to that file directly.')) return;
        fh = await window.showSaveFilePicker({ id: 'lead-xlsx', startIn: 'desktop', suggestedName: SRC_NAME, types: [{ description: 'Excel workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
        await handlePut(fh);
      }
      const w = await fh.createWritable(); await w.write(blob); await w.close(); how = 'saved';
    } catch (e) {
      if (e.name === 'AbortError') return;
      handleDel();
      alert('Could not write the file (' + e.message + '). If it is open in Excel, close it first. The file will be downloaded instead.');
      how = 'downloaded';
    }
  }
  if (how === 'downloaded') { const a = h('a', { href: URL.createObjectURL(blob), download: SRC_NAME }); document.body.append(a); a.click(); a.remove(); }
  STORE = { data: RAW, changes: (STORE && STORE.changes) || [], saved: true, how };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); } catch (e) {}
  showEditBar();
}
function showEditBar() {
  const bar = document.getElementById('editbar');
  if (!STORE) { bar.hidden = true; return; }
  bar.hidden = false;
  if (STORE.saved) {
    // saved changes stay in this browser so the page keeps showing them until it is rebuilt from the new Excel
    if (STORE.dismissed) { bar.hidden = true; return; }
    bar.replaceChildren(h('span', { class: 'sys-dot' }), h('span', { class: 'grow' }, STORE.how === 'saved' ? 'Saved to Excel. Your changes are in the file now; this page keeps showing them.' : 'Excel downloaded (' + SRC_NAME + '). Move it into the data/leads folder to replace the old one.'),
      btn('Change file', async () => { await handleDel(); saveToExcel(); }, 'ghost'),
      btn('OK', () => { STORE.dismissed = true; try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); } catch (e) {} bar.hidden = true; }, 'ghost'));
    return;
  }
  const n = STORE.changes.length;
  bar.replaceChildren(h('span', { class: 'sys-dot' }), h('span', { class: 'grow', title: STORE.changes.slice(-10).join('\n') }, n + (n === 1 ? ' change' : ' changes') + ' not saved to Excel yet · last: ' + STORE.changes[n - 1]),
    btn('Save to Excel', saveToExcel, 'go'),
    btn('Change file', async () => { await handleDel(); saveToExcel(); }, 'ghost'),
    btn('Undo all', () => { if (confirm('Undo all ' + n + ' changes made on this page? Your Excel file stays as it is.')) { try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); } }, 'ghost'));
}

// ---- router ----
const PAGES = { overview, leads: leadsPage, board, cases: casesPage, aftersales: afterSalesPage, followup, cold: coldPage };
function render() {
  const page = PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
  for (const id of Object.keys(PAGES)) {
    const sec = document.getElementById('p-' + id);
    sec.hidden = id !== page;
    if (id === page) sec.replaceChildren(...PAGES[id]().filter(x => x != null));
  }
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
}
document.getElementById('c-board').textContent = activeHot.length;
document.getElementById('c-leads').textContent = leads.length;
document.getElementById('c-follow').textContent = overdue.length + today.length || ''; // red dot only for leads that still need closing
document.getElementById('c-cases').textContent = processing.length + needProduct.length;
document.getElementById('c-after').textContent = afterSalesDue.length;
document.getElementById('c-cold').textContent = cold.length;
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
render();
showEditBar();
try { const ri = sessionStorage.getItem('lead-reopen'); sessionStorage.removeItem('lead-reopen'); if (ri != null && DATA.leads[Number(ri)]) openLead(DATA.leads[Number(ri)]); } catch (e) {}
</script>
</body>
</html>
`;
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log('Wrote ' + path.relative(root, OUT));
