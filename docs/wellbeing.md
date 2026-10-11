# Wellbeing and sensory safety: Pastel Pop

**Status:** v0.6, 2026-10-11. Working reference for the designer and engineers. Design detail lives in `docs/game-design.md`; this file holds the safety rules, the evidence behind them and the release checks. Where the two disagree on a design value, `docs/game-design.md` wins and this file should be corrected.

**Changed in v0.2:** the sensory rules are split into two tiers by owner decision. Tier 1 (safety) covers the whole game. Tier 2 (comfort) covers Calm mode only. Story mode gains bounded allowances (section 6).

**Changed in v0.3:** the sources in section 3 were checked against their live pages where they could be reached. WCAG, the Xbox guideline, Google Play, HSE, Rethink and the Mental Health Foundation were read. The Shao study, the Fish dissertation, NICE and Mind could not be reached and stay unverified. No rule or value was changed; suggested changes are listed for the owner in section 10.

**Changed in v0.4:** the four proposals from that source check were agreed by the owner and applied: stress wording banned, WCAG flash definitions added, a condition on the low-time bar pulse, and the shared rhythm's basis text reworded.

**Changed in v0.5:** the owner agreed all recommendations from the review of the Calm proposal in `docs/game-design.md` v0.6 (decisions 12 to 20 in section 9). Colour names and the Dusk background are recorded; Calm gets four flash-limit caps in Tier 1 (ring pops, circle arrivals, the Reduce motion dim, entering and leaving Calm); the Tier 2 fade rule is scoped; section 5 gains rows for palette, correct tap, motion, idle and screen sleep; the retired-effects table now says what has been deleted and what is still in the code. Nothing in this version has been built or measured: the new caps are reasoned from the specification and must be proved on a device (section 10).

**Changed in v0.6:** the four sources this repo's fetch tool could not reach (Shao, Fish, NICE, Mind) are marked verified on 2026-10-11, on the owner's instruction, with facts read live in the owner's Claude chat session. No rule or value changed. One question stays open: whether the Shao study covered a 4 s in / 6 s out ratio.

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
| | "stress management", "stress relief", "helps you manage stress" |

Rules:
- Stress wording is banned because Google Play names "stress management apps" as an example of a health and fitness app. Google does not mention "calming" or "relaxing" either way (read 2026-10-11).
- The Calm mode "Purpose" sentence in `docs/game-design.md` (naming anxiety and panic attacks) is internal design intent. It never appears in the store listing, in-game text, screenshots or a shortcut name.
- The open-into-Calm shortcut or widget is labelled "Calm". Never "panic", "SOS" or similar.
- Calm mode has no evaluative text at all: no praise, no counts, no messages. Praise for effort belongs to Story mode only.
- "Nearly! Try again" is fine, in Story mode only.
- **Colour names:** the five colours are Star, Cloud, Kite, Leaf and Moon (owner decision 12). Each colour has one name, the plain noun for the thing its symbol shows. There is no second set of shade names (decision 17).
- A colour name never describes a mood or an effect on the player, in the game, the code, the accessibility labels or the store text. No "calm", "serene", "mindful", "healing" or similar.
- Names are not shown as text during play. They may appear in accessibility labels with a plain colour word, for example "Target: Star, yellow".
- The exit control's accessibility label is neutral: "Leave Calm". Never "Quit", "Give up", "End session" or anything that makes stopping sound like failing. This is design judgement, in line with the principle that stopping must feel complete.
- The prototype's colour names and "psychology" strings ("mindful blue", "renewal green", "Creates mental space and peaceful clarity") are unsupported claims. None may reach player-facing or store text. They were removed from the code on 2026-10-11 (foundations task F-02); a search of `src/` and `index.html` finds none.
- All store copy is reviewed against this section before release.

## 3. Evidence

The sources below were checked on 2026-10-11. Most were read against their live pages by this repo's fetch tool, which returns a summary with short quotes, so quoted wording should be re-read on the page itself before it is used for a release decision. Four (Shao, Fish, NICE and Mind) could not be reached by that tool; they were read live in the owner's Claude chat session and are marked verified by the owner, with the facts the owner supplied. Details for each source are in the notes under the table.

| Source | What it supports | Strength and limits | Last checked |
|---|---|---|---|
| Shao, Man and Lee (2024), *Mindfulness*, meta-analysis of slow-paced breathing (31 studies, n=1,133 non-clinical adults) | Slow-paced breathing at about 6 a minute gave reliable short-term cardiovascular effects | Effect on negative emotion and stress was modest and not significant (p=0.06). Whether a 4 s in / 6 s out ratio was studied is not established | Verified 2026-10-11 by the owner: read live in the owner's Claude chat session and supplied as facts. Not fetched by this repo's tools |
| Fish (2014), ECU dissertation, casual games and anxiety | Casual game play linked to lower state anxiety | Weak evidence: n=54 adults on SSRIs, non-randomised | Verified 2026-10-11 by the owner: read live in the owner's Claude chat session and supplied as facts. Not fetched by this repo's tools |
| HSE, Rethink Mental Illness, Mental Health Foundation (read by this repo's tool); Mind (read by the owner) | Slow breathing and longer out-breaths (HSE, Rethink). Noticing everyday things through the senses, or focusing on one routine task (Rethink, Mental Health Foundation) | Public self-help guidance, not studies. Mindfulness can be hard or make some people feel worse (Rethink, Mental Health Foundation). "Peaceful imagery", a 1-to-5 breathing count, NHS adaptation and "stop if a breathing exercise causes difficulty" were not found on the pages read | 2026-10-11 for HSE, Rethink and Mental Health Foundation (pages listed below). **Mind:** "How to manage anxiety and worry", published March 2026; recommends breathing and grounding, and notes mindfulness makes some people feel worse. Verified 2026-10-11 by the owner: read live in the owner's Claude chat session and supplied as facts. Not fetched by this repo's tools |
| NICE CG113 | Treatment of anxiety and panic belongs to healthcare | Clinical guideline for professionals treating adults with generalised anxiety disorder or panic disorder. Used only as a boundary. Last checked by NICE in March 2020 | Verified 2026-10-11 by the owner: read live in the owner's Claude chat session and supplied as facts. Not fetched by this repo's tools |
| Xbox Accessibility Guideline 123 | Content descriptions before purchase, warnings at launch, an option to skip distressing scenes, respectful portrayal of mental health. Names "death or loss of a loved one" as content that can need a warning. Names trypophobia (clusters of bumps or small holes) among common phobias | Industry practice, not empirical proof. It asks for warnings and options; it does not tell developers to remove content. Avoiding phobia triggers in Calm art is our own choice | 2026-10-11, full page, learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/123 |
| WCAG 2.2 SC 2.3.1 (level A) | Nothing flashes more than 3 times in any one second, unless the flash is below the general flash and red flash thresholds | Standard. No setting makes a breach acceptable. The thresholds do include a small-area route, but its size estimate assumes a desktop screen, so this game does not rely on it (see notes) | 2026-10-11, www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html and the glossary of www.w3.org/TR/WCAG22/ |
| WCAG 2.2 SC 2.3.3 (level AAA) | Motion animation triggered by interaction can be switched off, unless it is essential | Standard. Protects players with vestibular disorders (the page lists distraction, dizziness, headaches and nausea). Covers motion started by the player's action only | 2026-10-11, www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html and the glossary of www.w3.org/TR/WCAG22/ |
| Google Play Health Content and Services policy, and Families policy | Health features or health information make an app a health app, which then needs a disclaimer; the Health apps declaration form is for all developers; misleading or harmful health functions and claims are banned | Store policy; wording changes over time. The pages say nothing either way about "calming" or "relaxing". "Stress management apps" are named as an example of a health and fitness app | 2026-10-11, support.google.com/googleplay/android-developer/answer/16679511, /answer/13996367 and /answer/9893335 |

### What the live pages said (2026-10-11)

**WCAG 2.3.1, flashing**
- The rule: pages "do not contain anything that flashes more than three times in any one second period", or the flash is below the thresholds. Level A.
- A flash is a pair of opposite brightness changes (up then down, or down then up).
- Content is below the thresholds if either of these is true: (1) no more than three general flashes and no more than three red flashes in any one second; or (2) the combined area of flashes happening at the same time is no more than 25% of any 10 degree visual field on the screen, at typical viewing distance.
- A **general flash** is a pair of opposite changes in relative luminance of 10% or more of the maximum, where the darker state is below 0.80. A brightness change smaller than that is not counted as a general flash.
- A **red flash** is any pair of opposite transitions involving a saturated red. The working definition given: one state has R/(R+G+B) of 0.8 or more, and the colour difference between the two states is more than 0.2 on the CIE 1976 UCS chromaticity diagram.
- A fine, balanced pattern (such as white noise or a checkerboard with squares under 0.1 degree) is exempt.
- **What this does and does not support for a phone game.** The wording does make small area a real way to pass. But the only size estimate the standard gives (a 341 x 256 pixel block on a 1024 x 768 screen) is for a 15 to 17 inch screen viewed from 22 to 26 inches. It gives no figure for a phone. The Understanding page says the standard "cannot account for the actual viewing distance that a person chooses", that people closer than the assumed distance "will be affected by flashing areas that normatively pass", and that content should be analysed at the largest scale a user may view it. A phone is held close, and a child may hold it closer. So "it is small" is not a safe reason on its own. This game passes by flash count (route 1), counted across everything on screen, and keeps brightness changes modest. Area stays a second safeguard, never the argument.
- The standard counts red flashes the same way as general flashes (three a second). Our "no saturated red flashing" rule is stricter than the standard. That is deliberate.
- The area test says flashes at the same moment are combined. The standard does not spell out how to count flashes from separate elements pulsing out of step. Our "flashes add up" reading (section 4) is the cautious one and stays.
- WCAG also has SC 2.3.2 (level AAA): three flashes a second with no threshold exception. Our Tier 1 rule is, in effect, that stricter version.
- The standard notes that tools can analyse a screen recording, and that no tool is needed if flashing is at or under 3 a second.

**WCAG 2.3.3, motion**
- The rule: "Motion animation triggered by interaction can be disabled, unless the animation is essential". Level AAA.
- Motion animation means added steps that create movement or a smooth transition. It does not include changes of colour, blur or opacity that do not change the perceived size, shape or position of the element.
- Essential means that removing it would fundamentally change the information or function, and it cannot be done another conforming way.
- The page recommends using the system reduce-motion setting (`prefers-reduced-motion`).
- What this means here: a brightness-only pulse is not motion under this definition, as long as the element does not change size, shape or position. Ambient movement that the player did not trigger (circle drift, swell and settle) is outside this rule, so our Reduce motion table already goes further than 2.3.3 asks.

**Xbox Accessibility Guideline 123**
- Page dated 2022-05-09 by Microsoft; still published.
- Recommends: a description of sensitive content that players can read before buying; a warning at launch; optional warnings before specific scenes; options to lessen or remove such content; an option to skip scenes or missions, ideally also once the scene has started and without blocking progress; respectful portrayal, including not linking mental illness with villainy.
- Sensitive content listed includes "death or loss of a loved one", which is the Story mode theme.
- Phobias named: spiders, snakes, heights, flying, injections or needles, drowning, clowns, and trypophobia ("repetitive patterns or clusters of bumps or small holes").
- It says plainly that it is not asking developers to avoid or remove content. It asks for warnings and choices.
- It also suggests developers consider in-game support resources. The owner has decided against this for v1.0 (decision 5); recorded here only for completeness.

**HSE, Rethink, Mental Health Foundation, Mind**

| Organisation | Page read | What it said |
|---|---|---|
| HSE | www2.hse.ie/mental-health/self-help/activities/relaxation-tips/ (last reviewed 23/07/2025) and .../activities/mindfulness/ (last reviewed 23/07/2025) | Breathing: "try holding your breath for a count of 4 and then exhaling (breathing out) to a count of 6", later working up to "inhaling for 7 seconds and exhaling for 9". Suggests 2 minutes. No 1-to-5 count, no advice to stop, no mention of children, no NHS credit on these pages. Mindfulness page: notice everyday things; no warning that it may not suit everyone |
| Rethink | rethink.org/advice-and-information/about-mental-illness/mental-health-conditions/anxiety-disorders/ (updated February 2024) and rethink.org/advice-and-information/living-with-mental-illness/wellbeing-physical-health/stress-how-to-cope/ (updated January 2023; its own "next update" date of March 2026 has passed) | Breathing: count as you breathe, slow down, "see if you can expand your exhale, to make it longer than your inhale". Also a 4 s in, 5 s hold, 8 s out method, with "you can alter the number of seconds to suit you". Mindfulness: "may be difficult if you are having very distressing thoughts. If they are causing you difficulty speak to your doctor". That advice is about mindfulness and meditation, and it says speak to a doctor; no line about stopping a breathing exercise was found |
| Mental Health Foundation | www.mentalhealth.org.uk/explore-mental-health/a-z-topics/mindfulness (updated 13 August 2021) and .../publications/how-manage-and-reduce-stress | Noticing difficult thoughts "could make you feel worse at first"; mindfulness may not help someone who is very unwell; it "could worsen" trauma symptoms for people with PTSD. Suggests noticing everyday sensations. No breathing counts and no imagery guidance |
| Mind | "How to manage anxiety and worry", published March 2026. Recommends breathing and grounding; notes mindfulness makes some people feel worse. Read by the owner, not by this repo's tool (www.mind.org.uk returned HTTP 403 to it) | Verified 2026-10-11 by the owner |

- The HSE breathing page first tried (.../activities/breathing-exercises-for-stress/) returned "not found". That address came from memory, so this does not show a page was removed. The 1-to-5 count and "adapted from NHS" stay unverified.
- Two of the three organisations read include a breath-hold in their guidance. This game has no breathing instruction, so nothing follows from that for v1.0.

**Google Play**
- Health Content and Services: applies "if your app offers health-related features or information as part of its functionality", and also to non-health apps that access health data; its example is "games apps that collect a user's activity data".
- "All developers must complete the Health apps declaration form on the App content page" in Play Console. So the form is not only for health apps; it is where the game states what it is.
- Health and medical apps that are not regulated medical devices "must include a clear disclaimer in their app description" that the app is "not a medical device and does not diagnose, treat, cure, or prevent any medical condition", and must remind users to consult a healthcare professional.
- Not allowed: health and medical functions that are "misleading or potentially harmful", and "misleading health claims that contradict existing medical consensus".
- Health app categories page: health and fitness apps are "apps that help users manage their health and fitness"; the examples include sleep trackers and "stress management apps". Relaxation, meditation, calming and games are not mentioned. Its advice on claims applies "if your app makes a health or medical claim, such as helping in diagnosis or management of health conditions".
- Reading for this game (advisor's reading, not Google's wording): the pages neither clear nor forbid "calming" and "relaxing". The risk sits in health features, health data and health claims, which sections 1, 2 and 8 already rule out. Wording about managing or relieving stress would move towards a named health-app example.
- Families policy, recorded without deciding decision 8: "If one of the target audiences for your app is children, you must comply". The target audience must be declared before publishing, and misstating it can lead to removal. Content children can reach "must be appropriate for children". Any ads shown to children must come from Google's self-certified ad SDKs, with no interest-based advertising. Collection of personal and sensitive information from children must be disclosed. Apps for children must not send the Android advertising ID, and may only use SDKs approved for child-directed services. A mixed-audience app must use age screening, such as a neutral age screen, so children only see non-personalised ads. The page notes an app may be designed for children "or your app may just attract their attention".

**Could not be reached by this repo's fetch tool** (all four were then verified by the owner on 2026-10-11; see the table above)
- **Shao, Man and Lee (2024):** link.springer.com/article/10.1007/s12671-023-02294-2 answered with a redirect to idp.springer.com, a different host used for sign-in. It was not followed. The article address and DOI also came from memory and are themselves unconfirmed.
- **Fish (2014):** the search and browse pages on thescholarship.ecu.edu returned either "not found" or a page with no readable content, and the one item address tried was a different thesis. The correct address is needed.
- **NICE CG113:** www.nice.org.uk/guidance/cg113 returned HTTP 403.
- **Mind:** see the table above.

**Outside the evidence table:**
- Young children (under about 10) breathe faster at rest than adults, so a 6-a-minute rhythm may be uncomfortable if they try to follow it. This is general physiology, not from a source above; verify before relying on it. It is one reason the game never instructs breathing. None of the pages read on 2026-10-11 mentioned children's breathing, so this is still unverified.
- Every Tier 2 rule, and the 10-taps-a-second test as a test method, is design judgement, not a finding.

## 4. Sensory rules

Two tiers, by owner decision (section 9, decision 9). Tier 1 is safety and is pass/fail everywhere. Tier 2 is comfort and binds Calm mode only.

### Tier 1: whole game (safety, non-negotiable)

Applies to Calm mode, Story mode, menus, the reveal and the gallery.

- **Flash limit:** nothing flashes more than 3 times in any one second. No saturated red flashing.
  - **What counts as a flash** (WCAG 2.3.1): a pair of opposite brightness changes of 10% or more of the maximum relative luminance, where the darker state is below 0.80.
  - **Saturated red** means R/(R+G+B) of 0.8 or more.
  - Flashes are counted across the whole screen. The small-area exception in WCAG is not used.
- **10-taps-a-second test:** every tap-triggered effect stays within the flash limit at 10 taps a second and with several fingers at once.
- **No full-screen flash**, and no full-screen colour change triggered per tap.
- **Reduce motion:** an in-game setting, which also follows the phone's system setting (Android mechanism needs a tech lead check). Behaviour per effect is in the table below.
- **Sound:** no sudden loud sounds. Separate music and effects sliders. Overlapping sounds are capped so fast tapping cannot stack volume. Music fades in on entering a mode and out on leaving, so no mode starts at full volume. The mute choice is remembered.
- **Time-based effects:** all effects run on time, not frame counts, so limits hold on 60, 90 and 120 Hz screens.
- **Patterns:** symbols and patterns are never clusters of dots or holes.
- **Symbols:** Star, Cloud, Kite, Leaf and Moon are drawn as solid silhouettes with no inner dots or holes. Cloud is one solid mass, never separate puffs or dots. Basis: XAG 123 names clusters of bumps or small holes (trypophobia). A single hole is not a cluster, so "no inner holes at all" goes further than the guideline; that part is design judgement, chosen because each symbol is repeated on every circle and several circles are on screen together.
- **Retired prototype effects** stay retired as they were built (table below). Story mode may have new, bounded effects (section 6).

**How Calm stays inside the flash limit** (owner decisions 14, 15 and 16)

A circle in Calm is light on a dark background: Star has a relative luminance of about 0.69 and Dusk about 0.03 (figures from `docs/game-design.md`, computed by hand from the hex values). A circle appearing and then disappearing is therefore a full general flash under the WCAG definition, and several circles can do it at once. The four caps below are how Calm passes by flash count. They are the advisor's reasoning from the specification, not a measurement.

- **Ring pops (count cap):** no more than 3 ring pops begin in any one second, across the whole screen. Extra pops in that second use the plain fade with no ring. The pop never brightens the circle and never turns white.
- **Arrivals:** no more than 2 circles begin arriving in any one second. A circle's fade-in followed by its pop counts as one flash.
- **Reduce motion dim (luminance cap):** the dim changes relative luminance by no more than about 0.07 on the lightest colour, which keeps it under the 0.10 that counts as a general flash. The cap is on luminance, not on a fixed percentage, so it is recomputed whenever a hex value changes. With the starting values this is about 6% of the way towards Dusk on Star (designer's figure; the advisor's rough hand calculation gives about 0.07 as well).
- **Entering and leaving Calm:** never a large full-screen brightness step. The launch screen background stays close to Dusk in luminance, and the move between the two is a fade. One step is not a flash by itself under WCAG; the rule is here because it is the largest brightness change a player can cause, and a player can go in and out repeatedly.
- These caps are counted together with everything else on screen, and are enforced in one place in the effects layer so that fast tapping with several fingers cannot get round them.

**Reduce motion table**

| Effect | Mode | With Reduce motion on |
|---|---|---|
| Wrong-tap screen shake | Story | Replaced by a brief dim |
| Popped light travelling to the mural | Story | Removed |
| Reveal (colour flowing into the mural) | Story | Plain crossfade |
| Pop burst | Story | Small fade, no expanding rings |
| Pop | Calm | Plain fade of the circle over about 450 ms, no ring |
| Wrong-tap wobble | Calm | Brief dim of that circle: it eases a little towards the background and back over about 600 ms. At most about 0.07 change in relative luminance on the lightest colour. One dim per circle at a time; a circle already dimming ignores further wrong taps. The cue is faint on purpose and the sound carries most of it |
| Swell and settle | Calm | Reduced or off |
| Target glow | Calm | Kept: it changes opacity only and its pixels never move, so it is not motion under WCAG 2.3.3 |
| Low-time bar pulse | Story | Kept, on one condition: the pulse changes brightness, colour or opacity only, and never the bar's size, shape or position. WCAG 2.3.3 treats a pulse as "not motion" only on that condition. It stays inside the flash limit |
| Circle drift | Both | Kept: it is the game |

**Retired prototype effects**

State of the code checked on 2026-10-11, after foundations tasks F-01 and F-02 were merged, by searching `src/` and `index.html`. The files `src/particle.js`, `src/rainEffect.js`, `src/gameModes.js`, `src/leaderboard.js` and `rain.css` no longer exist. "Still in the code" means the effect was found on that date.

| Effect | Why it was retired | State on 2026-10-11 |
|---|---|---|
| Glitch particles (erratic jittering dots) | Erratic jittering dots | Removed: the particle file is deleted |
| Large ripple rings (up to 260 px on every tap) | Not local to the circle | Removed: the particle file is deleted |
| Rain mode bursts | White on near-black, the highest contrast in the prototype | Removed: the Rain files are deleted |
| Frame-counted particle lifetimes | Speed varies with screen refresh rate | Removed with the particle file |
| Uncontrolled canvas shake (±4 px, 0.4 s) | No off switch, not bounded | Removed (F-02) |
| Full-screen background tint on each correct tap | Whole-screen colour tied to tap rate | Removed (F-02) |
| Red "Game Over!" on one wrong tap | Alarm colour and hard fail | Removed (F-02) |
| Fast swoop-in of circles | Frame-counted, abrupt entrance | Removed (F-02) |
| Frame-counted circle movement | Speed varies with screen refresh rate | **Still in the code:** `src/circle.js` moves by a fixed amount per frame |
| Colour names and "psychology" strings | Unsupported claims (section 2) | Removed (F-02) |

The rule is unchanged: none of these may remain as built at release (section 11).

### Tier 2: Calm mode only (comfort; design judgement, not safety)

- No screen shake at all.
- Pulses no faster than one every 2 seconds.
- No blinking, ticking or urgency cues of any kind.
- Small, quiet tap feedback. Effects sit below the music bed.
- Soft arrival of circles.
- No colour change faster than a 1 second fade for anything the player did not trigger at that spot: background, swatch and target changes, circle arrival, glow, HUD and screen transitions. Feedback on the tapped circle itself may be faster (pop about 450 ms; Reduce motion dim about 600 ms), provided it stays on that circle, never brightens it, and runs once per circle at a time. Reason (design judgement): a change the player caused, where they are looking, is expected and does not startle; a change elsewhere on screen is not expected. Feedback slower than about half a second would also stop feeling like a response to the tap.
- Glow uses stepped solid rings, not fine dither. The glow is on the target swatch only.
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
| Shared rhythm | 10 s cycle, about 4 s swelling and 6 s settling | The rate of about 6 a minute matches the pace studied in Shao et al. (verified 2026-10-11): reliable short-term cardiovascular effects, with a modest, non-significant effect on negative emotion and stress. Longer out-breaths appear in HSE and Rethink guidance (confirmed 2026-10-11). Whether a 4/6 split was studied is not established. Whether an uninstructed visual rhythm changes anyone's breathing or mood remains a hope |
| Effect of the rhythm on the player | None claimed | **Hope only.** No evidence that an uninstructed visual rhythm changes breathing or mood |
| Swell amplitude | About 5 to 8% of radius, smooth easing, no hold | Tier 2, design judgement |
| Touch target | At or above the minimum at the settled size | Accessibility |
| Target glow | Pulses on the same 10 s rhythm, so there is only one rhythm | Tier 2, design judgement |
| Density | 4 to 6 circles, in 3 of the 5 colours. The 3 are drawn at random for each visit to Calm and kept for the whole visit. Circles never expire or vanish on their own | Owner decision 17. Single-focus task: self-help guidance (Rethink, Mental Health Foundation); casual-game evidence is weak and unverified. That 3 is the right number is design judgement |
| Palette | Star `#EDD894`, Cloud `#9CC4E4`, Kite `#E6A08C`, Leaf `#5E9478`, Moon `#9A82C2`. Soft and low in saturation, fully opaque fills, no pure white, no pure black, no saturated red (the reddest, Kite, has R/(R+G+B) of about 0.43 against the Tier 1 line of 0.8). The symbol is on every circle and the swatch and cannot be switched off | Owner decision 12; hex values remain starting values. Contrast figures are in `docs/game-design.md`, computed by hand, not measured on a screen. No evidence is claimed that any colour calms: the palette is design judgement |
| Correct tap | Registers on touch-down. The circle dissolves where it is over about 450 ms, in its own colour only: it never brightens and never turns white. One thin ring reaching no more than a quarter of a radius beyond the circle. One soft note from a small fixed set, chosen at random; the pitch never climbs with consecutive taps | Tier 1 for the ring cap (section 4). No rising pitch because a rising chain is a streak signal: design judgement, following the no-streaks principle |
| Circle arrival | Fade or drift in over 1 s or more; no more than 2 begin arriving in any one second; a target-colour circle is always on screen | Tier 1 for the arrival cap (owner decision 15); the rest is Tier 2, design judgement |
| Target change | After a number of clears, never on a clock; the new target is always a colour already on screen; swatch-only crossfade of about 2 s; no sting, no background tint; old and new targets both accepted during the crossfade. Assistive technology is told politely: the new label is announced once, after any speech already in progress, never interrupting and never repeated | Tier 2, design judgement. The polite announcement is owner decision 19 |
| Wrong tap | One small slow wobble (a single cycle of about 300 ms or more) on that circle only; sound quieter than the pop and not a descending error tone. A circle that is already wobbling ignores further wrong taps and makes no sound, so nothing stacks | Owner decisions; no penalty of any kind. Silence on a repeat tap also keeps the Tier 1 rule that fast tapping cannot stack volume |
| Missed tap | A tap on empty space does nothing: no sound, no mark | Design judgement |
| Motion | Slow, smooth drift (starting value 0.05 play-area widths a second) with no sudden change of speed or direction. Circles never bounce: they turn away from edges and from each other over 1 s or more, and do not overlap. No visible ticking: if movement or the swell would show as whole-pixel jumps, place and scale more finely than the pixel grid, or drop the swell and let the glow carry the rhythm | Tier 2, design judgement. Circle drift is ambient, so it is outside WCAG 2.3.3 |
| Idle | Nothing changes if the player stops tapping. No prompt, hint, nudge or dimming by the game, and nothing that grows more insistent with time. Watching is a complete way to use Calm | Design judgement, following the no-pressure principle |
| Screen sleep | Follows the phone's own setting. No wake lock in v1.0. Three conditions: music pauses when the screen sleeps; waking returns quietly to Calm exactly as it was left, with music fading back in and no overlay or countdown; the game itself never dims the screen | Owner decision 18. Reasons (design judgement): overriding the phone's sleep timer costs battery and takes a choice away from the player; music carrying on from a dark phone could startle |
| Music | Fades in over 1 to 2 s, including from the open-into-Calm shortcut and after the screen wakes | Tier 1 (no sudden loud sound); the length is design judgement |
| Background | Dusk `#332C2E`: a dim, warm, dark tone, neither white nor black. Never tinted by play | Owner decision 12; the hex is a starting value. A mid-tone was dropped because soft colours cannot reach 3:1 contrast against it (the designer's hand calculation in `docs/game-design.md`). "Comfortable at night" is design judgement, to be checked on a real phone in a dark room |
| Entering and leaving | Never a large full-screen brightness step (section 4) | Owner decision 16 |
| HUD | The target swatch and one exit control only. No text, no numbers. The exit control is never animated; its accessibility label is "Leave Calm" | Owner decision 19 for the label; the rest is Tier 2, design judgement |
| Vibration | Off by default | Owner decision |
| Start and exit | One tap in, instant out, no confirmation; returning from the background fades straight back in with no overlay or countdown | Owner decision |
| Breathing interlude | Not in v1.0 | Owner decision, 2026-10-11 |

**Launch screen:** quiet. The Story button does not animate quickly, and no Story music plays there. Its background stays close to Dusk in luminance, so that going into Calm and coming back is never a large full-screen brightness step (owner decision 16). How close is "close" is not yet a number: it is set by measurement (section 10).

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
| 11 | Source check proposals, all agreed: stress wording banned; WCAG flash definitions added to the flash limit; the low-time bar pulse may change brightness, colour or opacity only; the shared rhythm's basis text reworded |
| 12 | Colour names Star, Cloud, Kite, Leaf and Moon, and the Dusk background `#332C2E`: agreed. All hex values remain starting values |
| 13 | Tier 2 fade rule scoped: no colour change faster than a 1 second fade for anything the player did not trigger at that spot. Feedback on the tapped circle itself may be faster (pop about 450 ms; Reduce motion dim about 600 ms), provided it stays on that circle, never brightens it, and runs once per circle at a time |
| 14 | Ring pops: the count cap is chosen, not the opacity cap. No more than 3 ring pops begin in any one second; extra pops use the plain fade |
| 15 | Arrivals: no more than 2 circles begin arriving in any one second. A circle's fade-in followed by its pop counts as one flash |
| 16 | Reduce motion dim is a luminance cap: at most about 0.07 change in relative luminance on the lightest colour, recomputed when a hex changes. Entering and leaving Calm is never a large full-screen brightness step; the launch screen background stays close to Dusk in luminance |
| 17 | Each Calm visit shows 3 of the 5 colours, drawn at random. One name per colour; no second set of shade names |
| 18 | Screen sleep follows the phone's setting; no wake lock in v1.0. Conditions: music pauses on sleep; quiet resume to Calm as left; the game itself does not dim |
| 19 | Artist and interface brief agreed: solid silhouettes with no inner dots or holes; a neutral exit label ("Leave Calm"); polite announcement of target changes; a wrong tap on an already-wobbling circle is silent |
| 20 | "Agree with all recommendations" from the review of `docs/game-design.md` v0.6. Decisions 12 to 19 are that agreement, as relayed by the coordinator |

## 10. Open checks before release

**Measure on a real device, at 60 and 120 Hz, against the flash thresholds**
- [ ] The 10-taps-a-second test on every tap-triggered effect, with several fingers, including Story's bigger pop bursts.
- [ ] The low-time bar pulse at 2 a second.
- [ ] The bar pulse, other Story pulses and pop bursts running together (flashes add up).
- [ ] Calm ring pops at 10 taps a second with several fingers: no more than 3 rings begin in any one second, and the extra pops fall back to the plain fade.
- [ ] Calm arrivals: no more than 2 circles begin arriving in any one second, including straight after a burst of fast pops and on first entry to Calm.
- [ ] Calm in total: fade-ins, pops and glow counted together across the screen stay at or under 3 flashes in any one second during the fastest tapping a tester can manage. Analyse a screen recording; do not rely on reading the code.
- [ ] Reduce motion dim: the relative luminance change on the lightest colour is at most about 0.07, measured from the colours actually drawn. Repeat whenever a hex value changes.
- [ ] Reduce motion dim: is so faint a cue still noticed, with sound on and with sound off? If not, bring it back for review; do not simply enlarge it.
- [ ] Entering and leaving Calm, and waking from screen sleep: no large full-screen brightness step. Measure the launch screen background against Dusk, and set a number for "close" from that.
- [ ] Glow steps stay under 0.10 change in relative luminance (the design gives at most 0.06, by hand).
- [ ] Palette and Dusk on a real phone in a dark room at low brightness and outdoors in daylight: circles and symbols stay clear, nothing glares. Phone screens differ, so use more than one phone if possible.
- [ ] Palette through a colour-vision simulator and in greyscale, and with colour-blind players if possible. The design's reasoning on this is not yet tested.
- [ ] Drift and swell show no visible ticking or whole-pixel jumps at the chosen internal resolution.
- [ ] Screen sleep: music stops when the screen sleeps and fades back in on waking, with no sudden sound.

**Re-verify against live sources**
- [x] WCAG 2.3.1 area and luminance thresholds. Read 2026-10-11 (section 3). The wording allows a small-area pass, but its size estimate is for a desktop screen and it warns about close viewing. So the instruction stands: nobody relies on "small area" as the reason a pulse or burst is safe.
- [x] WCAG 2.3.1 and 2.3.3 definitions generally. Read 2026-10-11.
- [x] The Shao et al. figures. Verified 2026-10-11 by the owner (section 3).
- [ ] Whether Shao et al. studied a 4 s in / 6 s out ratio. Still open: not covered by the facts supplied.
- [x] Google Play health policy and Families policy wording. Read 2026-10-11.
- [ ] Confirm the final store listing does not make the game a health app. Cannot be done until the listing is written.
- [x] XAG 123. Read 2026-10-11.
- [ ] The under-10s breathing-rate point (general physiology). No source read addressed it.
- [x] Fish (2014): sample size and design. Verified 2026-10-11 by the owner (section 3). Only a state-anxiety finding is recorded; trait anxiety is not.
- [x] NICE CG113 scope and status. Verified 2026-10-11 by the owner (section 3).
- [x] Mind's guidance. Verified 2026-10-11 by the owner (section 3).
- [ ] HSE: the 1-to-5 breathing count and "adapted from NHS". Not found on the two HSE pages read.
- [ ] Rethink: any advice to stop a breathing exercise that causes difficulty. Not found on the two Rethink pages read.

**Changes from the 2026-10-11 source check:** all four proposals were agreed by the owner and applied (sections 2, 4 and 5; decision 11 in section 9).

**Other**
- [ ] Play Console: complete the Health apps declaration form accurately. Google says all developers must complete it, whether or not the app has health features.
- [ ] Children: decide the Google Play target audience and check Families policy, together with the 12+ storyline rating (deferred by the owner).
- [ ] Tech lead: how Reduce motion follows the Android system setting.
- [x] The low-time bar pulse is kept under Reduce motion, changing brightness, colour or opacity only. Recorded in `docs/game-design.md` (Story mode, Low time).
- [ ] Remove the one prototype effect still marked "still in the code" in section 4: frame-counted circle movement (foundations tasks F-07 and F-09). The shake, per-tap tint, red "Game Over!", swoop-in, colour names and "psychology" strings were removed in F-02.
- [ ] Game artist: symbol drawings checked against the solid-silhouette rule (section 4) before they go in.
- [ ] Review final store copy, the shortcut label, colour names and accessibility labels against section 2.
- [ ] Review Stage 2 and Stage 3 art and lines against section 7 once written.

## 11. Release checklist

**Whole game (Tier 1)**
- [ ] Nothing flashes more than 3 times a second, counted across everything on screen; no saturated red flashing
- [ ] Every tap-triggered effect passes the 10-taps-a-second test with several fingers
- [ ] No full-screen flash; no full-screen colour change per tap
- [ ] Reduce motion works per the table and follows the system setting
- [ ] No sudden loud sounds; music and effects sliders; no volume stacking; music fades in and out
- [ ] All effects time-based; checked at 60 and 120 Hz
- [ ] No symbol or pattern is a cluster of dots or holes; the five symbols are solid silhouettes with no inner dots or holes
- [ ] Calm: no more than 3 ring pops begin in any one second (extras use the plain fade); no more than 2 circles begin arriving in any one second
- [ ] Calm: the Reduce motion dim changes relative luminance by at most about 0.07 on the lightest colour, recomputed for the final hex values
- [ ] Entering and leaving Calm is never a large full-screen brightness step; the launch screen background is close to Dusk in luminance
- [ ] No retired prototype effect remains as built, and none of the prototype's colour names or "psychology" strings remain in the code
- [ ] No medical or therapeutic claims, and no psychologist endorsement, in game or store listing
- [ ] No mood or health data, no Calm analytics, no notifications

**Calm mode (Tier 2 and section 5)**
- [ ] No timer, score, counter, fail state, streak or evaluative text
- [ ] No screen shake; no blinking, ticking or urgency cues
- [ ] Pulses no faster than one every 2 s
- [ ] No colour change faster than a 1 s fade for anything the player did not trigger at that spot: background, swatch and target changes, circle arrival, glow, HUD and screen transitions
- [ ] Feedback on the tapped circle (pop about 450 ms; Reduce motion dim about 600 ms) stays on that circle, never brightens it, and runs once per circle at a time
- [ ] Small, quiet tap feedback; effects below the music bed; circles arrive softly; pop pitch never climbs with consecutive taps
- [ ] A wrong tap on an already-wobbling (or already-dimming) circle does nothing and is silent; a tap on empty space does nothing
- [ ] One tap in, instant out, quiet resume; the exit label is "Leave Calm"
- [ ] Idle changes nothing; screen sleep follows the phone's setting with no wake lock; music pauses on sleep; the game itself never dims
- [ ] Each visit shows 3 of the 5 colours; names are Star, Cloud, Kite, Leaf and Moon and describe no mood or effect; symbols cannot be switched off
- [ ] Target changes are announced politely to assistive technology, once, never interrupting
- [ ] No story content or story imagery; no common phobia triggers in art
- [ ] Rhythm, density, palette, background, motion, target change and wrong tap match section 5
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
| 2026-10-11 | The section 3 sources, against their live pages (v0.3 of this file) | AI advisor agent (not a clinical endorsement) | Read: WCAG 2.2 SC 2.3.1 and 2.3.3 with glossary, XAG 123, Google Play health and Families policies, HSE, Rethink, Mental Health Foundation. Not reached, still unverified: Shao et al. (redirect to a sign-in host), Fish (not found on the ECU site), NICE CG113 (HTTP 403), Mind (HTTP 403). No blocker found. No rule or value changed; four proposed changes listed in section 10. Pages were read as tool summaries with short quotes, not as full raw text, except XAG 123. Only this file was read; nothing built or measured |
| 2026-10-11 | The Calm proposal in `docs/game-design.md` Draft v0.6 (colours, names, symbols, tap feedback, motion, idle, screen sleep), and the owner's agreement to all recommendations (v0.5 of this file) | AI advisor agent (not a clinical endorsement) | No blocker in the design as written. Four flash-limit caps for Calm added to Tier 1 (ring pops, arrivals, Reduce motion dim, entering and leaving Calm); Tier 2 fade rule scoped; decisions 12 to 20 recorded. All caps are reasoned from the specification and hand-computed luminance figures: nothing built, nothing measured, no source re-checked live for this version. Contrast and colour-vision figures are the designer's and were not independently recomputed, except a rough hand check of the dim on Star. Code searched (`src/`, `index.html`) only to correct the retired-effects table: five prototype files are deleted, but the shake, per-tap tint, "Game Over!", swoop-in and "psychology" strings were still present on branch `docs/calm-palette`. `docs/game-design.md` v0.7 not read: it was being edited in parallel |
| 2026-10-11 | The four sources not reached in v0.3: Shao et al., Fish, NICE CG113, Mind (v0.6 of this file) | The owner, from pages read live in the owner's Claude chat session; recorded by the coordinating session | Marked verified with the owner's facts. Not read by this repo's tools and not reviewed by the wellbeing advisor. No rule or value changed. Still open: whether Shao et al. studied a 4/6 ratio |
