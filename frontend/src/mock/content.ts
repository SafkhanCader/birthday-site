import type { Content, VoiceNote } from "../api/types";

/**
 * SAMPLE CONTENT — for building the frontend without the backend.
 *
 * Replace the words with yours. Photos here are placeholder images;
 * your real photos will come from the backend later (backend/media).
 *
 * ⚠ This file is only used when VITE_USE_MOCK=true. Anything in src/
 *   ends up in public JavaScript, so your real letter and photos must
 *   live in backend/content + backend/media, not here.
 */

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const mockContent: Content = {
  site: {
    herName: "My Love",
    fromName: "Mohamed",
    birthday: "2026-10-13T00:00:00+01:00",
    heroLine: "Today the whole world is celebrating you — and I get to celebrate you the most.",
    heroSubline: "Scroll slowly. Every part of this was made for you.",
    // music: { src: "music/our-song.mp3", title: "Our Song" },
  },

  journey: [
    {
      id: "first-meet",
      date: "14 June 2018",
      title: "The day I first saw you",
      place: "Where it all began",
      text: "I didn't know it yet, but my whole life quietly changed direction that day.",
      photo: img("meet", 900, 700),
    },
    {
      id: "first-date",
      date: "2 August 2018",
      title: "Our first date",
      place: "A little café",
      text: "I was nervous, you were perfect, and the coffee went cold because we never stopped talking.",
      photo: img("date", 900, 700),
    },
    {
      id: "proposal",
      date: "20 December 2019",
      title: "The question",
      place: "Under the winter lights",
      text: "You said yes before I finished the sentence. I still smile every time I think about it.",
      photo: img("ring", 900, 700),
    },
    {
      id: "wedding",
      date: "15 May 2020",
      title: "Forever began",
      place: "Our wedding day",
      text: "The most beautiful day of my life — because it was the day you became my home.",
      photo: img("wedding", 900, 700),
    },
    {
      id: "home",
      date: "3 March 2022",
      title: "Our first home",
      place: "Our little world",
      text: "Four walls, a hundred boxes, and the happiest chaos. Home was never a place — it was you.",
      photo: img("home", 900, 700),
    },
  ],

  album: [
    {
      id: "beginning",
      title: "The Beginning",
      subtitle: "Where our story started",
      photos: [
        { src: img("a1", 800, 1000), w: 800, h: 1000, caption: "Our very first photo together" },
        { src: img("a2", 1000, 700), w: 1000, h: 700, caption: "That evening walk" },
        { src: img("a3", 800, 800), w: 800, h: 800 },
        { src: img("a4", 800, 1100), w: 800, h: 1100, caption: "Your smile, always" },
        { src: img("a5", 1000, 700), w: 1000, h: 700 },
        { src: img("a6", 800, 1000), w: 800, h: 1000 },
      ],
    },
    {
      id: "adventures",
      title: "Adventures",
      subtitle: "Everywhere we've been",
      photos: [
        { src: img("b1", 1000, 700), w: 1000, h: 700, caption: "Lost, but together" },
        { src: img("b2", 800, 1000), w: 800, h: 1000 },
        { src: img("b3", 800, 800), w: 800, h: 800, caption: "Sunset watchers" },
        { src: img("b4", 1000, 750), w: 1000, h: 750 },
        { src: img("b5", 800, 1100), w: 800, h: 1100 },
      ],
    },
    {
      id: "everyday",
      title: "Everyday Us",
      subtitle: "The small moments I love most",
      photos: [
        { src: img("c1", 800, 1000), w: 800, h: 1000, caption: "Sunday mornings" },
        { src: img("c2", 1000, 700), w: 1000, h: 700 },
        { src: img("c3", 800, 800), w: 800, h: 800 },
        { src: img("c4", 800, 1000), w: 800, h: 1000, caption: "You, being you" },
      ],
    },
  ],

  reasons: [
    "The way your eyes smile before your lips do.",
    "You make every ordinary day feel like a celebration.",
    "Your kindness — to everyone, always.",
    "How you hold my hand without even thinking about it.",
    "Your laugh. Honestly, just your laugh.",
    "You believe in me even when I forget to.",
    "The way you say my name.",
    "You turned a house into a home.",
    "Your courage, quiet and strong.",
    "How beautiful you look when you're concentrating.",
    "You are my calm in every storm.",
    "Because life with you is my favourite adventure.",
  ],

  letter: {
    greeting: "My dearest love,",
    paragraphs: [
      "Happy birthday. I have tried many times to put into words what you mean to me, and every time the words feel too small. So this year, I built you something instead — a little place that holds our story.",
      "Thank you for every laugh, every late-night talk, every time you held me together without saying a word. You make my life softer, brighter and fuller than I ever knew it could be.",
      "Whatever this next year brings, I want you to know one thing for certain: I choose you. Today, tomorrow, and every day after that.",
    ],
    signoff: "Forever and always yours,",
    signature: "Mohamed",
  },

  gift: {
    title: "Something you've been dreaming of",
    note: "I've watched you look at this for months. Every time I see you wear it, I want you to remember how loved you are.",
    photo: img("gift", 900, 900),
  },

  london: {
    headline: "Pack your bags, beautiful. We're going to London.",
    from: "Home",
    fromCode: "HOME",
    to: "London",
    toCode: "LDN",
    departDate: "Sat 17 Oct",
    returnDate: "Mon 19 Oct",
    stay: "A cosy hotel by the river",
    days: [
      {
        label: "Day 1",
        date: "Sat 17 Oct",
        title: "Arrival & river lights",
        items: [
          { time: "11:00", title: "Train into London", note: "Window seat is yours" },
          { time: "15:00", title: "Check in & rest" },
          { time: "18:30", title: "Walk along the South Bank", note: "Golden hour by the Thames" },
          { time: "20:00", title: "Candlelit dinner", note: "Table for two, booked" },
        ],
      },
      {
        label: "Day 2",
        date: "Sun 18 Oct",
        title: "Just us",
        items: [
          { time: "10:00", title: "Slow breakfast" },
          { time: "12:00", title: "Covent Garden & shopping" },
          { time: "16:00", title: "Afternoon tea" },
          { time: "19:30", title: "A surprise evening", note: "Dress up a little ✨" },
        ],
      },
      {
        label: "Day 3",
        date: "Mon 19 Oct",
        title: "One last memory",
        items: [
          { time: "10:30", title: "Park stroll & coffee" },
          { time: "14:00", title: "Train home, hand in hand" },
        ],
      },
    ],
    packing: ["A beautiful dress", "Comfy walking shoes", "Warm coat", "Phone charger", "Your favourite perfume", "Your smile"],
  },

  wishes: [
    { id: "w1", name: "Mum", relation: "Family", message: "Happy birthday to our beautiful daughter. May your year be as bright as your heart." },
    { id: "w2", name: "Sister", relation: "Family", message: "To my best friend forever — have the most magical day. Love you endlessly!" },
    { id: "w3", name: "Best Friend", relation: "Friend", message: "You deserve every bit of happiness in the world. Enjoy London, queen!" },
    { id: "w4", name: "Dad", relation: "Family", message: "Proud of the woman you are. Happy birthday, sweetheart." },
  ],

  future: {
    intro: "This is only the beginning. Here are a few of the things I can't wait to do with you:",
    dreams: [
      { id: "f1", title: "See the northern lights", text: "Wrapped in one blanket, under a sky full of colour." },
      { id: "f2", title: "Build the home of our dreams", text: "With a kitchen big enough for your ideas." },
      { id: "f3", title: "Grow old laughing", text: "Still holding hands, still telling the same jokes." },
      { id: "f4", title: "Every birthday, together", text: "And make each one better than the last." },
    ],
    closing: "Happy birthday, my love.",
    photo: img("us-forever", 1400, 900),
  },

  unlockAt: "2026-10-13T00:00:00+01:00",

  // Shown under the voice note's code box. Keep it a hint only she understands.
  voiceHint: "Hint: the day and month you were born",
};

/**
 * PREVIEW ONLY — your voice note.
 *
 * 1. Put your recording at: frontend/public/voice/for-you.m4a
 *    (an .mp3 also works — then change src below to "/voice/for-you.mp3")
 * 2. Play it back and note when each sentence starts and ends, in seconds.
 *    Write them in `cues` — these become the subtitles.
 *
 * For the real site this moves to the backend (media/voice), behind the code check.
 */
export const mockVoice: VoiceNote = {
  title: "Before you blow out the candles",
  src: "/voice/you.m4a",
  cues: [
    { start: 0.5, end: 4.5, text: "Hey, my love. It's me." },
    { start: 4.8, end: 9.5, text: "I wanted you to hear this in my voice, not just read it." },
    { start: 9.8, end: 15, text: "Happy birthday to the most beautiful person I know." },
    { start: 15.3, end: 21, text: "Thank you for every single day you've given me." },
    { start: 21.3, end: 26.5, text: "I love you. Today, tomorrow, and always." },
  ],
};