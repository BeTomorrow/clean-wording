import { compare, getFileKeys, getProjectKeys } from "../src/script-utils";

test("Flutter - show project wording keys", () => {
  const keys = getProjectKeys("test/project/flutter/src", {
    matches: [{ regex: "localizations\\.([a-zA-Z0-9_]+)" }],
  });

  expect(keys).toStrictEqual([
    "wording",
    "wordingOnlyInProject",
    "wordingWithParameter",
  ]);
});

test("Flutter - show project wording keys - with multiple regexes", () => {
  const keys = getProjectKeys("test/project/flutter/src", {
    matches: [
      { regex: "localizations\\.([a-zA-Z0-9_]+)" },
      { regex: "AppLocalizations\\.of\\(context\\)!?\\.([a-zA-Z0-9_]+)" },
    ],
  });

  expect(keys).toStrictEqual([
    "wording",
    "wordingOnlyInProject",
    "wordingWithNewRegex",
    "wordingWithParameter",
  ]);
});

test("Flutter - show file wording keys (with .arb)", async () => {
  const keys = await getFileKeys("test/project/flutter/wordings.arb");

  expect(keys).toStrictEqual([
    "@wordingWithParameter",
    "wording",
    "wordingOnlyInFile",
    "wordingWithParameter",
  ]);
});

test("Flutter - show file wording keys (with .arb) - with ignore some keys", async () => {
  const keys = await getFileKeys("test/project/flutter/wordings.arb", {
    replaces: [{ regex: "^@.*", by: "" }],
  });

  expect(keys).toStrictEqual([
    "wording",
    "wordingOnlyInFile",
    "wordingWithParameter",
  ]);
});

test("Flutter - show file wording keys (with .arb) - with ignore and transform some keys", async () => {
  const keys = await getFileKeys("test/project/flutter/wordings.arb", {
    replaces: [
      { regex: "^@.*", by: "" },
      { regex: "wordingWithParameter$", by: "wordingWithCustom" },
    ],
  });

  expect(keys).toStrictEqual([
    "wording",
    "wordingOnlyInFile",
    "wordingWithCustom",
  ]);
});

test("Flutter - show unused file wording keys", async () => {
  const projectKeys = getProjectKeys("test/project/flutter/src", {
    matches: [{ regex: "localizations\\.([a-zA-Z0-9_]+)" }],
  });
  const fileKeys = await getFileKeys("test/project/flutter/wordings.arb", {
    replaces: [{ regex: "^@.*", by: "" }],
  });
  const diffKeys = compare(projectKeys, fileKeys, "inverted", "diff", false);

  expect(diffKeys).toStrictEqual(["wordingOnlyInFile"]);
});

test("React - show project wording keys", () => {
  const keys = getProjectKeys("test/project/react/src", {
    matches: [{ regex: 'i18n\\.t\\("((.|\n)+?)"' }],
  });

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInProject",
    "wording.withCounter",
    "wording.withParameter",
  ]);
});

test("React - show project wording keys - with ignore some keys", () => {
  const keys = getProjectKeys("test/project/react/src", {
    matches: [{ regex: 'i18n\\.t\\("((.|\n)+?)"' }],
    replaces: [{ regex: "^.*\\.withParameter$" }],
  });

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInProject",
    "wording.withCounter",
  ]);
});

test("React - show project wording keys - with transform some keys", () => {
  const keys = getProjectKeys("test/project/react/src", {
    matches: [{ regex: 'i18n\\.t\\("((.|\n)+?)"' }],
    replaces: [{ regex: "\\.withParameter$", by: ".withCustom" }],
  });

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInProject",
    "wording.withCounter",
    "wording.withCustom",
  ]);
});

test("React - show file wording keys (with .json)", async () => {
  const keys = await getFileKeys("test/project/react/wordings.json");

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInFile",
    "wording.withCounter.one",
    "wording.withCounter.other",
    "wording.withCounter.zero",
    "wording.withParameter",
  ]);
});

test("React - show file wording keys (with .json) - with transform some keys", async () => {
  const keys = await getFileKeys("test/project/react/wordings.json", {
    replaces: [{ regex: "(.zero|.one|.other)$" }],
  });

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInFile",
    "wording.withCounter",
    "wording.withParameter",
  ]);
});

test("React - show file wording keys (with .json flatten)", async () => {
  const keys = await getFileKeys("test/project/react/wordings_flatten.json");

  expect(keys).toStrictEqual([
    "wording.default",
    "wording.onlyInFile",
    "wording.withCounter.one",
    "wording.withCounter.other",
    "wording.withCounter.zero",
    "wording.withParameter",
  ]);
});

test("React - show file wording keys (with url)", async () => {
  const keys = await getFileKeys(
    "https://jsonplaceholder.typicode.com/todos/1"
  );

  expect(keys).toStrictEqual(["completed", "id", "title", "userId"]);
});

test("React - show unused file wording keys", async () => {
  const projectKeys = getProjectKeys("test/project/react/src", {
    matches: [{ regex: 'i18n\\.t\\("((.|\n)+?)"' }],
  });
  const fileKeys = await getFileKeys("test/project/react/wordings.json", {
    replaces: [{ regex: "(.zero|.one|.other)$" }],
  });
  const diffKeys = compare(projectKeys, fileKeys, "inverted", "diff", false);

  expect(diffKeys).toStrictEqual(["wording.onlyInFile"]);
});
