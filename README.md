# Clean-Wording

## Description

Utility for cleaning up unused wordings.

## Create configuration

Create wording config file named for exemple '.clean_wording_config.json' at your project root location.

All required config :

```
{
    "projectSourcePath": "<path_to_source_files>",
    "projectSourceParser": {
        "parser": [
            { "type":"match", "regex": "<regex>" },
        ]
    },
    "wordingsSource": "<path_to_source_wordings_file_or_url>",
}
```

All configs :

```
{
    "projectSourcePath": "<path_to_source_files>",
    "projectSourceParser": {
        "parser": [
            {
                "type": "<match/replace>",
                "regex": "<regex_1_1>",
                "position": <match__extract_value_index_default_1>,
                "by": "<replace__value_default_empty>",
                "post_regex": {
                    "type":"<match/replace>",
                    "regex": "<regex_1_2>",
                    "post_regex": {
                        ...
                    }
                }
            },
            ...
        ],
        onlyFilesWithExtensions: ["<extension_1>", ...]
    },
    "wordingsSource": "<path_to_source_wordings_file_or_url>",
    "wordingsSourceParser": {
        "replaces": [
            { "regex": "<regex>", "by": "<value_default_empty>" },
            ...
        ],
    },
    "compare" : {
        "dynamicRegexValue": "<regex>"
    }
}
```

Exemple for a React project (simple) :

```
{
    "projectSourcePath": "src/",
    "projectSourceParser": {
        "parser": [{ "type": "match", "regex": "i18n\\.t\\(\"((.|\n)+?)\"" }]
    },
    "wordingsSource": "assets/strings/map.json",
    "wordingsSourceParser": {
        "replaces": [
            {
                "_comment": "remove .zero & .one & .other",
                "regex": "(.zero|.one|.other)$"
            }
        ]
    }
}
```

Exemple for a React project (more complexe -> trying to manage dynamic wordings) :

```
{
  "projectSourcePath": "src/",
  "projectSourceParser": {
    "parser": [
      {
        "_comment": "match all I18n.t(*)",
        "type": "match",
        "regex": "I18n\\.t\\(((?:[^()]*|\\((?:[^()]*|\\([^()]*\\))*\\))*)\\)",
        "post_regex": {
          "_comment": "match all \"*\" ",
          "type": "match",
          "regex": "(?:\"|`|')(.*?)(?:\"|`|')",
          "post_regex": {
            "_comment": "replace dynamic value by *",
            "type": "replace",
            "regex": "(\\${.*})",
            "by": "*",
            "post_regex": {
              "_comment": "keep only valid wordings because previous regex can have bad values",
              "type": "replace",
              "regex": "^.*[^a-zA-Z0-9._\\-*].*$",
            }
          }
        }
      }
    ]
  },
  "wordingsSource": "assets/strings/EN-en.json"
  "wordingsSourceParser": {
        "replaces": [
            {
                "_comment": "remove wordings used only for config, store, ...",
                "regex": "(NSCameraUsageDescription)|<...>"
            }
        ]
    }
  "compare" : {
    "dynamicRegexValue": "\\*"
  }
}
```

Exemple for a Flutter project :

```
{
    "projectSourcePath": "lib/src/",
    "projectSourceParser": {
        "parser": [
            { "type": "match", "regex": "context\\.curLocalizations\\.([a-zA-Z0-9_]+)" },
            { "type": "match", "regex": "AppLocalizations\\.of\\(context\\)!?\\.([a-zA-Z0-9_]+)" }
        ]
    },
    "wordingsSource": "lib/asset/translations/intl_fr.arb",
    "wordingsSourceParser": {
        "replaces": [
            {
                "_comment": "remove all keys begining by @",
                "regex": "^@.*"
            }
        ]
    }
}
```

## Integration & Run

### React

Install it as dev dependencies

```
# With npm

npm install @betomorrow/clean-wording --save-dev

# With yarn

yarn add @betomorrow/clean-wording --save-dev
```

Add scripts lines to invoke tools easily with npm in package.json

```
{
    "scripts": {
        "clean-wording": "clean-wording -c .clean_wording_config.json"
    }
}
```

### Flutter

Use directly this command

```
npx -p @betomorrow/clean-wording clean-wording -c .clean_wording_config.json
```

## Command options

```
Options:
    -c, --config <path>                [Required] Path on config json file (ex: .clean_wording_config.json)
    -sp, --showAllProjectWordingKeys   Show all detected project wording-keys
    -sf, --showAllFileWordingKeys      Show all detected file wording-keys
    -spo, --showOrphanProjectKeys      Show project wording-keys not present in the file wording-keys
    -sfo, --showOrphanFileWordingKeys  [Default] Show file wording-keys not present in the project wording-keys
    -v, --verbose                      show verbose logs
    -h, --help                         display help for command
```
