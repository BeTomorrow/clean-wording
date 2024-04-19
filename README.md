# Clean-Wording

## Description

Utility for cleaning up unused wordings.

## Create configuration

Create wording config file named for exemple 'clean_wording_config.json' at your project root location.

All required config :

```
{
    "projectSourcePath": "<path_to_source_files>",
    "projectSourceParser": {
        "matches": [
            { "regex": "<regex>" },
        ]
    },
    "wordingsSource": "<path_to_source_wordings_file_or_url>",
}
```

All config :

```
{
    "projectSourcePath": "<path_to_source_files>",
    "projectSourceParser": {
        "matches": [
            { "regex": "<regex_1>" },
            { "regex": "<regex_2>" },
            ...
        ],
        "replaces": [
            { "regex": "<regex_1>", by: "<value_default_empty>" },
            { "regex": "<regex_2>", by: "<value_default_empty>" },
        ]
    },
    "wordingsSource": "<path_to_source_wordings_file_or_url>",
    "wordingsSourceParser": {
        "replaces": [
            { "regex": "<regex_1>", "by": "<value_default_empty>" }
        ]
    },
}
```

Exemple for a React project :

```
{
    "projectSourcePath": "src/",
    "projectSourceParser": {
        "matches": [{ "regex": "i18n\\.t\\("((.|\n)+?)"" }]
    },
    "wordingsSource": "assets/strings/map.json",
    "wordingsSourceParser": {
        "replaces": [
            {
                "_comment": "remove .zero & .one & .other",
                "regex": "(.zero|.one|.other)$"
            }
        ]
    },
}
```

Exemple for a Flutter project :

```
{
    "projectSourcePath": "lib/src/",
    "projectSourceParser": {
        "matches": [
            { regex: "context\\.curLocalizations\\.([a-zA-Z0-9_]+)" },
            { regex: "AppLocalizations\\.of\\(context\\)!?\\.([a-zA-Z0-9_]+)" },
        ]
    },
    "wordingsSource": "lib/asset/translations/intl_fr.arb",
    "wordingsSourceParser": {
        "replaces": [
            {
                "_comment": "remove all keys begining by @",
                "regex": "^@.*",
            }
        ]
    },
}
```

## Integration & Run

### React

Install it as dev dependencies

```
# With npm

npm install @bderrien/clean-wording --save-dev

# With yarn

yarn add @bderrien/clean-wording --save-dev
```

Add scripts lines to invoke tools easily with npm in package.json

```
{
    "scripts": {
        "clean-wording": "clean-wording -c clean_wording_config.json"
    }
}
```

### Flutter

Use directly this command

```
npx -p @bderrien/clean-wording clean-wording -c clean_wording_config.json
```

## Command options

```
Options:
    -c, --config <path>                [Required] Path on config json file (ex: clean-wording-config.json)
    -sp, --showAllProjectWordingKeys   Show all detected project wording-keys
    -sf, --showAllFileWordingKeys      Show all detected file wording-keys
    -spo, --showOrphanProjectKeys      Show project wording-keys not present in the file wording-keys
    -sfo, --showOrphanFileWordingKeys  [Default] Show file wording-keys not present in the project wording-keys
    -v, --verbose                      show verbose logs
    -h, --help                         display help for command
```
