# AI search visibility data

How often ChatGPT Search, Perplexity and Gemini Search cite and name the brands in each software category, as published on [devtune.ai/verticals](https://devtune.ai/verticals). Each folder holds one category's rankings, copied from devtune.ai every Monday, so the git history is a dated record of how those rankings change.

For the current figures, use the live files on devtune.ai. This repository is the archive.

## Files

| Path | What it holds | Live copy |
|---|---|---|
| `verticals/data.json` | Every published category, with its page, data file, data window and when the file was built | [devtune.ai/verticals/data.json](https://devtune.ai/verticals/data.json) |
| `verticals/<slug>/data.json` | One category: platforms, counts, and each brand's presence rate and brand mention rate with their ranks and 90% ranges, plus its presence rate and brand mention rate on each platform | `https://devtune.ai/verticals/<slug>/data.json` |

Every file describes its own fields in a top-level `fields` object. A value the page shows as `Unmeasured` is `null`. `schemaVersion` changes only when a field is renamed, removed or changes meaning.

To see a category's history, run `git log -p verticals/<slug>/data.json`.

## How it's measured

DevTune asks each category's buyer questions on each AI platform and records which brands each answer names, and which brands' own sites it cites. The [methodology](https://devtune.ai/verticals/methodology) sets out the whole method. Each [category page](https://devtune.ai/verticals) shows the figures with their 90% ranges, and the `fields` object in each file defines every value.

## Licence and citation

The data is licensed under [CC BY 4.0](LICENSE). You may reuse it for any purpose if you credit DevTune and link the category's page. Each file carries its own citation in plain text, HTML and BibTeX under `citation`, for example:

> DevTune. (2026-11-17). Cloud Cost Management & FinOps AI Search Visibility Rankings [Data set]. https://devtune.ai/verticals/cloud-cost-management-finops

Cite the date in the citation, which is the end of the file's data window, so readers can find the same figures in this archive.

## Updates

A GitHub Actions workflow (`.github/workflows/snapshot.yml`) runs `scripts/snapshot.mjs` every Monday at 06:00 UTC. It copies the index and every category file, removes categories that are no longer published, and commits whatever changed.

The weeks from 1 June to 16 November 2026 were backfilled with `scripts/backfill.mjs`: each file was recomputed from DevTune's stored runs as of that Monday, with the method in use when it was backfilled, and carries that Monday in `asOf`. A category is missing from a week when it wasn't tracked yet or its stored runs for that week had expired.
