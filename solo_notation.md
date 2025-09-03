# Solo RPG Notation SRD  
*A Standard for Recording Solo Play*

## 1. Introduction

Solo RPG play often produces rich stories, but recording them can be messy.  
This standard notation system provides a **shorthand method** to capture the essentials of play while leaving space for optional narrative, dialogue, and campaign tracking.  

The notation is designed to be:  
- **Flexible** — usable across different systems.  
- **Layered** — works as both quick shorthand or expanded narrative.  
- **Searchable** — tags and codes make it easy to track NPCs, events, and locations.  

## 2. Front Matter

Use this block at the start of a campaign log to record essential details.

### Campaign Header

```
=== Campaign Log: Campaign Title ===
[Title]        Campaign Title
[Ruleset]      Ruleset and tools used
[Genre]        
[Player]       
[PCs]          
[Start Date]   yyyy-mm-dd
[Last Update]  yyyy-mm-dd
```

### Optional Fields
- **[Tools]** — Oracles, generators, house rules used  
- **[Themes]** — Mystery, romance, cosmic horror…  
- **[Tone]** — Gritty, light, surreal, etc.  
- **[Notes]** — Any prep or expectations before play  

### Example

```
=== Campaign Log: Star Hauler ===
[Title]        Star Hauler
[Ruleset]      Loner Space
[Genre]        Space trading / sci-fi adventure
[Player]       Roberto
[PCs]          Captain Elara (PC:Elara|Ship: Rustwing)
[Start Date]   2025-09-03
[Last Update]  2025-09-03
[Tools]        Oracles: Mythic, Stars Without Number NPC tables
[Themes]       Trade, exploration, moral dilemmas
[Tone]         Pulpy with dark undertones
[Notes]        Starting on Argus Station, day after cargo strike.
```

## 3. Session Header

Use a short block at the start of each session to keep records tidy.

### Basic Session Header

```
=== Session 1 ===
[Date]        2025-09-03
[Duration]    90 minutes
[Start Scene] S1
```

### Optional Fields
- **[Recap]** — Short note of previous events  
- **[Goals]** — Player expectations for this session  
- **[Notes]** — Table conditions, variants, mood  

### Example

```
=== Session 2 ===
[Date]        2025-09-10
[Duration]    2h
[Start Scene] S8
[Recap]       Jonah was captured at the lighthouse. Cultist plot at 3/6.
[Goals]       Rescue Jonah, follow clue from diary.
[Notes]       Trying new NPC reaction table.
```

### Placement of Boundaries

- Always place **Front Matter** once, at the very start of the campaign log.  
- Start each play session with a **Session Header**.  
- End each play session with:  
  ```
  === Session X End ===
  ```
- Update `[Last Update]` in the Front Matter each time a new Session Header is added.

## 4. Scene Log

### 4.1 Scenes

Scenes are the basic unit of play.

```
[S#] *Context / Frame*
```

- `S#` = numbered scene (`[S1]`, `[S2]`, …).  
- Context = short description (*abandoned lighthouse, midnight*).  
- Use letters for flashbacks or branches: `[S3a]`.  
- Use thread IDs for parallel storylines: `[T2-S5]`.  
- Optional time markers: `⏳ Day 3`, `⏰ Midnight`.

### 4.2 Actions

Two types of uncertainty drive play:  

- **Player-facing actions (mechanics)**  
  ```
  ▶ Pick the lock
  ```
- **World / GM questions (oracle)**  
  ```
  ? Is anyone inside?
  ```

### 4.3 Resolutions

#### Mechanics
```
🎲 [roll or rule] → outcome
```
Example:  
`🎲 d20+Lockpicking=17 vs DC 15 → Success`

#### Oracle
```
⤷ [answer] (roll if relevant)
```
Example:  
`⤷ Yes, but… (d6=4)`

**Shorthand convention**:  
- Use `>` or `<` for comparisons (e.g., `🎲2<4` = fail, `🎲5>3` = success).  
- Add `S` or `F` if needed: `🎲2<4 F`.

### 4.4 Consequences

Record the narrative result after rolls:

```
⇒ The door creaks open, but the noise echoes through the hall.
```

### 4.5 Persistent Elements

Track ongoing elements with tags.

- **NPCs**: `[N:Jonah|friendly|injured]` → later `[N:Jonah|captured]`  
- **Locations**: `[L:Lighthouse|ruined|stormy]`  
- **Events & Clocks**: `[E:CultistPlot 2/6]`  
- **Threads**: `[Thread: Find Jonah’s Sister | Open]` → `[Thread:…|Closed]`  
- **Player Character**: `[PC:Name|HP 6|Stress 2|Gear:Dagger]` → `[PC:HP-1]`

Re-use IDs in later scenes to connect the log:  
`[#N:Jonah]`, `[#L:Lighthouse]`, `[#E:CultistPlot]`.

### 4.6 Progress Tracking

Different forms of progress can be tracked consistently:  

- **Clocks** (fill up): `[Clock:Ritual 5/12]`  
- **Tracks** (progress bars): `[Track:Escape 3/8]`  
- **Timers** (count down): `[Timer:Dawn 2]`

### 4.7 Random Tables

When inspiration tables or generators are used, note the roll:

- **Simple table**:  
  `📖 d100=42 → "A broken sword"`  

- **Complex generator**:  
  `📚 Mythic Event: d100=78 + 11 → NPC Action / Betray`

### 4.8 Narrative Excerpts (Optional)

You may add narrative or dialogue where it helps.  

- **Inline prose**:  
  `⇒ The room reeks of mildew.`  

- **Dialogue**:  
  ```
  N (Guard): "Who’s there?"
  PC: "Stay calm…"
  ```

- **Long block**:  
  ```
  ---
  The diary reads:  
  "The tides no longer obey the moon."  
  ---
  ```

This is optional — shorthand alone is enough.

### 4.9 Meta Notes

Use parentheses for reminders, reflections, or house rules.  

```
(note: testing alternate stealth rule)
```

## 5. Examples

### Example 1 — Hybrid Log
```
[S7] *Dark alley behind tavern ⏰ Midnight*
▶ Sneak past the guards
🎲 Stealth d6=2 vs TN 4 → Fail
⇒ My foot kicks a barrel. [E:AlertClock 2/6]

? Do they see me?
⤷ No, but… (d6=3)
⇒ Distracted, but one guard lingers. [N:Guard|watchful]

N (Guard): "Who's there?"
PC: "Stay calm… just stay calm."
```

### Example 2 — Pure Shorthand
```
S7 ▶Sneak 🎲2<4 F → noise [E:Alert 2/6] ?Seen? ⤷Nb3 → distracted, 1 stays
```

### Example 3 — Tracking Threads
```
[S12] *Inside the lighthouse*
▶ Search the chamber
🎲 Investigation d6=5 vs TN 4 → Success
⇒ I find a hidden diary. [E:CultistPlot 3/6] [Thread: Find Jonah’s Sister|Open]

📖 Random clue: d100=42 → "A broken sword"
```

### Example 4 — Complete Campaign Log

```
=== Campaign Log: Clearview Mystery ===
[Title]        Clearview Mystery
[Ruleset]      Loner + Mythic Oracle
[Genre]        Teen mystery / supernatural
[Player]       Roberto
[PCs]          Alex (PC:Alex|HP 8|Stress 0|Gear: Flashlight, Notebook)
[Start Date]   2025-09-03
[Last Update]  2025-09-10
[Tools]        Oracles: Mythic, Random Event tables
[Themes]       Friendship, courage, secrets
[Tone]         Eerie but playful
[Notes]        Inspired by 80s teen mystery shows

=== Session 1 ===
[Date]        2025-09-03
[Duration]    1h30
[Start Scene] S1
[Goals]       Introduce Alex, set first clue

[S1] *School library after hours*
▶ Sneak inside to check the archives
🎲 Stealth d6=5 vs TN 4 → Success
⇒ I slip inside unnoticed. [L:Library|dark|quiet]

? Is there a strange clue waiting?  
⤷ Yes (d6=6)  
⇒ I find a torn diary page about the lighthouse. [E:LighthouseClue 1/6]

[S2] *Outside the library, empty hall*
? Do I hear footsteps?  
⤷ Yes, but… (d6=4)  
⇒ A janitor approaches, but he doesn’t notice me yet. [N:Janitor|tired|suspicious]

N (Janitor): "Thought I heard something…"  
PC (Alex, whisper): "Gotta get out of here."

=== Session 1 End ===

=== Session 2 ===
[Date]        2025-09-10
[Duration]    2h
[Start Scene] S3
[Recap]       Found diary page hinting at lighthouse. Nearly spotted in library.
[Goals]       Investigate lighthouse, avoid suspicion.

[S3] *Path to the old lighthouse ⏳ Day 2*
▶ Approach quietly at dusk
🎲 Stealth d6=2 vs TN 4 → Fail
⇒ I step on broken glass, crunching loudly. [Clock:Suspicion 1/6]

? Does anyone respond from inside?  
⤷ No, but… (d6=3)  
⇒ The light flickers briefly in the tower window. [L:Lighthouse|ruined|haunted]

[S4] *Inside lighthouse foyer*
▶ Search the floor for signs of activity
🎲 Investigation d6=6 vs TN 4 → Success
⇒ I find fresh footprints in the dust. [Thread: Who is using the lighthouse?|Open]

📖 Random table roll d100=42 → "A broken lantern"
⇒ A cracked lantern lies near the stairs. [E:LighthouseClue 2/6]

PC (Alex, thinking): "Someone’s been here… recently."

=== Session 2 End ===
```

## 6. Micro-Reference Appendix

A quick at-a-glance summary of common shorthand:

```
S1 ▶Pick lock 🎲d20=17>15 → Success ⇒ creak noise
S2 ?Is anyone inside? ⤷Yes, but… ⇒ distracted guard
S3 ▶Fight guard 🎲d6=1<4 F ⇒ HP-2 [PC:HP 8]
S4 ?Does ally arrive? ⤷No, and… ⇒ Thread "Rescue" Open
S5 ▶Search room 🎲d6=6>4 S ⇒ find clue [#clue]
S6 📖 d100=42 → "A broken sword" [E:CultPlot 3/6]
S7 ▶Convince Jonah 🎲d20=12<14 F ⇒ Jonah angry [N:Jonah|hostile]
S8 ?Does time run out? ⤷Yes ⇒ [Timer:Dawn 0]
S9 ▶Escape tunnels 🎲d6=5>3 S ⇒ [Track:Escape 6/8]
S10 === Session 1 End ===
```

## 7. Solo RPG Notation Legend

A quick reference to the standard solo play notation.

### Core Symbols
- `[S#]` — Scene number and frame  
- ▶ — Player action (mechanics)  
- ? — Oracle question (world / uncertainty)  
- 🎲 — Mechanics roll/result  
- ⤷ — Oracle result  
- ⇒ — Consequence / outcome  

### Tracking
- `[N:Name|tags]` — NPC  
- `[L:Name|tags]` — Location  
- `[E:Name X/Y]` — Event / Clock  
- `[Thread:Name|Open/Closed]` — Story thread  
- `[PC:Name|stats|gear]` — Player character  

### Progress
- `[Clock:Name X/Y]` — Clock (fill up)  
- `[Track:Name X/Y]` — Progress track (advance)  
- `[Timer:Name X]` — Countdown  

### Narrative (Optional)
- Inline: `⇒ Short prose`  
- Dialogue:  
  ```
  N (Guard): "Who's there?"
  PC: "Stay calm…"
  ```
- Block:  
  ```
  ---
  Text excerpt here
  ---
  ```

### Meta
- `(note: … )` — Reflection, reminder, house rule  

### Example Line
```
S3 ▶Pick lock 🎲d20=17>15 → Success ⇒ creak noise [N:Guard|alert]
```

## 8. Credits & License

This notation is inspired by the [Valley Standard](https://alfredvalley.itch.io/the-valley-standard).

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.  
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/  
or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
