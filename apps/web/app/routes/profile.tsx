import { data, Link } from "react-router";
import { apiGet, type CriteriaAnswer, type NodeAnswer } from "../api.server";
import { LinkItem, numberSources } from "../components/LinkItem";
import { Reasons } from "../components/Reasons";
import { Sources } from "../components/Sources";
import { cloudflareContext } from "../context";
import { PROFILE, SITE_NAME } from "../copy";
import type { Route } from "./+types/profile";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const [result, criteria] = await Promise.all([
    apiGet<NodeAnswer>(env.API, `/nodes/${encodeURIComponent(params.id)}`),
    apiGet<CriteriaAnswer>(env.API, "/criteria"),
  ]);
  if (!result.ok) {
    throw data(result.message, {
      status: result.status === 400 || result.status === 404 ? result.status : 502,
    });
  }
  return { ...result.body, criteria: criteria.ok ? criteria.body.criteria : [] };
}

export function meta({ loaderData: answer }: Route.MetaArgs) {
  return [{ title: answer === undefined ? SITE_NAME : `${answer.node.name} | ${SITE_NAME}` }];
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { node, listing, heldBy, holds, sources, criteria } = loaderData;
  const sourceNumber = numberSources(sources);
  const section = (title: string, links: typeof heldBy) => (
    <section aria-labelledby={title}>
      <h2 id={title}>{title}</h2>
      {links.length === 0 ? (
        <p>{PROFILE.none}</p>
      ) : (
        <ul>
          {links.map((link) => (
            <LinkItem key={link.id} link={link} sourceNumber={sourceNumber} />
          ))}
        </ul>
      )}
    </section>
  );
  return (
    <>
      <h1>{node.name}</h1>
      <p>
        <Link to={`/check/${encodeURIComponent(node.id)}`}>{PROFILE.check(node.name)}</Link>
      </p>
      {listing !== null && (
        <section aria-labelledby="listing">
          <h2 id="listing">{PROFILE.listing}</h2>
          <Reasons evidence={listing.evidence} criteria={criteria} sourceNumber={sourceNumber} />
        </section>
      )}
      {section(PROFILE.heldBy, heldBy)}
      {section(PROFILE.holds, holds)}
      <Sources sources={sources} />
    </>
  );
}
