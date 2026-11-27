# Turkey Run

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/yologie/turkey-run/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/yologie/turkey-run/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A turkey is on the Thanksgiving menu — and it has other plans. **Turkey Run**
is a 2D canvas escape game: the turkey sprints across an autumn farmyard
while the farmer chases from right behind. Dodge the flying carving knives,
jump the fences and the HOT brick oven, grab corn and pumpkins to keep the
farmer at bay, and reach the forest gate 1,200 metres out. Three lives.
One very determined farmer.

## How to play

- **Up / W** — flap the wings for height
- **Down / S** — dive back down
- **Space / click** — jump (clears fences and the oven)
- **Drag the mouse** — steer the turkey up and down
- **P** — pause, **R** — restart after a run ends

The farmer never stops gaining on you: every stumble and every hit brings
him closer, every corn cob and pumpkin pushes him back. Lose all three
lives, or let him catch you, and dinner is served.

## Build

Pure static files — no libraries, no network, no audio files (all sound is
synthesised with WebAudio). Play it locally with `node serve.ts`, then open
http://localhost:8080. Screenshots are deterministic: load
`game/index.html?shot=title|play|chase|end&seed=7`.

## Screenshots

- `1-title.jpg` — title screen with the farmyard, the turkey and the farmer
- `2-play.jpg` — mid-run: the turkey jumps a fence, a knife flies in
- `3-chase.jpg` — the farmer right behind the turkey, oven ahead
- `4-end.jpg` — ESCAPED! at the forest gate with the final score

## License

MIT — see [LICENSE](LICENSE).
