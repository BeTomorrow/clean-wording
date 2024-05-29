import axios from "axios";
import fs from "fs";
import _ from "lodash";
import path from "path";
import util from "util";

interface ProjectSourceSubParser {
  type: "match" | "replace" | "ignore";
  regex: string;
  position?: number | null;
  by?: string | null;
  post_regex?:
    | ProjectSourceMatchParser
    | ProjectSourceReplaceParser
    | ProjectSourceIgnoreParser;
}

type ProjectSourceMatchParser = ProjectSourceSubParser & {
  type: "match";
  position?: number;
  by?: null;
};

type ProjectSourceReplaceParser = ProjectSourceSubParser & {
  type: "replace";
  by?: string;
  position?: null;
};

type ProjectSourceIgnoreParser = ProjectSourceSubParser & {
  type: "ignore";
  by?: null;
  position?: null;
};

interface ProjectSourceParser {
  parser: (ProjectSourceSubParser | ProjectSourceReplaceParser)[];
  onlyFilesWithExtensions?: string[];
}

interface WordingSourceParser {
  replaces?: { regex: string; by?: string }[];
}

export const dotNotate = (
  obj: { [key: string]: any },
  target: { [key: string]: string } = {},
  prefix = ""
) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      dotNotate(obj[key], target, prefix + key + ".");
    } else {
      return (target[prefix + key] = obj[key]);
    }
  });

  return target;
};

export const getUniqSortedKeys = (array: any[]) => {
  return [...new Set(array)].sort();
};

export const compare = (
  aKeys: string[],
  bKeys: string[],
  side: "normal" | "inverted",
  dynamicRegexValue: string | null
) => {
  const listA = side === "normal" ? aKeys : bKeys;
  const listB = side === "normal" ? bKeys : aKeys;

  const doOperation = (a: string, b: string) => {
    const localKey = side === "normal" ? a : b;
    const serverKey = side === "normal" ? b : a;

    if (localKey === serverKey) {
      return true;
    }
    if (dynamicRegexValue) {
      const diffRegex = new RegExp(
        `^${localKey.replace(new RegExp(dynamicRegexValue, "g"), ".*")}$`
      );
      const regexResult = diffRegex.exec(serverKey);
      if (regexResult) {
        return true;
      }
    }
    return false;
  };

  return getUniqSortedKeys(
    _.differenceWith(listA, listB, (a, b) => doOperation(a, b))
  );
};

export const getProjectKeys = (
  projectSourcePath: string | null,
  projectSourceParser: ProjectSourceParser | null,
  verbose: boolean = false
) => {
  if (!projectSourcePath) {
    throw Error("No project source path");
  }
  if (!projectSourceParser) {
    throw Error("No project parser");
  }

  return getUniqSortedKeys(
    getKeysInFolder(
      path.join(process.cwd(), projectSourcePath),
      projectSourceParser,
      verbose
    )
  );
};

export const getFileKeys = async (
  wordingsSource: string | null,
  wordingsSourceParser?: WordingSourceParser
) => {
  if (!wordingsSource) {
    throw Error("No file wordings path");
  }

  let keysDict = {};

  if (wordingsSource.startsWith("http")) {
    const result = (await axios.get(wordingsSource)).data;
    keysDict = dotNotate(result);
  } else if (wordingsSource.endsWith(".arb")) {
    const content = fs.readFileSync(
      path.join(process.cwd(), wordingsSource),
      "utf-8"
    );
    keysDict = JSON.parse(content);
  } else if (wordingsSource.endsWith(".json")) {
    const content = fs.readFileSync(
      path.join(process.cwd(), wordingsSource),
      "utf-8"
    );
    keysDict = dotNotate(JSON.parse(content));
  } else {
    throw Error(
      "File wording-keys format not suported (only use .arb & .json)"
    );
  }

  let keyArray = Object.keys(keysDict);
  wordingsSourceParser?.replaces?.forEach((replace) => {
    keyArray = keyArray.map((key) => {
      return key.replace(new RegExp(replace.regex), replace.by ?? "");
    });
  });

  keyArray = keyArray.filter((key) => !!key);

  return getUniqSortedKeys(keyArray);
};

export const getKeysInFolder = (
  dirname: string,
  projectSourceParser: ProjectSourceParser,
  verbose: Boolean
) => {
  let keys: string[] = [];

  const files = fs.readdirSync(dirname);
  files?.forEach((file) => {
    const folders: string[] = [];
    const filenames: string[] = [];

    const fileSplitted = file.split(".");
    if (fileSplitted.length == 1) {
      folders.push(file);
    } else if (fileSplitted.length == 2) {
      const fileExtension = fileSplitted[1];
      if (projectSourceParser.onlyFilesWithExtensions === undefined) {
        filenames.push(file);
      } else {
        if (
          projectSourceParser.onlyFilesWithExtensions.includes(fileExtension)
        ) {
          filenames.push(file);
        } else {
          if (verbose)
            console.log(
              "file ignored because not valid file extension " + file
            );
        }
      }
    } else {
      if (verbose) console.log("file ignored because bad format " + file);
    }

    folders.forEach((folder) => {
      keys = [
        ...keys,
        ...getKeysInFolder(
          dirname + "/" + folder,
          projectSourceParser,
          verbose
        ),
      ];
    });

    filenames.forEach((filename) => {
      if (verbose) console.log("file " + filename);

      const content = fs.readFileSync(dirname + "/" + filename, "utf-8");

      projectSourceParser.parser.forEach((parser) => {
        keys = [...keys, ...parserContent(parser, content, verbose, 1)];
      });
    });
  });

  return keys;
};

export const parserContent = (
  parser: ProjectSourceSubParser | ProjectSourceReplaceParser,
  content: string,
  verbose: Boolean,
  depth: number
): string[] => {
  let keys: string[] = [];

  if (parser.type === "replace") {
    const replacedContent = content.replace(
      new RegExp(parser.regex),
      parser.by ?? ""
    );

    if (parser.post_regex) {
      keys = parserContent(parser.post_regex, replacedContent, verbose, depth);
    } else if (replacedContent) {
      if (verbose)
        console.log(" ".repeat(depth + 1) + "found '" + replacedContent + "'");
      keys = [replacedContent];
    }
  }

  if (parser.type === "match") {
    const regexGlobal = new RegExp(parser.regex, "g");

    let match: RegExpExecArray | null;
    while ((match = regexGlobal.exec(content)) !== null) {
      if (verbose) console.log(" ".repeat(depth) + "match " + match);
      if (match.index === regexGlobal.lastIndex) {
        regexGlobal.lastIndex++;
      }

      if (match.length <= 1) {
        continue;
      }

      const matchValue = match[parser.position ?? 1];
      if (!matchValue) {
        continue;
      }

      if (parser.post_regex) {
        keys = [
          ...keys,
          ...parserContent(parser.post_regex, matchValue, verbose, depth + 1),
        ];
      } else {
        if (verbose)
          console.log(" ".repeat(depth + 1) + "found '" + matchValue + "'");
        keys = [...keys, matchValue];
      }
    }
  }

  if (parser.type === "ignore") {
    const regex = new RegExp(parser.regex);
    if (regex.test(content)) {
      if (verbose)
        console.log(" ".repeat(depth + 1) + "ignore '" + content + "'");
    } else {
      if (parser.post_regex) {
        keys = [
          ...keys,
          ...parserContent(parser.post_regex, content, verbose, depth + 1),
        ];
      } else {
        if (verbose)
          console.log(" ".repeat(depth + 1) + "found '" + content + "'");
        keys = [...keys, content];
      }
    }
  }

  return keys;
};

export const log = (array: any[]) => {
  console.log("keys: " + util.inspect(array, { maxArrayLength: null }));
  console.log("TOTAL ", array.length);
};
