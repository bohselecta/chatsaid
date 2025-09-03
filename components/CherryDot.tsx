export default function CherryDot({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="inline-block align-text-top cursor-pointer"
    >
      <circle cx="32" cy="40" r="18" fill="#e11d48" /> {/* cherry red */}
      <path
        d="M32 22 C32 12, 44 10, 48 2"
        stroke="#15803d"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}
