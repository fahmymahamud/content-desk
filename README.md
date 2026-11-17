# Content Desk

A free reel agent that runs inside your own Claude account. You give it one input (an idea, a link, photos, clips or a voice note). It develops 3 different reel ideas from that same input, draws each idea's scenes so you can judge them as pictures, builds the video you approve, and posts it when you tap Post.

Built by [@careershifttechguy](https://www.instagram.com/careershifttechguy) for his own channel, now shared free under the MIT licence.

## What it does

- **One input, 3 ideas.** Every idea stays inside your input. It never mixes inputs, so a cleaning promo and a tech tip never bleed into each other.
- **Scenes as pictures.** Each idea shows its scenes drawn out, so you see a weak hook before any video is made.
- **Video built for you.** Approve an idea and the agent renders a vertical reel with narration (free Kokoro voice, or your own voice note), captions, music and a thumbnail.
- **Two extra reel styles.** *Poster alive* cuts a flyer into pieces and animates them. *Comic reel* turns a photo of a person or pet into a comic-book character.
- **Posting on your tap.** Instagram, Facebook Page and YouTube Shorts through Composio. Nothing posts unless you press Post or Schedule.
- **Optional news ideas.** A scheduled task can drop 3 fresh ideas from the last 72 hours on your desk a few mornings a week.

## What you need

| Need | Why |
|---|---|
| A paid Claude plan with scheduled tasks and artifacts | The desk is a Claude artifact; the agent is a Claude scheduled task |
| [Composio](https://composio.dev) connected to Claude, with your Instagram, Facebook Page and YouTube linked | Only for auto-posting. Skip it and download the video from the desk instead |
| A place to host the video at a public URL while posting | Instagram and Facebook fetch the video from a URL |

The desk does **not** run on normal web hosting. It uses Claude's artifact database, asset store and scheduled tasks, so it lives in your Claude account.

## Set it up (about 15 minutes)

1. **Download this repo.** Click the green **Code** button, then **Download ZIP**.
2. **Set your brand.** Open `desk/index.html` in any text editor. Near the top, find the block that starts `YOUR SETTINGS` and fill in `brand`, `handle` and `audience`. Leave `trigger` as it is for now. Save.
3. **Open a new Claude chat** with code execution on, attach the ZIP, and paste this:

   > Unzip this. Publish the `desk/` folder as a new artifact titled "Content Desk", with these capabilities: db, assets, downloads, sample, user, and the Claude Code Remote MCP server with the tool fire_trigger. Then read `prompts/desk-agent.md`, replace the `{{...}}` placeholders using my answers (ask me for any you can't fill), set `{{DESK_URL}}` to the new artifact's link, and create a scheduled task named "Desk Agent" with no schedule and that prompt. Finally put the new task's id in `CONFIG.trigger` in `desk/index.html` and republish the artifact.

   You should get back a Content Desk link and see a "Desk Agent" task in your scheduled tasks.
4. **Test it.** Open the desk, type a topic in the box and press **Develop 3 ideas**. After a few minutes, 3 ideas appear in the Ideas tab with their scenes drawn.
5. **Optional extras.** Ask Claude to create the idea starter (`prompts/idea-starter.md`) on a schedule, and the scheduled poster (`prompts/scheduled-poster.md`) every hour if you want the Schedule button.

### Placeholders in the prompts

| Placeholder | What to put |
|---|---|
| `{{YOUR_NAME}}` | Your first name. The agent starts every message with it |
| `{{BRAND}}`, `{{HANDLE}}`, `{{ONE_LINE_ABOUT_YOU}}`, `{{AUDIENCE}}` | Your channel, in plain words |
| `{{MAIN_HASHTAG}}` | Your own hashtag, e.g. `#mychannel` |
| `{{NEWS_TOPICS}}` | What the news ideas should cover, e.g. "free AI tools, AI scams, local tech news" |
| `{{DESK_URL}}` | Your Content Desk artifact link |
| `{{DESK_AGENT_TRIGGER_ID}}` | The Desk Agent task id (`trig_...`) |
| `{{INSTAGRAM_USER_ID}}`, `{{FACEBOOK_PAGE_ID}}`, `{{YOUTUBE_CHANNEL_ID}}` | From your Composio connections. Claude can look these up for you |
| `{{VIDEO_HOSTING_STEP}}` | How to get a public URL for the video, e.g. "Upload to my Higgsfield storage with media_upload and use the returned URL" |
| `{{TIKTOK_STEP}}` | Your TikTok route, or "Skip TikTok: record tiktok as Not set up" |

## Folder map

```
desk/            the Content Desk page and everything the agent fetches from it
  index.html     the desk (settings block at the top)
  scenes.js      draws every scene, on the desk and in the video
  video.html     the page the renderer records
  engine/        builds a reel: voice, media, frames, ffmpeg
  poster/        "Bring poster alive" kit and guide
  comic/         "Make comic reel" kit and guide
  av/            optional avatar poses (empty by default)
prompts/         the three scheduled-task prompts
```

## Honest limits

- Tested on one account (the author's). Expect to fix small things on yours.
- Rendering runs in Claude's cloud sandbox and uses your plan's usage. A normal reel takes 3 to 8 minutes; poster and comic reels take 15 to 25.
- TikTok usually needs you to confirm the post yourself.
- YouTube uploads through Composio can fail when its shared upload limit is used up. The desk tells you, and you post again later.
- WhatsApp groups cannot be posted to. Download the video and forward it.

## Licence

MIT. Free to use, change and share. Credit is appreciated, not required.
