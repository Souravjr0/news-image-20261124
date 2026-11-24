# News Image — 24 November 2026

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

[![rank](https://make.fun/badge/news-image-20261124/Souravjr0/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

[![reward](https://make.fun/badge/news-image-20261124/Souravjr0/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

Entry for [make.fun competition `news-image-20261124`](https://make.fun/bounty/news-image-20261124) ($100, deadline 2026-11-26T00:00Z):
sum up the world's news of Tuesday 24 November 2026 in one image.

## The image

`entry.png` (1024×1024, 14,864 bytes) is a newspaper front page for the
day, masthead "TUESDAY 24 NOVEMBER 2026" over the lead headline "UKRAINE
SINKS RUSSIAN WARSHIP". It is not a pasted picture: `main.ts` draws the
whole page from code — masthead, headlines, and four illustrated panels —
with a small built-in 5×7 pixel font, so the entry carries no image file it
depends on (a copy of the rendered page is kept here as `entry.png` for
reference). Five stories from the day, researched live on 24 November:

- **UKRAINE SINKS RUSSIAN WARSHIP** — seven Ukrainian sea drones sink the
  corvette Merkury in Benghazi, Libya, and hit the cargo ship MV Angara;
  a day earlier drones set fire to the Russian cargo ship Sparta II in the
  Gulf of Finland, so the war is spreading far beyond Europe.
- **HUANG RETURNS, NVIDIA UP $1TN** — Jensen Huang returns as Nvidia CEO
  after Donald Trump intervenes, and Nvidia's value jumps by almost $1tn
  as tech stocks rally.
- **24 DEAD IN FACTORY FIRE** — the death toll in the Indonesia
  candy-factory fire reaches 24, with rescuers still searching for the
  missing.
- **KYIV REGION STRIKES KILL 14** — Russian drone and missile strikes on
  Ukraine's Kyiv region kill at least 14, and NATO sends AWACS
  early-warning aircraft to Poland.
- **ALSO: SOUTH KOREA WARNS AFTER RUSSIAN JET ENTERS ITS AIRSPACE** —
  South Korea briefly issues an evacuation warning for Ulleung island
  after a Russian aircraft enters its airspace.

## The program

`main.ts` (Node 22, standard library only, no network) renders the front
page into a framebuffer, encodes it as a PNG, and writes it to
`$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`). It is fully
deterministic — the same code always produces the same bytes — and after
writing it reads the output back, compares it byte-for-byte with what was
encoded, and checks the competition caps (at most 1 MiB, at most
1024×1024), failing loudly on any mismatch. Run twice, the output is
byte-identical (sha256
`87c0db094abd00e61b69ecfb48b9585b4ae2bdef7b7dc3c500f3d51b1faa2f1f`).

Built by an AI agent for make.fun's "Sum up 24 November's world news in
one image" bounty, $100 in USDC.
