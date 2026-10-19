
"use client";

import { useMemo, useState } from "react";
import { jobs } from "../../lib/demo-jobs";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workplace, setWorkplace] = useState("all");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const query = search.toLowerCase().trim();
      const place = location.toLowerCase().trim();

      const searchableText = [
        job.title,
        job.company,
        job.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesLocation =
        !place || job.location.toLowerCase().includes(place);

      // Basic demo classification. Replace with structured
      // workplaceType fields when connecting a real jobs API.
      const jobLocation = job.location.toLowerCase();

      const matchesWorkplace =
        workplace === "all" ||
        (workplace === "remote" &&
          jobLocation.includes("remote")) ||
        (workplace === "hybrid" &&
          jobLocation.includes("hybrid")) ||
        (workplace === "onsite" &&
          !jobLocation.includes("remote") &&
          !jobLocation.includes("hybrid"));

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWorkplace
      );
    });
  }, [search, location, workplace]);

  return (
    <main style={{ fontFamily: "Arial, sans-serif" }}>
      <section
        style={{
          background: "linear-gradient(135deg, #10233f, #155a91)",
          color: "white",
          padding: "48px 32px",
          borderRadius: 16,
          marginBottom: 28,
        }}
      >
        <p style={{ color: "#a9d9ff", fontWeight: 700 }}>
          TAVISHI CAREERS
        </p>

        <h1 style={{ fontSize: 38, margin: "10px 0" }}>
          Explore opportunities
        </h1>

        <p style={{ lineHeight: 1.6, maxWidth: 650 }}>
          Search career opportunities across the United
          States. Find roles that match your interests
          and take the next step in your career.
        </p>
      </section>

      <section
        style={{
          background: "white",
          border: "1px solid #dce3ed",
          borderRadius: 14,
          padding: 24,
          marginBottom: 25,
        }}
      >
        <h2 style={{ marginTop: 0, color: "#10233f" }}>
          Find your next job
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 15,
          }}
        >
          <label style={{ display: "grid", gap: 8 }}>
            Job title or company
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. SOC Analyst"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            U.S. location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            Work arrangement
            <select
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              style={inputStyle}
            >
              <option value="all">All arrangements</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <h2 style={{ color: "#10233f", margin: 0 }}>
            Available jobs
          </h2>

          <span style={{ color: "#526174" }}>
            {filteredJobs.length} results
          </span>
        </div>

        {filteredJobs.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid #dce3ed",
              padding: 35,
              textAlign: "center",
              borderRadius: 14,
            }}
          >
            <h3>No matching jobs found</h3>
            <p>Try a different job title or location.</p>

            <button
              onClick={() => {
                setSearch("");
                setLocation("");
                setWorkplace("all");
              }}
              style={buttonStyle}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                style={{
                  background: "white",
                  border: "1px solid #dce3ed",
                  borderRadius: 14,
                  padding: 25,
                  boxShadow:
                    "0 4px 18px rgba(16,35,63,0.04)",
                }}
              >
                <h3
                  style={{
                    fontSize: 23,
                    color: "#10233f",
                    margin: "0 0 10px",
                  }}
                >
                  {job.title}
                </h3>

                <p style={{ color: "#155a91", fontWeight: 600 }}>
                  {job.company}
                </p>

                <p style={{ color: "#526174" }}>
                  📍 {job.location}
                </p>

                <p
                  style={{
                    lineHeight: 1.7,
                    color: "#344054",
                  }}
                >
                  {job.description}
                </p>

                <button
                  disabled
                  style={{
                    ...buttonStyle,
                    opacity: 0.55,
                    cursor: "not-allowed",
                  }}
                >
                  Apply — Coming Soon
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p
        style={{
          marginTop: 35,
          textAlign: "center",
          fontSize: 13,
          color: "#667085",
        }}
      >
        Demo listings only. Live job feeds and application
        submissions are not yet connected.
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 13,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 15,
  background: "white",
  color: "#10233f",
};

const buttonStyle: React.CSSProperties = {
  background: "#155a91",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "12px 22px",
  fontWeight: 700,
  cursor: "pointer",
};
