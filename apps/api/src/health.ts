export type HealthReport = {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
};

/**
 * Checks that the D1 database answers a trivial query.
 *
 * Failures are logged for operators but reported to callers only as
 * "unavailable": error text can reveal internals and must not reach clients.
 */
export async function checkHealth(db: D1Database): Promise<HealthReport> {
  try {
    await db.prepare("SELECT 1").first();
    return { status: "ok", database: "ok" };
  } catch (error) {
    console.error("Health check: database query failed", error);
    return { status: "degraded", database: "unavailable" };
  }
}
