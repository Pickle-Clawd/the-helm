/**
 * Shared model display utilities used across the dashboard.
 */

/** Returns Tailwind classes for color-coded model badges */
export function getModelBadgeClass(model?: string): string {
  if (!model) return "";
  if (model.includes("opus")) return "bg-purple-500/15 text-purple-400 border-purple-500/25";
  if (model.includes("sonnet")) return "bg-blue-500/15 text-blue-400 border-blue-500/25";
  if (model.includes("gemini") && model.includes("flash")) return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  if (model.includes("gemini")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  return "bg-muted text-muted-foreground";
}

/** Strip provider prefix for cleaner display */
export function shortModel(model?: string): string {
  if (!model) return "default";
  return model.replace(/^(anthropic\/|google-gemini-cli\/|openai\/)/, "");
}

/** Estimate cost in USD based on total tokens and model (rough approximation) */
export function estimateCost(totalTokens?: number, model?: string): number | null {
  if (!totalTokens || !model) return null;
  // Use a blended rate (assume ~40% input, ~60% output as rough approximation)
  // Opus: input $15/MTok, output $75/MTok → blended ~$51/MTok
  // Sonnet: input $3/MTok, output $15/MTok → blended ~$10.2/MTok
  // Gemini flash: very cheap ~$0.3/MTok blended
  // Gemini pro: ~$5/MTok blended
  let ratePerMTok = 10; // default to sonnet-ish
  if (model.includes("opus")) ratePerMTok = 51;
  else if (model.includes("sonnet")) ratePerMTok = 10.2;
  else if (model.includes("gemini") && model.includes("flash")) ratePerMTok = 0.3;
  else if (model.includes("gemini")) ratePerMTok = 5;
  return (totalTokens / 1_000_000) * ratePerMTok;
}

/** Format cost as dollar string */
export function formatCost(cost: number | null): string {
  if (cost === null) return "";
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}
