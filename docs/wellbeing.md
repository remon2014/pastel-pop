# Wellbeing and sensory safety: Pastel Pop

**Status:** v0.2, 2026-10-11. Working reference for the designer and engineers. Design detail lives in `docs/game-design.md`; this file holds the safety rules, the evidence behind them and the release checks. Where the two disagree on a design value, `docs/game-design.md` wins and this file should be corrected.

**Changed in v0.2:** the sensory rules are split into two tiers by owner decision. Tier 1 (safety) covers the whole game. Tier 2 (comfort) covers Calm mode only. Story mode gains bounded allowances (section 6).

**Who wrote this:** an AI advisor agent (`wellbeing-advisor`). Its review is not a clinical endorsement and must never be presented as one, in the game, the store listing or anywhere else.

## 1. Boundary

- Pastel Pop is a calming game, not a treatment. It does not diagnose, treat, cure or prevent anxiety, panic or any condition.
- The game gives no medical advice, never assesses a player's mental health and never tries to manage a crisis.
- The game never tells the player to breathe or how.
- No health features and no health claims. If that ever changes, stop and check the Google Play health rules first (see Open checks).

## 2. Wording

| Allowed | Not allowed |
|---|---|
| "relaxing", "calming" | "reduces anxiety", "helps panic attacks" |
| "a gentle way to unwind" | "therapy", "treatment", "clinically proven" |
| "soothing colours and music" | "for your mental health" or any similar claim |
| "A story about loss and hope" (content note) | "designed with / reviewed by a psychologist" |

Rules:
- The Calm mode "Purpose" sentence in `docs/game-design.md` (naming anxiety and panic attacks) is internal design intent. It never appears in the store listing, in-game text, screenshots or a shortcut name.
- The open-into-Calm shortcut or widget is labelled "Calm". Never "panic", "SOS" or similar.
- Calm mode has no evaluative text at all: no praise, no counts, no messages. Praise for effort belongs to Story mode only.
- "Nearly! Try again" is fine, in Story mode only.
- The prototype's colour names and "psychology" strings in `src/colorManager.js` ("mindful blue", "renewal green", "Creates mental space and peaceful clarity") are unsupported claims. None may reach player-facing or store text.
- All store copy is reviewed against this section before release.

## 3. Evidence

Nothing below was re-checked against its live source during the 2026-10-11 reviews. Treat every row as unverified until the "last checked" column has a date.

| Source | What it supports | Strength and limits | Last checked |
|---|---|---|---|
| Shao, Man and Lee (2024), *Mindfulness*, meta-analysis of slow-paced breathing (31 studies, n=1,133) | Breathing at about 6 a minute produces short-term calming changes in heart rate, heart rate variability and blood pressure | Effect on stress and negative emotion modest and not significant (p=0.06). Adults, non-clinical, sessions of 5+ minutes, deliberate breathing | Not yet re-verified in this repo |
| Fish (2014), ECU dissertation, casual games and anxiety | Casual play linked to lower state anxiety | Weak: n=54, not randomised, adults already on medication | Not yet re-verified in this repo |
| HSE (adapted from NHS), Rethink Mental Illness, Mental Health Foundation, Mind | Slow breathing, longer out-breaths, focusing on one object, peaceful imagery | Public self-help guidance. Some people feel worse with breath focus or mindfulness | Not yet re-verified in this repo |
| NICE CG113 | Treatment of anxiety and panic belongs to healthcare | Used only as a boundary | Not yet re-verified in this repo |
| Xbox Accessibility Guideline 123 | Content notes, skippable distressing content, respectful portrayal | Industry practice, not empirical proof | Not yet re-verified in this repo |
| WCAG 2.2 SC 2.3.1 | No more than 3 flashes in any second; saturated red is riskier | Standard. No setting makes a breach acceptable. Its area and luminance thresholds are not yet re-verified, so do not rely on "small area" as the reason an effect is safe | Not yet re-verified in this repo |
| WCAG 2.2 SC 2.3.3 | Non-essential motion from interaction can be switched off | Standard (level AAA). Protects players with vestibular disorders | Not yet re-verified in this repo |
| Google Play Health Content and Services policy | Health features trigger a declaration and disclaimer; misleading health claims are banned | Store policy; wording changes over time | Not yet re-verified in this repo |

**Outside the evidence table:**
- Young children (under about 10) breathe faster at rest than adults, so a 6-a-minute rhythm may be uncomfortable if they try to follow it. This is general physiology, not from a source above; verify before relying on it. It is one reason the game never instructs breathing.
- Every Tier 2 rule, and the 10-taps-a-second test as a test method, is design judgement, not a finding.

## 4. Sensory rules

Two tiers, by owner decision (section 9, decision 9). Tier 1 is safety and is pass/fail everywhere. Tier 2 is comfort and binds Calm mode only.

### Tier 1: whole game (safety, non-negotiable)

Applies to Calm mode, Story mode, menus, the reveal and the gallery.

- **Flash limit:** nothing flashes more than 3 times in any one second. No saturated red flashing.
- **10-taps-a-second test:** every tap-triggered effect stays within the flash limit at 10 taps a second and with several fingers at once.
- **No full-screen flash**, and no full-screen colour change triggered per tap.
- **Reduce motion:** an in-game setting, which also follows the phone's system setting (Android mechanism needs a tech lead check). Behaviour per effect is in the table below.
- **Sound:** no sudden loud sounds. Separate music and effects sliders. Overlapping sounds are capped so fast tapping cannot stack volume. Music fades in on entering a mode and out on leaving, so no mode starts at full volume. The mute choice is remembered.
- **Time-based effects:** all effects run on time, not frame counts, so limits hold on 60, 90 and 120 Hz screens.
- **Patterns:** symbols and patterns are never clusters of dots or holes.
- **Retired prototype effects** stay retired as they were built (table below). Story mode may have new, bounded effects (section 6).

**Reduce motion table**

| Effect | Mode | With Reduce motion on |
|---|---|---|
| Wrong-tap screen shake | Story | Replaced by a brief dim |
| Popped light travelling to the mural | Story | Removed |
| Reveal (colour flowing into the mural) | Story | Plain crossfade |
| Pop burst | Both | Small fade, no expanding rings |
| Wrong-tap wobble | Calm | Brief dim of that circle |
| Swell and settle | Calm | Reduced or off |
| Low-time bar pulse | Story | Kept: it is a brightness change, not motion, and stays inside the flash limit (advisor's reading; designer to confirm) |
| Circle drift | Both | Kept: it is the game |

**Retired prototype effects**

| Effect | Where | Why |
|---|---|---|
| Uncontrolled canvas shake (±4 px, 0.4 s) | `index.html` (`.shake`), `src/game.js` | No off switch, not bounded |
| Glitch particles | `src/particle.js` `createGlitch` | Erratic jittering dots |
| Per-tap full-screen tint | `src/game.js` `fadeToBackgroundColor` | Whole-screen colour tied to tap rate |
| Frame-counted lifetimes | `src/particle.js`, `src/circle.js` | Speed varies with screen refresh rate |
| Red "Game Over!" on one wrong tap | `index.html`, `src/game.js` | Alarm colour and hard fail |
| Rain mode bursts | `rain.css`, `src/rainEffect.js` | White on near-black, highest contrast in the code |
| Large ripple rings | `src/particle.js` `createRipple` | Rings up to 260 px on every tap; not local to the circle |
| Fast swoop-in of circles | `src/circle.js` `animateIn` | Frame-counted, abrupt entrance |

### Tier 2: Calm mode only (comfort; design judgement, not safety)

- No screen shake at all.
- Pulses no faster than one every 2 seconds.
- No blinking, ticking or urgency cues of any kind.
- Small, quiet tap feedback. Effects sit below the music bed.
- Soft arrival of circles.
- No colour change faster than a 1 second fade.
- Glow uses stepped solid rings, not fine dither.
- No spiders, snakes, needles, deep water or heights in Calm art.

All Calm-specific values in section 5 stay as they are.

### Safety reading of the Story allowances

**No blocker.** As specified, no Story allowance in section 6 breaches the 3-flashes-a-second limit. A bar pulse of at most 2 a second is under the limit on its own. Three conditions follow from Tier 1 and must hold in the build:

1. **Flashes add up.** The limit applies to what the player sees in total, not to each element separately. The bar pulse, other Story pulses and bright pop bursts can run at the same moment. The surest build is: pulses share one clock, pulse brightness changes are modest, and a burst brightens once and fades rather than blinking. Proof is by measurement (section 10), not by this reading.
2. **No saturated red on the low-time bar pulse.** A low-time bar is the usual place a red pulse creeps in.
3. **"Bigger and brighter" bursts must still pass the 10-taps-a-second test**, with several fingers, as a combined effect.

**Residual risk, stated once:** Story mode is intentionally less comfortable for anxious or motion-sensitive players. Calm mode and Reduce motion are the mitigations.

## 5. Calm mode

Calm is one endless level with no story, no timer, no score, no streaks, no fail state and nothing to lose. Values below are starting values; see `docs/game-design.md`.

| Item | Agreed value | Basis |
|---|---|---|
| Shared rhythm | 10 s cycle, about 4 s swelling and 6 s settling | Rate (6 a minute) matches the supported pace. The 4/6 split is consistent with self-help guidance on longer out-breaths; whether it was studied is unverified |
| Effect of the rhythm on the player | None claimed | **Hope only.** No evidence that an uninstructed visual rhythm changes breathing or mood |
| Swell amplitude | About 5 to 8% of radius, smooth easing, no hold | Tier 2, design judgement |
| Touch target | At or above the minimum at the settled size | Accessibility |
| Target glow | Pulses on the same 10 s rhythm, so there is only one rhythm | Tier 2, design judgement |
| Density | 4 to 6 circles, 3 colours | Single-focus task: self-help guidance; casual-game evidence is weak |
| Circle arrival | Fade or drift in over 1 s or more; a target-colour circle is always on screen | Tier 2, design judgement |
| Target change | After a number of clears, never on a clock; swatch-only crossfade of about 2 s; no sting, no background tint; old and new targets both accepted during the crossfade | Tier 2, design judgement |
| Wrong tap | One small slow wobble (about 300 ms or more) on that circle only; sound quieter than the pop | Owner decision; no penalty of any kind |
| Music | Fades in over 1 to 2 s, including from the open-into-Calm shortcut | Tier 1 (no sudden loud sound); the length is design judgement |
| Background | Dim warm mid-tone, not white | Tier 2, design judgement |
| Vibration | Off by default | Owner decision |
| Start and exit | One tap in, instant out, no confirmation; returning from the background fades straight back in with no overlay or countdown | Owner decision |
| Breathing interlude | Not in v1.0 | Owner decision, 2026-10-11 |

**Launch screen:** quiet. The Story button does not animate quickly, and no Story music plays there.

## 6. Story mode

Story mode is meant to feel frantic. Everything here sits inside Tier 1; Tier 2 does not apply. Values are starting values, to be tuned in playtests.

| Item | Allowance | Bound |
|---|---|---|
| Wrong tap | One small, short, decaying screen shake, plus the chunk leaving the time bar | A few pixels, 200 ms or less. One shake at a time: repeated wrong taps never stack or extend it. No red flash. Under Reduce motion the shake becomes a brief dim |
| Low time | The time bar itself may pulse, and a tick sound may quicken as time runs out | Bar only, never the screen. At most 2 pulses a second. No saturated red flashing. The tick is on the effects slider and is not a sudden loud sound |
| Other pulses | Allowed | At most 2 a second |
| Pops | Bigger and brighter pixel bursts | Local to the circle. Never a full-screen flash. Passes the 10-taps-a-second test |
| Failure | "Nearly! Try again", then a quick fade before the level restarts | Fade of about 0.5 to 1 s. Not a hard cut |
| Reveal | Unchanged | One gradual colour fade of 1 s or more, no bright bloom at the end, text stays until tapped, tap to skip with no loss of progress |
| Travelling lights | Allowed | Removed under Reduce motion |
| Music | May build in tempo and energy | No sudden loud sounds |

## 7. Story content ("The Lantern Mural")

- The story lives in Story mode only. No mural, unlit-lantern or grief imagery in Calm or on the launch screen.
- Loss is shown through absence only. No danger, injury, cause of loss or graves. "Someone dear" stays unspecified.
- **Compassion note for Stage 2:** the Keeper is never blamed. Tell it so the valley failed to help her, not so her grief ruined the valley. Stage 3 keeps "not undone, but remembered".
- **Content note:** "A story about loss and hope" (or similar) on first entry to Story mode and in the store text.
- Grief and mental health are never shown as villainy, danger or a joke.

## 8. Privacy and contact

- No mood, anxiety or health data. No mood check-ins.
- No analytics on Calm use: when and how often someone opens Calm is a proxy for how they feel.
- No push notifications. No streaks, daily rewards or return prompts.

## 9. Owner decisions, 2026-10-11

| # | Decision |
|---|---|
| 1 | Reduce motion setting, also following the system setting: yes |
| 2 | Separate music and effects sliders: yes |
| 3 | Breathing interlude: not in v1.0. The 10 s rhythm stays; the game never instructs breathing |
| 4 | Content note and tap-skippable reveal: yes |
| 5 | "Need to talk to someone?" support item in settings: left out. The game contains no support signposting or helpline details |
| 6 | No push notifications, no Calm analytics: yes |
| 7 | Story restart: a quick fade of about 0.5 to 1 s before the level restarts. Revised the same day; it replaces the earlier 1 to 2 s automatic beat |
| 8 | Children, target audience and Families policy: deferred to the store rating question |
| 9 | Sensory rules split into two tiers. Safety rules (Tier 1) stay game-wide. Comfort rules (Tier 2) apply to Calm mode only, so Story mode can feel frantic as intended. Story mode allowances are in section 6 |
| 10 | Story wrong-tap shake: one at a time. Repeated wrong taps never stack or extend it |

## 10. Open checks before release

**Measure on a real device, at 60 and 120 Hz, against the flash thresholds**
- [ ] The 10-taps-a-second test on every tap-triggered effect, with several fingers, including Story's bigger pop bursts.
- [ ] The low-time bar pulse at 2 a second.
- [ ] The bar pulse, other Story pulses and pop bursts running together (flashes add up).

**Re-verify against live sources**
- [ ] WCAG 2.3.1 area and luminance thresholds. Until this is done, nobody relies on "small area" as the reason a pulse or burst is safe.
- [ ] WCAG 2.3.1 and 2.3.3 definitions generally.
- [ ] The Shao et al. figures, and whether a 4 s in / 6 s out ratio was studied.
- [ ] Google Play health policy wording; confirm the listing does not make the game a health app.
- [ ] XAG 123.
- [ ] The under-10s breathing-rate point (general physiology).

**Other**
- [ ] Children: decide the Google Play target audience and check Families policy, together with the 12+ storyline rating (deferred by the owner).
- [ ] Tech lead: how Reduce motion follows the Android system setting.
- [ ] Designer to confirm: the low-time bar pulse is kept under Reduce motion.
- [ ] Review final store copy and the shortcut label against section 2.
- [ ] Review Stage 2 and Stage 3 art and lines against section 7 once written.

## 11. Release checklist

**Whole game (Tier 1)**
- [ ] Nothing flashes more than 3 times a second, counted across everything on screen; no saturated red flashing
- [ ] Every tap-triggered effect passes the 10-taps-a-second test with several fingers
- [ ] No full-screen flash; no full-screen colour change per tap
- [ ] Reduce motion works per the table and follows the system setting
- [ ] No sudden loud sounds; music and effects sliders; no volume stacking; music fades in and out
- [ ] All effects time-based; checked at 60 and 120 Hz
- [ ] No symbol or pattern is a cluster of dots or holes
- [ ] No retired prototype effect remains as built
- [ ] No medical or therapeutic claims, and no psychologist endorsement, in game or store listing
- [ ] No mood or health data, no Calm analytics, no notifications

**Calm mode (Tier 2 and section 5)**
- [ ] No timer, score, counter, fail state, streak or evaluative text
- [ ] No screen shake; no blinking, ticking or urgency cues
- [ ] Pulses no faster than one every 2 s; no colour change faster than a 1 s fade
- [ ] Small, quiet tap feedback; effects below the music bed; circles arrive softly
- [ ] One tap in, instant out, quiet resume
- [ ] No story content or story imagery; no common phobia triggers in art
- [ ] Rhythm, density, target change and wrong tap match section 5
- [ ] The game never instructs breathing

**Story mode (section 6)**
- [ ] Wrong-tap shake is a few pixels, 200 ms or less, decaying, one at a time (never stacked or extended); brief dim under Reduce motion; no red flash
- [ ] Low-time pulse is on the bar only, at most 2 a second, not saturated red
- [ ] Tick sound is on the effects slider and never a sudden loud sound
- [ ] Other pulses at most 2 a second
- [ ] Pop bursts are local to the circle
- [ ] Failure uses a fade of about 0.5 to 1 s, not a hard cut
- [ ] Reveal: gradual fade, no bloom, text waits for a tap, skippable with no loss of progress
- [ ] Content note shown on first entry and in store text
- [ ] Story follows section 7, including the Stage 2 compassion note

## 12. Review record

| Date | Reviewed | By | Outcome |
|---|---|---|---|
| 2026-10-11 | `docs/game-design.md` Draft v0.3; prototype files `index.html`, `rain.css`, `src/particle.js`, `game.js`, `circle.js`, `rainEffect.js`, `colorManager.js` | AI advisor agent (not a clinical endorsement) | No safety breach in the design as written. Three sets of missing guarantees raised and accepted: measurable flash rule, Reduce motion, retired prototype effects. Owner decisions 1 to 8 recorded. No source re-checked live. Not read: `src/uiManager.js`, `gameModes.js`, `main.js`, `leaderboard.js`, `config.js`, `utils.js`, `docs/backlog.md` |
| 2026-10-11 | Owner's two-tier split and the Story mode allowances, as relayed by the coordinator (v0.2 of this file) | AI advisor agent (not a clinical endorsement) | No allowance breaches the flash limit as specified; no blocker. Three build conditions recorded in section 4. Decision 7 revised and decision 9 added. Assessed from the specification only: nothing built, nothing measured, no source re-checked live, and `docs/game-design.md` not re-read because it was being edited in parallel |
