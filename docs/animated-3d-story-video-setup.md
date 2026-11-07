# Animated 3D story video skill: setup

The `animated-3d-story-video` skill is already installed as a **project skill** in this repo:

```
.claude/skills/animated-3d-story-video/SKILL.md
```

Any Claude Code session opened in this repo's folder picks it up on its own. Type `/` to see it in the list.

## On your Windows PC

1. Install Claude Code (the desktop app or the CLI), **Node.js** (LTS) and **ffmpeg**.
2. Clone this repo, or download it, to a normal folder, for example `C:\animations\test.v1`.
   If you'd rather keep the videos separate from this repo, copy the
   `.claude\skills\animated-3d-story-video` folder into either:
   - `C:\Users\<you>\.claude\skills\` to make it **personal** (works in every project), or
   - `<your project>\.claude\skills\` to make it **project-only**.
   The `.claude` folder is hidden. Turn on View > Show > Hidden items in File Explorer.
3. Start a **local** session in that folder. A cloud session has no graphics card, so it can't render.
4. Set **High performance** under Windows Settings > System > Display > Graphics.
   The skill names the Remotion browser (Chrome/Chromium) and the Claude app. Add Node too.
5. Check that you're on your real PC by running PDF prompt **4.1**
   ("Run commands that show my computer's OS, GPU name ... virtual machine?").
6. Say "Make an animated story video" (or "... about <topic>").

## What the skill does

| Step | You | Claude |
|------|-----|--------|
| 1. Ideas | Pick one of 5 | Researches and fact-checks 5 true stories |
| 2. Script | Approve (or ask for edits) | Writes a 40-60 s script with a shot table |
| 3. Build | Supply a voiceover if you have one | Builds the whole Remotion + three.js project and checks stills |
| Render | Double-click `render.bat` | Checks the finished mp4 afterwards |

## Things to know

- **You don't need PDF Stage 1** (reference videos and the rulebook). The skill already has its own
  fixed house style, and it's told never to ask for reference videos.
  The PDF's Stage 3 and 4 prompts are still useful for fixes.
  For example, 3.8 finds and fixes mistakes, 3.9 makes the motion feel more real, and 4.3 speeds up rendering.
- **Voiceover first.** Without audio the skill times everything at 3.35 words/s, and the cuts
  must be re-timed later. Record or generate `voiceover.wav` after the script step and before the build.
- **The skill makes the renders.** It writes `render.bat` (the full video) and `test_render.bat` (a 30-frame test).
  Run the test first.
- **PROGRESS.md.** The skill doesn't create it on its own. Ask for it at the start, for example:
  "Keep a PROGRESS.md log of every step and problem."
  Then the PDF's "Continue in a new session" prompt can pick up from it.
  The skill has no `analysis/rulebook.md`, so point that prompt at `SKILL.md` instead.
- Known limits from the skill: the models are procedural, the output is 720x1280, and
  lifted building facades sometimes show black patches.
