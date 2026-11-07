import { SITE_NAME } from "../copy";

export function meta() {
  return [{ title: `Data | ${SITE_NAME}` }];
}

export default function Data() {
  return (
    <>
      <h1>Data</h1>
      <p>
        All of the ownership data is open. <a href="/data/graph.json">Download it as JSON</a>; it is
        rebuilt from the project's repository on every update.
      </p>
      <p>
        The data is published under the{" "}
        <a href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License 1.0</a>: you
        may use and share it, credit the project and its sources, and share what you build from it
        under the same terms. Each record names its own sources.
      </p>
      <p>
        The same data is available through a public JSON API; see the{" "}
        <a href="https://github.com/areksh/ownerfinder/blob/master/docs/api.md">
          API documentation
        </a>
        .
      </p>
    </>
  );
}
