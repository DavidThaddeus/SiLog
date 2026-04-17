"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

/**
 * Renders logbook technicalNotes text with:
 * - Markdown: numbered lists, bullets, bold, sub-items
 * - <u>TEXT</u> → underlined headings (via rehype-raw)
 * - $equation$ / $$equation$$ → rendered via KaTeX
 * - DIAGRAM SUGGESTION: → visually distinct dashed box
 */

/** Force each (i)(ii)(iii) sub-item into its own paragraph before rendering */
function preprocessText(text: string): string {
  return text
    // Double newline before every (i)(ii)(iii) that appears mid-line — markdown needs \n\n for a new paragraph
    .replace(/([^\n])\s+(\([ivxIVX]+\))/g, "$1\n\n$2");
}

export function LogbookText({ text }: { text: string }) {
  const diagIdx = text.search(/DIAGRAM SUGGESTION:/i);
  const rawMain = diagIdx !== -1 ? text.slice(0, diagIdx).trimEnd() : text;
  const mainText = preprocessText(rawMain);
  const diagText = diagIdx !== -1 ? text.slice(diagIdx) : null;

  return (
    <>
      <div className="logbook-text">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            // Paragraphs — indent (i)(ii)(iii) sub-item lines
            p: ({ children }) => {
              const firstText = React.Children.toArray(children)
                .map(c => typeof c === "string" ? c : "")
                .join("");
              if (/^\s*\([ivxIVX]+\)/.test(firstText)) {
                return (
                  <p style={{ margin: "2px 0 4px 24px", lineHeight: 1.75 }}>
                    {children}
                  </p>
                );
              }
              return <p style={{ margin: "0 0 10px 0", lineHeight: 1.75 }}>{children}</p>;
            },
            // Ordered lists (1. 2. 3.)
            ol: ({ children }) => (
              <ol style={{ margin: "8px 0 10px 0", paddingLeft: 22, lineHeight: 1.75 }}>
                {children}
              </ol>
            ),
            // Unordered lists (-)
            ul: ({ children }) => (
              <ul style={{ margin: "8px 0 10px 0", paddingLeft: 22, lineHeight: 1.75 }}>
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: 4 }}>{children}</li>
            ),
            // Bold
            strong: ({ children }) => (
              <strong style={{ fontWeight: 700 }}>{children}</strong>
            ),
            // Inline code (fallback for mono terms)
            code: ({ children }) => (
              <code style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.9em", background: "rgba(140,90,60,0.08)", padding: "1px 5px", borderRadius: 3 }}>
                {children}
              </code>
            ),
          }}
        >
          {mainText}
        </ReactMarkdown>
      </div>

      {diagText && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1.5px dashed rgba(140,90,60,0.4)",
            background: "rgba(140,90,60,0.05)",
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--text-muted)",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-mono)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8C5A3C",
              marginBottom: 4,
            }}
          >
            ✏ Diagram Suggestion
          </span>
          {diagText.replace(/^DIAGRAM SUGGESTION:\s*/i, "")}
        </div>
      )}
    </>
  );
}
