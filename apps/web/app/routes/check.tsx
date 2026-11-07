import { COUNTRY_CODES } from "@ecf/model";
import { data, Form, Link } from "react-router";
import { apiGet, type LookupAnswer } from "../api.server";
import { Answer } from "../components/Answer";
import { cloudflareContext } from "../context";
import { CHECK, countryLabel, SITE_NAME } from "../copy";
import { checkSettings, lookupApiPath } from "../lib/lookup-path";
import type { Route } from "./+types/check";

const COUNTRIES = [...COUNTRY_CODES]
  .map((code) => ({ code, name: countryLabel(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { env, country } = context.get(cloudflareContext);
  const settings = checkSettings(new URL(request.url).searchParams, country);
  const result = await apiGet<LookupAnswer>(env.API, lookupApiPath(params.id, settings));
  if (!result.ok) throw data(result.message, { status: result.status === 400 ? 400 : 502 });
  return { answer: result.body, settings };
}

export function meta({ loaderData: loaded }: Route.MetaArgs) {
  const name = loaded?.answer.node?.name ?? loaded?.answer.query.node;
  return [{ title: name === undefined ? SITE_NAME : `${name} | ${SITE_NAME}` }];
}

export default function Check({ loaderData }: Route.ComponentProps) {
  const { answer, settings } = loaderData;
  const name = answer.node?.name ?? answer.query.node;
  return (
    <>
      <h1>{name}</h1>
      <p>{CHECK.asked(answer.query.country, answer.query.date)}</p>
      <Answer answer={answer} />
      {answer.node !== null && (
        <p>
          <Link to={`/profile/${encodeURIComponent(answer.node.id)}`}>{CHECK.profile(name)}</Link>
        </p>
      )}
      <Form method="get" aria-labelledby="settings">
        <h2 id="settings">{CHECK.settings}</h2>
        <p>
          <label htmlFor="country">{CHECK.country}</label>{" "}
          <select id="country" name="country" defaultValue={answer.query.country}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="date">{CHECK.date}</label>{" "}
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={settings.date ?? ""}
            aria-describedby="date-hint"
          />{" "}
          <span id="date-hint">{CHECK.dateHint}</span>
        </p>
        <p>
          <label htmlFor="minStakePct">{CHECK.minStakePct}</label>{" "}
          <input
            id="minStakePct"
            name="minStakePct"
            type="number"
            min={0}
            max={100}
            step="any"
            defaultValue={settings.minStakePct ?? answer.query.minStakePct}
          />
        </p>
        <p>
          <input
            id="includePassive"
            name="includePassive"
            type="checkbox"
            defaultChecked={settings.includePassive}
          />{" "}
          <label htmlFor="includePassive">{CHECK.includePassive}</label>
        </p>
        <button type="submit">{CHECK.update}</button>
      </Form>
    </>
  );
}
