import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="tc-logo" aria-label="Tavishi Careers home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 24a12 12 0 0 1 24 0" fill="none" stroke="#B8E3CF" strokeWidth="4" strokeLinecap="round" />
        <path d="M8 24a8 8 0 0 1 16 0" fill="none" stroke="#9CCBEA" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 24a4 4 0 0 1 8 0" fill="none" stroke="#267569" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <b>Tavishi</b><small>Careers</small>
    </Link>
  );
}
