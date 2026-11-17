# Poster Alive: turn one poster into an animated story reel

One flat poster or flyer goes in. A 1080x1920, 20-40 second reel comes out, where the poster's own artwork (logo, mascot, title, photo, price, icons, contact bar) is cut into separate pieces and each piece moves, building the offer as a short story with narration, captions, sound effects and light music. It is not a slow zoom over a still image.

Everything runs free and offline in the sandbox: Real-ESRGAN upscaling (CPU), Kokoro narration, Playwright + ffmpeg rendering.

## Files in this kit

| File | What it does |
|---|---|
| `upscale.py` | Sharpens/enlarges a small poster so cut pieces stay crisp. Writes `poster.png`, `poster_hi.png`, `scale.json`. |
| `cutlib.py` | Cutting tools (`Cutter`) and `python3 cutlib.py grid` for finding coordinates. |
| `vo.py` | Narration from `script.json`, writes `vo/*.wav` and `tl.json` (all timings). |
| `engine.js` + `comp.html` | Animation engine and page. Your `scenes.js` plugs into it. |
| `render.js` | Preview frames and per-scene video files. |
| `audio.py` | Mixes narration, the `sfx()` hits from `scenes.js`, and a music bed. |
| `make.sh` | Runs the whole build. |
| `example/` | The complete M Clean promo (cut.py, script.json, scenes.js). Read it before writing your own: it is the reference for style, pacing and code patterns. |

You write three files per poster: `cut.py`, `script.json`, `scenes.js`.

## Workflow

Work in a new empty folder. Copy the kit files into it (flat, next to each other) and copy the three `example/` files in as your starting point.

### 1. Upscale and study the poster

```bash
python3 upscale.py <poster image>     # 2-5 minutes for a small poster; first run downloads a 67 MB model
python3 cutlib.py grid                # grid1.png, grid2.png... labelled in ORIGINAL pixels
```

Read `poster.png` and every `grid*.png`. List every distinct element and write down its box. All coordinates everywhere are original poster pixels; the library handles the enlargement.

While looking, collect the poster's facts exactly as printed (offer, prices, dates, phone, conditions). The reel may only state what the poster states. Do not invent prices, deadlines, guarantees or claims. A soft hook question is fine ("Is your sofa ready?"), a new fact is not.

### 2. Cut the pieces (`cut.py`)

Pick the cutting method by what the art sits on. This choice decides whether the piece looks clean:

| The element | Method | Shown on |
|---|---|---|
| Outlined logo, mascot, outlined title, dark pill, on a lighter background | `c.darkfill(box, seeds=…, exclude=…)` then `c.save(name, box, mask)` | anything |
| Plain dark text on a light background | `c.darkalpha(box)` + `c.save(…, color=(r,g,b))` | anything |
| Photo or shape on a flat coloured background | `c.blob(box, is_bg, seed)` where `is_bg` is a colour test you write | anything |
| Round badge | `c.circle(cx, cy, r)` (find it with `c.component`) | anything |
| Art printed on a white card | `c.save(name, box, unwhite=True)` | a white `card`/`chip` box |
| Art on a dark bar | `c.save(name, box)` plain rectangle | a `navy` box set to the bar's colour (it uses blend-mode lighten, so the rectangle edges vanish) |
| Bubbles, sparkles, highlights lighter than the background | `c.whitealpha(name, box, bgbox)` | anywhere, as decoration |

Always finish with `c.poster(box)` (the whole poster for the final reveal) and `c.finish()`.

Then Read `sheet.png` (pieces on magenta). Fix before going on: neighbours bleeding into a piece (tighten the box, add `exclude=`), holes, stray specks, light fringes. If the poster has no bubble or sparkle to lift, still create pieces named `bubble` and `star` from any small light decoration, or skip `burst()`, `floaters()` and `twinkle()` in your scenes.

Split things that should move separately: each line of a tagline, each feature icon, the price number apart from its label. A piece that sits on top of another (a badge over a photo) can be cut twice: once inside the parent and once alone, then animated in place on top so nothing shows underneath.

### 3. Write the story (`script.json`)

Think of the poster as a storyboard that has not been cut yet. A good order:

1. **Hook** (2-3 s): the brand mark or mascot arrives with energy, plus a question or the headline promise.
2. **What it is**: the title slams in.
3. **Proof / feeling**: the photo, with the benefit icons popping one by one as they are spoken.
4. **The offer**: build the price step by step, so the viewer watches the saving happen. This is the longest scene.
5. **Tagline** if the poster has one.
6. **Urgency + how to act**: deadline, then phone/WhatsApp/website revealed as it is spoken.
7. **Reveal**: the complete original poster returns whole, so the conditions and small print are on screen.

Give each scene a `name` and 1-3 short lines. `say` is what the voice speaks (spell numbers and odd words the way they sound: "sixty dollars", "Kay Clean"); `cap` is what the caption shows ("$60", "M Clean"). Put any caption token that is spoken longer than it looks into `"spoken"` so captions stay in sync. Aim for 60-90 spoken words.

```bash
bash make.sh voice        # writes tl.json; fix anything printed after "unsayable:" by respelling `say` or adding to "lexicon"
```

### 4. Animate (`scenes.js`)

Read `example/scenes.js` and the comment at the top of `engine.js`. You define `buildScenes()`. The stage is 1080x1920; an object's placement is a function of time `T`:

```js
const logo=img('logo',5,20);                      // 5 = the largest poster-scale it will be shown at
add(logo,T=>({x:540,y:lerp(-400,730,bounce(tw(T,.1,.85))),s:5,r:Math.sin(T*2)*2,a:1}));
sfx(.8,'thud',.5); shake(.8,14);
```

`s` is poster-scale: a piece 100 px wide on the poster shown at `s:5` is 500 px wide on screen.

Anchor every entrance to the narration, not to guessed seconds: `S.price.t0` is a scene start, `L[4].s` is when line 4 starts, `L[4].words` has per-word times. A piece should appear on the word that names it.

What makes it feel alive rather than like slides:

- **A host.** Keep the logo or mascot on screen in a corner after the hook, bobbing and nodding on each new line.
- **Every entrance has character.** Drop with `bounce`, slam from big with `oc` plus `shake` and a `thud`, spin in with `elastic`, slide with `back`. Vary them; do not fade everything.
- **Nothing sits still.** Add a small idle motion to each piece (`Math.sin(T*2)*6` on y, a degree of rotation, a pulse).
- **The key number gets the biggest moment**: slam + shake + `ding` + `burst`.
- **Reveal contact details as they are spoken** (clip-path wipe per digit, see the example).
- **Shine sweeps** (`shine` + `sweep`) across the title and photo, sparkles (`twinkle`) on the product.
- **Exits** start about 0.3 s before the next scene and fly off in different directions.

Layout rules that avoid rework:

- Keep important content between y=220 and y=1400. Captions sit at y≈1450-1560. Below 1600 is covered by the Instagram/TikTok interface.
- Leave 40 px side margins. Check nothing touches a card edge.
- Match the poster's palette: set `stage.style.background`, and override `--cap-bg`, `--cap-hi`, `--navy`, `--card-line` on the stage (`stage.style.setProperty('--navy','#…')`).
- If there are several scenes with white cards or dark bars, build them as `box(w,h,'card')` / `box(w,h,'navy')` groups with pieces as children.

### 5. Preview, then build once

```bash
bash make.sh preview                  # two frames per scene -> prev/sheet*.jpg
bash make.sh preview 3.7,12.9,16.8    # or exact moments (pick the busiest ones)
```

Read the sheets. Look for: text cut off or overlapping, pieces outside the safe area, a piece missing, rectangles visible around a cut-out, an empty half-screen. Fix and preview again. Previews take seconds; the full render takes minutes, so only build when the previews are right.

```bash
bash make.sh                          # reel.mp4, thumbnail.jpg, check.jpg
bash make.sh scene price cta          # later: re-render only the scenes you changed
```

Read `check.jpg` and `thumbnail.jpg` once. Set `"thumbnail_at": seconds` in `script.json` to choose the thumbnail moment (default is the final poster).

## Telling the person what they got

Say plainly: the length, the scene order in one line each, that the voice is a free AI voice, and that you checked the frames but cannot listen to the audio, so they should play it once with sound. Name any line the narration adds that is not printed on the poster. Do not post anything unless asked.

## When things go wrong

- **"no piece named X"**: the name in `img()` is not in `p/meta.json`; check `cut.py`.
- **Faint rectangle around a piece**: it was saved as a plain rectangle but is shown on a different colour. Use `unwhite=True` (white cards) or put it on a `navy` box with the bar's exact colour (`c.at(x,y)` prints it).
- **Cut-out has a halo of background colour**: reduce `grow` in `darkfill`, or for text use `darkalpha` with a flat `color`.
- **Two shapes merge in `darkfill`**: pass `exclude=` (a grown mask or a `region`) or `seeds=`.
- **Poster is a photo with no clear elements**: cut the 2-4 largest subjects with `blob`, use the whole poster as a slow-moving backdrop, and animate text you re-typeset in boxes instead. Say that you did this.
- **Captions drift from the voice**: add the offending caption token to `"spoken"`.
