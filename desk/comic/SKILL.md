---
name: photo-comic-reel
description: Turn ordinary photos of a real person, pet, team or place into an animated comic-book vertical reel (Instagram Reels, TikTok, Shorts) - the subject is cut out of the photo, redrawn as a flat-colour comic character with ink lines and a white sticker border, dropped onto a comic version of another photo, and animated with speech bubbles, bursts, props, narration, captions and sound. Use this whenever someone sends a photo of a person and asks to make them a cartoon or comic character, animate them, crop them out, put them on a different background, make a reel or short "about my dad / my mum / my team / my dog", send someone a message as a video, or says a plain slideshow or Ken Burns pan over the photo is not enough. Also use for "comic" jobs from the Content Desk. For a finished poster or flyer, use poster-alive-reel instead.
---

# Photo comic reel

Photos go in. A 1080x1920, 20-40 second comic reel comes out: the person cut out and redrawn as a comic sticker, standing in a comic version of a second photo, talking in speech bubbles, with props flying in, narration, captions, sound effects and music.

Everything runs free and offline in the sandbox: OpenCV for the cut-out and the comic treatment, Kokoro for the voice, Playwright and ffmpeg to render.

## Files (all under `scripts/`)

| File | What it does |
|---|---|
| `cutout.py` | `grid` to read coordinates off the photo; `Cutout` to trace and refine a silhouette. |
| `comic.py` | `toon` (flat colour + ink), `sticker` (cut-out to comic character), `backdrop` (photo to comic background), `write_meta`. |
| `upscale.py` | Only for a small or soft photo: sharpens it 4x first. |
| `vo.py` | Narration from `script.json`; writes `vo/*.wav` and `tl.json` (all timings). |
| `engine.js` + `props.js` + `comp.html` | Animation engine, comic toolkit (titles, bubbles, chips, bursts, speed lines, SVG props), and the page. |
| `render.js`, `audio.py`, `make.sh` | Preview frames, per-scene video, sound mix, build. |
| `example/` | The complete "Dad, drink your water" reel. Read it before writing your own. |

You write three files per reel: `cut.py`, `script.json`, `scenes.js`.

## Workflow

Work in a new empty folder with everything from `scripts/` copied in flat, plus the three `example/` files as your starting point. Copy your avatar poses into `av/` if the reel uses them.

### 1. Look at the photos and decide the cast

Read every photo. Decide which one is the **subject** (cut out) and which is the **backdrop**. Usually a portrait plus a place. A photo can be both if nothing else fits.

Then write down what you actually see about the person: what they wear, what they are doing, where they are. The reel's warmth comes from those details, so a hat, a work polo or a lanyard is worth a scene.

### 2. Cut the subject out

```bash
python3 cutout.py grid photo.jpg      # grid1.png, grid2.png... labelled in photo pixels
```

Read every `grid*.png` and trace the silhouette yourself, then let grabCut tidy the edges:

```python
from cutout import Cutout
Cutout('photo.jpg').poly([(0,792),(120,700), ...]).refine().save('mask.png')
```

Tracing by hand is the whole trick. Automatic segmentation does not know where a wide hat ends and a corrugated roof begins, or that the bright green between a brim and a shoulder is a palm tree rather than part of the person. Go clockwise, roughly 30-40 points, and spend them where the shape is interesting: a hat brim, hair, the gap between an arm and a body. `refine()` then snaps the line to real edges but only within a band around it, so it cannot wander off.

Read `cut_check.jpg`: magenta is what gets cut away. Fix leaks by pulling those polygon points in. Two or three passes is normal. Parts that sit against the frame edge can just follow the frame.

### 3. Make the comic art

```python
from comic import sticker, backdrop, write_meta
sticker('photo.jpg','mask.png','p/person.png')     # comic character with a white sticker border
backdrop('place.jpg','p/bg.png')                   # comic background, 1080x1920
write_meta(['person','bg', ...])                   # p/meta.json for the engine
```

Also save a head-and-shoulders crop of the sticker for close-ups. Read the results. Common fixes:

- **A white beard or a lawn comes out as black speckle**: the ink lines are firing on texture. Raise `blur`, `lo` and `hi` in `toon`.
- **The background looks snowed on**: `white_lines` caught sunlit patches, not just painted lines. Pass `white_lines=False`, or tighten the thresholds in `backdrop`.
- **Skin looks sunburnt**: lower `sat`.

### 4. Write the story (`script.json`)

A comic reel is a small story about a real person, so it wants a shape, not a list of facts:

1. **Meet them** - the title card and the character slamming in.
2. **What they do** - the backdrop, the weather, the routine.
3. **The snag** - what they get wrong, or what you worry about. One line.
4. **The payoff** - the one thing the reel is really about, on a burst.
5. **Someone tells them** - your avatar, or you, in a speech bubble.
6. **The simple rule** - a number they will remember.
7. **Why it matters** - two or three short chips.
8. **The warm close** - both of them together, and the line you actually want to say.

Keep it to 60-90 spoken words. `say` is what the voice speaks (spell numbers and names the way they sound), `cap` is what the caption shows. A name in another language needs a `lexicon` entry: check the Kokoro lexicon first, because an English word with the same spelling may already be there with the wrong sound (for example the Malay word "ayah" is in it with an English reading, "EYE-ah", not "AH-yah").

```bash
bash make.sh voice      # writes tl.json; fix anything printed after "unsayable:"
```

### 5. Animate (`scenes.js`)

Read `example/scenes.js` and the comments at the top of `engine.js` and `props.js`. You define `buildScenes()`. The stage is 1080x1920 and placement is a function of time `T`.

Comic motion is bigger than normal motion. What makes it read as a comic:

- **Slam, don't fade.** Characters arrive with `bounce` from off-screen, titles arrive huge and shrink with `oc`, props land with `shake` and a `thud`.
- **Nothing is still.** A sine wave on y, a degree or two of rotation, a slow drift on the backdrop.
- **The subject is the hero.** They are on screen in most scenes, big, and they come back at the end.
- **Speech, not narration, for the message.** The line you want the person to hear goes in a `bub()` with a `tail()`, in their language.
- **One burst.** Exactly one scene gets the full `bang()` treatment: the payoff.
- **Scenes alternate.** Backdrop scenes and flat cream-and-halftone scenes, so the eye gets a rest.
- **Props carry the facts.** `PROPS.bottle`, `glass`, `drop`, `heart`, `bolt`, `battery`, `stars`, `sun`, `clock`, `tick`, `cross`, `bang`.

Layout: keep content between y=220 and y=1430, captions sit at y≈1470, below 1600 is covered by the app interface, 40px side margins.

### 6. Preview, then build once

```bash
bash make.sh preview                 # two frames per scene -> prev/sheet*.jpg
bash make.sh preview 3.7,12.9        # or exact moments
```

Read the sheets. Look for: pieces overlapping faces, text cut off, a half-empty frame, a prop colliding with a character. Previews take seconds, the build takes minutes, so only build when the frames are right.

```bash
bash make.sh                         # reel.mp4, thumbnail.jpg, check.jpg
bash make.sh scene water close       # later: re-render only the scenes you changed
```

Read `check.jpg` once.

## Telling the person what they got

Say the length, the scenes in one line each, how you cut the subject out, and that the voice is a free AI voice you could not listen to, so they should play it with sound. Name any line that is yours rather than theirs. Do not post or send anything unless asked.

A reel about someone's family is personal. Keep the tone warm rather than clever, and never put words in the person's mouth that the sender did not ask for.
