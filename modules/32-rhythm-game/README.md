# Module 32: Rhythm Game
**Hit the right note at the right time and feel the music move through your fingers | Beat Lane**
> "A rhythm game is a musical instrument where the song plays itself and your only job is to not ruin it."
---

## Prerequisites

| Module | What You'll Reuse |
|--------|-------------------|
| Module 1 — Pong | Frame-precise input handling, timing-based gameplay, visual feedback on collision |

---

## Week 1: History & Design Theory

### The Origin

In 1996, Masaya Matsuura created **PaRappa the Rapper** and proved that pressing buttons in time with music could be a game. The concept was deceptively simple: a song plays, icons scroll across the screen indicating which button to press and when, and the player presses the matching button in time with the beat. What made PaRappa revolutionary was not the mechanical complexity — there were only a handful of buttons — but the feedback loop it created between the player and the music. Hit the notes and the song sounds right; miss them and the track falls apart, vocals go off-key, and the crowd boos. The player was not just keeping score — they were performing. Matsuura understood something that would define the genre for decades: the joy of a rhythm game is not precision for its own sake but the feeling that you are inside the music, that your inputs are the reason the song sounds good. Every rhythm game since has been a variation on that insight, whether the interface is a plastic guitar, a VR lightsaber, or four arrow keys.

### How the Genre Evolved

**PaRappa the Rapper (1996)** — NanaOn-Sha's debut established the genre's essential contract: the game provides a song and a visual cue for each beat; the player provides the input. PaRappa used call-and-response — a teacher character raps a line, then the player repeats it. The timing windows were forgiving by modern standards, but the core loop was already fully formed: audio plays, visual indicator scrolls, player presses button, game scores the accuracy. PaRappa proved that rhythm gameplay created an emotional connection to music that passive listening could not match.

**Guitar Hero (2005)** — Harmonix took PaRappa's core loop and gave it a physical interface: a plastic guitar controller with five colored fret buttons and a strum bar. The "note highway" — a scrolling track where colored notes approach a target line — became the genre's standard visual language. Guitar Hero's brilliance was in its difficulty curve: Easy used three buttons, Medium used four, Hard used five, and Expert added faster patterns and chords. The same song became a fundamentally different challenge at each difficulty. Guitar Hero also solved the genre's accessibility problem: anyone could play on Easy and feel like a rock star, while experts could spend months mastering Expert-level shredding. The franchise sold over 25 million units and proved that rhythm games could be mainstream entertainment.

**Beat Saber (2018)** — Beat Games brought rhythm gameplay into virtual reality and discovered that physical movement amplified everything the genre did well. Instead of pressing buttons, players slashed colored blocks with lightsabers in time with music. The physicality made timing feel visceral — a perfectly timed slash was satisfying in a way a button press could never be. Beat Saber also demonstrated that the note highway concept was adaptable to any input modality: the core is still "the right action at the right time," whether that action is a button press, a strum, or a full-body swing. Beat Saber became VR's best-selling game and proved the genre was far from exhausted.

### What Makes It "Great"

A great rhythm game creates flow state — that feeling where the player stops thinking about which button to press and their hands just move with the music. This requires three things working in concert. First, the charting must match the music: notes should fall on audible beats, patterns should follow melodic phrases, and the player's inputs should feel like they are producing the sounds, not just coinciding with them. Second, the timing windows must be fair but meaningful: the difference between a "Perfect" and a "Great" should be audible and visible, rewarding precision without punishing near-misses. Third, the visual and audio feedback must be immediate and satisfying: hit effects, score popups, combo counters, and screen pulses should celebrate the player's accuracy in real time. When all three align, the player enters a state where they are no longer playing a game about music — they are playing music through a game.

### The Essential Mechanic

Hitting inputs in time with musical beats within precise timing windows.

---

## Week 2: Build the MVP

### What You're Building

A **single-lane note highway rhythm game**. A music track plays, and notes scroll down the screen toward a target line at the bottom. When a note reaches the target line, the player presses the corresponding key (the MVP uses 4 lanes mapped to D, F, J, K). The game scores each input as Perfect, Great, Good, or Miss based on timing accuracy. Consecutive hits build a combo multiplier. The song plays from a chart file that defines when each note occurs. After the song ends, a results screen shows accuracy percentage, max combo, and letter grade. The player can calibrate audio/visual offset to compensate for hardware latency.

### Core Concepts

**1. Audio Synchronization**

The entire game is driven by the song's current playback position, not by frame counting or wall-clock time. Every frame, the game queries the audio system for the current song position in milliseconds and uses that as the single source of truth for all timing calculations. This ensures that even if frames drop or stutter, the notes remain synchronized with the music.

```
// Audio is the single source of truth
audioEngine = {
    track: null,
    startTime: 0,
    offset: 0       // Calibration offset in ms
}

function startSong(trackFile, calibrationOffset):
    audioEngine.track = loadAudio(trackFile)
    audioEngine.offset = calibrationOffset
    audioEngine.track.play()
    audioEngine.startTime = getCurrentTimeMs()

function getSongPosition():
    // Always derive position from audio playback, not frame counting
    return audioEngine.track.getPlaybackPosition() + audioEngine.offset

function isSongFinished():
    return audioEngine.track.isFinished()

// Every frame, the game asks: "Where are we in the song?"
function gameLoop():
    songPositionMs = getSongPosition()

    updateNotes(songPositionMs)
    checkInputs(songPositionMs)
    renderFrame(songPositionMs)

    if isSongFinished():
        showResults()
```

*Why it matters:* Audio sync is the foundation of every rhythm game. If notes drift even 20 milliseconds from the music, the game feels "off" and the player's inputs stop feeling connected to the beat. Frame-based timing accumulates drift over a three-minute song. Audio-position-based timing does not. This is the single most important technical decision in a rhythm game, and getting it wrong makes everything else irrelevant.

**2. Note Highway / Chart Format**

A song chart is a data file that lists every note in the song: its timestamp (in milliseconds), its lane (which column/key), and optionally its type (tap, hold, etc.). The chart is loaded at song start and notes are spawned as their visual approach time arrives. The chart format is the bridge between the music and the gameplay — it defines the experience.

```
// Chart format — array of note events
// Each note: {timeMs, lane, type}
sampleChart = {
    songFile: "track01.ogg",
    bpm: 120,
    notes: [
        {timeMs: 500,  lane: 0, type: "tap"},
        {timeMs: 750,  lane: 1, type: "tap"},
        {timeMs: 1000, lane: 2, type: "tap"},
        {timeMs: 1000, lane: 3, type: "tap"},   // Chord — two notes at same time
        {timeMs: 1250, lane: 0, type: "tap"},
        {timeMs: 1500, lane: 1, type: "hold", endTimeMs: 2000},
        // ... hundreds more notes
    ]
}

// Scroll speed determines how far ahead notes appear
SCROLL_SPEED = 800    // pixels per second
APPROACH_TIME = 1500  // ms — how long before hit time the note appears

function loadChart(chartFile):
    chart = parseChartFile(chartFile)
    activeNotes = []
    nextNoteIndex = 0
    return chart

function spawnUpcomingNotes(songPositionMs):
    while nextNoteIndex < chart.notes.length:
        note = chart.notes[nextNoteIndex]
        spawnTime = note.timeMs - APPROACH_TIME

        if songPositionMs >= spawnTime:
            activeNote = {
                timeMs: note.timeMs,
                lane: note.lane,
                type: note.type,
                yPosition: SPAWN_Y,    // Top of screen
                hit: false,
                missed: false
            }
            activeNotes.add(activeNote)
            nextNoteIndex += 1
        else:
            break  // Notes are sorted by time — no more to spawn yet

function updateNotePositions(songPositionMs):
    for each note in activeNotes:
        // Position based on time until hit
        timeUntilHit = note.timeMs - songPositionMs
        note.yPosition = TARGET_Y - (timeUntilHit / APPROACH_TIME) * HIGHWAY_LENGTH
```

*Why it matters:* The chart is the game's level design. A good chart makes a song feel playable; a bad chart makes it feel random. The data-driven approach means adding new songs requires zero code changes — just a new chart file and audio track. The spawning system (only create notes when they are about to become visible) keeps the active note count manageable even for songs with thousands of notes.

**3. Timing Windows**

When the player presses a key, the game checks the closest note in that lane against the current song position. The difference in milliseconds determines the judgment: Perfect (within 20ms), Great (within 50ms), Good (within 100ms), or Miss (beyond 100ms or no input at all). Notes that pass the target line without any input are also scored as Miss.

```
TIMING_WINDOWS = {
    PERFECT: 20,    // +/- 20ms from target
    GREAT:   50,    // +/- 50ms
    GOOD:    100,   // +/- 100ms
    MISS:    150    // Beyond this, note is missed
}

SCORE_VALUES = {
    PERFECT: 300,
    GREAT:   200,
    GOOD:    100,
    MISS:    0
}

function judgeInput(lane, songPositionMs):
    // Find the closest unhit note in this lane
    closestNote = null
    closestDiff = TIMING_WINDOWS.MISS + 1

    for each note in activeNotes:
        if note.lane == lane and not note.hit and not note.missed:
            diff = abs(songPositionMs - note.timeMs)
            if diff < closestDiff:
                closestDiff = diff
                closestNote = note

    if closestNote == null:
        return  // No note to judge — ignore input

    if closestDiff <= TIMING_WINDOWS.PERFECT:
        judgment = "PERFECT"
    else if closestDiff <= TIMING_WINDOWS.GREAT:
        judgment = "GREAT"
    else if closestDiff <= TIMING_WINDOWS.GOOD:
        judgment = "GOOD"
    else:
        return  // Too far from any note — ignore

    closestNote.hit = true
    applyScore(judgment)
    showJudgmentFeedback(judgment, closestNote.lane)

// Check for notes that passed without being hit
function checkMissedNotes(songPositionMs):
    for each note in activeNotes:
        if not note.hit and not note.missed:
            if songPositionMs - note.timeMs > TIMING_WINDOWS.MISS:
                note.missed = true
                applyScore("MISS")
                showJudgmentFeedback("MISS", note.lane)
                resetCombo()
```

*Why it matters:* Timing windows are what separate a rhythm game from a reaction-time test. The tiered judgment system (Perfect/Great/Good/Miss) means the game rewards precision without requiring perfection. A player who hits every note within 50ms will clear the song and have fun; a player who hits every note within 20ms will get a higher score and feel like a virtuoso. The windows must be tuned carefully — too tight and casual players feel frustrated; too loose and skilled players feel unchallenged.

**4. Input Latency Calibration**

Different hardware configurations introduce different amounts of delay between when audio plays and when the player hears it, and between when a key is pressed and when the game registers it. The calibration system lets the player adjust an audio offset and a visual offset (in milliseconds) to compensate. A calibration screen plays a metronome click and asks the player to tap along, then calculates the average offset automatically.

```
calibration = {
    audioOffset: 0,   // ms — shift when notes should be hit relative to audio
    visualOffset: 0,  // ms — shift when notes appear on screen
    isCalibrating: false,
    taps: [],
    metronomeHits: []
}

function startCalibration():
    calibration.isCalibrating = true
    calibration.taps = []
    calibration.metronomeHits = []

    // Play a steady metronome at known intervals
    bpm = 120
    intervalMs = 60000 / bpm  // 500ms between beats
    for i in range(16):  // 16 beats
        calibration.metronomeHits.add(i * intervalMs)

    playMetronome(bpm)

function recordCalibrationTap(tapTimeMs):
    calibration.taps.add(tapTimeMs)

function calculateCalibration():
    // Match each tap to its nearest metronome beat
    offsets = []
    for each tap in calibration.taps:
        nearestBeat = findNearest(calibration.metronomeHits, tap)
        offsets.add(tap - nearestBeat)

    // Average offset = how late the player consistently taps
    avgOffset = average(offsets)

    // If player taps 30ms late on average, shift audio offset by -30ms
    // This means notes will be judged 30ms earlier to match perception
    calibration.audioOffset = -round(avgOffset)
    calibration.isCalibrating = false

    return calibration.audioOffset

// Apply calibration in getSongPosition
function getSongPosition():
    rawPosition = audioEngine.track.getPlaybackPosition()
    return rawPosition + calibration.audioOffset
```

*Why it matters:* Latency calibration is the difference between a rhythm game that feels tight and one that feels broken. A 40ms audio delay (common with Bluetooth speakers or certain audio drivers) means the player hears the beat 40ms late, so they press the key 40ms late, and the game scores them as inaccurate — even though their timing relative to what they heard was perfect. Calibration corrects this invisible problem. Many players will never touch the calibration screen, but the ones who do will have a dramatically better experience, and competitive players consider it essential.

**5. Combo and Scoring System**

Each successful hit increments a combo counter. The combo multiplier increases the score earned per note: at 10 combo the multiplier is 2x, at 30 it is 4x, at 50 it is 8x. A single Miss resets the combo to zero and the multiplier to 1x. The final score, max combo, and percentage of notes hit determine a letter grade (S/A/B/C/D). The combo system adds stakes to every note — each note is not just worth points but also affects every subsequent note's value.

```
scoring = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    judgments: {PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0},
    totalNotes: 0
}

COMBO_THRESHOLDS = [
    {combo: 0,  multiplier: 1},
    {combo: 10, multiplier: 2},
    {combo: 30, multiplier: 4},
    {combo: 50, multiplier: 8}
]

function getMultiplier():
    multiplier = 1
    for each threshold in COMBO_THRESHOLDS:
        if scoring.combo >= threshold.combo:
            multiplier = threshold.multiplier
    return multiplier

function applyScore(judgment):
    scoring.judgments[judgment] += 1

    if judgment != "MISS":
        scoring.combo += 1
        scoring.maxCombo = max(scoring.maxCombo, scoring.combo)
        scoring.score += SCORE_VALUES[judgment] * getMultiplier()
    else:
        scoring.combo = 0

function resetCombo():
    scoring.combo = 0

function calculateResults():
    totalNotes = scoring.totalNotes
    hitNotes = totalNotes - scoring.judgments.MISS
    accuracy = hitNotes / totalNotes * 100
    perfectPercent = scoring.judgments.PERFECT / totalNotes * 100

    grade = "D"
    if accuracy >= 95 and perfectPercent >= 80:
        grade = "S"
    else if accuracy >= 90:
        grade = "A"
    else if accuracy >= 80:
        grade = "B"
    else if accuracy >= 70:
        grade = "C"

    return {
        score: scoring.score,
        maxCombo: scoring.maxCombo,
        accuracy: accuracy,
        grade: grade,
        judgments: scoring.judgments
    }
```

*Why it matters:* The combo system transforms a rhythm game from "hit as many notes as possible" to "do not miss a single note." Without combos, missing one note in the middle of a song costs only that note's points. With combos, missing one note resets the multiplier, costing potentially thousands of points from every subsequent note until the combo rebuilds. This creates dramatic tension — a 200-combo streak means every note matters intensely, and a single miss is devastating. The combo counter is the emotional core of the scoring system.

**6. BPM-Based Event Scheduling**

Notes are authored at positions in the song (beat 1, beat 2.5, etc.) and converted to millisecond timestamps using the song's BPM. This allows charts to be authored in musical terms rather than raw time, and enables features like scroll speed adjustment where notes move faster or slower without changing the song. BPM changes mid-song (common in complex music) are handled by a BPM map.

```
// Convert musical position to time
function beatToMs(beat, bpm):
    return (beat / bpm) * 60000

function msTobeat(timeMs, bpm):
    return (timeMs / 60000) * bpm

// BPM map for songs with tempo changes
// [{beat: 0, bpm: 120}, {beat: 32, bpm: 140}, ...]
function beatToMsWithBPMMap(beat, bpmMap):
    currentMs = 0
    currentBeat = 0

    for i in range(bpmMap.length):
        segment = bpmMap[i]
        nextBeat = bpmMap[i + 1].beat if i + 1 < bpmMap.length else beat

        beatsInSegment = min(nextBeat, beat) - currentBeat
        if beatsInSegment <= 0:
            break

        currentMs += beatToMs(beatsInSegment, segment.bpm)
        currentBeat += beatsInSegment

    return currentMs

// Chart authoring in beats, converted to ms at load time
function processChart(rawChart):
    processedNotes = []
    for each note in rawChart.notes:
        processedNotes.add({
            timeMs: beatToMsWithBPMMap(note.beat, rawChart.bpmMap),
            lane: note.lane,
            type: note.type
        })
    return processedNotes

// Scroll speed adjusts visual approach without changing timing
function getScrollSpeed(baseSpeed, userSpeedMod):
    return baseSpeed * userSpeedMod  // 1.0x, 1.5x, 2.0x etc.
```

*Why it matters:* BPM-based scheduling is what makes charts feel musical. A note on beat 3 of measure 4 means something to a chart author; "note at 7500ms" does not. This abstraction also handles tempo changes gracefully — if the song speeds up from 120 to 140 BPM in the chorus, the notes automatically space correctly. Scroll speed modification (letting the player speed up or slow down the visual approach) is also only possible because the visual position is derived from the BPM timing, not hard-coded.

**7. Visual Feedback Synchronized to Music**

Hit effects, background pulses, screen flashes, and lane highlights all trigger on beat to reinforce the connection between player input and music. The background can pulse on every beat (derived from BPM), hit effects play at the judgment moment, and the note highway can flash on downbeats. This visual layer is what makes the game feel alive rather than clinical.

```
// Beat pulse — triggered by BPM clock, not by player input
beatClock = {
    lastBeatTime: 0,
    beatInterval: 0
}

function initBeatClock(bpm):
    beatClock.beatInterval = 60000 / bpm  // ms per beat

function updateBeatClock(songPositionMs):
    if songPositionMs - beatClock.lastBeatTime >= beatClock.beatInterval:
        beatClock.lastBeatTime += beatClock.beatInterval
        triggerBeatPulse()

function triggerBeatPulse():
    // Background flash
    backgroundFlash.alpha = 0.3
    backgroundFlash.fadeOut(duration=200)

    // Scale pulse on the target line
    targetLine.scale = 1.1
    targetLine.tweenTo(scale=1.0, duration=150)

// Hit feedback — triggered by player input judgment
function showJudgmentFeedback(judgment, lane):
    // Text popup
    popup = createText(judgment, lanePositions[lane])
    popup.color = JUDGMENT_COLORS[judgment]
    popup.fadeUpAndOut(duration=500)

    // Particle burst on hit
    if judgment != "MISS":
        particles = createParticleBurst(lanePositions[lane], TARGET_Y)
        particles.color = LANE_COLORS[lane]
        particles.count = PARTICLE_COUNTS[judgment]  // More particles for better judgments

    // Screen shake on miss
    if judgment == "MISS":
        camera.shake(intensity=3, duration=100)

// Combo milestone effects
function checkComboMilestones():
    if scoring.combo == 50:
        flashScreen(color=GOLD, duration=300)
        showText("50 COMBO!", centerScreen)
    if scoring.combo == 100:
        flashScreen(color=RAINBOW, duration=500)
        showText("100 COMBO!", centerScreen)
```

*Why it matters:* Visual feedback is what makes a rhythm game feel like a performance rather than a typing test. The beat pulse connects the player to the music even when they are not hitting notes. The hit effects celebrate accuracy and make Perfect feel different from Good in a visceral, instant way. Miss effects (screen shake, dimming) communicate failure without words. The visual layer is not decoration — it is the game's emotional voice, telling the player "you are doing great" or "you are losing it" sixty times per second.

### Stretch Goals

- Add hold notes (press and hold until the note ends, scoring continuously)
- Implement a chart editor where players can create their own note charts
- Add difficulty selection (Easy/Normal/Hard) with different charts for the same song
- Create a replay system that records inputs and plays them back
- Add a health bar that drains on misses and ends the song early if depleted

### MVP Spec

| Component | Minimum Viable Version |
|-----------|----------------------|
| Lanes | 4 lanes (D, F, J, K keys) with colored note indicators |
| Note Highway | Notes scroll from top to bottom toward a target line |
| Chart Format | JSON file with timestamp, lane, and type per note |
| Audio Sync | Song position drives all timing — no frame-count drift |
| Timing Windows | Perfect (20ms), Great (50ms), Good (100ms), Miss (150ms+) |
| Scoring | Points per judgment, combo multiplier at 10/30/50 combo |
| Calibration | Audio offset setting adjustable in 5ms increments |
| Visual Feedback | Beat pulse, hit particles, judgment popups, combo counter |
| Results Screen | Score, accuracy %, max combo, letter grade (S/A/B/C/D) |
| Song | 1 bundled song with a hand-authored chart (60-90 seconds) |

### Deliverable

A playable rhythm game where notes scroll down a 4-lane highway synchronized to a music track. The player presses lane keys in time with the beat and receives millisecond-accurate timing judgments. A combo system multiplies score for consecutive hits. Visual feedback (beat pulses, hit effects, judgment popups) reinforces the connection between input and music. Audio calibration allows the player to offset latency. After the song, a results screen displays accuracy, max combo, and letter grade. The game must feel tight — inputs should feel connected to the music, not to the visuals.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|-------------|---------|
| Audio Synchronization | Like using a monotonic clock source for distributed timestamps — all events derive their timing from a single authoritative source (the audio engine), avoiding drift that accumulates with frame counting |
| Note Highway / Chart Format | Like an event queue with scheduled tasks — each note is a job with a trigger time, and the scheduler processes them in order as the clock advances |
| Timing Windows | Like SLA tiers for response time — a response under 20ms is "perfect" (P99), under 50ms is "great" (P95), under 100ms is "acceptable," and beyond that is a timeout (miss) |
| Input Latency Calibration | Like measuring and compensating for network latency — you ping the system, calculate the round-trip offset, and apply it to all subsequent timing calculations |
| Combo and Scoring System | Like a connection pool that grows with sustained throughput — consecutive successful requests increase the pool size (multiplier), but a single failure resets it to baseline |
| BPM-Based Event Scheduling | Like a cron expression that translates human-readable schedules ("every 500ms") into absolute timestamps, with support for variable-rate scheduling (tempo changes) |
| Visual Feedback on Music | Like real-time monitoring dashboards that flash alerts on events — each beat is a metric tick, each hit is a success indicator, and the visual layer provides instant operational awareness |

### Frontend Developers

| Core Concept | Analogy |
|-------------|---------|
| Audio Synchronization | Like synchronizing animations to requestAnimationFrame rather than setInterval — you derive position from the actual time source to prevent visual jank and timing drift |
| Note Highway / Chart Format | Like a virtualized list that renders only the items currently in the viewport — notes are spawned as they enter visual range and removed when they leave, keeping the DOM lean |
| Timing Windows | Like touch target sizes in mobile design — a 44px tap target (Good) is accessible, a 24px target (Perfect) rewards precision, and a 0px target (Miss) means the user missed entirely |
| Input Latency Calibration | Like measuring First Input Delay and adjusting event handlers to compensate — you account for the gap between when the user acts and when the browser registers it |
| Combo and Scoring System | Like a streak counter in a gamified UI (Duolingo, GitHub contributions) — consecutive daily interactions build the streak, a single missed day resets it, and the stakes increase with streak length |
| BPM-Based Event Scheduling | Like keyframe animations defined in percentages rather than absolute pixels — the system scales correctly regardless of screen size (tempo), and authoring is relative rather than absolute |
| Visual Feedback on Music | Like micro-interactions (button ripples, toast notifications, loading skeletons) — each user action triggers immediate visual confirmation that the system received and processed the input |

### Data / ML Engineers

| Core Concept | Analogy |
|-------------|---------|
| Audio Synchronization | Like aligning multiple time-series datasets to a common clock — all features must share the same temporal reference frame, and drift between streams corrupts downstream analysis |
| Note Highway / Chart Format | Like a labeled training dataset — each note is a labeled example (timestamp = feature, lane = class), and the chart's quality (labeling accuracy) directly determines the model's (game's) performance |
| Timing Windows | Like tolerance thresholds in anomaly detection — a prediction within 20ms of ground truth is a true positive (Perfect), within 50ms is borderline (Great), and beyond 100ms is a false negative (Miss) |
| Input Latency Calibration | Like bias correction in a prediction model — systematic offset (the player always hits 30ms late) is estimated from calibration data and subtracted from all future predictions |
| Combo and Scoring System | Like cumulative reward in reinforcement learning — each successful action adds to the reward, but a single catastrophic failure (reset) can wipe out accumulated gains, incentivizing consistent performance over risky plays |
| BPM-Based Event Scheduling | Like resampling time-series data to a uniform frequency — raw data arrives at variable intervals, but the processing pipeline normalizes it to a consistent tempo for analysis |
| Visual Feedback on Music | Like real-time training loss visualization — each batch (beat) updates the chart, spikes (misses) are immediately visible, and the running average (combo) shows overall trajectory |

---

## Discussion Questions

1. **The "Feel" Problem:** Two rhythm games can have identical timing windows and scoring systems, yet one feels tight and the other feels laggy. Beyond audio sync and calibration, what contributes to the subjective "feel" of a rhythm game? How do visual feedback timing, input buffering, and animation design affect perceived responsiveness?

2. **Charting as Level Design:** A rhythm game's difficulty and fun come almost entirely from chart quality, not code quality. What makes a good chart? Should every audible sound be a note, or should charts be selective? How do you balance "follows the music" with "is fun to play with two hands on a keyboard"?

3. **Accessibility vs. Competitive Depth:** Guitar Hero's Easy mode uses 3 buttons; Expert uses 5 with complex chord patterns. How do you design a system that is welcoming to newcomers and rewarding for experts without maintaining completely separate content (charts) for each difficulty level?

4. **Audio as a Technical Constraint:** Web browsers, mobile devices, and Bluetooth audio all introduce unpredictable latency. If you were building a rhythm game for the browser, how would you handle the reality that audio latency varies across devices and you cannot guarantee sub-10ms precision? At what point does latency make a rhythm game unplayable?
