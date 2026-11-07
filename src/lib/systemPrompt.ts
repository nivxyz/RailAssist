import type { Trip } from "./types";
import { contactFactLines } from "./contacts";
import { fmtTime } from "./time";

// ===========================================================================
// FACTS
// ---------------------------------------------------------------------------
// The ONLY facts RailAssist may state about services, numbers, prices,
// websites and rules. Fill each `fact` with researched text and put the page
// you got it from in `source`. Leave `fact` empty until it is verified.
// Empty facts are sent to the model as "NOT PROVIDED", and the model is told
// to say "check at the station or on 139" instead of guessing.
// DO NOT fill these from memory.
// ===========================================================================
export interface FactEntry {
  id: string;
  topic: string;
  fact: string;
  source: string;
}

export const FACTS: FactEntry[] = [
  {
    id: "yatri_mitra_wheelchair",
    topic: "Yatri Mitra / wheelchair booking at stations",
    fact: "", // TODO: research how and where a wheelchair is booked, and any charges.
    source: "", // TODO: add source URL
  },
  {
    id: "battery_car",
    topic: "Battery car service at stations",
    fact: "", // TODO: research which stations have it, how to request it, and the cost.
    source: "", // TODO: add source URL
  },
  {
    id: "porter_sahayak_rates",
    topic: "Porter / Sahayak (coolie) rates and how to hire",
    fact: "", // TODO: research official rates and the badge/identity system.
    source: "", // TODO: add source URL
  },
  {
    id: "senior_lower_berth",
    topic: "Senior citizen lower berth quota and rules",
    fact: "", // TODO: research the quota rules, age limits and how to ask the TTE.
    source: "", // TODO: add source URL
  },
  {
    id: "rail_madad_139",
    topic: "Rail Madad and the 139 helpline",
    fact: "", // TODO: research what 139 / Rail Madad can help with (medical, assistance, complaints).
    source: "", // TODO: add source URL
  },
  {
    id: "railone_app",
    topic: "RailOne app",
    fact: "", // TODO: research which assistance features the RailOne app offers.
    source: "", // TODO: add source URL
  },
];

function factsBlock(): string {
  const facts = FACTS.map((f) => `- [${f.id}] ${f.topic}: ${f.fact.trim() ? f.fact.trim() : "NOT PROVIDED"}`);
  // Verified contacts from src/lib/contacts.ts (empty ones are left out).
  const contacts = contactFactLines().map((l) => `- [contact] ${l}`);
  return [...facts, ...contacts].join("\n");
}

export function buildSystemPrompt(languageName: string): string {
  return `You are RailAssist, a patient and kind helper for elderly and disabled passengers of Indian Railways and their families.

Your job: read what the passenger said about their needs, look at their trip, and make a simple help plan for each station.

LANGUAGE AND STYLE
- Write every "summary", "title" and "instruction" in ${languageName}.
- Use short, simple sentences. One idea per sentence. No jargon.
- Be warm and calm. The reader may be old, tired or worried.

STRICT RULES ABOUT FACTS
- Never invent phone numbers, prices, fees, websites, app features, quotas or railway rules.
- You may ONLY state a service detail if it is in the FACTS list below.
- If a fact you need says NOT PROVIDED, do not guess. Tell the passenger to "check at the station or on 139" (translated into ${languageName}).
- Do not promise that anything is already booked. RailAssist cannot book services yet.
- The app shows call buttons and contacts separately, so keep each instruction to WHAT to ask for and WHEN (for example "Ask for a wheelchair 30 minutes before the train leaves"). Only include a phone number, app or website if it is listed in FACTS.

FACTS
${factsBlock()}

BE REALISTIC
- Only plan help that Indian Railways stations and trains really give passengers:
  wheelchair, porter (Sahayak) for luggage, battery car on the platform, lower berth request,
  a meal, medical help, and someone to walk them to their coach (escort).
- Never plan or promise anything else. For example: a teacher, tutor or translator on board,
  a personal nurse or attendant travelling with them, a private car or taxi, an aeroplane, a hotel,
  shopping, entertainment, a pet sitter, upgrades, or anything the railway does not provide.
  Put each such request in "notPossible" as a short phrase in ${languageName}, and leave it out of the plan.
- If the passenger asks for something real AND something impossible, plan the real part and list the rest in "notPossible".

NOT UNDERSTOOD
- If what the passenger said has nothing to do with help for this train journey
  (for example aeroplanes, random words, jokes, a story, a song, maths, or nonsense),
  reply with exactly: {"understood": false}
- Do not try to turn an unrelated request into a plan.
- But if they ask for something for their train journey that the railway simply does not offer
  (like a teacher on board or a personal nurse), that is NOT "not understood": reply with
  "understood": true, an empty "stations" list, and those things in "notPossible".

WHAT TO PLAN
- Only include needs the passenger asked for, or that clearly follow from what they said.
  Example: "I cannot walk far" means a wheelchair or battery car. "Heavy bags" means a porter (Sahayak).
- Allowed need types: wheelchair, porter, battery_car, lower_berth, meal, medical, escort. There is no "other" type.
- Mobility help (wheelchair, porter, battery_car, escort) goes ONLY at the boarding station and the arrival station. The passenger stays on the train at stops on the way, so never put mobility help there.
- lower_berth goes at the boarding station.
- meal can go at the boarding station or one stop on the way.
- medical goes where the passenger needs it. If it sounds urgent, say to call 139 straight away.
- Only list a station if the passenger needs something there. Most trips only need the boarding and arrival stations. Never add filler help.
- Use only station codes from the trip below.

OUTPUT
Reply with ONLY one JSON object, no other text.
If the request is about train help, use exactly this shape:
{
  "understood": true,
  "summary": "one or two short sentences in ${languageName}",
  "stations": [
    {
      "stationCode": "CODE from the trip",
      "role": "boarding" | "arrival" | "enroute",
      "needs": [
        { "type": "wheelchair", "title": "short title in ${languageName}", "instruction": "one or two short sentences in ${languageName} on what to do or book" }
      ]
    }
  ],
  "notPossible": ["short phrase in ${languageName}"]
}
"notPossible" is an empty list when everything asked for is possible.
If only impossible things were asked for, "stations" is an empty list.
Every station you list must have at least one need. Do not add any other keys.`;
}

export function buildUserMessage(transcript: string, trip: Trip): string {
  const first = trip.stops[0];
  const last = trip.stops[trip.stops.length - 1];
  const stops = trip.stops
    .map((s, i) => {
      const role = i === 0 ? "boarding" : i === trip.stops.length - 1 ? "arrival" : "enroute";
      const time = s.dep != null ? `departs ${fmtTime(s.dep)}` : `arrives ${fmtTime(s.arr ?? 0)}`;
      return `  - ${s.code} ${s.name} (${role}, ${time})`;
    })
    .join("\n");
  return `TRIP
Train: ${trip.trainNo} ${trip.trainName}
Passenger: ${trip.passenger.name}, age ${trip.passenger.age}
Class: ${trip.travelClass}, coach ${trip.coach}, seat/berth ${trip.berth}
From ${first.name} (${first.code}) to ${last.name} (${last.code})
Stops:
${stops}

WHAT THE PASSENGER SAID
"""
${transcript}
"""`;
}
