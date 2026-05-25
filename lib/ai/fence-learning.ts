import type { AdaptiveFenceSuggestion, FenceLearningEvent } from "@/lib/types";

const RECENT_DISMISS_DAYS = 21;
const RECENT_ACCEPT_DAYS = 21;

export function recentlyDismissedSuggestionIds(events: FenceLearningEvent[], now = new Date()) {
  const cutoff = now.getTime() - RECENT_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return new Set(
    events
      .filter((event) => event.decision === "dismissed" && new Date(event.createdAt).getTime() >= cutoff)
      .map((event) => event.suggestionId)
  );
}

export function learningScoreForSuggestion(suggestion: Pick<AdaptiveFenceSuggestion, "categoryId" | "type">, events: FenceLearningEvent[]) {
  return events.reduce((score, event) => {
    if (event.categoryId !== suggestion.categoryId || event.suggestionType !== suggestion.type) return score;
    if (event.decision === "accepted" || event.decision === "marked-useful") return score + 1;
    if (event.decision === "dismissed") return score - 0.8;
    return score;
  }, 0);
}

export function filterLearnedSuggestions<T extends AdaptiveFenceSuggestion>(suggestions: T[], events: FenceLearningEvent[], now = new Date()) {
  const dismissed = recentlyDismissedSuggestionIds(events, now);
  const acceptedCutoff = now.getTime() - RECENT_ACCEPT_DAYS * 24 * 60 * 60 * 1000;
  const accepted = new Set(
    events
      .filter((event) => (event.decision === "accepted" || event.decision === "marked-useful") && new Date(event.createdAt).getTime() >= acceptedCutoff)
      .map((event) => event.suggestionId)
  );
  return suggestions.filter((suggestion) => !dismissed.has(suggestion.id) && !accepted.has(suggestion.id));
}
