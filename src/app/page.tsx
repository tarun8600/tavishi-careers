import Link from "next/link";

const STEPS = [
  { tone: "mint", title: "Discover worldwide", body: "Search roles from verified employer sources in the United States, Worldwide or any country, with filters for workplace, salary, seniority and employment type." },
  { tone: "sky", title: "Prepare with care", body: "Keep several resumes for different career paths and prepare an application for each role." },
  { tone: "lavender", title: "You approve every submission", body: "Nothing is sent without your explicit approval. Track each application from draft to offer." },
];

export default function Home() {
  return (
    <>
      <section className="tc-hero" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <p className="tc-badge tc-tone-mint" style={{ marginBottom: 16 }}>Worldwide career platform</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", maxWidth: 760, margin: "0 auto 1rem" }}>
          Find work that fits you, anywhere in the world.
        </h1>
        <p style={{ fontSize: "1.125rem", maxWidth: 620, margin: "0 auto 2rem", color: "var(--text-muted)" }}>
          Explore real openings, organize your resumes and stay in control of every application.
        </p>
        <form action="/jobs" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
          <input type="search" name="q" placeholder="Job title, skill, or company" aria-label="Search jobs" style={{ flex: "1 1 280px", borderRadius: "var(--r-pill)", padding: "0 1.25rem" }} />
          <button type="submit" className="tc-btn tc-btn-primary">Search jobs</button>
        </form>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 40 }}>
        {STEPS.map((s) => (
          <div key={s.title} className="tc-card tc-card-hover">
            <span className={`tc-badge tc-tone-${s.tone}`}>{s.title}</span>
            <p style={{ marginTop: 12 }}>{s.body}</p>
          </div>
        ))}
      </section>

      <section className="tc-card" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Ready to start?</h2>
          <p className="tc-hint" style={{ margin: 0 }}>Sign in with Google to set up your career profile.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" className="tc-btn tc-btn-primary">Sign in</Link>
          <Link href="/jobs" className="tc-btn tc-btn-secondary">Browse jobs</Link>
        </div>
      </section>
    </>
  );
}
