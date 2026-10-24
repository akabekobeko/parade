import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { SmartPlaylistRules } from "../ipc/types";
import { buildSmartSql } from "./buildSmartSql";

/** Row of the count query below. */
const countRowSchema = z.object({ count: z.number().int() });

/**
 * Count the tracks a smart playlist's rules select
 * (`docs/specs/v1.6/architecture/database.md`, `musicCount`).
 *
 * Wraps the SELECT of `buildSmartSql` in `SELECT COUNT(*)`: the rules'
 * `limit` is inside the subquery, so the count stops at the limit too, and
 * the sort (even `random`) cannot change the result.
 *
 * @param db - The open library connection.
 * @param rules - The decoded rule document.
 * @param now - Evaluation instant for relative date conditions.
 * @returns Number of matching tracks.
 */
export const countSmartPlaylistMusics = (
  db: DatabaseSync,
  rules: SmartPlaylistRules,
  now: Date,
): number => {
  const { sql, params } = buildSmartSql(rules, now);
  return countRowSchema.parse(
    db.prepare(`SELECT COUNT(*) AS count FROM (${sql})`).get(...params),
  ).count;
};
