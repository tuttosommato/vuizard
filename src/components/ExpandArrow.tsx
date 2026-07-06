export default function ExpandArrow({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.2s ease",
        transform: isExpanded ? "rotate(-180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M0 3 l6 6 6 -6" />
    </svg>
  );
}
