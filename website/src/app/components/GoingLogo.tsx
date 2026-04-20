export function GoingLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="72" cy="18" r="8" fill="#ff4c41" />
      <path
        d="M68 26 C68 26 58 30 50 40 C38 54 34 68 38 80 C42 92 58 96 70 90 C82 84 86 70 82 58 C78 46 66 42 58 46 C50 50 48 60 52 68 C56 76 64 76 70 70"
        stroke="#ff4c41"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
