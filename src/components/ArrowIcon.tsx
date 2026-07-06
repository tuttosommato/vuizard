export default function ArrowIcon({ size = 24, stroke = 2 }: { size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={stroke}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
