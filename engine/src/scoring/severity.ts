import { MADSeverity } from "../domain/types";

export function severityFromScore(score: number): MADSeverity {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error(`Invalid MAD disorder score: ${score}`);
  }

  if (score >= 80) return MADSeverity.CRITICAL;
  if (score >= 60) return MADSeverity.HIGH;
  if (score >= 40) return MADSeverity.ELEVATED;
  if (score >= 20) return MADSeverity.WATCH;

  return MADSeverity.NORMAL;
}
