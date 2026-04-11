import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/playground/lsp": [
      "./node_modules/@vscjava/java-language-server/**/*",
      "./node_modules/@vscjava/java-ls-config-linux/**/*",
      "./node_modules/@vscjava/java-ls-config-win32/**/*",
      "./node_modules/clangd-linux/**/*",
      "./node_modules/pyright/**/*",
      "./node_modules/typescript/**/*",
      "./node_modules/typescript-language-server/**/*",
      "./node_modules/vscode-langservers-extracted/**/*",
    ],
  },
  poweredByHeader: false,
  serverExternalPackages: [
    "njre",
    "pyright",
    "typescript",
    "typescript-language-server",
    "vscode-langservers-extracted",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
