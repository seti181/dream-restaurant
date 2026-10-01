// Mewa herself: a herring gull, like the ones on every railing by the Motława.
// White head and belly, pale grey wings with black tips, a yellow beak with a red spot, pink legs.

export function MewaIcon({ size = 48 }: { size?: number }) {
  return (
    <svg className="mewa-icon" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Mewa">
      {/* Legs */}
      <g stroke="#e59a94" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M27 49 L26 59 M23 59 L29 59" />
        <path d="M33 48 L34 59 M31 59 L37 59" />
      </g>
      {/* Head, neck and white body */}
      <path
        d="M12 42 C16 32 29 28 37 28 C36 21 39 13 46 12.5 C52 12.5 55 16.5 53.5 21.5 C52 26 48.5 28.5 48.5 33 C48.5 44 40 50 29 50 C21 50 15 47 12 42 Z"
        fill="#ffffff"
        stroke="#7b8792"
        strokeWidth="1.2"
      />
      {/* Pale grey back and wing, reaching past the tail */}
      <path
        d="M40 29.5 C31 27.5 17 31 9 37 L2 40.5 L13 42.5 C24 45.5 36 42.5 42 35.5 Z"
        fill="#aeb9c4"
        stroke="#7b8792"
        strokeWidth="1"
      />
      {/* Black wingtips with white spots */}
      <path d="M2 40.5 L9 37 L15 41 L13 42.5 Z" fill="#26292d" />
      <circle cx="6.5" cy="40.2" r="0.9" fill="#ffffff" />
      <path d="M20 37.5 C26 35.5 32 35 38 35.5" stroke="#8f9ba6" strokeWidth="1" fill="none" />
      {/* Slim yellow beak with a hooked tip and the red spot */}
      <path
        d="M52.5 19.5 L60.5 20.2 C62.6 20.5 62.8 22.4 61 22.8 L52.5 23.3 Z"
        fill="#f4c531"
        stroke="#c99a12"
        strokeWidth="0.7"
      />
      <circle cx="58.6" cy="22.7" r="1" fill="#d9412b" />
      {/* Pale eye */}
      <circle cx="47.8" cy="17.2" r="1.7" fill="#f6e7a6" stroke="#7b8792" strokeWidth="0.6" />
      <circle cx="48.1" cy="17.2" r="0.75" fill="#1d1f22" />
    </svg>
  );
}
