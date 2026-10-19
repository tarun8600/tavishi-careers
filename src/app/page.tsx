
export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif" }}>
      <section
        style={{
          background: "linear-gradient(135deg, #10233f, #155a91)",
          color: "white",
          borderRadius: 18,
          padding: "75px 35px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#9ed8ff", fontWeight: 700 }}>
          TAVISHI CAREERS
        </p>

        <h1 style={{ fontSize: "clamp(32px, 5vw, 58px)", margin: "16px 0" }}>
          Your next career opportunity starts here.
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 650, margin: "0 auto 30px" }}>
          Discover career opportunities across the United States.
          Explore jobs, prepare your resume, and take control of your
          application journey.
        </p>

        <form action="/jobs" method="get" style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center"
        }}>
          <input
            type="search"
            name="q"
            placeholder="Job title, skill, or company"
            aria-label="Search jobs"
            style={{
              padding: 16,
              borderRadius: 9,
              border: "none",
              minWidth: 250,
              fontSize: 16,
            }}
          />

          <button type="submit" style={{
            background: "#f5bd4f",
            color: "#10233f",
            padding: "16px 28px",
            border: "none",
            borderRadius: 9,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}>
            Find Jobs →
          </button>
        </form>
      </section>

      <section style={{ padding: "55px 0" }}>
        <h2 style={{ fontSize: 32, marginBottom: 12 }}>
          Everything you need for your job search
        </h2>

        <p style={{ color: "#526174", marginBottom: 30 }}>
          One place to explore opportunities and prepare for your next role.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 18,
        }}>
          {[
            {
              icon: "🔍",
              title: "Discover Jobs",
              description: "Explore career opportunities across the United States."
            },
            {
              icon: "📄",
              title: "Resume Tools",
              description: "Prepare and organize resumes tailored to your career goals."
            },
            {
              icon: "✨",
              title: "AI Assistance",
              description: "Get help preparing job applications while keeping control of submissions."
            },
            {
              icon: "📊",
              title: "Track Progress",
              description: "Keep track of opportunities and your application journey."
            }
          ].map((feature) => (
            <article key={feature.title} style={{
              padding: 25,
              border: "1px solid #e0e5ed",
              borderRadius: 14,
              background: "white",
              color: "#14233d",
            }}>
              <div style={{ fontSize: 32 }}>{feature.icon}</div>
              <h3 style={{ marginBottom: 10 }}>{feature.title}</h3>
              <p style={{ color: "#526174", lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{
        textAlign: "center",
        padding: "45px 20px",
        background: "#eaf2fb",
        borderRadius: 16,
        color: "#10233f"
      }}>
        <h2>Ready to explore new opportunities?</h2>
        <p>Start browsing available sample listings.</p>
        <a href="/jobs" style={{
          display: "inline-block",
          background: "#155a91",
          color: "white",
          textDecoration: "none",
          padding: "14px 26px",
          borderRadius: 8,
          fontWeight: 700,
          marginTop: 10,
        }}>
          Explore Jobs →
        </a>
      </section>

      <p style={{
        marginTop: 30,
        textAlign: "center",
        fontSize: 13,
        color: "#667085",
      }}>
        Demo preview. Live job feeds, accounts, and application submissions
        are not yet configured.
      </p>
    </main>
  );
}
