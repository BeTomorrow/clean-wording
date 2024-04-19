import axios from "axios";
import fs from "fs";
import _ from "lodash";
import path from "path";
import util from "util";

interface ProjectSourceParser {
  matches: { regex: string; position?: number }[];
  replaces?: { regex: string; by?: string }[];
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
  operation: "diff" | "equal",
  include: boolean
) => {
  const listA = side === "normal" ? aKeys : bKeys;
  const listB = side === "normal" ? bKeys : aKeys;

  const doOperation = (a: string, b: string) => {
    const localKey = side === "normal" ? a : b;
    const serverKey = side === "normal" ? b : a;

    if (localKey === serverKey) {
      return true;
    }
    const diffRegex = new RegExp(
      `^${localKey
        .replace(new RegExp("\\.", "g"), "\\.")
        .replace(new RegExp("\\*", "g"), ".*")}$`
    );
    const regexResult = diffRegex.exec(serverKey);
    if (regexResult) {
      return true;
    }
    if (include && serverKey.includes(localKey)) {
      return true;
    }
    return false;
  };

  if (operation === "diff") {
    return getUniqSortedKeys(
      _.differenceWith(listA, listB, (a, b) => doOperation(a, b))
    );
  } else {
    let same: string[] = [];
    listA.forEach((a) => {
      listB.forEach((b) => {
        if (doOperation(a, b)) {
          same = [...same, a];
        }
      });
    });
    return getUniqSortedKeys(same);
  }
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
      path.join(__dirname, projectSourcePath),
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
      path.join(__dirname, wordingsSource),
      "utf-8"
    );
    keysDict = JSON.parse(content);
  } else if (wordingsSource.endsWith(".json")) {
    const content = fs.readFileSync(
      path.join(__dirname, wordingsSource),
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
  files.forEach((file) => {
    const folders: string[] = [];
    const filenames: string[] = [];

    if (file.split(".").length > 1) {
      filenames.push(file);
    } else {
      folders.push(file);
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

      projectSourceParser.matches.forEach(({ regex, position }) => {
        const regexGlobal = new RegExp(regex, "g");

        let match: RegExpExecArray | null;
        while ((match = regexGlobal.exec(content)) !== null) {
          if (verbose) console.log(" match " + match);
          if (match.index === regexGlobal.lastIndex) {
            regexGlobal.lastIndex++;
          }

          let matchValue = match[position ?? 1];
          if (matchValue.length === 0) {
            continue;
          }

          projectSourceParser.replaces?.forEach(
            (replace) =>
              (matchValue = matchValue.replace(
                new RegExp(replace.regex),
                replace.by ?? ""
              ))
          );

          if (matchValue) {
            keys = [...keys, matchValue];
          } else {
            console.log("ignore ", match[position ?? 1]);
          }
        }
      });
    });
  });

  return keys;
};

export const log = (array: any[]) => {
  console.log(util.inspect(array, { maxArrayLength: null }));
  console.log("TOTAL ", array.length);
};
