// The lead workbook layout and a small .xlsx writer, shared by:
//  - scripts/make-lead-template.js (Node: practice / blank / upgraded workbooks)
//  - the lead mockup page (browser: "Save to Excel")
// Plain JavaScript with no imports, so the page can embed this file as it is.
// Compression is passed in (Node zlib or the browser's CompressionStream).

export const HOT_STAGES = [
  ['h01_phone_date', 'Phone number received'],
  ['h02_form_sent_date', 'Google Form sent'],
  ['h03_call_date', 'First call stage'],
  ['h04_docs_date', 'Docs collection stage'],
  ['h05_checking_date', 'Bank Checking stage'],
  ['h06_proposal_date', 'Proposal stage'],
  ['h07_appointment_date', 'Appointment stage'],
  ['h08_followup_date', 'Follow up & closing'],
];
// What a customer can close. One customer may close several at once: one row each on the Cases sheet.
export const PRODUCTS = ['BCS', 'BCS settlement', 'CCS', 'Goal Loan', 'Home Fin', 'SME Loan', 'Fin Account', 'Card Master', 'Biz Assist', 'Financial Workshop'];
// Only these products may have their fee paid by installment.
export const INSTALLMENT_PRODUCTS = ['BCS', 'BCS settlement', 'CCS'];
// Choices for "next action". HOT_NEXT[k] is what comes after HOT step k+1; COLD_NEXT[k] after COLD step k.
export const HOT_NEXT = ['Send Google Form', 'First call', 'Remind to send documents', 'Bank checking', 'Prepare proposal', 'Set closing appointment', 'Follow up to close'];
export const COLD_NEXT = ['Promote Telegram group', 'Remind to join Telegram group', 'Send freebie'];
export const OTHER_NEXT = ['WhatsApp follow-up', 'Call back'];
export const NEXT_ACTIONS = [...HOT_NEXT, ...COLD_NEXT, ...OTHER_NEXT];
export const COLD_STEPS = [
  ['c1_telegram_promoted_date', 'Telegram group promoted'],
  ['c2_telegram_joined_date', 'Joined Telegram group'],
  ['c3_upgraded_hot_date', 'Upgraded to HOT'],
];
export const LEAD_COLUMNS = [
  ['lead_id', 'Lead ID, must be unique', 'L-0001'],
  ['name', 'Name', 'Ali (Demo)'],
  ['platform', 'Where the lead came from', 'Facebook / Instagram / TikTok / Xiaohongshu'],
  ['first_contact_date', 'Date of first contact', '2026-11-01'],
  ['category', 'HOT = willing to share personal details and problems; COLD = just curious, no contact details left', 'HOT / COLD'],
  ['status', 'Active = still in steps 1-8; Won = closed at least one product (see the Cases sheet); Lost', 'Active / Won / Lost'],
  ['agent', 'Who brought this customer. Your own case: Chris. Passed to you by an agent: that agent\'s name', 'Chris / Wendy'],
  ['consultant', 'Who handles the case (usually Chris)', 'Chris'],
  ['phone', 'Phone (HOT leads only)', '012-000 0001'],
  ['problem', 'Short description of the problem', 'Credit card debt'],
  ['next_action', 'What to do next (leads not yet closed; leave blank once Won). Pick from the list or type your own', 'First call'],
  ['next_action_date', 'Date of the next action (leads not yet closed)', '2026-11-16'],
  ['last_action', 'Closed customers (Won): what you last did for them', 'Called bank about BCS'],
  ['last_action_date', 'Closed customers (Won): when you last did it; the dashboard shows how long ago. Optional: case, payment and after-sales dates count too', '2026-11-16'],
  ['lost_reason', 'Why the lead was lost (lost leads only)', 'No reply'],
  ['notes', 'Notes', ''],
  ...HOT_STAGES.map(([id, label], i) => [id, 'HOT step ' + (i + 1) + ' "' + label + '": the date it was reached (leave blank until then)', '']),
  ['coi_date', 'After-sales: the date this customer was converted to a COI (centre of influence)', '2026-11-12'],
  ['telegram_promoted_date', 'After-sales: the date the Telegram group was promoted to this customer', '2026-11-12'],
  ...COLD_STEPS.map(([id, label]) => [id, 'COLD "' + label + '": the date', '']),
];
export const CASE_COLUMNS = [
  ['case_id', 'Case ID, must be unique (one row per product a customer closed)', 'C-0001'],
  ['lead_id', 'The lead ID from the Leads sheet (pick from the list)', 'L-0002'],
  ['customer', 'Filled in automatically from the Leads sheet: do not type here', ''],
  ['product', 'Product closed (pick from the list)', PRODUCTS.join(' / ')],
  ['closed_date', 'Date this product was closed with the customer', '2026-10-26'],
  ['processing_date', 'Date case processing started', '2026-10-28'],
  ['fee_collected_date', 'Date the full fee was collected; the case is closed only then. Leave blank for installment cases: they close when the last payment on the Payments sheet is paid', '2026-11-10'],
  ['installment', 'Yes = the fee is paid by installment (only for ' + INSTALLMENT_PRODUCTS.join(', ') + '); list every payment on the Payments sheet', 'Yes / blank'],
  ['notes', 'Notes', ''],
];
export const PAYMENT_COLUMNS = [
  ['case_id', 'The case ID from the Cases sheet, installment cases only (pick from the list)', 'C-0002'],
  ['customer', 'Filled in automatically from the Cases sheet: do not type here', ''],
  ['product', 'Filled in automatically from the Cases sheet: do not type here', ''],
  ['due_date', 'When this installment is due', '2026-03-05'],
  ['amount', 'Amount of this installment in RM (numbers only)', '6000'],
  ['paid_date', 'Date it was paid (blank = not paid yet)', '2026-03-04'],
];
export const FREEBIE_COLUMNS = [
  ['lead_id', 'The lead ID from the Leads sheet (pick from the list)', 'L-0005'],
  ['name', 'Filled in automatically from the Leads sheet: do not type here', ''],
  ['freebie', 'What was given', 'MoneyBuddy DSR report'],
  ['sent_date', 'Date it was sent', '2026-11-10'],
];
export const LAYOUT = { Leads: LEAD_COLUMNS, Cases: CASE_COLUMNS, Payments: PAYMENT_COLUMNS, Freebies: FREEBIE_COLUMNS };
// Columns Excel fills in itself (looked up by ID); {r} is the row number. Never stored as data.
export const AUTO = {
  Cases: { customer: 'IFERROR(INDEX(Leads!$B:$B,MATCH($B{r},Leads!$A:$A,0)),"")' },
  Payments: { customer: 'IFERROR(INDEX(Cases!$C:$C,MATCH($A{r},Cases!$A:$A,0)),"")', product: 'IFERROR(INDEX(Cases!$D:$D,MATCH($A{r},Cases!$A:$A,0)),"")' },
  Freebies: { name: 'IFERROR(INDEX(Leads!$B:$B,MATCH($A{r},Leads!$A:$A,0)),"")' },
};
const AUTO_ROWS = 500; // formulas are ready on this many rows

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colName = n => { let s = ''; for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const excelSerial = iso => (Date.parse(iso + 'T00:00:00Z') - Date.UTC(1899, 11, 30)) / 86400000;
const isDateCol = id => id.endsWith('_date');

// style 0 = normal, 1 = date (yyyy-mm-dd), 2 = bold header, 3 = number, 4 = grey italic (filled in automatically)
function sheetXml(columns, rows, widths, lists, auto) {
  lists = lists || {}; auto = auto || {};
  const cell = (r, c, v, id) => {
    const ref = colName(c) + r;
    if (id && auto[id]) return '<c r="' + ref + '" t="str" s="4"><f>' + esc(auto[id].replace(/\{r\}/g, r)) + '</f></c>';
    if (v === undefined || v === null || v === '') return '';
    if (id && isDateCol(id) && /^\d{4}-\d{2}-\d{2}$/.test(v)) return '<c r="' + ref + '" s="1"><v>' + excelSerial(v) + '</v></c>';
    if (typeof v === 'number') return '<c r="' + ref + '" s="3"><v>' + v + '</v></c>';
    if (typeof v === 'boolean') return '<c r="' + ref + '" t="b"><v>' + (v ? 1 : 0) + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr"' + (id ? '' : ' s="2"') + '><is><t>' + esc(v) + '</t></is></c>';
  };
  const head = '<row r="1">' + columns.map((c, i) => cell(1, i, c, null)).join('') + '</row>';
  const n = Object.keys(auto).length ? Math.max(rows.length, AUTO_ROWS) : rows.length;
  const body = Array.from({ length: n }, (_, ri) => '<row r="' + (ri + 2) + '">' + columns.map((c, i) => cell(ri + 2, i, (rows[ri] || {})[c], c)).join('') + '</row>').join('');
  const cols = '<cols>' + columns.map((c, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + ((widths && widths[i]) || (auto[c] ? 22 : isDateCol(c) ? 13 : Math.max(12, c.length + 2))) + '" customWidth="1"' + (isDateCol(c) ? ' style="1"' : c === 'amount' ? ' style="3"' : '') + '/>').join('') + '</cols>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + cols + '<sheetData>' + head + body + '</sheetData>' + validations(columns, lists) + '</worksheet>';
}
// drop-down lists in Excel, rows 2-2000: a fixed list (e.g. product names) or a range on another sheet (e.g. the lead IDs)
function validations(columns, lists) {
  const v = Object.entries(lists).filter(([col]) => columns.includes(col)).map(([col, values]) => {
    const L = colName(columns.indexOf(col));
    const list = Array.isArray(values) ? values : values && values.values;
    const strict = Array.isArray(values); // a fixed list blocks other text; { values, allowOther } only suggests
    const f = list ? '"' + esc(list.join(',')) + '"' : esc(values);
    return '<dataValidation type="list" allowBlank="1" showErrorMessage="' + (strict ? 1 : 0) + '" sqref="' + L + '2:' + L + '2000"><formula1>' + f + '</formula1></dataValidation>';
  });
  return v.length ? '<dataValidations count="' + v.length + '">' + v.join('') + '</dataValidations>' : '';
}
function guideXml(title, subtitle) {
  const lines = [
    [title],
    [subtitle],
    ['How to use: one row per lead on the Leads sheet. When a lead reaches a step, fill in that step\'s date; the dashboard takes the last filled date as the current stage.'],
    ['When a customer closes, add one row per product on the Cases sheet (a customer can close several products at once) and set the lead\'s status to Won. Pick the lead_id from the list; the customer\'s name then appears by itself (grey columns are filled in automatically).'],
    ['Installment cases: put every payment on the Payments sheet (due date, amount, paid date). The case closes only when every payment is paid. After-sales (COI, Telegram group) is per customer on the Leads sheet.'],
    [''],
    ['Sheet', 'Column', 'Meaning', 'Example'],
    ...LEAD_COLUMNS.map(([id, desc, ex]) => ['Leads', id, desc, ex]),
    ...CASE_COLUMNS.map(([id, desc, ex]) => ['Cases', id, desc, ex]),
    ...PAYMENT_COLUMNS.map(([id, desc, ex]) => ['Payments', id, desc, ex]),
    ...FREEBIE_COLUMNS.map(([id, desc, ex]) => ['Freebies', id, desc, ex]),
  ];
  const rows = lines.map((l, r) => '<row r="' + (r + 1) + '">' + l.map((v, c) => v === '' ? '' : '<c r="' + colName(c) + (r + 1) + '" t="inlineStr"' + (r === 0 || r === 6 ? ' s="2"' : '') + '><is><t>' + esc(v) + '</t></is></c>').join('') + '</row>').join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="26" customWidth="1"/><col min="3" max="3" width="70" customWidth="1"/><col min="4" max="4" width="36" customWidth="1"/></cols><sheetData>' + rows + '</sheetData></worksheet>';
}

// All the XML files of the workbook, as { path: text }.
// data = { leads, cases, payments, freebies, extra: { Leads: [...], ... }, title, subtitle }
export function workbookFiles(data) {
  const extra = data.extra || {};
  const cols = (sheet, list) => list.map(c => c[0]).concat(extra[sheet] || []);
  const SHEETS = [
    ['Leads', sheetXml(cols('Leads', LEAD_COLUMNS), data.leads || [], null, { category: ['HOT', 'COLD'], status: ['Active', 'Won', 'Lost'], next_action: { values: NEXT_ACTIONS, allowOther: true } })],
    ['Cases', sheetXml(cols('Cases', CASE_COLUMNS), data.cases || [], [10, 10, 22, 20, 13, 15, 18, 12, 24], { lead_id: 'Leads!$A$2:$A$2000', product: PRODUCTS, installment: ['Yes'] }, AUTO.Cases)],
    ['Payments', sheetXml(cols('Payments', PAYMENT_COLUMNS), data.payments || [], [10, 22, 18, 13, 12, 13], { case_id: 'Cases!$A$2:$A$2000' }, AUTO.Payments)],
    ['Freebies', sheetXml(cols('Freebies', FREEBIE_COLUMNS), data.freebies || [], [12, 22, 34, 13], { lead_id: 'Leads!$A$2:$A$2000' }, AUTO.Freebies)],
    ['Guide', guideXml(data.title || 'Lead workbook', data.subtitle || '')],
  ];
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + SHEETS.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + SHEETS.map(([name], i) => '<sheet name="' + esc(name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + SHEETS.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (SHEETS.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF7F7F7F"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf/><xf numFmtId="164" applyNumberFormat="1"/><xf fontId="1" applyFont="1"/><xf numFmtId="3" applyNumberFormat="1"/><xf fontId="2" applyFont="1"/></cellXfs></styleSheet>',
  };
  SHEETS.forEach(([, xml], i) => { files['xl/worksheets/sheet' + (i + 1) + '.xml'] = xml; });
  return files;
}

// CRC-32, as zip needs it
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

// A zip file (the .xlsx container) from { path: text }. deflateRaw(Uint8Array) -> Promise<Uint8Array>.
export async function zipFiles(files, deflateRaw) {
  const enc = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  const u16 = (v, a, o) => { a[o] = v & 255; a[o + 1] = (v >>> 8) & 255; };
  const u32 = (v, a, o) => { a[o] = v & 255; a[o + 1] = (v >>> 8) & 255; a[o + 2] = (v >>> 16) & 255; a[o + 3] = (v >>> 24) & 255; };
  for (const [name, text] of Object.entries(files)) {
    const nameB = enc.encode(name), raw = enc.encode(text), data = await deflateRaw(raw), crc = crc32(raw);
    const h = new Uint8Array(30);
    u32(0x04034b50, h, 0); u16(20, h, 4); u16(0x0800, h, 6); u16(8, h, 8); u32(0, h, 10); u32(crc, h, 14); u32(data.length, h, 18); u32(raw.length, h, 22); u16(nameB.length, h, 26); u16(0, h, 28);
    parts.push(h, nameB, data);
    const c = new Uint8Array(46);
    u32(0x02014b50, c, 0); u16(20, c, 4); u16(20, c, 6); u16(0x0800, c, 8); u16(8, c, 10); u32(0, c, 12); u32(crc, c, 16); u32(data.length, c, 20); u32(raw.length, c, 24); u16(nameB.length, c, 28); u32(offset, c, 42);
    central.push(c, nameB);
    offset += 30 + nameB.length + data.length;
  }
  const cdSize = central.reduce((s, b) => s + b.length, 0);
  const end = new Uint8Array(22);
  const count = Object.keys(files).length;
  u32(0x06054b50, end, 0); u16(count, end, 8); u16(count, end, 10); u32(cdSize, end, 12); u32(offset, end, 16);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((s, b) => s + b.length, 0));
  let p = 0; for (const b of all) { out.set(b, p); p += b.length; }
  return out;
}
