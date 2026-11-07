import { data, Form, useActionData } from "react-router";
import { cloudflareContext } from "../context";
import { REQUEST, SITE_NAME } from "../copy";
import { createIssue, parseRequestForm, verifyTurnstile } from "../lib/request.server";
import type { Route } from "./+types/request";

const ISSUES = "https://github.com/areksh/ownerfinder/issues";

function settings(env: Env) {
  const open =
    env.TURNSTILE_SITE_KEY !== "" && Boolean(env.TURNSTILE_SECRET_KEY) && Boolean(env.GITHUB_TOKEN);
  return { open, siteKey: env.TURNSTILE_SITE_KEY };
}

export function loader({ context }: Route.LoaderArgs) {
  return settings(context.get(cloudflareContext).env);
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  if (
    !settings(env).open ||
    env.TURNSTILE_SECRET_KEY === undefined ||
    env.GITHUB_TOKEN === undefined
  ) {
    return data({ errors: { form: REQUEST.closed } }, { status: 503 });
  }
  const form = await request.formData();
  const parsed = parseRequestForm(form);
  if (!parsed.ok) return data({ errors: parsed.errors }, { status: 400 });
  const human = await verifyTurnstile(
    String(form.get("cf-turnstile-response") ?? ""),
    env.TURNSTILE_SECRET_KEY,
    request.headers.get("cf-connecting-ip") ?? undefined,
  );
  if (!human) return data({ errors: { form: REQUEST.notVerified } }, { status: 400 });
  try {
    const url = await createIssue(parsed.input, { token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO });
    return { submitted: url };
  } catch (error) {
    console.error("Request form: could not create the issue", error);
    return data({ errors: { form: REQUEST.failed } }, { status: 502 });
  }
}

export function meta() {
  return [{ title: `${REQUEST.title} | ${SITE_NAME}` }];
}

export default function Request({ loaderData }: Route.ComponentProps) {
  const result = useActionData<typeof action>();
  const errors: Record<string, string | undefined> =
    result !== undefined && "errors" in result ? result.errors : {};
  if (result !== undefined && "submitted" in result) {
    return (
      <>
        <h1>{REQUEST.thanks}</h1>
        <p>
          {REQUEST.submitted} <a href={result.submitted}>{result.submitted}</a>
        </p>
      </>
    );
  }
  if (!loaderData.open) {
    return (
      <>
        <h1>{REQUEST.title}</h1>
        <p>
          {REQUEST.useGitHub} <a href={`${ISSUES}/new`}>{REQUEST.openIssue}</a>.
        </p>
      </>
    );
  }
  const field = (name: string) =>
    errors[name] === undefined ? {} : { "aria-invalid": true, "aria-describedby": `${name}-error` };
  const error = (name: string) =>
    errors[name] === undefined ? null : (
      <span id={`${name}-error`} role="alert">
        {errors[name]}
      </span>
    );
  return (
    <>
      <h1>{REQUEST.title}</h1>
      <p>{REQUEST.intro}</p>
      <p>{REQUEST.privacy}</p>
      {errors.form !== undefined && <p role="alert">{errors.form}</p>}
      <Form method="post">
        <p>
          <label htmlFor="subject">{REQUEST.subject}</label>
          <br />
          <input
            id="subject"
            name="subject"
            required
            minLength={3}
            maxLength={200}
            size={50}
            {...field("subject")}
          />{" "}
          {error("subject")}
        </p>
        <p>
          <label htmlFor="change">{REQUEST.change}</label>
          <br />
          <textarea
            id="change"
            name="change"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            cols={50}
            {...field("change")}
          />{" "}
          {error("change")}
        </p>
        <p>
          <label htmlFor="sources">{REQUEST.sources}</label>
          <br />
          <textarea id="sources" name="sources" required rows={3} cols={50} {...field("sources")} />{" "}
          {error("sources")}
        </p>
        <div className="cf-turnstile" data-sitekey={loaderData.siteKey} />
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        <p>
          <button type="submit">{REQUEST.send}</button>
        </p>
      </Form>
    </>
  );
}
