#!/usr/bin/env npx ts-node

import { program } from "commander";
import fs from "fs";
import { compare, getFileKeys, getProjectKeys, log } from "./script-utils";

export async function mainFunction(argv: string[]) {
  program
    .description("Get all wording-keys from a file that unused in a project")
    .option(
      "-c, --config <path>",
      "[Required] Path on config json file (ex: .clean_wording_config.json)"
    )
    .option(
      "-sp, --showAllProjectWordingKeys",
      "Show all detected project wording-keys"
    )
    .option(
      "-sf, --showAllFileWordingKeys",
      "Show all detected file wording-keys"
    )
    .option(
      "-spo, --showOrphanProjectKeys",
      "Show project wording-keys not present in the file wording-keys"
    )
    .option(
      "-sfo, --showOrphanFileWordingKeys",
      "[Default] Show file wording-keys not present in the project wording-keys"
    )
    .option("-v, --verbose", "show verbose logs")
    .parse(argv);

  const options = program.opts();

  if (!argv.slice(2).length || !options.config) {
    program.outputHelp();
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(options.config).toString());

  if (options.showAllProjectWordingKeys) {
    const projectKeys = getProjectKeys(
      config.projectSourcePath,
      config.projectSourceParser,
      options.verbose
    );
    log(projectKeys);
  } else if (options.showAllFileWordingKeys) {
    const fileKeys = await getFileKeys(
      config.wordingsSource,
      config.wordingsSourceParser
    );
    log(fileKeys);
  } else if (options.showOrphanProjectKeys) {
    const projectKeys = getProjectKeys(
      config.projectSourcePath,
      config.projectSourceParser,
      options.verbose
    );
    const fileKeys = await getFileKeys(
      config.wordingsSource,
      config.wordingsSourceParser
    );
    const diff = compare(projectKeys, fileKeys, "normal", "diff", false);
    log(diff);
  } else {
    const projectKeys = getProjectKeys(
      config.projectSourcePath,
      config.projectSourceParser,
      options.verbose
    );
    const fileKeys = await getFileKeys(
      config.wordingsSource,
      config.wordingsSourceParser
    );
    const diff = compare(projectKeys, fileKeys, "inverted", "diff", false);
    log(diff);
  }
}
