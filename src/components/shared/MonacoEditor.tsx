"use client";

import type { EditorProps } from "@monaco-editor/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";

function EditorLoadingState() {
  return (
    <div
      className="flex flex-1 items-center justify-center bg-[#0e0e15] text-xs text-zinc-600"
      style={{ fontFamily: "var(--font-mono), 'SF Mono', monospace" }}
    >
      <span className="flex items-center gap-2">
        <span className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        Loading editor...
      </span>
    </div>
  );
}

const EditorComponent = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <EditorLoadingState />,
  }
);

export default function MonacoEditor(props: EditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Parameters<NonNullable<EditorProps["onMount"]>>[0] | null>(null);

  const handleMount = useCallback<NonNullable<EditorProps["onMount"]>>(
    (editor, monaco) => {
      editorRef.current = editor;
      editor.layout();
      props.onMount?.(editor, monaco);
    },
    [props]
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      editorRef.current?.layout();
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="h-full w-full min-w-0" ref={containerRef}>
      <EditorComponent
        {...props}
        onMount={handleMount}
        options={{
          ...props.options,
          automaticLayout: true,
          wordWrap: props.options?.wordWrap ?? "on",
        }}
        width="100%"
      />
    </div>
  );
}
