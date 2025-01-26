# Porting Wikipedia to Bliptext
Welcome! This folder contains the following:
- `convert_wiki_script.js` - The tester, reading `input.txt` (Wikipedia's raw code) and porting it to `output.md` (Bliptext's raw code). Meant for testing the porter with singular files.
- `wikipedia_to_blip.js` - The porter, exporting a JS function that takes in Wikipedia's raw code and returns Bliptext compatible Markdown.
- `wikidump_to_json.py` - The converter, because Wikipedia's `enwiki-20241201-pages-articles-multistream.xml` is a fucking mess. This converts it into JSONL (JSON Lines) with `{ title: String, text: String }`.
- `importer.js` - The importer, reading the JSONL from **converter**, calling **porter** on the `text`, and calling `http://localhost:3000/admin/new` with the content.

In order to allow `importer.js` to call SvelteKit, please modify `svelte.config.js` with the following:
```js
const config = {
    // ...
	kit: {
        // ...
		csrf: {
			checkOrigin: false,
		}
    }
}
```

## Known issues
- Images can be `/commons/` or `/en/`, with no info about which to use. We call `fetch()` to check, but it can fail and default, leading to a nonexistent image. 
- Sentences including special formats (tables, codeblocks, etc.) are excluded, but their paragraphs aren't. That leads to empty headers at the end of the article.

**NOTE:** Most of this code is written by an LLM. It ran at 1000req/s peak, 13req/s worst. Restarting it & providing a higher `START_FROM_ARTICLE` makes it temporarily faster.