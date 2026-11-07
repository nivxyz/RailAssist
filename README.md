# RailAssist

Prototype for **Youth Ideathon 2026 (IRCTC track)**.

RailAssist helps elderly and disabled train passengers in India (and their families) plan all the station help they need for one trip. The passenger enters a PNR, says what they need in their own language, and gets a clear checklist for each station. Station staff see the requests live, and the family gets phone-style updates.

> **Prototype only.** All trains, times and passengers are demo data. Nothing is booked with Indian Railways or IRCTC. The "Request sent to station" flow goes to our own demo station desk. With an IRCTC partnership, RailAssist would book these services automatically.

## Setup

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local     # on Windows: copy .env.example .env.local
```

Open `.env.local` and paste your Groq key (from https://console.groq.com/keys):

```
GROQ_API_KEY=gsk_...
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000.

The key is only used by the server-side API routes (`/api/transcribe`, `/api/plan`). It is never sent to the browser.

**No key? The demo still works.** Voice input will show a friendly error and ask the user to type, and the plan is made by a simple offline keyword planner instead of the AI.

## Pages

| URL | What it is |
| --- | --- |
| `/` | Passenger app (phone-sized frame on desktop) |
| `/station` | Station staff assistance desk |
| `/family` | What a relative sees: train position and updates |

All windows on the **same laptop and same browser** stay in sync through `localStorage` + `BroadcastChannel`. There is no database.

## Running the demo (for the pitch video)

1. Open two windows of the same browser side by side at 1920×1080:
   - left: http://localhost:3000 (passenger)
   - right: http://localhost:3000/station (staff desk)
   - optional third window or tab: http://localhost:3000/family
2. **Passenger:** pick a language, tap the demo trip *Bengaluru → Chennai* (PNR `4521873690`), or type any 10-digit PNR.
3. **Passenger:** tap the big microphone and speak, for example
   *"I am 72, I cannot walk far and I have two heavy bags. I need a wheelchair."*
   Or type the same text in the box. Tap **Make my help plan**.
4. **Passenger:** check the help plan, then tap **Send requests to stations**.
5. **Station:** the requests appear live. Click **Accept** on each one. The passenger app shows **Confirmed** and the family feed updates.
6. **Station:** click **Mark boarded** on the KSR Bengaluru request (or press `N` to move the train).
7. Press **`D`** to add a 40-minute delay. The passenger app shows an alert, the arrival help time moves from 2:30 PM to 3:10 PM, and the station request flashes with the new time.
8. Press `N` a few times to move the train to Chennai Central, then click **Mark picked up** on the station desk.

### Demo keyboard shortcuts (work on every page)

| Key | Action |
| --- | --- |
| `D` | Add a 40-minute delay to the stops ahead |
| `N` | Move the train forward (depart, then station by station) |
| `Shift` + `R` | Restart the trip with the same PNR (good between takes) |

There is also a tiny grey dot in the bottom-left corner of every page. Click it to open the same demo controls, plus **Clear everything**.

Shortcuts are ignored while typing in a text box.

### Demo PNRs

| PNR | Trip |
| --- | --- |
| `4521873690` | 12608 Lalbagh Express, KSR Bengaluru → Chennai Central |
| `2468013579` | 12123 Deccan Queen, Mumbai CSMT → Pune |
| `8765432109` | 12301 Rajdhani Express, Howrah → New Delhi (overnight) |

Any other 10-digit PNR returns one of these routes with a generic passenger.

## Before the pitch: things to fill in

- **Facts** in `src/lib/systemPrompt.ts`: the `FACTS` list (Yatri Mitra wheelchair booking, battery car, porter/Sahayak rates, senior citizen lower berth rules, Rail Madad / 139, RailOne app) is empty on purpose. Add researched text and the source URL for each. Until then, the AI tells passengers to "check at the station or on 139".
- **Contacts** in `src/lib/contacts.ts`: RailAssist can't book services yet, so each help item shows how to arrange it today, with a **Call** button, an app or website link, or "Ask at…". Fill in the real numbers, links and counters for each service (wheelchair, porter, battery car, meals, and so on) with a source URL. Empty slots stay hidden. Until then, every card shows only "Call 139" and "Ask at the enquiry counter". Filled contacts are also passed to the AI so it can mention them.
- **Translations** in `src/lib/i18n.ts`: every non-English string needs a native-speaker check. Keys we were not confident about are left out (English shows instead) and listed in a `TODO` comment above each language.

## How it works

- `src/lib/config.ts`: model IDs (`whisper-large-v3-turbo` for speech, `openai/gpt-oss-120b` for planning). Change them here.
- `src/app/api/transcribe/route.ts`: sends the recorded audio to Groq Whisper with the chosen language code.
- `src/app/api/plan/route.ts`: sends the transcript and trip (looked up on the server from the PNR) to the chat model in JSON mode. The reply is validated (`src/lib/plan.ts`); if it is invalid it retries once, then falls back to the offline planner.
- `src/lib/systemPrompt.ts`: the RailAssist system prompt and the FACTS section.
- `src/lib/store.ts` and `src/lib/actions.ts`: shared demo state and every action (send, accept, delay, move train).
- `src/lib/trips.ts`: demo trips.

## Deploying to Vercel

Import the project in Vercel and add `GROQ_API_KEY` under *Settings → Environment Variables*. Sync between windows only works inside one browser on one device, which is what the demo needs.
