# Game Design: Pastel Pop

**Status: Draft v0.1.** This is the owner's initial vision. The Game Designer agent should challenge and refine it before major build work starts. "Open questions" lists the decisions still to make.

Working title: **Pastel Pop** (may change).

## Vision
A tap-the-matching-colour game where clearing levels gradually uncovers an ancient, hand-drawn diagram behind the play area, piece by piece revealing a legend. Simple to pick up, satisfying to play, and rewarding curiosity as much as skill.

## Audience
All ages and backgrounds. This means:
- Learnable in seconds without reading instructions.
- Story told mostly through images, with short, simple text.
- Nothing frightening, violent or unsuitable for children.
- Playable by colour-blind players (see Accessibility).
- No accounts, no personal data collected, works fully offline.

## Core loop
1. A target colour is shown.
2. Circles move around the play area.
3. Tap circles matching the target to clear them.
4. Clear the required circles to finish the level.
5. Each finished level uncovers part of the background diagram and a fragment of the story.

The existing 10 experimental modes are retired and replaced by the two modes below.

## Modes

### Calm mode
- Relaxing and satisfying: soft palette, gentle pace, soothing music, pleasing tap feedback.
- Low pressure. Whether mistakes have any penalty here is an open question.

### Frantic mode
- One stage of 5 levels for v1.0.
- Each level is noticeably more intense than the last: faster circles, more of them, more distractors, less time.
- Clearing all 5 levels completes the stage and reveals its full diagram and story chapter.

## Story and reveal
- **Structure:** the game is divided into stages; each stage has several levels and tells its own self-contained chapter of a larger legend.
- **Reveal:** the background starts covered or obscured. Each cleared level uncovers a section of an ancient-looking diagram (map, mural or manuscript style), with a short story fragment.
- **Tone:** ancient, mysterious and wondrous, with the sense of adventure of classic early-2000s adventure games.
- **Originality:** the world, story, characters and art must be entirely original. Draw on the mood of classic adventure games, but use no names, symbols, characters, music or assets from existing games such as The Legend of Zelda.

## Look
- Pixel art in the style of early-2000s handheld and console games.
- Crisp pixels: draw at a low internal resolution and scale up with no smoothing, so it stays sharp on every screen.
- A consistent limited palette per mode: soft and warm for Calm, more saturated and higher-contrast as Frantic intensifies.
- Pixel-style fonts and UI to match, kept readable on small screens.

## Feel
- Every tap gives instant feedback: a pixel burst or pop, a sound, and optional light vibration.
- Wrong taps are clearly signalled but not harsh, especially in Calm mode.
- Music sets each mode's mood: ambient and soothing for Calm, building in tempo and energy as Frantic progresses.
- Chiptune or retro-inspired audio fits the pixel look.

## Accessibility
- **Never colour alone:** each colour also has a distinct shape or pixel symbol, so colour-blind players can match by symbol.
- Large touch targets, comfortable for one-handed play.
- Settings for sound, music and vibration on or off.
- Readable text at all sizes and against every background.

## Version 1.0 scope
**In:**
- Calm mode, complete with its own visuals, music and feel.
- Frantic mode with one stage of 5 levels and its story reveal.
- Pixel-art visual style, retro audio, tap feedback.
- Colour-blind support, basic settings, local high scores.
- Android release.

**Out (later):**
- More stages and chapters.
- iOS release (planned soon after Android).
- Monetization of any kind.
- Online features, accounts or cloud saves.

## Open questions
1. **Calm mode structure:** does it also have levels and a story reveal, or is it endless and story-free?
2. **Failure:** what happens on a wrong tap in each mode: game over, lose a life, lose time, or nothing?
3. **Level length:** how long should a level take? (Mobile sessions are often 30 seconds to 3 minutes.)
4. **Intensity curve:** exactly what escalates across Frantic's 5 levels, and by how much?
5. **Story content:** what is the legend, and what is stage 1's chapter?
6. **Reveal visuals:** map, mural, manuscript or something else? How is the cover drawn and removed?
7. **Name:** keep "Pastel Pop", given the shift to a pixel-art, ancient-legend style?
8. **Retention:** what brings players back: high scores, unlocking stages, collectibles, daily play?
