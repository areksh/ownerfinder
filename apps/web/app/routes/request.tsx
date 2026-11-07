import { SITE_NAME } from "../copy";

export function meta() {
  return [{ title: `Request a change | ${SITE_NAME}` }];
}

export default function Request() {
  return (
    <>
      <h1>Request a change</h1>
      <p>
        To ask for a company or brand to be added, or for a correction, please{" "}
        <a href="https://github.com/areksh/ownerfinder/issues/new">open an issue on GitHub</a> with
        at least one source.
      </p>
    </>
  );
}
