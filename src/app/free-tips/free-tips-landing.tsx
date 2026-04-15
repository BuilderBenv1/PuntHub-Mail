"use client";

import { useState } from "react";

const FORM_ID = "555347e5-c7b1-4e3f-9d17-a39adb306994";

export function FreeTipsLanding() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, form_id: FORM_ID }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0f1a",
        color: "#fff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1a 0%, #1a2332 50%, #0d1f2d 100%)",
          padding: "60px 20px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: "640px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(22,163,74,0.15)",
              border: "1px solid rgba(22,163,74,0.3)",
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "13px",
              color: "#4ade80",
              fontWeight: 600,
              marginBottom: "24px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            100% Free - No Card Required
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 0 20px",
              letterSpacing: "-1px",
            }}
          >
            Free Daily
            <br />
            <span style={{ color: "#4ade80" }}>Racing Tips</span>
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              lineHeight: 1.6,
              margin: "0 0 40px",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Expert horse racing selections delivered to your inbox every morning.
            Join thousands of punters already getting an edge.
          </p>

          {/* Signup Form */}
          {submitted ? (
            <div
              style={{
                background: "rgba(22,163,74,0.1)",
                border: "1px solid rgba(22,163,74,0.3)",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "440px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#fff"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: "0 0 8px",
                }}
              >
                You're in!
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "15px", margin: 0, lineHeight: 1.5 }}>
                Check your inbox for a confirmation email.
                <br />
                Click the link and you'll get tomorrow's tips.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                maxWidth: "440px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexDirection: "column",
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    fontSize: "16px",
                    borderRadius: "10px",
                    border: "1px solid #2a3441",
                    backgroundColor: "#111827",
                    color: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "16px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "background-color 0.2s, transform 0.1s",
                  }}
                >
                  {loading ? "Subscribing..." : "Get Free Tips"}
                </button>
              </div>
              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  {error}
                </p>
              )}
              <p
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  marginTop: "12px",
                }}
              >
                No spam. Unsubscribe anytime with one click.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* What you get */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "60px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          What you'll get
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              title: "Daily Tips by 9am",
              desc: "Selections landed in your inbox before the first race, every day.",
            },
            {
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              title: "Full Transparency",
              desc: "Every result tracked and published. No hiding the losers.",
            },
            {
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              title: "Completely Free",
              desc: "No hidden charges, no premium upsell required. Just free tips.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "28px 24px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(22,163,74,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#4ade80"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  margin: "0 0 8px",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          borderTop: "1px solid #1e293b",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          PuntHub - Free racing tips delivered daily.
        </p>
      </div>
    </div>
  );
}
