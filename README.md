# RailAssist

Prototype for **Youth Ideathon 2026 (IRCTC track)**.

RailAssist is a chatbot that helps elderly and disabled Indian Railways passengers (and their families) work out what help they need for a train journey, and how to get it. You type or speak in your own language. It tells you what to ask for and when, and gives you official links, apps and phone numbers to arrange each thing yourself.

- **One chat, just for you.** There is no admin, no station desk and nobody else reading it. The chat is saved only on your own device.
- **No booking.** RailAssist cannot book anything. It points you to the official way to do it (IRCTC, eCatering, Rail Madad, RailOne and so on). With an IRCTC partnership, it could book these for you in the future.
- **Realistic.** It only helps with real railway services: wheelchair, porter (Sahayak), battery car, lower berth quota, food on the train, medical help, and help to reach your coach. Anything else (a teacher on board, a personal nurse, a taxi) is listed as **Not available on trains or at stations**. Unrelated requests (like "a Boeing aeroplane") get **"Sorry, I didn't understand that."**
- **8 languages:** English, Hindi, Tamil, Kannada, Telugu, Bengali, Marathi, Malayalam.

Live: https://railassist-ideathon.vercel.app (same chatbot on phone and PC).

## Setup

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local     # on Windows: copy .env.example .env.local
```

Put your Groq key (from https://console.groq.com/keys) in `.env.local`:

```
GROQ_API_KEY=gsk_...
```

```bash
npm run dev
```

Open http://localhost:3000.

The key is only used by the server (`/api/chat`, `/api/transcribe`) and is never sent to the browser. Without a key the chat still works with a simple offline keyword helper, and voice input asks you to type instead.

## Using it

1. Pick your language at the top.
2. Tap the orange microphone and speak, or type. You can also tap a suggestion such as "I need a wheelchair at the station".
3. RailAssist replies with:
   - a short answer,
   - a card for each kind of help (where you need it: at the station you get on, where you get off, or on the train),
   - **How to get it today** buttons: official websites, apps and numbers (tap to call or open),
   - **Help any time:** 139 and the station enquiry counter.
4. Ask follow-up questions. It remembers the conversation. **Start a new chat** clears it.

### Installing it as an app

- **Phone:** open the site. It asks "Download the RailAssist app?". Tap **Yes, download** (on iPhone it shows the Safari steps: Share, then Add to Home Screen). It gets its own icon and opens full screen.
- **PC:** in Chrome, Edge or Brave, click the install icon in the address bar.

## Official links and facts

All links, numbers and facts were researched from official sources on 8 Nov 2026, and each one lists its source:

- `src/lib/contacts.ts`: the buttons shown under each kind of help, the helpline, and the "Useful official links" on the welcome screen.
- `src/lib/systemPrompt.ts`: the `FACTS` the AI is allowed to state (wheelchairs, battery cars, porters, lower berth quota, 139, eCatering, RailOne, Divyangjan ID).

Things to know (from that research):

- **No national online booking for wheelchairs, porters or battery cars.** IRCTC e-Wheelchair online booking covers only 19 big stations (it needs your PNR). Free wheelchairs are available at 5,868 stations: ask at the enquiry counter or call 139.
- **139** is the single railway helpline (182 was merged into it). Press 1 for security or medical help.
- **Food on the train:** IRCTC eCatering, 1323, or the Food on Track app.

Re-check these before the pitch. Never add a number or link from memory: use only official sources.

## Translations

UI text is in `src/lib/i18n.ts`. Hindi is complete. The other languages cover the main labels and fall back to English for newer text (each language has a TODO listing what is missing). All non-English text needs a native-speaker check. Contact button labels are English for now.

## How it works

- `src/components/chat/ChatApp.tsx`: the chat screen (voice, suggestions, answer cards, saved on this device).
- `src/app/api/chat/route.ts`: sends the conversation to the Groq chat model in JSON mode, checks the reply (`src/lib/chat.ts`), retries once, and falls back to the offline helper. It waits and retries once on Groq's free-tier rate limit (about 8,000 tokens per minute, roughly 4–5 answers).
- `src/app/api/transcribe/route.ts`: speech to text with Groq Whisper, in the chosen language.
- `src/lib/config.ts`: model IDs (`whisper-large-v3-turbo`, `openai/gpt-oss-120b`).

## Deploying to Vercel

Import the GitHub repo in Vercel and add `GROQ_API_KEY` under *Settings → Environment Variables*. Every push to `main` redeploys.
