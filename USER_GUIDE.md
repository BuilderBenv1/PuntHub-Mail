# PuntHub Mail — User Guide

A self-hosted email marketing platform built on Next.js, Supabase, and Resend.
This guide covers everything you can do from the dashboard, plus the workflows
that matter most day-to-day. Written for operators, not developers.

---

## Table of contents

1. [Login & dashboard](#login--dashboard)
2. [Core concepts](#core-concepts)
3. [Subscribers](#subscribers)
4. [Lists (Tags)](#lists-tags)
5. [Segments](#segments)
6. [Campaigns](#campaigns)
7. [Re-send to non-openers](#re-send-to-non-openers)
8. [Automations](#automations)
9. [Templates](#templates)
10. [Forms](#forms)
11. [Landing pages](#landing-pages)
12. [API keys](#api-keys)
13. [Merge tags (personalization)](#merge-tags-personalization)
14. [Dormant cleanup](#dormant-cleanup)
15. [Deliverability checklist](#deliverability-checklist)
16. [Troubleshooting](#troubleshooting)

---

## Login & dashboard

Visit your deployment URL (e.g. `https://mailsender.punthub.co.uk`) and sign in
with the email/password issued to you. Multiple users can be logged in
simultaneously.

The **Dashboard** shows headline stats — total subscribers, active vs.
unsubscribed, recent send activity, open/click trends.

To add another user: in Supabase → **Authentication → Users → Add user**.
Tick **Auto Confirm User**. New users immediately have full dashboard access
(there are no per-user permissions).

---

## Core concepts

Three things you'll work with constantly:

- **Subscriber** — one row per email address. Has a status (`active`,
  `pending`, `unsubscribed`, `bounced`, `complained`, `dormant`).
- **List (Tag)** — a manual grouping. A subscriber can be on many lists.
  Used when sending campaigns: pick "Include Lists" and "Exclude Lists".
- **Segment** — a dynamic, rule-based grouping. Re-evaluates every time
  it's used. Can filter on opens, clicks, dates, engagement score, list
  membership. Useful for things like "anyone who opened my last campaign".

The "list vs segment" rule of thumb: if the group is fixed (e.g. "Newsletter
signups"), use a List. If the group is dynamic (e.g. "Highly engaged in
last 30 days"), use a Segment.

---

## Subscribers

The Subscribers page is the master view of your contacts. You can:

- **Filter** by list, status, or email search
- **Add** a single subscriber (manual entry)
- **Import CSV** for bulk uploads — see Import below
- **Click a row** to open the side panel with full subscriber details:
  email history, open/click counts, current lists, status, last opened date,
  engagement score
- **Edit** name, email, status, and list membership from the side panel
- **Unsubscribe** or **delete** from the side panel

### CSV import

Click **Import CSV**. The CSV must have a header row. Expected columns:
- `email` (required)
- `name` (optional)
- `status` (optional — defaults to `active`)

You can map any of your CSV columns to subscriber fields. You can also
assign the entire import to one or more lists during the import flow.

Imports run server-side in batches; large files (10k+) may take a minute or
two. The UI shows progress.

### Engagement score

Each subscriber has an `engagement_score` from 0–100 that's updated by a
nightly cron job. It's a rough quality signal — high score = active opener
and clicker. Use it in segment rules to target "highly engaged" subs.

---

## Lists (Tags)

Lists are simple, named groupings. Go to **Lists** to create, rename, or
delete them. Each list shows:
- **Name** (clickable — opens the filtered subscriber view)
- **List ID** with a **Copy** button (for API integrations)
- **Subscriber count** (active subscribers only)

You'll attach subscribers to lists in several ways:
- Manually from a subscriber's side panel
- During CSV import
- Via a signup form (form has tag_ids attached)
- Programmatically via the v1 API

### How lists feed into sending

When you create a campaign, you pick **Include Lists** (recipients are anyone
on any included list) and **Exclude Lists** (subtract anyone on any excluded
list). This is OR-include, OR-exclude — the union of includes minus the
union of excludes.

---

## Segments

Go to **Segments → New Segment**. Add one or more rules. **All rules must
match** (AND logic) for a subscriber to be in the segment.

Available rule fields:
- **Status** equals `active` / `unsubscribed` / etc.
- **Engagement Score** greater than / less than N
- **List (Tag)** has tag — subscriber is on this list
- **Last Opened At** after / before a date
- **Created At** after / before a date
- **Opened Campaign** is — subscriber opened a specific campaign
- **Clicked Campaign** is — subscriber clicked a link in a specific campaign

Click **Preview Count** to see how many subscribers currently match before
saving.

### Materializing a segment into a list

Segments can't be sent to directly (campaign targeting uses Lists). To
target a segment in a campaign, click **Create List** on the segment row.
This snapshots all currently matching subscribers into a new tag with the
description "Snapshot of segment X on YYYY-MM-DD". The new tag is then
selectable in **New Campaign → Include Lists**.

The snapshot is one-time — re-run **Create List** later if you want a fresh
list reflecting the segment's current state.

---

## Campaigns

The main way you send broadcast emails. Go to **Campaigns → New Campaign**.

### Editor fields

- **Subject** — supports merge tags (e.g. `Hey {name}, this week's tips`)
- **Preview Text** — the bit that shows under the subject in most inboxes
- **From Name** & **From Email** — must be a verified sender domain in Resend
- **Reply-To** — optional, if different from From
- **Include Lists** / **Exclude Lists** — recipient targeting
- **Email Body** — either Visual Builder (drag-and-drop) or HTML Code (paste
  raw HTML). You can switch between them; the visual builder exports HTML
  on save.

### Sending options

- **Save Draft** — saves without sending
- **Send Test** — sends to a single address you specify. Merge tags render
  `{name}` as `Test` so you can preview personalization. Use this every
  time before a real send.
- **Schedule** — pick a date/time. The cron job picks it up at that time.
- **Send Now** — flips the campaign to `sending` status. The cron sender
  processes it in batches of 50 emails per invocation (every minute), so
  a 3,000-recipient send takes about an hour to fully deliver.

### Campaign status flow

`draft` → `scheduled` (optional) → `sending` → `sent`

Once `sent`, a campaign cannot be edited or re-sent (use **Duplicate** or
**Re-send to non-openers** instead).

### Campaign stats

Click a sent campaign for the detail view:
- Opens / Open rate
- Clicks / Click rate
- Bounces, complaints, unsubscribes
- Per-link click counts
- Send event log (who got it, when, what happened)

Stats update in near-real-time via Resend webhooks.

### Deleting campaigns

Drafts and scheduled campaigns can be deleted. Sent campaigns can't (their
send_events are needed for reporting). To "delete" a sent campaign, use
the Duplicate button and discard the original from view.

---

## Re-send to non-openers

A common workflow: send a campaign, wait 48 hours, then re-send to anyone
who didn't open it (with a different subject line).

On the Campaigns page, click **Re-send** on any sent campaign. You'll be
prompted for a new subject line. The system:
1. Creates a new campaign with the same body but new subject
2. Targets only subscribers who didn't open the original
3. Excludes anyone unsubscribed/bounced since the original
4. Sends through the same cron pipeline

You can repeat this cycle (re-send to non-openers of the re-send, etc.)
but two cycles is usually the max worth doing.

---

## Automations

Multi-step email sequences triggered by events. Go to **Automations**.

### Triggers

- **Signup** — fires when a subscriber confirms their email (status flips
  to `active`)
- **Tag added** — fires when a specific tag is added to a subscriber

### Steps

Each automation has an ordered list of steps. Each step has:
- **Delay** in minutes (0 = immediate, 1440 = 24 hours, etc.)
- **Subject**
- **HTML body** (or load from a template)

The cron job (`/api/cron/automations`, runs every minute) picks up
enrollments whose `next_send_at` has passed and sends the next step.

### Enrollments

When the trigger fires, an `automation_enrollment` row is created with
`current_step = 0`. After each step sends, `current_step` increments and
`next_send_at` is set to `now() + step.delay_minutes`. When all steps are
done, status flips to `completed`.

### Activating

Automations are inactive by default. Click the **Active** toggle on the
automation list once it's set up. Don't activate until you've sent test
emails for every step.

---

## Templates

Reusable email designs. Go to **Templates → New Template**. Templates
can be loaded into a campaign editor (Campaign → Load Template) or
attached to automation steps and form welcome emails.

Templates support the same visual/HTML editor as campaigns, and the same
merge tags.

---

## Forms

Hosted public signup forms. Go to **Forms → New Form** to create one.

### Form fields

- **Name** — internal label
- **Slug** — URL path (e.g. `newsletter` → `/s/newsletter`)
- **Heading**, **Description**, **Button Text**, **Success Message** — what
  the visitor sees
- **Show name field** — toggle whether you collect names too
- **Tags** — subscribers who submit this form get these tags
- **Welcome template** — optional; if set, sends this template as a welcome
  email after confirmation
- **Redirect URL** — optional; redirect after submit instead of showing the
  success message
- **Theme**, **Accent color**, **Background color**, **Logo URL** — visual
  customization

### Flow

1. Visitor submits the form at `/s/your-slug`
2. Subscriber is created in `pending` status with the form's tags
3. A confirmation email is sent (double opt-in)
4. Visitor clicks the confirmation link
5. Subscriber flips to `active`
6. If welcome template is set, it sends immediately
7. If signup trigger automations exist, those enrollments begin

### Embedding on an external site

You can also embed the signup endpoint directly:

```html
<form method="POST" action="https://yourapp.com/api/subscribe">
  <input type="hidden" name="form_id" value="<your form UUID>" />
  <input type="email" name="email" required />
  <input type="text" name="name" />
  <button type="submit">Subscribe</button>
</form>
```

Or POST programmatically (server-side, since the endpoint has no CORS
headers):

```bash
curl -X POST https://yourapp.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Jane","form_id":"<UUID>"}'
```

---

## Landing pages

Custom marketing landing pages hosted at `/p/<slug>`. Go to
**Landing Pages → New** to create one with the visual builder. Set
**Published** to true to make it live.

Useful for signup CTAs that need more than a simple form — e.g. a
sales/pitch page that includes a signup form mid-scroll.

---

## API keys

For programmatic access from external apps (e.g. your main product website
posting signups into PuntHub Mail).

Go to **API Keys → Create Key**. Copy the key value immediately — it's only
shown once. The key is hashed in the database.

### v1 API endpoints

All require `Authorization: Bearer <key>` header.

**POST `/api/v1/subscribers`** — Upsert a subscriber
```json
{
  "email": "user@example.com",
  "name": "Jane Smith",
  "list_ids": ["<tag UUID>"],
  "tags": ["List name"]
}
```
Either `list_ids` (UUIDs, renames-proof) or `tags` (names) — both work and
can be combined.

**GET `/api/v1/subscribers?tag=<name>&status=active`** — List subscribers

**POST `/api/v1/send`** — Trigger a transactional send (one-off, not a
campaign). Useful for system emails.

---

## Merge tags (personalization)

In any **subject line** or **HTML body** you can use:

| Token | Replaced with |
|---|---|
| `{name}` | Subscriber's name. Falls back to `there` if blank/null. |
| `{email}` | Subscriber's email address |
| `{unsubscribe_token}` | Unique unsubscribe token (rewritten into URLs) |
| `{subscriber_id}` | Subscriber's UUID (mostly for tracking pixel/link URLs) |

Example:
```
Subject: Hey {name}, welcome aboard

Hi {name},
Thanks for subscribing. You're signed up under {email}.
```

Send Test renders `{name}` as `Test` so you can preview what real recipients
will see.

---

## Dormant cleanup

ISPs (Gmail, Outlook, Yahoo) downgrade your inbox placement when you send
to a lot of people who don't open. Cleaning out long-term non-openers is
the single biggest lever for deliverability.

**On the Subscribers page**, click **Dormant Tool**:

1. **Source list** — pick one list (e.g. "Free Tips") to scope the cleanup,
   or leave on "All lists" for a global pass
2. **No opens in the last** — 30 / 60 / 90 / 180 days
3. Click **Find Dormant Subscribers** to preview
4. Review the list (you can scroll through)
5. Click **Mark as Dormant**

This will:
- Remove them from the source list (if one was picked)
- Add them to the **DORMANT V2** list
- Flip their status to `dormant` (status `dormant` is excluded from sends)

Subscribers added in the last 14 days are always excluded — they haven't
had time to engage yet.

Run this monthly per active list. You'll see open rates climb and inbox
placement improve within 2–3 weeks of cleanup.

---

## Deliverability checklist

The platform handles authentication and bulk-sender requirements correctly,
but there are operational habits that matter:

- ✅ **SPF, DKIM, DMARC** — verified in Resend → Domains. If not green,
  emails will land in spam.
- ✅ **List-Unsubscribe header** — automatic on all sends. Gives recipients
  Gmail's native one-click unsubscribe button.
- ✅ **Tracking** — opens/clicks/bounces/complaints flow into stats via
  the Resend webhook.
- ❗ **Open rate >25%** — clean dormants to keep this high
- ❗ **Complaint rate <0.3%** — sudden complaints (people clicking "Report
  Spam") will trash your sender reputation. Don't email cold lists.
- ❗ **Consistent volume** — sudden 10x volume increases trigger filters.
  Ramp gradually.
- ❗ **Single sending domain** — don't bounce between `news@punthub.co.uk`
  and `hello@punthub.co.uk` and `team@...` — pick one and stick with it.

Run **mail-tester.com** monthly: send any campaign to the address it gives
you, then check your score. Aim for 10/10.

---

## Troubleshooting

### "My emails are going to spam"

Most common cause: low engagement rate. Run the Dormant Cleanup on your
biggest list. Wait 2–3 weeks. Re-test with mail-tester.com.

If mail-tester is below 9/10, the issue is technical — check the report
breakdown (auth, content, blocklists).

### "Test email sent but not received"

Check Vercel logs (**Vercel → daycrew-mail → Logs**) for the failed send.
Most common error: `Domain not verified` — go to Resend → Domains and
verify your sending domain by adding the DNS records they provide.

### "Open rate looks wrong"

Resend webhook may not be configured. Check **Resend → Webhooks** — the
URL should be `https://yourapp.com/api/webhooks/resend` and it should be
returning 200 on real events. If it's returning 401, the
`RESEND_WEBHOOK_SECRET` env var doesn't match Resend's signing secret —
copy from Resend and update Vercel env vars, then redeploy.

### "Campaign stuck in 'sending' status"

The cron job processes 50 recipients per minute. A 3,000-recipient send
takes ~60 minutes. If it's been longer than (recipients / 50) minutes,
check Vercel logs for cron errors. Common causes:
- Resend rate limit hit — sends pause and retry automatically
- `RESEND_API_KEY` rotated and Vercel env not updated

### "Segment shows 0 matching subscribers"

If the segment has rules that produce hundreds of matches but reports 0,
the underlying query may be hitting a URL length limit. This is fixed in
recent versions — make sure you're on the latest deployment.

### "List import is stuck"

CSV imports run synchronously in a serverless function with a 60-second
timeout. For files over ~10,000 rows, split them into multiple uploads.

---

## Operational cadence (recommended)

- **Daily**: glance at Campaigns to confirm sends completed cleanly
- **Weekly**: check the Dashboard's open/click trends; if open rate drops
  below 30%, investigate
- **Monthly**:
  - Run Dormant Cleanup on each major list
  - Run mail-tester.com on a recent campaign
  - Check Resend → Domains for any verification regressions
  - Review API key usage; rotate any that haven't been used in 90 days
