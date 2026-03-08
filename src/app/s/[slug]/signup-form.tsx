"use client";

import { useState } from "react";

type FormThemeColors = {
  backgroundColor: string;
  cardBackground: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  buttonBackground: string;
  buttonText: string;
  buttonHoverBackground: string;
  borderRadius: string;
  fontFamily: string;
};

type Form = {
  id: string;
  name: string;
  slug: string;
  heading: string;
  description: string | null;
  button_text: string;
  success_message: string;
  tag_ids: string[];
  redirect_url: string | null;
  show_name_field?: boolean;
  logo_url?: string | null;
};

export function SignupFormPage({ form, theme }: { form: Form; theme: FormThemeColors }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [buttonHover, setButtonHover] = useState(false);

  const showNameField = form.show_name_field !== false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, form_id: form.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (form.redirect_url) {
        window.location.href = form.redirect_url;
        return;
      }

      setMessage(data.message || form.success_message);
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.backgroundColor,
        padding: "16px",
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: theme.cardBackground,
          borderRadius: theme.borderRadius,
          padding: "32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        {form.logo_url && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.logo_url}
              alt=""
              style={{ maxHeight: "48px", margin: "0 auto" }}
            />
          </div>
        )}
        <h1
          style={{
            color: theme.textColor,
            fontSize: "24px",
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          {form.heading}
        </h1>
        {form.description && (
          <p
            style={{
              color: theme.mutedTextColor,
              fontSize: "15px",
              textAlign: "center",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            {form.description}
          </p>
        )}

        {submitted ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: theme.accentColor,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={theme.buttonText} strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p style={{ color: theme.textColor, fontSize: "18px", fontWeight: 600 }}>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {showNameField && (
              <div>
                <label
                  style={{
                    display: "block",
                    color: theme.textColor,
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "6px",
                  }}
                >
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  style={{
                    width: "100%",
                    backgroundColor: theme.inputBackground,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: theme.borderRadius,
                    padding: "10px 14px",
                    fontSize: "15px",
                    color: theme.inputText,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
            <div>
              <label
                style={{
                  display: "block",
                  color: theme.textColor,
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  backgroundColor: theme.inputBackground,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: theme.borderRadius,
                  padding: "10px 14px",
                  fontSize: "15px",
                  color: theme.inputText,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#ef4444", fontSize: "14px", margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
              style={{
                width: "100%",
                backgroundColor: buttonHover ? theme.buttonHoverBackground : theme.buttonBackground,
                color: theme.buttonText,
                border: "none",
                borderRadius: theme.borderRadius,
                padding: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "background-color 0.2s",
              }}
            >
              {loading ? "Subscribing..." : form.button_text}
            </button>
            <p
              style={{
                color: theme.mutedTextColor,
                fontSize: "12px",
                textAlign: "center",
                margin: 0,
              }}
            >
              We&apos;ll send you a confirmation email. No spam, unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
