/**
 * Reads ledger.csv, checks it, writes the page. One step on purpose: nothing
 * is written unless every check passes, so a bad ledger cannot be published.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const HEADER = 'date,direction,amount_usd,party,category,note'
const REPO = 'https://github.com/deskflow/funding'
const CATEGORIES = {
  in: ['sponsorship'],
  out: ['payout', 'infrastructure', 'upstream', 'fees'],
}

const round2 = (n) => Math.round(n * 100) / 100
const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const today = new Date().toISOString().slice(0, 10)

// Fields split on commas, except `note`, which takes the rest of the line --
// so notes can contain commas and nothing in the file ever needs quoting.
const [header, ...lines] = readFileSync('ledger.csv', 'utf8').trim().split(/\r?\n/)
if (header !== HEADER) {
  console.error(`ledger.csv has the wrong header:\n  got      ${header}\n  expected ${HEADER}`)
  process.exit(1)
}

const rows = lines.filter(Boolean).map((text, i) => {
  const parts = text.split(',')
  const [date, direction, amount_usd, party, category, ...note] = parts
  return {
    date, direction, amount_usd, party, category,
    note: note.join(','),
    columns: parts.length,
    line: i + 2, // 1-based, past the header, so problems point into the file
  }
})

const problems = []
const seen = new Map()
let received = 0
let spent = 0

for (const row of rows) {
  const bad = (message) => problems.push(`line ${row.line}: ${message}`)

  // Extra commas belong to the note; too few means a column is missing.
  if (row.columns < 6) { bad(`has ${row.columns} columns, expected 6:\n    ${HEADER}`); continue }
  if (!CATEGORIES[row.direction]) { bad(`direction "${row.direction}" must be in or out`); continue }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) bad(`date "${row.date}" is not YYYY-MM-DD`)
  else if (row.date > today) bad(`date ${row.date} is in the future`)

  const usd = Number(row.amount_usd)
  if (!Number.isFinite(usd) || usd <= 0) bad(`amount "${row.amount_usd}" must be a positive number`)
  else if (round2(usd) !== usd) bad(`amount ${row.amount_usd} is not a whole number of cents`)

  if (!CATEGORIES[row.direction].includes(row.category)) {
    bad(`category "${row.category}" is not one of ${CATEGORIES[row.direction].join(', ')}`)
  }

  if (!row.party) bad('no party -- who paid, or who was paid?')
  if (!row.note) bad('no note -- say what this was for')

  // The easy mistake to make by hand, and it silently inflates income.
  const key = [row.date, row.direction, row.amount_usd, row.party, row.category].join('|')
  if (seen.has(key)) bad(`identical to line ${seen.get(key)} -- entered twice?`)
  else seen.set(key, row.line)

  if (row.direction === 'in') received = round2(received + usd)
  else spent = round2(spent + usd)

  // Rows are checked in file order, so keep the file in date order.
  if (received < spent) bad(`balance goes negative (${money(round2(received - spent))}) here`)
}

if (problems.length) {
  console.error(`${problems.length} problem(s) in ledger.csv:\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

const balance = round2(received - spent)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const tr = (r) => `<tr>
<td>${esc(r.date)}<td>${r.direction === 'in' ? 'received' : 'spent'}
<td class=n>${money(Number(r.amount_usd))}<td>${esc(r.party)}<td>${esc(r.category)}<td>${esc(r.note)}`

mkdirSync('site', { recursive: true })
writeFileSync('site/index.html', `<!doctype html>
<html lang=en>
<meta charset=utf-8>
<meta name=viewport content="width=device-width, initial-scale=1">
<title>Deskflow funding</title>
<style>
body { font-family: sans-serif; max-width: 60em; margin: 2em auto; padding: 0 1em; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid #ccc; padding: 0.4em 0.6em; text-align: left; }
.n { text-align: right; }
</style>

<h1>Deskflow funding</h1>

<p>Every dollar sponsors have given Deskflow, and everywhere it has gone.</p>

<p>
Received ${money(received)}<br>
Spent ${money(spent)}<br>
<strong>Left ${money(balance)}</strong>
</p>

${rows.length === 0 ? '<p>Nothing recorded yet.</p>' : `<table>
<tr><th>Date<th>In/out<th class=n>Amount<th>Who<th>What for<th>Note
${rows.map(tr).join('\n')}
</table>`}

<p>
Built from <a href="${REPO}/blob/main/ledger.csv">ledger.csv</a>, which is only ever
changed by pull request, so every change is a public commit that can be diffed.
The <a href="${REPO}#readme">README</a> says what the money may be spent on.
</p>

<p>Generated ${today}.</p>
`)

console.log(`Ledger OK: ${rows.length} rows, balance ${money(balance)}. Wrote site/index.html.`)
