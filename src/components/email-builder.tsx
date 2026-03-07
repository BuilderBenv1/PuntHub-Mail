"use client";

import { useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";

const EmailEditor = dynamic(
  () => import("react-email-editor").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50"><p className="text-muted-foreground">Loading email builder...</p></div> }
);

export interface EmailBuilderRef {
  exportHtml: () => Promise<{ html: string; design: any }>;
  loadDesign: (design: any) => void;
}

interface EmailBuilderProps {
  initialDesign?: any;
  minHeight?: string;
  onReady?: () => void;
}

export const EmailBuilderComponent = forwardRef<EmailBuilderRef, EmailBuilderProps>(
  function EmailBuilderComponent({ initialDesign, minHeight = "600px", onReady }, ref) {
    const editorRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      exportHtml: () => {
        return new Promise((resolve) => {
          if (!editorRef.current?.editor) {
            resolve({ html: "", design: null });
            return;
          }
          editorRef.current.editor.exportHtml((data: any) => {
            resolve({ html: data.html, design: data.design });
          });
        });
      },
      loadDesign: (design: any) => {
        if (editorRef.current?.editor && design) {
          editorRef.current.editor.loadDesign(design);
        }
      },
    }));

    const handleReady = useCallback(() => {
      if (initialDesign && editorRef.current?.editor) {
        editorRef.current.editor.loadDesign(initialDesign);
      }
      onReady?.();
    }, [initialDesign, onReady]);

    return (
      <div style={{ minHeight }}>
        <EmailEditor
          ref={editorRef}
          onReady={handleReady}
          options={{
            mergeTags: [
              { name: "Unsubscribe Link", value: "{unsubscribe_url}" },
              { name: "Preferences Link", value: "{preferences_url}" },
              { name: "Subscriber ID", value: "{subscriber_id}" },
            ],
            features: {
              textEditor: { spellChecker: true },
            },
            appearance: {
              theme: "modern_light",
            },
          }}
          style={{ minHeight }}
        />
      </div>
    );
  }
);
