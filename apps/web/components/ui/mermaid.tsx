"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  /** Mermaid diagram source (e.g. a `flowchart LR ...` string). */
  chart: string;
  className?: string;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Renders a Mermaid.js diagram on the client. Mermaid touches the DOM, so it is
 * dynamically imported and only runs after mount. The diagram re-renders when the
 * chart source or the active (light/dark) theme changes.
 */
export function MermaidDiagram({ chart, className, onNodeClick }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const onNodeClickRef = useRef(onNodeClick);
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    let cancelled = false;
    // Mermaid ids must be valid CSS selectors — strip React's colons.
    const renderId = `mmd-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          flowchart: { curve: "basis", padding: 12 },
          fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
        });

        const { svg } = await mermaid.render(renderId, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);

          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            const nodes = svgElement.querySelectorAll(".node");
            nodes.forEach((node) => {
              const idAttr = node.getAttribute("id");
              if (idAttr) {
                const match = idAttr.match(/flowchart-([^-]+)-\d+/);
                if (match && match[1]) {
                  const nodeId = match[1];
                  if (onNodeClickRef.current) {
                    (node as HTMLElement).style.cursor = "pointer";
                    node.addEventListener("click", () => {
                      onNodeClickRef.current?.(nodeId);
                    });
                  }
                }
              }
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, reactId]);

  if (error) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        Could not render diagram.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full justify-center overflow-x-auto [&_svg]:max-w-full", className)}
      aria-label="Pipeline diagram"
    />
  );
}
