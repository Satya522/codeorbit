import { describe, expect, it } from "vitest";
import {
  getWebCorePreset,
  getWebCorePresetDefinitions,
  getWebCoreSuggestedPackages,
} from "@/lib/webcorePresets";

describe("webcore presets", () => {
  it("exposes frontend starter presets", () => {
    const presetIds = getWebCorePresetDefinitions().map((preset) => preset.id);

    expect(presetIds).toEqual(
      expect.arrayContaining([
        "vanilla-landing",
        "tailwind-ui",
        "react-ui",
        "three-scene",
        "chart-dashboard",
        "supabase-shell",
      ]),
    );
  });

  it("includes React dependencies in the React preset", () => {
    const reactPreset = getWebCorePreset("react-ui");

    expect(reactPreset.packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "react" }),
        expect.objectContaining({ name: "react-dom" }),
      ]),
    );
    expect(reactPreset.script).toContain("createRoot");
  });

  it("offers popular frontend package shortcuts", () => {
    const suggestedSpecifiers = getWebCoreSuggestedPackages().map((pkg) => pkg.specifier);

    expect(suggestedSpecifiers).toEqual(
      expect.arrayContaining([
        "react@19.2.4",
        "three@0.179.1",
        "tailwindcss@4",
        "bootstrap@5.3.3",
        "animate.css@4.1.1",
        "chart.js@4.5.1",
        "@supabase/supabase-js@2",
      ]),
    );
  });

  it("ships a compact Tailwind preset", () => {
    const tailwindPreset = getWebCorePreset("tailwind-ui");

    expect(tailwindPreset.packages).toEqual(expect.arrayContaining([expect.objectContaining({ name: "tailwindcss" })]));
    expect(tailwindPreset.styles).toContain('@import "tailwindcss";');
  });
});
