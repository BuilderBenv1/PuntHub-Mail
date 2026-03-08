"use client";

import { type FormTheme } from "./themes";

interface FormThemePreviewProps {
  theme: FormTheme;
  heading: string;
  description: string;
  buttonText: string;
  showNameField: boolean;
  logoUrl?: string;
  compact?: boolean;
}

export function FormThemePreview({
  theme,
  heading,
  description,
  buttonText,
  showNameField,
  logoUrl,
  compact = false,
}: FormThemePreviewProps) {
  const scale = compact ? 0.6 : 0.8;

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor,
        padding: compact ? "12px" : "24px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? "180px" : "320px",
        transform: `scale(${scale})`,
        transformOrigin: "top center",
      }}
    >
      <div
        style={{
          backgroundColor: theme.cardBackground,
          borderRadius: theme.borderRadius,
          padding: compact ? "16px" : "24px",
          width: "100%",
          maxWidth: "360px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          fontFamily: theme.fontFamily,
        }}
      >
        {logoUrl && (
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxHeight: compact ? "28px" : "40px", margin: "0 auto" }}
            />
          </div>
        )}
        <h3
          style={{
            color: theme.textColor,
            fontSize: compact ? "14px" : "18px",
            fontWeight: 600,
            textAlign: "center",
            margin: "0 0 4px",
          }}
        >
          {heading || "Subscribe to our newsletter"}
        </h3>
        {description && (
          <p
            style={{
              color: theme.mutedTextColor,
              fontSize: compact ? "10px" : "13px",
              textAlign: "center",
              margin: "0 0 12px",
            }}
          >
            {description}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: compact ? "6px" : "10px" }}>
          {showNameField && (
            <div
              style={{
                backgroundColor: theme.inputBackground,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: theme.borderRadius,
                padding: compact ? "6px 8px" : "8px 12px",
                fontSize: compact ? "10px" : "13px",
                color: theme.mutedTextColor,
              }}
            >
              Your name
            </div>
          )}
          <div
            style={{
              backgroundColor: theme.inputBackground,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: theme.borderRadius,
              padding: compact ? "6px 8px" : "8px 12px",
              fontSize: compact ? "10px" : "13px",
              color: theme.mutedTextColor,
            }}
          >
            you@example.com
          </div>
          <div
            style={{
              backgroundColor: theme.buttonBackground,
              color: theme.buttonText,
              borderRadius: theme.borderRadius,
              padding: compact ? "6px 8px" : "10px 12px",
              fontSize: compact ? "11px" : "14px",
              fontWeight: 600,
              textAlign: "center",
              cursor: "default",
            }}
          >
            {buttonText || "Subscribe"}
          </div>
        </div>
        <p
          style={{
            color: theme.mutedTextColor,
            fontSize: compact ? "8px" : "10px",
            textAlign: "center",
            marginTop: compact ? "6px" : "10px",
          }}
        >
          No spam, unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

export function ThemeCard({
  theme,
  selected,
  onClick,
}: {
  theme: FormTheme;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/30"
      }`}
      style={{ width: "100%" }}
    >
      <FormThemePreview
        theme={theme}
        heading="Newsletter"
        description=""
        buttonText="Subscribe"
        showNameField={false}
        compact
      />
      <div className="p-2 bg-card border-t">
        <p className="text-xs font-medium">{theme.name}</p>
        <p className="text-[10px] text-muted-foreground">{theme.description}</p>
      </div>
    </button>
  );
}
