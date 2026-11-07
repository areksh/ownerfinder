/** The check page's settings, read from its URL, and the API path they ask for. */
import { isCountryCode } from "@ecf/model";

export const DEFAULT_COUNTRY = "GB";

export interface CheckSettings {
  country: string;
  date?: string;
  minStakePct?: string;
  includePassive: boolean;
}

/**
 * The country comes from the URL, else Cloudflare's guess at the
 * visitor's, else GB. Other settings are kept only when set; the API
 * checks their values.
 */
export function checkSettings(query: URLSearchParams, visitorCountry?: string): CheckSettings {
  const asked = query.get("country");
  const country =
    asked !== null && asked !== ""
      ? asked
      : visitorCountry !== undefined && isCountryCode(visitorCountry)
        ? visitorCountry
        : DEFAULT_COUNTRY;
  const settings: CheckSettings = { country, includePassive: query.get("includePassive") === "on" };
  const date = query.get("date");
  if (date !== null && date !== "") settings.date = date;
  const pct = query.get("minStakePct");
  if (pct !== null && pct !== "") settings.minStakePct = pct;
  return settings;
}

export function lookupApiPath(id: string, settings: CheckSettings): string {
  const params = new URLSearchParams({ country: settings.country });
  if (settings.date !== undefined) params.set("date", settings.date);
  if (settings.minStakePct !== undefined) params.set("minStakePct", settings.minStakePct);
  if (settings.includePassive) params.set("includePassive", "true");
  return `/lookup/${encodeURIComponent(id)}?${params}`;
}
