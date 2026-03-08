"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

export interface PageBuilderRef {
  getHtml: () => string;
  getCss: () => string;
  getProjectData: () => any;
  loadProjectData: (data: any) => void;
}

interface PageBuilderProps {
  projectData?: any;
  onReady?: () => void;
}

export const PageBuilderComponent = forwardRef<PageBuilderRef, PageBuilderProps>(
  function PageBuilderComponent({ projectData, onReady }, ref) {
    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useImperativeHandle(ref, () => ({
      getHtml: () => {
        if (!editorRef.current) return "";
        return editorRef.current.getHtml();
      },
      getCss: () => {
        if (!editorRef.current) return "";
        return editorRef.current.getCss() || "";
      },
      getProjectData: () => {
        if (!editorRef.current) return null;
        return editorRef.current.getProjectData();
      },
      loadProjectData: (data: any) => {
        if (editorRef.current && data) {
          editorRef.current.loadProjectData(data);
        }
      },
    }));

    useEffect(() => {
      if (initialized.current || !containerRef.current) return;
      initialized.current = true;

      async function initEditor() {
        const grapesjs = (await import("grapesjs")).default;
        const webpage = (await import("grapesjs-preset-webpage")).default;

        // Import GrapesJS CSS
        if (!document.getElementById("grapesjs-css")) {
          const link = document.createElement("link");
          link.id = "grapesjs-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/grapesjs/dist/css/grapes.min.css";
          document.head.appendChild(link);
        }

        const editor = grapesjs.init({
          container: containerRef.current!,
          height: "100%",
          width: "auto",
          storageManager: false,
          plugins: [webpage],
          pluginsOpts: {
            [webpage as any]: {
              blocks: ["link-block", "quote", "text-basic"],
            },
          },
          canvas: {
            styles: [
              "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
            ],
          },
          blockManager: {
            appendTo: "#blocks-panel",
          },
          panels: {
            defaults: [],
          },
        });

        // Add custom blocks for signup form embed
        editor.BlockManager.add("signup-form-embed", {
          label: "Signup Form",
          category: "Forms",
          content: `<div class="signup-form-embed" style="max-width:500px;margin:2rem auto;padding:2rem;background:#f8fafc;border-radius:0.5rem;text-align:center;">
            <h3 style="margin:0 0 0.5rem;font-size:1.5rem;font-weight:600;">Subscribe to our newsletter</h3>
            <p style="color:#64748b;margin:0 0 1.5rem;font-size:0.875rem;">Get the latest updates delivered to your inbox.</p>
            <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:320px;margin:0 auto;">
              <input type="email" placeholder="you@example.com" style="padding:0.625rem 0.875rem;border:1px solid #e2e8f0;border-radius:0.375rem;font-size:0.875rem;" />
              <button style="padding:0.625rem;background:#2563eb;color:white;border:none;border-radius:0.375rem;font-weight:600;cursor:pointer;">Subscribe</button>
            </div>
          </div>`,
          attributes: { class: "fa fa-envelope" },
        });

        editor.BlockManager.add("hero-section", {
          label: "Hero Section",
          category: "Sections",
          content: `<section style="padding:4rem 2rem;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;">
            <h1 style="font-size:3rem;font-weight:700;margin:0 0 1rem;line-height:1.2;">Your Headline Here</h1>
            <p style="font-size:1.25rem;max-width:600px;margin:0 auto 2rem;opacity:0.9;">A compelling description that makes visitors want to learn more about what you offer.</p>
            <a href="#" style="display:inline-block;padding:0.875rem 2rem;background:white;color:#667eea;border-radius:0.5rem;font-weight:600;text-decoration:none;">Get Started</a>
          </section>`,
          attributes: { class: "fa fa-star" },
        });

        editor.BlockManager.add("features-grid", {
          label: "Features Grid",
          category: "Sections",
          content: `<section style="padding:4rem 2rem;max-width:1000px;margin:0 auto;">
            <h2 style="text-align:center;font-size:2rem;font-weight:700;margin:0 0 3rem;">Why Choose Us</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;">
              <div style="text-align:center;padding:1.5rem;">
                <div style="font-size:2.5rem;margin-bottom:1rem;">🚀</div>
                <h3 style="font-size:1.25rem;font-weight:600;margin:0 0 0.5rem;">Feature One</h3>
                <p style="color:#64748b;font-size:0.875rem;margin:0;">Description of this amazing feature and why it matters.</p>
              </div>
              <div style="text-align:center;padding:1.5rem;">
                <div style="font-size:2.5rem;margin-bottom:1rem;">💡</div>
                <h3 style="font-size:1.25rem;font-weight:600;margin:0 0 0.5rem;">Feature Two</h3>
                <p style="color:#64748b;font-size:0.875rem;margin:0;">Description of this amazing feature and why it matters.</p>
              </div>
              <div style="text-align:center;padding:1.5rem;">
                <div style="font-size:2.5rem;margin-bottom:1rem;">⚡</div>
                <h3 style="font-size:1.25rem;font-weight:600;margin:0 0 0.5rem;">Feature Three</h3>
                <p style="color:#64748b;font-size:0.875rem;margin:0;">Description of this amazing feature and why it matters.</p>
              </div>
            </div>
          </section>`,
          attributes: { class: "fa fa-th" },
        });

        editor.BlockManager.add("cta-section", {
          label: "Call to Action",
          category: "Sections",
          content: `<section style="padding:4rem 2rem;text-align:center;background:#1e293b;color:white;">
            <h2 style="font-size:2rem;font-weight:700;margin:0 0 1rem;">Ready to Get Started?</h2>
            <p style="font-size:1.125rem;margin:0 auto 2rem;max-width:500px;opacity:0.8;">Join thousands of satisfied customers today.</p>
            <a href="#" style="display:inline-block;padding:0.875rem 2.5rem;background:#2563eb;color:white;border-radius:0.5rem;font-weight:600;text-decoration:none;">Sign Up Free</a>
          </section>`,
          attributes: { class: "fa fa-bullhorn" },
        });

        editor.BlockManager.add("footer", {
          label: "Footer",
          category: "Sections",
          content: `<footer style="padding:2rem;text-align:center;background:#f1f5f9;color:#64748b;font-size:0.875rem;">
            <p style="margin:0;">© 2026 Your Company. All rights reserved.</p>
          </footer>`,
          attributes: { class: "fa fa-minus" },
        });

        if (projectData) {
          editor.loadProjectData(projectData);
        }

        editorRef.current = editor;
        onReady?.();
      }

      initEditor();

      return () => {
        if (editorRef.current) {
          editorRef.current.destroy();
        }
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div style={{ display: "flex", height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <div
          id="blocks-panel"
          style={{
            width: "220px",
            overflow: "auto",
            borderRight: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        />
        <div ref={containerRef} style={{ flex: 1 }} />
      </div>
    );
  }
);
