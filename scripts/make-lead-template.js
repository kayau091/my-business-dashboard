// Writes data/leads/Lead_Practice.xlsx: an invented practice workbook for the lead-management
// dashboard (HOT / COLD leads). Every name, phone number and problem in it is made up.
// Run: node scripts/make-lead-template.js
// No libraries: the layout and the .xlsx writer are in scripts/lead-workbook.js (shared with the mockup page).
// The dates are fixed (reporting date 2026-11-14) so the file is the same every time.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { HOT_STAGES, COLD_STEPS, PRODUCTS, INSTALLMENT_PRODUCTS, LAYOUT, AUTO, workbookFiles, zipFiles } from './lead-workbook.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// `--blank <file>` writes the same layout with no rows: a workbook for your own leads.
// `--upgrade <file>` rewrites your own workbook in the latest layout and keeps every row
// (a backup copy is saved next to it first).
const blankAt = process.argv.indexOf('--blank');
const upAt = process.argv.indexOf('--upgrade');
const UPGRADE = upAt !== -1;
const BLANK = blankAt !== -1 || UPGRADE;
const OUT = UPGRADE ? path.resolve(process.argv[upAt + 1] || path.join(root, 'data/leads/My_Leads.xlsx'))
  : BLANK ? path.resolve(process.argv[blankAt + 1] || path.join(root, 'data/leads/My_Leads.xlsx')) : path.join(root, 'data/leads/Lead_Practice.xlsx');
const REPORTING_DATE = '2026-11-14';

// ---------- invented data (seeded, so it never changes) ----------
let seed = 20261114;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const before = (a, b) => a <= b;
// a next-action date near the reporting date (a few already overdue), never before the last step
// a last-action date in the few weeks before the reporting date, never before `since`
const lastDate = since => { const d = addDays(REPORTING_DATE, -int(0, 20)); return d < since ? since : d; };
const nextDate = last => { const d = addDays(REPORTING_DATE, int(-4, 10)); return d < last ? addDays(last, 1) : d; };

const NAMES = ['Ali', 'Mei Ling', 'Kumar', 'Siti', 'Jason', 'Farah', 'Wei Jie', 'Priya', 'Hafiz', 'Grace', 'Ahmad', 'Xin Yi', 'Ravi', 'Nurul', 'Daniel', 'Hui Min', 'Arif', 'Kavitha', 'Ken', 'Aisyah', 'Ming', 'Zul', 'Joanne', 'Suresh', 'Amirah', 'Kok Leong', 'Lina', 'Hakim', 'Shu Fen', 'Vincent', 'Yasmin', 'Raj', 'Eunice', 'Faiz', 'Pei Shan', 'Azlan', 'Rachel', 'Ganesh', 'Liyana', 'Chee Keong'];
const PLATFORMS = ['Facebook', 'Facebook', 'Instagram', 'Instagram', 'TikTok', 'Xiaohongshu'];
const PROBLEMS = ['Too much credit card debt', 'DSR too high, home loan rejected', 'Cannot repay personal loan', 'Wants to consolidate debts', 'Late payments on CCRIS', 'Car loan plus card debt', 'Loan rejected, wants to know why'];
const NEXT_ACTION = ['Send Google Form', 'First call', 'Remind to send documents', 'Bank checking', 'Prepare proposal', 'Set closing appointment', 'Follow up to close'];
const LOST = ['No reply', 'Fee too high', 'Went elsewhere', 'Incomplete documents, gave up', 'Not needed for now'];
const FREEBIES = ['MoneyBuddy DSR report', 'TFG tickets', 'ChatGPT prompt: settle credit card debt yourself', 'Monthly money tips'];

const OWNER = 'Chris';
const AGENTS = ['Wendy (Demo agent)', 'Kelvin (Demo agent)', 'Aina (Demo agent)'];
const UPGRADED = new Set([5, 17, 26]); // examples of COLD leads that later became HOT
// customers who closed, and how many products each closed (so every kind of example is in the file)
const CLOSERS = new Map([[1, 2], [3, 1], [7, 3], [9, 1], [12, 2], [15, 1], [20, 1], [24, 2], [29, 1], [33, 1], [36, 2]]);
const leads = [];
const freebies = [];
const cases = [];
const payments = [];
const firstOfNextMonth = iso => { const [y, m] = iso.split('-').map(Number); return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`; };
const monthDay = (iso, k, day) => { let d = iso; for (let j = 0; j < k; j++) d = firstOfNextMonth(d); return d.slice(0, 8) + String(day).padStart(2, '0'); };
// an installment plan: one row per payment; paid if due by the reporting date (sometimes late or missed)
function addSchedule(c, start, amounts, day, missChance) {
  let missed = false;
  amounts.forEach((amount, k) => {
    const due = monthDay(start, k, day);
    const p = { case_id: c.case_id, due_date: due, amount };
    if (!missed && before(due, REPORTING_DATE)) {
      if (rnd() < missChance) missed = true;
      else { const paid = addDays(due, int(-3, 4)); if (before(paid, REPORTING_DATE)) p.paid_date = paid; }
    }
    payments.push(p);
  });
  return payments.filter(p => p.case_id === c.case_id).every(p => p.paid_date);
}
function planAmounts(total, months) {
  const big = Math.round(total * 0.2 / 100) * 100;
  const rest = total - 2 * big;
  const each = Math.floor(rest / (months - 2) / 100) * 100;
  const list = [big, big, ...Array(months - 3).fill(each)];
  list.push(total - list.reduce((a, b) => a + b, 0));
  return list;
}
for (let i = 0; i < 40; i++) {
  const id = `L-${String(i + 1).padStart(4, '0')}`;
  const first = CLOSERS.has(i) ? addDays('2026-08-10', int(0, 55)) : addDays('2026-09-01', int(0, 72));
  const row = { lead_id: id, name: `${NAMES[i]} (Demo)`, platform: pick(PLATFORMS), first_contact_date: first, status: 'Active' };
  let hotStart = null;
  if (!CLOSERS.has(i) && (UPGRADED.has(i) || rnd() < 0.45)) {
    // COLD: PM only. Some are told about the Telegram group, some join, a few become HOT.
    row.category = 'COLD';
    let d = first;
    const depth = UPGRADED.has(i) ? 3 : int(0, 2);
    for (let s = 0; s < depth; s++) {
      const next = addDays(d, int(1, 7));
      if (!before(next, REPORTING_DATE)) break;
      row[COLD_STEPS[s][0]] = d = next;
    }
    if (row.c2_telegram_joined_date) {
      let fd = row.c2_telegram_joined_date;
      for (let k = int(1, 2); k > 0; k--) {
        fd = addDays(fd, int(2, 10));
        if (!before(fd, REPORTING_DATE)) break;
        freebies.push({ lead_id: id, freebie: pick(FREEBIES), sent_date: fd });
      }
    }
    if (row.c3_upgraded_hot_date) { row.category = 'HOT'; hotStart = row.c3_upgraded_hot_date; }
    else if (!row.c1_telegram_promoted_date) { row.next_action = 'Promote Telegram group'; row.next_action_date = nextDate(first); }
    else if (!row.c2_telegram_joined_date) { row.next_action = 'Remind to join Telegram group'; row.next_action_date = nextDate(row.c1_telegram_promoted_date); }
  } else {
    row.category = 'HOT';
    hotStart = first;
  }
  if (hotStart) {
    // most cases are Chris's own; some are passed on by an agent (invented names)
    row.agent = rnd() < 0.3 ? pick(AGENTS) : OWNER;
    row.consultant = OWNER;
    row.phone =`01${int(0, 9)}-000 ${String(1000 + i).slice(-4)}`;
    row.problem = pick(PROBLEMS);
    let d = hotStart;
    const target = CLOSERS.has(i) ? 8 : int(1, 8);
    let reached = 0;
    for (let s = 0; s < target; s++) {
      const next = s === 0 ? d : addDays(d, int(1, 6));
      if (!before(next, REPORTING_DATE)) break;
      row[HOT_STAGES[s][0]] = d = next;
      reached = s + 1;
    }
    // NEXT_ACTION[k] is the action that leads to stage k + 2 (after reaching stage k + 1)
    const closed = CLOSERS.has(i) && reached === 8;
    if (closed) {
      // Won: one to three products, each its own case with its own processing and fee dates
      row.status = 'Won';
      const n = CLOSERS.get(i);
      const chosen = [];
      while (chosen.length < n) { const p = !chosen.length && rnd() < 0.6 ? pick(INSTALLMENT_PRODUCTS) : pick(PRODUCTS); if (!chosen.includes(p)) chosen.push(p); }
      const closedOn = addDays(d, int(0, 3));
      let allDone = true; let lastFee = closedOn;
      for (const product of chosen) {
        const c = { case_id: `C-${String(cases.length + 1).padStart(4, '0')}`, lead_id: id, product, closed_date: closedOn };
        const proc = addDays(closedOn, int(1, 5));
        if (before(proc, REPORTING_DATE)) c.processing_date = proc;
        if (INSTALLMENT_PRODUCTS.includes(product) && rnd() < 0.6) {
          // installment: closed only when the last payment is paid
          c.installment = 'Yes';
          const paidUp = addSchedule(c, proc, planAmounts(pick([6000, 9000, 12000, 15000]), int(3, 6)), int(1, 28), 0.15);
          const last = payments.filter(p => p.case_id === c.case_id).at(-1);
          if (paidUp && last.paid_date > lastFee) lastFee = last.paid_date;
          if (!paidUp) allDone = false;
        } else {
          const fee = addDays(proc, int(7, 35));
          if (c.processing_date && before(fee, REPORTING_DATE)) { c.fee_collected_date = fee; if (fee > lastFee) lastFee = fee; } else allDone = false;
        }
        cases.push(c);
      }
      if (allDone) {
        // after-sales: COI and Telegram are tracked separately
        const coi = addDays(lastFee, int(1, 8)); const tg = addDays(lastFee, int(0, 5));
        if (before(coi, REPORTING_DATE) && rnd() < 0.55) row.coi_date = coi;
        if (before(tg, REPORTING_DATE) && rnd() < 0.7) row.telegram_promoted_date = tg;
        // closed customers have no next action, only what was last done and when
        if (rnd() < 0.5) { row.last_action = 'Checked in after case closed'; row.last_action_date = lastDate(lastFee); }
      } else { row.last_action = pick(['Called bank about the case', 'Updated customer on progress', 'Sent documents to bank']); row.last_action_date = lastDate(closedOn); }
    } else if (reached >= 2 && rnd() < 0.2) { row.status = 'Lost'; row.lost_reason = pick(LOST); }
    else { row.next_action = reached === 8 ? 'Follow up to close' : NEXT_ACTION[reached - 1]; row.next_action_date = nextDate(d); }
  }
  if (i % 7 === 3) row.notes = 'Practice data: all invented';
  leads.push(row);
}
// A long installment plan, shaped like a real one: 6k, 6k, 3.6k x 4, 800 x 2, final 1.1k.
{
  const row = { lead_id: 'L-0041', name: 'Natalie (Demo)', platform: 'Facebook', first_contact_date: '2026-01-19', category: 'HOT', status: 'Won', agent: AGENTS[0], consultant: OWNER,
    phone: '012-000 1040', problem: 'Too much credit card debt', notes: 'Practice data: installment example' };
  ['2026-01-19', '2026-01-20', '2026-01-23', '2026-01-28', '2026-02-02', '2026-02-06', '2026-02-12', '2026-02-16'].forEach((d, k) => { row[HOT_STAGES[k][0]] = d; });
  const c = { case_id: `C-${String(cases.length + 1).padStart(4, '0')}`, lead_id: row.lead_id, product: 'BCS', closed_date: '2026-02-18', processing_date: '2026-02-20', installment: 'Yes', notes: 'Final payment in November' };
  cases.push(c);
  ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].forEach((m, k) => {
    const amount = [6000, 6000, 3600, 3600, 3600, 3600, 800, 800, 1100][k];
    const due = `${m}-25`;
    payments.push({ case_id: c.case_id, due_date: due, amount, ...(before(due, REPORTING_DATE) ? { paid_date: addDays(due, k % 3 - 1) } : {}) });
  });
  row.last_action = 'Reminded about the final installment (RM 1,100)'; row.last_action_date = '2026-11-10';
  leads.push(row);
}
if (BLANK) { leads.length = 0; cases.length = 0; payments.length = 0; freebies.length = 0; }

// extra columns you added yourself are kept, at the end of their sheet
const EXTRA = { Leads: [], Cases: [], Payments: [], Freebies: [] };
if (UPGRADE) {
  const { existsSync, copyFileSync } = await import('node:fs');
  if (!existsSync(OUT)) { console.error(`Not found: ${OUT}`); process.exit(1); }
  if (existsSync(path.join(path.dirname(OUT), '~$' + path.basename(OUT)))) {
    console.error('The workbook is open in Excel. Close it first (so your later save does not undo the upgrade), then run this again.');
    process.exit(1);
  }
  let n = 1; let backup;
  do { backup = OUT.replace(/\.xlsx$/i, `.backup-${n}.xlsx`); n++; } while (existsSync(backup));
  copyFileSync(OUT, backup);
  const { default: readXlsx } = await import('read-excel-file/node');
  const old = await readXlsx(OUT);
  const toIso = v => (v instanceof Date ? v.toISOString().slice(0, 10) : v);
  const target = { Leads: leads, Cases: cases, Payments: payments, Freebies: freebies };
  for (const [sheet, list] of Object.entries(target)) {
    const s = old.find(x => x.sheet === sheet);
    if (!s || !s.data.length) continue;
    const head = s.data[0].map(h => String(h ?? '').trim());
    const known = new Set(LAYOUT[sheet].map(c => c[0]));
    EXTRA[sheet] = head.filter(h => h && !known.has(h));
    for (const r of s.data.slice(1)) {
      const row = {};
      head.forEach((h, i) => { if (h && !(AUTO[sheet] && h in AUTO[sheet]) && r[i] !== null && r[i] !== '') row[h] = toIso(r[i]); });
      // closed customers keep no next action: move it to "last action" (what was last done)
      if (sheet === 'Leads' && String(row.status || '').trim().toLowerCase() === 'won' && row.next_action && !row.last_action && !row.last_action_date) {
        row.last_action = row.next_action; row.last_action_date = row.next_action_date;
        delete row.next_action; delete row.next_action_date;
      }
      if (Object.keys(row).length) list.push(row);
    }
  }
  console.log(`Backup saved: ${path.relative(root, backup)}`);
}

const files = workbookFiles({
  leads, cases, payments, freebies, extra: EXTRA,
  title: BLANK ? `Lead workbook (${path.basename(OUT)})` : 'Lead practice workbook (Lead_Practice.xlsx)',
  subtitle: BLANK ? 'Your own leads. Keep this file on your computer: it holds personal details and is never uploaded to GitHub.' : `Every name, phone number and problem here is invented practice data. Reporting date: ${REPORTING_DATE}.`,
});
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, await zipFiles(files, async raw => deflateRawSync(raw)));
const count = s => leads.filter(r => r.category === s).length;
console.log(`Wrote ${path.relative(root, OUT)}: ${leads.length} leads (HOT ${count('HOT')}, COLD ${count('COLD')}), ${cases.length} cases, ${payments.length} installment payments, ${freebies.length} freebies.`);
