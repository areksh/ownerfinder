import { Form } from "react-router";
import { SEARCH } from "../copy";

export function SearchForm({ value = "" }: { value?: string }) {
  return (
    <Form method="get" action="/search" role="search">
      <label htmlFor="q">{SEARCH.label}</label>{" "}
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={value}
        minLength={2}
        maxLength={100}
        required
      />{" "}
      <button type="submit">{SEARCH.button}</button>
    </Form>
  );
}
