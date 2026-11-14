# F-19 Real phone check (owner's checklist)

One sitting, about 40 minutes (about 55 with the optional items). Do the parts in order. For each check, write Yes or No and add a note if you like. Feel checks (soft, calm, noticeable, harsh, acceptable) are your own opinion: there is no wrong answer, and your notes go to the game designer and wellbeing advisor.

**STOP AT ONCE if anything flashes uncomfortably, strobes or flickers.** Look away, close the page and tell us. Any strobing, and any safety number outside its range, counts as a fail.

## What to have ready
- A cable only if you want to charge the phone during the test.
- Earbuds only for the optional listening check.
- A second phone and a dark room only for the optional palette check.
- The computer and the phone on the same home Wi-Fi.

## Setup
1. **Trusted home network only.** `dev:phone` opens the dev server to everyone on the local network. Do not use office, school, cafe or hotel Wi-Fi.
2. On the computer, in the project folder, run `npm run dev:phone`.
3. In the output, find the line starting `Network:`, for example `http://192.168.1.23:5174/`. Use that one, not `Local:`.
4. On the phone, open Chrome and type that address. Where this sheet says `?dev=circles`, add it to the end: `http://192.168.1.23:5174/?dev=circles`. A page that will not load usually means the phone is on mobile data, or the computer's firewall is blocking port 5174.
5. Hold the phone upright, normal brightness, auto-rotate on (swipe down from the top and check the Auto rotate tile).
6. **When you finish, press Ctrl+C in the computer's terminal to stop the server.**

## Your phone
| Field | Answer | Where to find it |
|---|---|---|
| Phone model | | Settings > About phone |
| Android version | | Settings > About phone > Android version (or Software information) |
| Refresh rate | | Settings > Display > Smooth motion, Motion smoothness or Refresh rate (usually 60 Hz or 90/120 Hz). Names vary by maker; note "not shown" if you cannot find it |

---

## 1. Start screen: `/` (no ?dev)
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-01 | Open the address. Tap Start | The game opens with circles moving | Start opens play | | |
| P-02 | Look at the top and bottom edges (notch, camera, gesture bar) | Nothing hidden under them | Swatch, Pause and circles all fully visible | | |
| P-03 | Hold the phone in one hand. Reach the colour swatch and the Pause button with your thumb | Easy to reach | Both easy one-handed | | |
| P-04 | Rotate to landscape, then back to upright | The play column | Column re-centres, nothing lost or stuck | | |

## 2. Circles: `?dev=circles`
Readout names: "Expected crossing (s)", "Last crossing (s)", "Crossings".
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-05 | Watch the dot cross side to side. Wait for 3 or more "Crossings" | "Last crossing (s)" next to "Expected crossing (s)" (3.84) | Last crossing is 3.64 to 4.04 | | Value seen: |
| P-06 | Watch the movement for 20 seconds | The dot's motion | Slow movement looks acceptable, not ticking or stuttering (feel) | | |

## 3. Render: `?dev=render`
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-07 | Look at the shapes close up, then at arm's length | Edges | Sharp, no blur (feel) | | "Device pixel ratio" seen: |

## 4. Layout: `?dev=layout`
Readout names: "Circles outside play area", "Window (CSS px), pixel ratio", "Swatch / circle diameter".
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-08 | Look at the swatch | Edges of the swatch | Sharp at your phone's pixel ratio | | |
| P-09 | Rotate to landscape and back, twice | "Circles outside play area" | Always 0, circles stay inside | | |

## 5. Input: `?dev=input`
Readout names: "Circle hit", "Taps total", "Tap (widths)".
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-10 | Tap with three fingers at the same moment, a few times | "Taps total" goes up by 3 each time | All three register | | |
| P-11 | Pinch the page, then double-tap it | The page | Does not zoom | | |
| P-12 | Tap just outside a circle's edge (a thumb-width of air) | "Circle hit" | Still hits, and it feels fair (feel) | | |
| P-13 | Tap the colour swatch where it overlaps a circle | "Circle hit" | The circle under the swatch is hit | | |

## 6. Settings: `?dev=settings`
Readout names: "Reduce motion switch", "System Reduce motion", "Effective Reduce motion".
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-14 | Turn on the phone's animation setting (see below), return to Chrome, reload the page | "System Reduce motion" | Reads "on", and "Effective Reduce motion" reads "on" | | |
| P-15 | Turn the phone setting back off, reload | "System Reduce motion" | Reads "off" | | |

**Where to find it on Android.** The setting is called **Remove animations** (Pixel: Settings > Accessibility > Color and motion > Remove animations). Samsung: Settings > Accessibility > Visibility enhancements > Reduce animations. Other makers: search Settings for "animation" or "motion". It may be called "Remove animations", "Reduce animations" or "Animation off".

## 7. Effects and loop
Readout names are exact. Press buttons by their label.

**7a. Loop speed (meter off): `?dev=effects`**
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-16 | Make sure "Flash meter: off" and "Slow loop (30 steps/s): off". Press "Auto-tapper" and "Low-time pulse" on, in "Mode: Story", and let the stress run for 30 seconds | "Steps per second" (one step per drawn frame when the slow loop is off) | About 60 (55 to 65), which is about 16.7 ms a frame. On a 90/120 Hz phone, about 60 is still the target. Motion should also look smooth | | Value seen: |

**7b. Looks, by eye: `?dev=effects`** (Flash meter off)
| ID | What to do | Look at | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-17 | Tap circles to pop them; turn on "Mode: Story" and cause a shake | Pop, shake, dim, pulse | Look right on a small screen (feel) | | |
| P-18 | Look at any dimming | Dim | Reads as soft, not a blackout (feel) | | |
| P-19 | Press "Calibration block (2/s)" on, hold the phone at arm's length for 10 seconds, then off | The block and fades | Look as expected: gentle, not harsh (feel) | | |
| P-20 | Press "Low-time pulse: on" | The pulse bar | Noticeable when hand-held, and outdoors or in bright light if easy (feel) | | |
| P-21 | Pulse still on, "Mode: Calm" | The beat | Feels calm (feel) | | |

**7c. Safety run with the meter on: `?dev=effects`**
Press "Reset highest". Press "Flash meter: on", "Auto-tapper" on and "Low-time pulse: on". Let it run for 60 seconds, in Story mode, then repeat in Calm mode. Read the numbers at the end.
| ID | Readout name | Pass | Value seen | Yes / No |
|---|---|---|---|---|
| P-22 | "Meter: highest in a second (layer)" | 3 or under | | |
| P-23 | "Meter: red flashes (highest / total)" | 0 | | |
| P-24 | "Highest shake change area (must be 10% or less)" | 10% or less | | |
| P-25 | Auto-tapper off, only "Low-time pulse: on", watch "Flashes in the last second" for 20 seconds | Reads 0 the whole time (the pulse alone adds no flashes) | | |
| P-26 | "Meter above layer (must stay 0)" | 0 | | |
| P-27 | By eye, the whole run | Nothing strobes or flickers (safety: any strobing is a fail) | | |

## 8. Audio: `?dev=audio` (phone speaker, volume at about half)
Readout names: "Sound enabled (after first tap)", "Sounds playing / highest", "Music gain (fade)".
| ID | What to do | Look at / listen for | Pass | Yes / No | Note |
|---|---|---|---|---|---|
| P-28 | Open the page, tap once anywhere | "Sound enabled (after first tap)" and sound | Changes to "yes"; sound starts on the first tap | | |
| P-29 | Press "Play pop", then "Play wrong tap" | The sounds | Soft and pleasant (feel) | | |
| P-30 | Press "Start music", then "Stop music" | "Music gain (fade)" and the sound | Gentle fade in and out (feel) | | |
| P-31 | Press the auto-tapper (10 a second) with Effects volume slider at full | The sound | Not harsh (feel) | | |
| P-32 | Listen during P-31 and P-29 | Clicks, crackle or the sound being squeezed | None | | |
| P-33 | With music playing, switch to another app, wait 5 seconds, come back | Sound | Silent while away; music fades back in gently | | |

## 9. Optional (skip if you cannot)
| ID | What to do | Pass | Yes / No | Note |
|---|---|---|---|---|
| P-34 | Repeat P-29, P-30 and P-31 with earbuds, at a low volume first | Nothing sharp, loud or fatiguing (feel) | | |
| P-35 | On a 90 or 120 Hz phone, repeat P-05 | "Last crossing (s)" 3.64 to 4.04 | | Value seen: |
| P-36 | On a second phone in a dark room, open `/`, Start, play for a minute | Palette colours and the Dusk look comfortable, nothing too bright (feel) | | |

---

## Results (fill in or paste back)
```
Phone model:
Android version:
Refresh rate:
Date:
Network: home Wi-Fi (yes/no):
Server stopped with Ctrl+C (yes/no):

Checks answered No (ID and short reason):
Values for P-05, P-16, P-22, P-23, P-24:
Anything strobed, flickered or felt uncomfortable (yes/no, where):
Feel notes (soft, calm, noticeable, harsh, acceptable):
Anything else:
```
