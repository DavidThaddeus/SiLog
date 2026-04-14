"use client";

import React from "react";

/**
 * Renders logbook technicalNotes text with:
 * - <u>TEXT</u> → actual underlined spans (headings)
 * - DIAGRAM SUGGESTION: → visually distinct dashed box
 * - Line breaks preserved
 */

function renderLine(line: string, key: number): React.ReactNode {
  // Split on <u>...</u> tags (case-insensitive, handles multiword)
  const parts = line.split(/(<u>[\s\S]*?<\/u>)/i);
  if (parts.length === 1) return line;
  return (
    <React.Fragment key={key}>
      {parts.map((part, i) => {
        const match = part.match(/^<u>([\s\S]*?)<\/u>$/i);
        if (match) {
          return (
            <span key={i} style={{ textDecoration: "underline", fontWeight: 600 }}>
              {match[1]}
            </span>
          );
        }
        return part;
      })}
    </React.Fragment>
  );
}

function renderMainText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {renderLine(line, i)}
      {i < lines.length - 1 && "\n"}
    </React.Fragment>
  ));
}

export function LogbookText({ text }: { text: string }) {
  const diagIdx = text.search(/DIAGRAM SUGGESTION:/i);
  const mainText = diagIdx !== -1 ? text.slice(0, diagIdx).trimEnd() : text;
  const diagText = diagIdx !== -1 ? text.slice(diagIdx) : null;

  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>
        {renderMainText(mainText)}
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
