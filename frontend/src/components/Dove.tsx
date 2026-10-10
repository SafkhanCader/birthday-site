/**
 * A white dove, drawn in SVG, facing right.
 *
 * mode:
 *  "fly"     — strong wing beats
 *  "glide"   — slow, wide beats while landing
 *  "perch"   — wings folded along the back, little legs showing, gentle breathing
 *  "flutter" — a quick startled flap (e.g. after a wrong password)
 */
export type DoveMode = "fly" | "glide" | "perch" | "flutter";

export function Dove({ mode, letter, className = "" }: { mode: DoveMode; letter: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={`dove dove--${mode} overflow-visible ${className}`} aria-hidden>
      <style>{`
        .dove .wing-near, .dove .wing-far { transform-box: view-box; }
        .dove .wing-near { transform-origin: 66px 48px; }
        .dove .wing-far  { transform-origin: 60px 48px; }
        .dove--fly .wing-near     { animation: dove-flap .42s ease-in-out infinite; }
        .dove--fly .wing-far      { animation: dove-flap-far .42s ease-in-out infinite; }
        .dove--glide .wing-near   { animation: dove-flap 1.1s ease-in-out infinite; }
        .dove--glide .wing-far    { animation: dove-flap-far 1.1s ease-in-out infinite; }
        .dove--flutter .wing-near { animation: dove-flap .18s ease-in-out 4; }
        .dove--flutter .wing-far  { animation: dove-flap-far .18s ease-in-out 4; }
        .dove--perch .wing-near   { transform: rotate(-36deg) scale(.9, .72) translate(6px, 8px); transition: transform .6s ease; }
        .dove--perch .wing-far    { transform: rotate(-40deg); opacity: 0; transition: transform .6s ease, opacity .4s; }
        .dove .legs { opacity: 0; transition: opacity .3s; }
        .dove--perch .legs, .dove--flutter .legs { opacity: 1; }
        .dove--perch .body-group { animation: dove-breathe 3.2s ease-in-out infinite; transform-box: view-box; transform-origin: 70px 70px; }
        .dove--perch .head { animation: dove-look 6s ease-in-out infinite; transform-box: view-box; transform-origin: 100px 46px; }
        @keyframes dove-flap     { 0%,100% { transform: rotate(24deg) } 50% { transform: rotate(-72deg) scaleY(.8) } }
        @keyframes dove-flap-far { 0%,100% { transform: rotate(18deg) } 50% { transform: rotate(-58deg) scaleY(.78) } }
        @keyframes dove-breathe  { 0%,100% { transform: scale(1) } 50% { transform: scale(1.025, 1.035) } }
        @keyframes dove-look     { 0%,40%,100% { transform: rotate(0) } 50%,62% { transform: rotate(-9deg) } 72%,85% { transform: rotate(6deg) } }
        @media (prefers-reduced-motion: reduce) { .dove * { animation: none !important; } }
      `}</style>

      <defs>
        <linearGradient id="dove-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#efe4ea" />
        </linearGradient>
        <linearGradient id="dove-wing" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3e9ef" />
        </linearGradient>
      </defs>

      {/* far wing (behind the body) */}
      <g className="wing-far">
        <path d="M60 48 C 50 30, 38 16, 20 10 C 30 24, 36 34, 52 52 Z" fill="#e6d7df" />
      </g>

      <g className="body-group">
        {/* tail feathers */}
        <path d="M46 56 L 12 44 C 17 53, 17 60, 10 71 L 44 65 Z" fill="url(#dove-body)" stroke="#d9c6cf" strokeWidth=".8" />
        <path d="M44 58 L 18 52 M44 61 L 16 62 M44 63 L 20 69" stroke="#dccad3" strokeWidth=".7" fill="none" />

        {/* body */}
        <path
          d="M40 56 C 50 40, 80 35, 97 41 C 108 45, 112 54, 105 61 C 96 69, 70 73, 52 69 C 43 67, 37 62, 40 56 Z"
          fill="url(#dove-body)"
          stroke="#dccad3"
          strokeWidth=".8"
        />

        {/* legs — only visible when perched */}
        <g className="legs" stroke="#d98a9e" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M70 70 L 68 80 M68 80 L 63 82 M68 80 L 72 83" />
          <path d="M80 70 L 80 80 M80 80 L 75 82 M80 80 L 84 83" />
        </g>

        {/* head, eye, beak */}
        <g className="head">
          <circle cx="104" cy="40" r="11.5" fill="#ffffff" stroke="#dccad3" strokeWidth=".8" />
          <path d="M114.5 37 L 127 41.5 L 114 45 Z" fill="#e7b86d" />
          <circle cx="107.5" cy="37" r="2" fill="#3b1220" />
          <circle cx="108.2" cy="36.3" r=".6" fill="#ffffff" />
          <path d="M101 45 C 104 47, 108 47, 111 45" stroke="#f4c7d4" strokeWidth="1.6" fill="none" opacity=".7" />

          {/* the letter, held in the beak */}
          {letter && (
            <g transform="translate(115 43) rotate(16)">
              <rect x="0" y="0" width="24" height="16" rx="1.6" fill="#fffaf5" stroke="#e5c3cc" strokeWidth=".9" />
              <path d="M0.6 0.8 L 12 9 L 23.4 0.8" fill="none" stroke="#e5c3cc" strokeWidth=".9" />
              <circle cx="12" cy="9" r="3" fill="#d6336c" />
              <path d="M10.6 8.6 C 10.6 7.6, 12 7.6, 12 8.5 C 12 7.6, 13.4 7.6, 13.4 8.6 C 13.4 9.6, 12 10.4, 12 10.4 C 12 10.4, 10.6 9.6, 10.6 8.6 Z" fill="#fff" />
            </g>
          )}
        </g>
      </g>

      {/* near wing (in front of the body) */}
      <g className="wing-near">
        <path
          d="M66 48 C 58 26, 42 10, 16 3 C 21 11, 25 15, 30 19 C 23 19, 19 21, 14 24 C 25 30, 33 32, 40 34 C 35 36, 31 40, 29 45 C 42 47, 54 50, 67 53 Z"
          fill="url(#dove-wing)"
          stroke="#d9c6cf"
          strokeWidth=".8"
          strokeLinejoin="round"
        />
        <path d="M60 44 C 50 34, 40 26, 24 20 M58 47 C 48 41, 40 37, 26 33" stroke="#e2d2da" strokeWidth=".8" fill="none" />
      </g>
    </svg>
  );
}