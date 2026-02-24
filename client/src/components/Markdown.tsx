import React from "react";

interface MarkdownProps {
  children: string;
  mode?: "static" | "streaming" | "typewriter";
  typewriterSpeed?: number;
  className?: string;
}

/**
 * Simple Markdown renderer component
 * For production use, consider using a library like react-markdown or markdown-to-jsx
 */
export function Markdown({
  children,
  mode = "static",
  typewriterSpeed = 50,
  className = "",
}: MarkdownProps) {
  const [displayedText, setDisplayedText] = React.useState("");

  React.useEffect(() => {
    if (mode === "typewriter") {
      let index = 0;
      const interval = setInterval(() => {
        if (index < children.length) {
          setDisplayedText(children.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, typewriterSpeed);

      return () => clearInterval(interval);
    } else {
      setDisplayedText(children);
    }
  }, [children, mode, typewriterSpeed]);

  // Basic markdown to HTML conversion
  const renderMarkdown = (text: string) => {
    // Convert bold **text** to <strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic *text* to <em>
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert code `text` to <code>
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // Convert line breaks
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: renderMarkdown(displayedText),
      }}
    />
  );
}
