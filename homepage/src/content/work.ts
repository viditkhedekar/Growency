// Real Growency spec ads, from trygrowency.com (assets/spec-ads).
// Each is Growency's own speculative work and was NOT commissioned by the
// brand shown, so every place an ad appears must keep its `note`.
// Files live in public/media/work/. Edit, reorder or add entries here.

export interface SpecAd {
  id: string;
  /** What the ad is for (shown as the title). */
  title: string;
  /** Required disclaimer, e.g. "Growency Spec · Not commissioned by IKEA". */
  note: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

const BASE = `${import.meta.env.BASE_URL}media/work/`;

export const SPEC_ADS: SpecAd[] = [
  {
    id: "aside",
    title: "AI browser assistant",
    note: "Growency Spec · Not commissioned by Aside",
    src: `${BASE}aside-invoice-matching.png`,
    width: 1080,
    height: 1350,
    alt: "Personal assistant for my other 31 tabs. Open every invoice in these tabs. Match each one to a payment in my spreadsheet. Flag anything that doesn’t match, and link back to the invoice. Hire your browser.",
  },
  {
    id: "instinct",
    title: "Personal assistant by text",
    note: "Growency Spec · Not commissioned by Instinct",
    src: `${BASE}instinct-tennis.jpg`,
    width: 880,
    height: 1100,
    alt: "An overhead view of a tennis court. The group chat is still deciding. Find us a court for Saturday. Somewhere nobody can call ‘too far’. Text Instinct. Get a court booked.",
  },
  {
    id: "wispr-flow",
    title: "Voice dictation",
    note: "Growency Spec · Not commissioned by Wispr Flow",
    src: `${BASE}wispr-flow-brand.jpg`,
    width: 880,
    height: 1100,
    alt: "A finger in a cast marked ‘per my last email’ rests on a keyboard. Your fingers can take a sick day. Dictate your emails with Wispr Flow.",
  },
  {
    id: "granola",
    title: "AI meeting notes",
    note: "Growency Spec · Not commissioned by Granola",
    src: `${BASE}granola-brand.jpg`,
    width: 880,
    height: 1100,
    alt: "Dan brought a plus-one. A cardboard robot with a ‘Dan’s AI notetaker’ badge sits in a meeting. Granola takes notes without a meeting bot.",
  },
  {
    id: "moonshot-for-everything",
    title: "Moonshot Luna · For everything after ‘i’ll’",
    note: "Growency Spec · Not commissioned by Moonshot",
    src: `${BASE}moonshot-for-everything.jpg`,
    width: 880,
    height: 1100,
    alt: "For everything after ‘i’ll’. A silver crescent necklace casts a shadow on white. Moonshot: a little moon for the little things.",
  },
  {
    id: "moonshot-bring-flowers",
    title: "Moonshot Luna · Bring flowers",
    note: "Growency Spec · Not commissioned by Moonshot",
    src: `${BASE}moonshot-bring-flowers.jpg`,
    width: 880,
    height: 1100,
    alt: "You said you’d bring flowers. A crescent necklace drapes over a small bouquet against black. Moonshot: a little moon for the little things.",
  },
  {
    id: "moonshot-good-memory",
    title: "Moonshot Luna · A good memory",
    note: "Growency Spec · Not commissioned by Moonshot",
    src: `${BASE}moonshot-good-memory.jpg`,
    width: 880,
    height: 1100,
    alt: "Jewellery with a good memory. A silver crescent necklace is worn against black cotton. Moonshot: a little moon for the little things.",
  },
  {
    id: "allbirds",
    title: "Tree Runner sneakers",
    note: "Growency Spec · Not commissioned by Allbirds",
    src: `${BASE}allbirds.webp`,
    width: 880,
    height: 1100,
    alt: "Breathable sneakers. Your socks can thank us later. Sunlight catches the mesh of a grey sneaker beside an open window.",
  },
  {
    id: "sandwich",
    title: "Video production",
    note: "Growency Spec · Not commissioned by Sandwich",
    src: `${BASE}sandwich.webp`,
    width: 880,
    height: 1100,
    alt: "Videos you just can’t scroll past. A physical stop bearing Sandwich’s logo blocks a finger from swiping up on a phone.",
  },
  {
    id: "ikea",
    title: "PAX wardrobe planner",
    note: "Growency Spec · Not commissioned by IKEA",
    src: `${BASE}ikea.webp`,
    width: 880,
    height: 1100,
    alt: "Design a wardrobe around your clothes. Yes, all of them. A modular wardrobe has space for coats, folded clothes and shoes.",
  },
];

/** The full-bleed reel composed from these ads (scripts/gen-reel.py). */
export const SPEC_REEL = {
  video: `${import.meta.env.BASE_URL}media/reel/spec-reel.mp4`,
  poster: `${import.meta.env.BASE_URL}media/reel/spec-reel.jpg`,
};

/** Where every "Let's talk" button goes (the live booking page). */
export const BOOK_URL = 'https://www.trygrowency.com/book';
