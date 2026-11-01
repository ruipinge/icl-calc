# Self-hosted fonts

No font is ever loaded from another origin (no CDN). Each face has one role;
see "Typography" in the repository's `CLAUDE.md`.

| file | role | source |
|---|---|---|
| `poppins-300-latin.woff2`, `poppins-500-latin.woff2` | labels, headings, micro-caps | byte-identical to what the Treeye site serves |
| `newsreader-400-latin.woff2` | running text | byte-identical to what the Treeye site serves |
| `inter-400-latin.woff2`, `inter-500-latin.woff2` | numbers: input values, units, table cells, numeric row headers, chart numerals, validation messages (#193) | subset below |

## Inter

Upstream: Inter **4.1** (font version 4.001, git `9221beed3`), the release
asset `Inter-4.1.zip` from <https://github.com/rsms/inter/releases/tag/v4.1>
(sha256 `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`).
Inputs are its `web/Inter-Regular.woff2` (sha256 `e06f6b1b…0ae085`) and
`web/Inter-Medium.woff2` (sha256 `0ff3e946…3f2a48`). Licence: SIL Open Font
License 1.1, in `inter-LICENSE.txt` beside this file.

Subset with fontTools 4.68.0 and brotli 1.2.1, **without** `uharfbuzz`
installed (with it, fontTools repacks GSUB and GPOS through HarfBuzz: the
font is the same, the bytes are not):

```sh
U="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+03BC,\
U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,\
U+20AC,U+2122,U+2212,U+2264-2265"
for w in 400:Regular 500:Medium; do
  pyftsubset "web/Inter-${w#*:}.woff2" --unicodes="$U" \
    --layout-features="kern,tnum,ss02,ccmp,mark,mkmk" \
    --flavor=woff2 --output-file="inter-${w%:*}-latin.woff2"
done
```

Then drop the hyphen from `tnum`, in both files:

```py
from fontTools.ttLib import TTFont

for path in ['inter-400-latin.woff2', 'inter-500-latin.woff2']:
    font = TTFont(path, recalcTimestamp=False)
    hyphen = font.getBestCmap()[ord('-')]
    gsub = font['GSUB'].table
    for record in gsub.FeatureList.FeatureRecord:
        if record.FeatureTag == 'tnum':
            for index in record.Feature.LookupListIndex:
                for sub in gsub.LookupList.Lookup[index].SubTable:
                    sub.mapping.pop(hyphen, None)
    font.flavor = 'woff2'
    font.save(path)
```

Inter's `tnum` widens the hyphen-minus to a digit's width, with a third of
an em of space before it, so "-4.09" read "- 4.09" and the sign looked
detached from its value. Every column of numbers in the app is
right-aligned, so the sign is the leftmost character and its width moves no
digit: the narrow hyphen keeps the columns aligned. The two steps
reproduce these files byte for byte (sha256 `abbe727d…883944` for 400,
`322fa3e1…7693a2` for 500).

- `U+03BC` is the Greek mu that every "μm" in the app uses. Neither the
  Newsreader nor the Poppins subset has it, so before #193 it fell back to a
  system font. Inter is also the fallback for it in the other two stacks.
- `tnum` makes the digits tabular. `ss02` is Inter's disambiguation set:
  a slashed 0, and I and l that cannot be read as 1. It was picked over
  `zero` + `cv01` by rendering both (the prototype for #193).
- `kern` is kept for spacing in the messages, and `ccmp`, `mark` and `mkmk`
  as named in the command (they hold no lookups for these characters, so
  the subset lists only `kern`, `ss02` and `tnum`). Every other feature is
  dropped.

`src/fonts.test.ts` reads these files' `cmap` tables and fails if a character
the app renders is missing from a font stack's self-hosted faces.
