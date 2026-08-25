# Deskflow funding

Every dollar sponsors give Deskflow, and everywhere it goes.

**[See the ledger →](https://deskflow.github.io/funding/)**

## The promise

**All sponsorship money is spent on Deskflow. None of it is kept by Synergy.**

GitHub needs a company account to pay sponsorship into, and that account belongs to
Synergy (legally, Synergy App Ltd). It holds the money for Deskflow, not as its own.

Synergy or anyone employed by Synergy, are not paid out of it.

It can only be spent on:

- **`payout`** — paying Deskflow contributors
- **`infrastructure`** — code signing certificates, Apple Developer Program, CI, domains
- **`upstream`** — sponsoring projects Deskflow depends on
- **`fees`** — payment and transfer charges

Anything else needs a public issue and agreement first.

Sponsor privately and you are recorded as `anonymous`, never by name.

## The ledger

[`ledger.csv`](ledger.csv) is the record. One line per payment:

```
date,direction,amount_usd,party,category,note
2025-12-31,out,1000.00,KDE e.V.,upstream,2025 total
```

It changes only by pull request, so every change is a public commit that can be diffed,
and someone other than the author has to merge it.

Amounts are US dollars. Anything paid in another currency is converted at the rate on the
day, with the original amount and the rate in the note.

Money coming in is added monthly from the GitHub Sponsors export, once payments have
actually arrived.

The 2025 entries are a reconstruction, compiled after the fact and dated to the year end.
Synergy paid those recipients directly, so the money never passed through a Deskflow
account. Everything from 2026 onward is recorded as it happens.

## Checks

`node build.mjs` checks the ledger and writes the page. CI runs it on every pull request,
and it writes nothing if anything is wrong. It rejects bad dates, unknown categories,
lines with no note, lines entered twice, and any balance below zero.

Nothing here is automated beyond that, and there are no access tokens. Lines are typed in
by hand, because at this size that is less work than maintaining a robot.

<sub>Repo setup: Pages source set to GitHub Actions, and `main` protected so a pull request
and one approval are required.</sub>
