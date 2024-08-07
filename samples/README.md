# Samples for common languages in all 4 supported modes

The [samples/.vscode/settings.json](samples/.vscode/settings.json) in the repo is a good place for reference.  
You can use the files in `samples/` to test if the configurations work for you. Make them unformatted and try your config.  
You should have the cli installed and available locally in the `$PATH` for the commands to work

## Prettier
[Prettier](https://prettier.io/docs/en/install) is an opinionated code formatter with support for JavaScript, JSX, Angular, Vue, Flow, TypeScript,CSS, Less, SCSS, HTML, Ember/Handlebars, JSON, GraphQL, Markdown, YAML

Use any one of the following. Refer [Modes](../README.md#modes) for more info
#### **inline_file**
```jsonc
{
  // settings.json
  // ...
  "[json]" : {
    "editor.defaultFormatter": "djpai.faster-format-with-cli",
    "djpai.format.command": "npx prettier --write --ignore-unknown \"{file}\"",
    "djpai.format.mode": "inline_file"
  }
  // ...
}
```

#### **inline_file_stdout**
```jsonc
{
  // settings.json
  // ...
  "[json]" : {
    "editor.defaultFormatter": "djpai.faster-format-with-cli",
    "djpai.format.command": "npx prettier --ignore-unknown \"{file}\"",
    "djpai.format.mode": "inline_file_stdout"
  },
  // ..
}
```

#### **inline_stdin**
```jsonc
{
  // settings.json
  // ...
  "[json]" : {
    "editor.defaultFormatter": "djpai.faster-format-with-cli",
    "djpai.format.command": "npx prettier --write --stdin-filepath \"{file}\" --ignore-unknown",
    "djpai.format.mode": "inline_stdin"
  }
  // ...
}
```

#### **overwrite**
```jsonc
{
  // settings.json
  // ...
  "[json]" : {
    "editor.defaultFormatter": "djpai.faster-format-with-cli",
    "djpai.format.command": "npx prettier --write --ignore-unknown \"{file}\"",
    "djpai.format.mode": "overwrite",
    "editor.formatOnSave": true,
  // ...
  }
}
```
