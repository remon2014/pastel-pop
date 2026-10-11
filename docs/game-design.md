# Game Design: Pastel Pop

**Status: Draft v0.3.** The owner's vision, updated with the decisions from the first design review and the owner's follow-up answers (2026-10-11). Items marked "proposal" are the Game Designer's suggestion and not yet agreed. "Open questions" lists the decisions still to make.

Working title: **Pastel Pop** (may change).

## Vision
A tap-the-matching-colour game with two sides. **Story mode** is the challenge: clearing levels returns colour to a faded ancient mural, section by section, revealing a legend of loss and hope. **Calm mode** is a quiet place: one endless, pressure-free level that gives the player a single gentle thing to focus on. Simple to pick up, satisfying to play, and rewarding curiosity as much as skill.

## Audience
Gameplay is for all ages and backgrounds. The Story mode storyline (themes of tragedy and hope) is written for ages 12 and up. This means:
- Learnable in seconds without reading instructions.
- Story told mostly through images, with short, simple text.
- Nothing frightening or violent on screen, in either mode. The story's weight comes from its themes, not from what is shown, because younger children will also play Story mode.
- The store age rating and audience declaration for a 12+ storyline inside an all-ages game will be dealt with later, before release (see Open questions).
- Playable by colour-blind players (see Accessibility).
- No accounts, no personal data collected, works fully offline.

## Core loop
1. A target is shown as a large symbol and colour swatch, with no word to read.
2. Circles move around the play area, each carrying its colour and symbol.
3. Tap circles matching the target to clear them.
4. In Story mode, clear the required circles to finish the level; the target may change mid-level, with a clear cue. In Calm mode there is no finish: play simply continues.
5. In Story mode, each finished level is followed by a short reveal beat (3 to 5 seconds): play clears, one section of the mural regains its colour, and one line of story appears.

The existing 10 experimental modes are retired and replaced by the two modes below.

## Modes

### Calm mode
**Purpose:** a quiet place for anyone who wants to settle, including people who often feel anxious or have panic attacks. They can open it and focus on one simple thing. Pastel Pop is a calming game, not a treatment: the game and its store listing must make no medical or therapeutic claims.

- **Structure:** one perpetual level. No story, no levels, no ending.
- **Instant start:** one tap from the launch screen, with no further menus, countdown or instructions. Leaving is equally instant, with no confirmation prompt. Players can also choose a way to open straight into Calm (see Launch screen).
- **No pressure of any kind:** no timer, score, stars, counters, lives or fail state. Nothing on screen can be lost or run out.
- **Wrong tap:** the circle gives a soft wobble and a gentle sound. No penalty, no restart, no lives: all of these are loss signals that work against the purpose. Confirmed by the owner.
- **Motion:** slow, smooth drifting with no sudden changes of speed or direction. Circles gently swell and settle on a slow shared rhythm. Starting value: a 10-second cycle, about 4 seconds swelling and 6 settling, so a player may fall into breathing with it. The game never tells the player to breathe or how.
- **Density:** 4 to 6 circles and 3 colours on screen (starting values). Circles never expire or vanish on their own.
- **Target changes:** only after a number of clears, never on a clock, and with a slow crossfade.
- **Palette:** soft, warm and low in saturation, with no flashing, no screen shake and no alarm colours.
- **Audio:** slow ambient music that loops without a noticeable seam, with no sudden changes in volume or tempo. Pop sounds are soft and rounded.
- **Vibration:** off by default in Calm mode.

All Calm values above are starting values, to be tuned in playtests and checked by the psychologist reviewer (see Dependencies).

### Story mode
This is where the game gets frantic.

- **Structure:** stages of 5 levels. Each stage restores one mural and tells one chapter.
- **Stage count for v1.0:** 3 stages, 15 levels, 3 murals. v1.0 is a public launch, and a single stage is only a few minutes of play.
- **Escalation:** each level is noticeably more intense than the last. At most two variables change per level, and at most one new idea is introduced per level.
- **Level length:** 30 to 45 seconds per level, so a stage takes about 4 to 5 minutes.
- **Time bar:** the one visible resource. A wrong tap removes a visible chunk of it (starting value: 3 seconds).
- **Failure:** when the bar is empty, a kind message appears ("Nearly! Try again") and that level restarts at once. Earlier levels and their mural sections are kept.
- **Story assist:** after 3 fails on the same level, the player is quietly offered a longer time bar for that level, so nobody is locked out of the story. Using it caps that level at 1 star and has no other effect. The size of the extension is a starting value to be tuned.
- **Score:** 1 to 3 stars and a best time per level. No named leaderboard. Stars (proposal, starting values): 1 for clearing the level, 2 with a quarter of the bar left, 3 with half of the bar left.
- **Onboarding:** no text tutorial. The first level opens with one slow circle of the target colour and a pulsing hint, then adds a second colour.

**Level tuning: starting values, to be tuned after testing.** 1.0x speed means a circle crosses the screen width in about 4 seconds. Later stages reuse this shape from a slightly higher base.

| Level | Colours | Circles on screen | Speed | Clears needed | Time bar | Target changes |
|---|---|---|---|---|---|---|
| 1 | 3 | 6 | 1.0x | 10 | 45 s | none |
| 2 | 4 | 8 | 1.25x | 12 | 45 s | none |
| 3 | 4 | 10 | 1.5x | 15 | 40 s | once, mid-level |
| 4 | 5 | 11 | 1.75x | 18 | 40 s | every 6 clears |
| 5 | 5 | 12 | 2.0x | 20 | 35 s | every 4 clears |

**Game Designer's remaining concern, noted once:** the story is now reachable only through the frantic mode, so players who cannot clear the later levels never see the ending. Forgiving failure, instant retry and the story assist are there to prevent this; check it in playtests.

### Coming back
What brings players back: the next chapter to uncover, stars to improve in Story mode, a gallery of finished murals to revisit, and Calm mode whenever they want it. No daily rewards, streaks or timers.

### Launch screen
- The Calm and Story buttons look clearly different from each other, so the two sides of the game are told apart at a glance and not by reading. Each takes its look from its own mode: soft and still for Calm, brighter and livelier for Story.
- Opening straight into Calm is the player's choice, never the default. It is offered as an option the player sets up, in the way a home-screen widget or shortcut is added, so that someone who wants Calm quickly can reach it without passing the launch screen. How this is built on Android (home-screen widget, app shortcut or an in-app setting) needs a tech lead check.

### Interruptions and saving
- Portrait orientation only.
- The game pauses automatically when the app goes to the background or a call arrives.
- Story progress is saved after every level.

## Story and reveal
Story and reveal belong to Story mode only.

- **Structure:** Story mode is divided into stages; each stage has 5 levels and tells its own self-contained chapter of a larger legend.
- **Reveal:** each stage has one ancient mural in 5 sections. It starts faded to near-grey. Each cleared level returns colour to one section, with a short story fragment. The colours the player popped are shown flowing into the mural, so play and story are the same act.
- **Why fade and not blur:** restoring colour is cheap to draw and keeps pixels crisp; a full-screen blur is costly on phones and works against the pixel-art look.
- **During play:** the mural stays quiet and low in contrast behind the circles so it never hurts readability. The reveal happens in its own beat between levels.
- **Gallery:** finished murals can be revisited in full colour, with their story lines.
- **Tone:** ancient, mythic and wondrous, with themes of tragedy and hope. The mood references are the mythic feel of the Legend of Zelda games and the emotional tone and glow of Ori and the Will of the Wisps.
- **Themes and age:** the storyline is written for ages 12 and up. Loss is shown through absence (an unlit lantern, an empty place), never through danger, injury or anything frightening.
- **Text:** one line of 8 words or fewer per fragment. The pictures must carry the story with the text hidden.
- **Originality:** the world, story, characters and art must be entirely original. The games named above are mood references only: use no names, symbols, characters, music or assets from them or from any other existing game.
- **Motifs to avoid**, because they would read as borrowed: swords and shields, a chosen hero in a tunic, triangles or three-part relics, a princess to rescue, fairy companions, pointed-eared folk, a great spirit tree, a small glowing guardian-spirit hero, owl or masked-creature guides.

### The legend: "The Lantern Mural"
Accepted by the owner, with its three chapters.

Long ago a valley was kept bright by lanterns, each holding one colour of living light, tended by a line of Keepers who painted the valley's story on a great wall. The last Keeper lost someone dear to her. In her grief she stopped tending the lanterns, and one by one they went dark. The colour drained from the valley and from the wall: the Long Grey. Generations later, a child finds a lantern that still holds a faint glow, and begins to bring the lights back.

- **Stage 1, "The First Light":** hope arrives. Five pictures and lines:
  1. A grey valley. "The valley had been grey for generations."
  2. A child holds a dim lantern. "A child found a lantern no one lit."
  3. The lantern catches a glow. "It caught one small light, and held it."
  4. The river turns blue. "Where the light fell, the river remembered blue."
  5. The village wakes; one painted figure on the wall is unfinished. "Someone painted this wall. Why did they stop?"
- **Stage 2, "The Keeper's Grief" (outline):** the mural shows the last Keeper, the empty place beside her, and the one lantern she could not bring herself to light. The tragedy is told here.
- **Stage 3, "What the Light Kept" (outline):** the child carries the light to the Keeper's unlit lantern. Colour returns to the whole wall, and its last section shows the Keeper's own painting of the one she lost. The loss is not undone, but it is remembered in colour.

## Look
- Pixel art in the style of early-2000s handheld and console games.
- Crisp pixels: draw at a low internal resolution and scale up with no smoothing, so it stays sharp on every screen.
- A consistent limited palette per mode: soft and warm for Calm, more saturated and higher-contrast as Story mode intensifies.
- At most 5 circle colours, each with a bold, distinct symbol silhouette.
- Pixel-style fonts and UI to match, kept readable on small screens. If the pixel font is not comfortably readable for story text on a small phone, use a clean readable font for story text.
- **Glow:** a soft glow in the spirit of the Ori games, done in pixels. Draw it as stepped or dithered rings of two or three lighter palette shades at the internal resolution, never as a smooth blur. Use it only where it means something: the target, a popped circle's light travelling to the mural, and restored mural sections. Slow pulses only; no flashing.
- **Art reference pending:** the owner will provide a visual reference, and the art will be produced in a similar style. The points in this section may be revised once it arrives (see Dependencies).

## Feel
- Every tap gives instant feedback: a pixel burst or pop, a sound, and optional light vibration.
- Wrong taps are clearly signalled but not harsh: a soft wobble and gentle sound in Calm mode; in Story mode, the same plus a visible chunk leaving the time bar.
- Feedback wording praises effort and good play, and failure messages are kind.
- Music sets each mode's mood: ambient and soothing for Calm, building in tempo and energy as Story mode progresses.
- Retro-inspired audio fits the pixel look. In Calm mode, soft rounded tones take priority over an authentic chiptune sound, which can be sharp.

## Accessibility
- **Never colour alone:** each colour also has a distinct shape or pixel symbol, shown on both the target and every circle, so colour-blind players can match by symbol. The game must be playable in greyscale.
- Large touch targets, comfortable for one-handed play. Circles are sized relative to the screen, never smaller than 48 dp across, with about 64 dp as the aim for moving circles (starting value).
- Settings for sound, music and vibration on or off.
- Readable text at all sizes and against every background.

## Version 1.0 scope
v1.0 is a public launch, not a test slice.

**In:**
- Calm mode: one endless level, complete with its own visuals, music and feel.
- Story mode: stages of 5 levels with their mural reveals and chapters (3 stages, 15 levels).
- Pixel-art visual style, retro audio, tap feedback.
- Colour-blind support and basic settings.
- Stars and best time per level, and a gallery of finished murals.
- Story assist after repeated fails, and an optional way to open straight into Calm.
- Wordless onboarding, portrait orientation, auto-pause, progress saved after each level.
- Android release.

**Out (later):**
- More stages and chapters.
- Named leaderboards.
- Daily rewards, streaks or other timed features.
- Power-ups, special circles and streak bonuses.
- iOS release (planned soon after Android).
- Monetization of any kind.
- Online features, accounts or cloud saves.

## Dependencies
- **Art reference:** the owner will provide visual references step by step, when asked. Pending.
- **Game-artist agent:** to be created, to produce original art in the style of the owner's reference. Blocks all final art; the Look section is provisional until then.
- **Music and sound:** the owner will upload music when asked. Every track and sound must come with a licence that allows commercial use in a published app. Record the source, licence and any required attribution for each one. Calm and Story mode need different music.
- **Psychologist reviewer (agreed, to be created):** an agent with expertise in anxiety, used as a reviewer and not as a co-designer. It would review the Calm mode spec (motion rhythm and the breathing-paced cycle, density, palette, audio, wording, and anything that could unsettle a person mid-panic) and the store listing wording, to confirm no medical or therapeutic claim is made. An agent's review is not a clinical endorsement and must not be presented as one.
- **Engineering foundations** (from `docs/backlog.md`): time-based movement, sharp rendering on phone screens, and screen-relative circle sizes must be in place before any tuning value in this doc means anything. Audio starts from nothing. The pixel-art glow and vibration behaviour on Android need a tech lead check.

## Open questions
1. **Store rating and audience:** how a 12+ storyline inside an all-ages game should be rated and declared on Google Play. Deferred by the owner; must be settled before release.
2. **Opening straight into Calm:** which Android mechanism to use (home-screen widget, app shortcut or in-app setting). Needs a tech lead check.
3. **Look after the art reference:** confirm pixel art, the internal resolution and the glow treatment once the owner's references arrive.
4. **Star thresholds:** the 1, 2 and 3 star rule in Story mode is still a proposal.
5. **Name:** "Pastel Pop" stays as the working title. Before release, check for clashing names on the store.
