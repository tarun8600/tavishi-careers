import Link from "next/link";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/saved-jobs", label: "Saved" },
  { href: "/resumes", label: "Resumes" },
  { href: "/applications", label: "Applications" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  return (
    <header className="tc-nav">
      <div className="tc-container tc-nav-inner">
        <Logo />
        <nav aria-label="Main" className="tc-nav-links">
          {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
