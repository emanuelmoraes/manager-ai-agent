"use client";

import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";

interface SwaggerUIOptions {
  url: string;
  dom_id: string;
  deepLinking?: boolean;
  presets?: unknown[];
  plugins?: unknown[];
  layout?: string;
  defaultModelsExpandDepth?: number;
  docExpansion?: "list" | "full" | "none";
}

interface SwaggerUIBundleType {
  (options: SwaggerUIOptions): unknown;
  presets: { apis: unknown };
  plugins: { DownloadUrl: unknown };
}

export default function ApiDocsPage() {
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!bundleLoaded || !presetLoaded || initializedRef.current) {
      return;
    }

    const win = window as unknown as {
      SwaggerUIBundle?: SwaggerUIBundleType;
      SwaggerUIStandalonePreset?: unknown;
    };

    if (typeof win.SwaggerUIBundle === "function") {
      win.SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          win.SwaggerUIBundle.presets.apis,
          win.SwaggerUIStandalonePreset,
        ],
        plugins: [
          win.SwaggerUIBundle.plugins.DownloadUrl,
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
      });
      initializedRef.current = true;
    }
  }, [bundleLoaded, presetLoaded]);

  return (
    <div style={{ minHeight: "100vh", width: "100%", backgroundColor: "#ffffff" }}>
      {/* Folha de estilos do Swagger UI */}
      <link rel="stylesheet" type="text/css" href="/swagger-ui/swagger-ui.css" />

      {/* Scripts estáticos do Swagger UI */}
      <Script
        src="/swagger-ui/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => setBundleLoaded(true)}
      />
      <Script
        src="/swagger-ui/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
        onLoad={() => setPresetLoaded(true)}
      />

      <div id="swagger-ui" />

      <style jsx global>{`
        html,
        body {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #3b4151 !important;
          margin: 0;
          padding: 0;
        }
        .swagger-ui .topbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
