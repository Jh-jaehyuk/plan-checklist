# Contributing

Thanks for helping out. This is a Claude Code mod: a hooks module that Claude Code loads as a plugin. It is not an npm package, so the dev loop goes through the `claude` CLI.

## Run it from your clone

```sh
claude --plugin-dir /path/to/plan-checklist
```

That session loads the mod straight from the folder, and saving a file reloads it. If you also installed `plan-checklist` from the marketplace, disable that copy first (`claude plugin disable plan-checklist@plan-checklist`) so the two don't collide.

## Check your change

```sh
claude plugin validate .   # manifest, hooks module, state contract
claude plugin test .       # tests/*.test.ts against the real engine
```

Type-check after Claude Code has loaded the mod once. Loading writes `.claude-plugin/types/` and `tsconfig.json`; both are git-ignored.

```sh
npx -p typescript tsc -p .
```

Write the test first and watch it fail before you write the fix. `tests/band.test.ts` shows how to draw the band at a given width and press its button.

## Where things live

| File | What it holds |
| --- | --- |
| `hooks/register.tsx` | The hooks: plan approval, the `plan_check` tool, `/checklist`, the reminder, the band |
| `hooks/plan.ts` | Pure logic: extracting steps, checking with evidence, the reminder text, band layout, `/checklist` text |
| `hooks/messages.ts` | Every string the mod shows or tells Claude, per language |
| `types/index.d.ts` | The session state contract |

## Adding a language

1. Add the language code to `Lang` in `hooks/messages.ts`, along with a full `Messages` table. The type checker tells you if a string is missing.
2. Map the code in `messagesFor`.
3. Add the code to `userConfig.language.options` in `.claude-plugin/plugin.json`.
4. Add a test that sets `{ options: { language: '<code>' } }` and checks one toast.

## Pull requests

- Keep each PR to one change, and describe what a user will see differently.
- Bump `version` in `.claude-plugin/plugin.json` and add a `CHANGELOG.md` entry when behavior changes. `claude plugin update` only picks up a new version.
