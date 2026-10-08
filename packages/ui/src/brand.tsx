/** Mantiene una firma vectorial accesible con la paleta de EnlaceHermano. */
export function Brand({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}): JSX.Element {
  return (
    <span
      className={`brand${light ? ' brand--light' : ''}`}
      aria-label="EnlaceHermano"
      role="img"
    >
      <svg
        className="brand-mark"
        viewBox="0 0 80 60"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="21" cy="10" r="7" fill="#17bfc3" />
        <circle cx="59" cy="10" r="7" fill="#ffbd4b" />
        <path
          d="M42 27C22 7 3 25 8 42c5 16 20 16 33 2l12-13"
          stroke="#17bfc3"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M38 33C58 10 76 24 73 41c-3 17-19 20-33 6"
          stroke="#f57853"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M73 41c-1 9-7 14-14 14"
          stroke="#ffbd4b"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="brand-word">
          Enlace<span>Hermano</span>
        </span>
      )}
    </span>
  );
}

/** Ilustración decorativa del vínculo entre los miembros de la comunidad. */
export function ConnectionArt(): JSX.Element {
  return (
    <svg
      className="connection-art"
      viewBox="0 0 520 320"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="260"
        cy="167"
        r="133"
        stroke="currentColor"
        strokeOpacity=".12"
        strokeDasharray="3 10"
      />
      <circle cx="139" cy="73" r="24" fill="#17bfc3" />
      <circle cx="366" cy="73" r="24" fill="#ffbd4b" />
      <path
        d="M279 140C192 45 84 121 107 204c25 89 109 80 163 24l58-62"
        stroke="#17bfc3"
        strokeWidth="38"
        strokeLinecap="round"
      />
      <path
        d="M253 184C348 69 439 110 419 207c-18 82-96 80-144 37"
        stroke="#f57853"
        strokeWidth="38"
        strokeLinecap="round"
      />
      <path
        d="M419 207c-8 36-28 56-58 59"
        stroke="#ffbd4b"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="m54 148 5 12 12 5-12 5-5 12-5-12-12-5 12-5 5-12Z"
        fill="#ffbd4b"
      />
      <path
        d="m458 69 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"
        fill="#f57853"
      />
      <circle cx="438" cy="265" r="7" fill="#17bfc3" />
      <circle cx="88" cy="264" r="5" fill="#f57853" />
    </svg>
  );
}
