# Module 36: Trivia
**Build a game where what you know -- and how fast you know it -- wins | The Fastest Brain in the Room**
> "The best trivia game makes you feel smart when you're right and curious when you're wrong."
---

## Prerequisites

- **Module 1: Pong** -- You need a working game loop and basic input handling. Trivia games extend this with timer management, state synchronization, and data-driven content.

## Week 1: History & Design Theory

### The Origin

Trivia games trace back to parlor games and pub quizzes, but the video game version found its voice in 1995 with **You Don't Know Jack** by Jellyvision. Rather than treating trivia as a dry flashcard exercise, YDKJ wrapped questions in irreverent humor, wordplay, and time pressure. A snarky host read questions aloud, players buzzed in with answers, and wrong answers were met with ridicule. The game understood something fundamental: trivia is not about testing knowledge -- it is about the social performance of knowing (or guessing, or panicking). The format -- question, timer, answer, reaction -- has remained essentially unchanged for 30 years because it is one of the most naturally compelling loops in all of gaming. Everyone knows something, and everyone wants to prove it.

### How the Genre Evolved

- **You Don't Know Jack (Jellyvision, 1995)** -- Proved that trivia games need personality. YDKJ's host-driven format, creative question framing ("DisOrDat" categories, trick questions), and punishing wrong-answer penalties made it feel like a game show rather than a quiz. It established that presentation and pacing matter as much as question quality, and that humor is the secret ingredient that keeps players engaged between questions.

- **Buzz! (Sony, 2005)** -- Brought trivia to the living room with dedicated wireless buzzers for the PlayStation. Buzz! demonstrated that physical input devices change the social dynamic -- literally racing to press a button creates physical comedy and excitement that button presses on a controller cannot match. It also pioneered round variety within trivia (fastest finger, point builder, final countdown), showing that the same question-answer loop can feel fresh with structural variation.

- **HQ Trivia (Rus Yusupov & Colin Kroll, 2017)** -- Took trivia live with a real host, real-time participation from millions of players simultaneously, and real cash prizes. HQ proved that trivia could be a mass spectator event and that the live, synchronous format -- everyone answering the same question at the same time -- created electric tension. It also revealed the infrastructure challenges: server load during live events, question pacing for millions, and cheat prevention at scale. HQ's meteoric rise and eventual collapse taught the industry about the economics and sustainability of live trivia platforms.

### What Makes It "Great"

A great trivia game makes every player feel like they have a chance. The question pool must span enough categories that a sports expert, a history buff, and a pop-culture junkie each get their moment to shine. Difficulty must escalate naturally so early questions build confidence and late questions create tension. Speed bonuses reward quick thinking without making the game unwinnable for careful readers. And critically, the moment between answering and seeing the result -- that half-second of "am I right?" -- must be preserved and dramatized. The best trivia games are not about knowing the most; they are about the emotional arc of each question: confidence, doubt, anticipation, and either triumph or the delicious sting of "I should have known that."

### The Essential Mechanic

Answering questions correctly under time pressure -- speed and knowledge both matter.

---

## Week 2: Build the MVP

### What You're Building

A multiplayer trivia game where 2-4 players answer questions from a structured database, earn points based on correctness and speed, build streaks for consecutive correct answers, and compete across multiple rounds. The game pulls questions from a data file, manages timers, tracks scores with streak multipliers, and displays a final results screen.

### Core Concepts

**1. Question Database Design**

Questions are data, not code. A well-structured question format supports multiple question types, categories, difficulty levels, and optional media. The database must be easy to author, validate, and extend.

```
// Question data structure
QuestionSchema:
    id: unique string
    text: string                    // "What planet is known as the Red Planet?"
    type: enum [MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN]
    answers: Answer[]
    correctAnswerIndex: integer     // index into answers array
    category: string                // "Science", "History", "Pop Culture"
    difficulty: enum [EASY, MEDIUM, HARD]
    timeLimit: seconds              // override default if needed
    media: optional                 // { type: "image"|"audio", url: string }
    tags: string[]                  // for filtering and selection
    explanation: optional string    // shown after answering

Answer:
    text: string
    id: string

// Example question entry (JSON/data file)
{
    "id": "sci_042",
    "text": "What planet is known as the Red Planet?",
    "type": "MULTIPLE_CHOICE",
    "answers": [
        {"id": "a", "text": "Venus"},
        {"id": "b", "text": "Mars"},
        {"id": "c", "text": "Jupiter"},
        {"id": "d", "text": "Saturn"}
    ],
    "correctAnswerIndex": 1,
    "category": "Science",
    "difficulty": "EASY",
    "timeLimit": 15,
    "explanation": "Mars appears red due to iron oxide on its surface."
}

// Loading questions
function loadQuestionDatabase(filepath):
    raw = readJSONFile(filepath)
    questions = []
    for each entry in raw:
        validate(entry, QuestionSchema)  // catch missing fields early
        questions.append(Question(entry))
    return questions
```

**Why it matters:** The question database is the content engine of the entire game. A clean schema means questions can be authored by non-programmers (in a spreadsheet or form), validated automatically, and swapped without touching game code. Separating content from logic is what makes a trivia game maintainable at scale -- whether you have 50 questions or 50,000.

**2. Timer-based Answer Windows**

Each question has a countdown timer. The player must answer before time runs out. Faster correct answers earn more points, creating tension between speed and deliberation.

```
class QuestionTimer:
    maxTime = 15  // seconds
    elapsed = 0
    isActive = false

    function start(timeLimit):
        maxTime = timeLimit
        elapsed = 0
        isActive = true

    function update(deltaTime):
        if NOT isActive:
            return
        elapsed += deltaTime
        if elapsed >= maxTime:
            isActive = false
            onTimeExpired()

    function getRemaining():
        return max(0, maxTime - elapsed)

    function getSpeedBonus():
        // More time remaining = higher bonus
        remainingRatio = getRemaining() / maxTime  // 1.0 = instant, 0.0 = last second
        return floor(remainingRatio * MAX_SPEED_BONUS)

    function render():
        remaining = getRemaining()
        // Visual timer bar that shrinks
        barWidth = (remaining / maxTime) * FULL_BAR_WIDTH
        barColor = remaining > 5 ? GREEN : remaining > 2 ? YELLOW : RED
        drawBar(barWidth, barColor)
        // Pulsing effect when time is low
        if remaining < 3:
            pulseText(ceil(remaining))
            playTickSound()
```

**Why it matters:** The timer is what transforms trivia from a relaxed quiz into a game. Without it, players can deliberate forever and the pacing collapses. The speed bonus creates a risk/reward decision: answer immediately for maximum points, or wait to think and risk running out of time. The visual and audio urgency cues in the final seconds are where tension peaks.

**3. Multiple Input Methods**

Trivia games must support diverse input devices: keyboard buttons, touchscreen taps, controller presses, or even voice input. An input abstraction layer lets the game accept answers from any source without changing game logic.

```
// Abstract input interface
interface AnswerInput:
    function getSelectedAnswer() -> answerId or null
    function isConfirmed() -> boolean

// Keyboard implementation
class KeyboardAnswerInput implements AnswerInput:
    ANSWER_KEYS = { "1": "a", "2": "b", "3": "c", "4": "d" }

    function getSelectedAnswer():
        for key, answerId in ANSWER_KEYS:
            if isKeyPressed(key):
                return answerId
        return null

// Touch/Click implementation
class TouchAnswerInput implements AnswerInput:
    function getSelectedAnswer():
        clickPos = getClickPosition()
        if clickPos != null:
            for each answerButton in answerButtons:
                if answerButton.containsPoint(clickPos):
                    return answerButton.answerId
        return null

// Voice implementation (for voice-powered games)
class VoiceAnswerInput implements AnswerInput:
    lastTranscript = null

    function onSpeechResult(transcript):
        // Match spoken text to answer options
        bestMatch = fuzzyMatch(transcript, currentAnswers)
        if bestMatch.confidence > THRESHOLD:
            lastTranscript = bestMatch.answerId

    function getSelectedAnswer():
        result = lastTranscript
        lastTranscript = null
        return result

// Game logic uses the abstraction
function processAnswer(inputMethod, currentQuestion, timer):
    answerId = inputMethod.getSelectedAnswer()
    if answerId != null:
        isCorrect = (answerId == currentQuestion.correctAnswerIndex)
        speedBonus = timer.getSpeedBonus()
        return AnswerResult(answerId, isCorrect, speedBonus)
    return null
```

**Why it matters:** The input method defines the social experience. Keyboard buttons work for local play. Phone-as-controller (like Jackbox) lets everyone use their own device privately. Voice input creates a shout-it-out game show atmosphere. Abstracting input means you can support all of these without rewriting the question-answer loop.

**4. Scoring with Streaks and Multipliers**

Points are awarded for correct answers, with bonuses for speed and consecutive correct answers (streaks). Streaks multiply the base score, creating high-risk, high-reward dynamics.

```
class ScoringSystem:
    BASE_POINTS = 100
    MAX_SPEED_BONUS = 50
    STREAK_MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3]  // index = streak count

    playerScores = {}   // playerId -> { total, streak, roundScores[] }

    function scoreAnswer(playerId, isCorrect, speedBonus):
        player = playerScores[playerId]

        if isCorrect:
            player.streak += 1
            streakIndex = min(player.streak, STREAK_MULTIPLIERS.length - 1)
            multiplier = STREAK_MULTIPLIERS[streakIndex]

            points = floor((BASE_POINTS + speedBonus) * multiplier)
            player.total += points
            player.roundScores.append(points)

            return ScoreResult(
                points: points,
                streak: player.streak,
                multiplier: multiplier,
                message: getStreakMessage(player.streak)
            )
        else:
            player.streak = 0
            player.roundScores.append(0)
            return ScoreResult(points: 0, streak: 0, multiplier: 1, message: null)

    function getStreakMessage(streak):
        if streak == 3: return "On Fire!"
        if streak == 5: return "Unstoppable!"
        if streak >= 7: return "LEGENDARY!"
        return null
```

**Why it matters:** Flat scoring (100 points per correct answer) is boring -- the leader after question 5 is almost always the leader after question 15. Streaks create drama: a player on a 5-question streak is earning triple points, so one mistake costs them enormously. Speed bonuses reward the confident guesser and punish the slow-but-sure player, creating different viable strategies.

**5. Question Selection Algorithm**

The algorithm chooses which question to show next, balancing difficulty progression, category variety, and avoiding repeats. Good selection keeps every round feeling fresh.

```
class QuestionSelector:
    allQuestions = []
    usedQuestionIds = set()
    recentCategories = []  // sliding window of last N categories

    function selectNextQuestion(roundNumber, totalRounds):
        // Step 1: Filter out used questions
        available = allQuestions.filter(q => q.id NOT in usedQuestionIds)

        // Step 2: Determine target difficulty based on round position
        progress = roundNumber / totalRounds  // 0.0 to 1.0
        if progress < 0.3:
            targetDifficulty = EASY
        else if progress < 0.7:
            targetDifficulty = MEDIUM
        else:
            targetDifficulty = HARD

        // Step 3: Filter by difficulty (with fallback)
        candidates = available.filter(q => q.difficulty == targetDifficulty)
        if candidates.isEmpty():
            candidates = available  // fallback to any available

        // Step 4: Prefer categories not recently used
        recentCats = set(recentCategories.last(3))
        preferred = candidates.filter(q => q.category NOT in recentCats)
        if preferred.isNotEmpty():
            candidates = preferred

        // Step 5: Random selection from candidates
        selected = random(candidates)
        usedQuestionIds.add(selected.id)
        recentCategories.append(selected.category)
        return selected
```

**Why it matters:** If players see the same question twice, trust in the game evaporates. If three Science questions appear in a row, the history expert feels cheated. If hard questions come first, new players get discouraged. The selection algorithm is invisible when it works and game-breaking when it does not.

**6. Content Pipeline / Authoring Tools**

Creating, validating, and managing thousands of questions requires tooling beyond a text editor. A content pipeline lets non-programmers author questions and catches errors before they reach players.

```
// Question validation
function validateQuestion(question):
    errors = []

    if question.text.length == 0:
        errors.append("Question text is empty")
    if question.answers.length < 2:
        errors.append("Must have at least 2 answers")
    if question.correctAnswerIndex >= question.answers.length:
        errors.append("Correct answer index out of range")
    if question.answers.hasDuplicateTexts():
        errors.append("Duplicate answer text detected")
    if question.category NOT in VALID_CATEGORIES:
        errors.append("Unknown category: " + question.category)
    if question.difficulty NOT in [EASY, MEDIUM, HARD]:
        errors.append("Invalid difficulty")

    return errors

// Batch import from CSV/spreadsheet
function importFromCSV(filepath):
    rows = parseCSV(filepath)
    questions = []
    errors = []

    for i, row in enumerate(rows):
        question = Question(
            id: generateId(row),
            text: row["question"],
            answers: [row["answer_a"], row["answer_b"], row["answer_c"], row["answer_d"]],
            correctAnswerIndex: letterToIndex(row["correct"]),
            category: row["category"],
            difficulty: row["difficulty"]
        )
        validationErrors = validateQuestion(question)
        if validationErrors:
            errors.append({ row: i, errors: validationErrors })
        else:
            questions.append(question)

    report(imported: questions.length, failed: errors.length, details: errors)
    return questions

// Stats for balancing the question pool
function analyzeQuestionPool(questions):
    byCategory = groupBy(questions, q => q.category)
    byDifficulty = groupBy(questions, q => q.difficulty)
    report("Category distribution:", countEach(byCategory))
    report("Difficulty distribution:", countEach(byDifficulty))
    // Flag gaps: "Warning: only 3 HARD History questions"
```

**Why it matters:** A trivia game is only as good as its questions. If authoring is painful, you will have too few questions and players will see repeats. If validation is manual, typos and broken questions will reach players. The pipeline is an investment in content velocity -- the ability to add hundreds of quality questions quickly is what keeps a trivia game alive.

**7. Live Multiplayer Synchronization**

All players must see the same question at the same time and submit answers within the same window. In local play this is trivial (shared state), but the architecture must support the possibility of networked play.

```
// Shared game state for synchronization
class TriviaGameState:
    currentQuestion: Question
    phase: enum [SHOWING_QUESTION, ACCEPTING_ANSWERS, SHOWING_RESULT, BETWEEN_QUESTIONS]
    timer: float
    playerAnswers: { playerId: AnswerResult }
    roundNumber: int

// Local multiplayer: state is shared directly
class LocalTriviaGame:
    state = TriviaGameState()

    function showQuestion(question):
        state.currentQuestion = question
        state.phase = SHOWING_QUESTION
        state.timer = QUESTION_READ_TIME
        state.playerAnswers = {}

    function startAnswerWindow():
        state.phase = ACCEPTING_ANSWERS
        state.timer = question.timeLimit
        // All players now see answer options and can respond

    function onPlayerAnswer(playerId, answerId):
        if state.phase != ACCEPTING_ANSWERS:
            return  // too early or too late
        if playerId in state.playerAnswers:
            return  // already answered
        state.playerAnswers[playerId] = processAnswer(answerId, state)
        // Check if all players have answered
        if allPlayersAnswered():
            endAnswerWindow()

    function endAnswerWindow():
        state.phase = SHOWING_RESULT
        state.timer = RESULT_DISPLAY_TIME
        revealCorrectAnswer(state.currentQuestion)
        for each playerId, result in state.playerAnswers:
            showPlayerResult(playerId, result)

// Network-ready: same interface, state sent over wire
// The local version is the MVP; networked version is a stretch goal
```

**Why it matters:** Synchronization is what makes trivia multiplayer rather than parallel solitaire. Every player must experience the question reveal, the ticking countdown, and the answer reveal at the same moment. Without sync, a player who sees the question one second earlier has an unfair advantage, and the shared social moment of "we all got that wrong" is lost.

### Stretch Goals

- Add image and audio questions (album art, sound clips, maps).
- Implement phone-as-controller input using WebSockets for private answer submission.
- Add a "wager" round where players bet points on their confidence.
- Create a question editor UI for authoring new questions in-game.
- Add category selection so players vote on the topic for the next round.
- Implement an audience mode where spectators can answer for bonus prizes.
- Add voice input for a "shout the answer" game mode.

### MVP Spec

| Element | Scope |
|---|---|
| **Players** | 2-4 local players, each with assigned input keys |
| **Question database** | 30+ questions in JSON file, covering 4+ categories and 3 difficulty levels |
| **Question types** | Multiple choice (4 options) as the primary type |
| **Timer** | Countdown per question (15s default), visual bar + color change at low time |
| **Scoring** | Base points + speed bonus + streak multiplier, displayed per-question and cumulatively |
| **Rounds** | 10-15 questions per game, difficulty escalating from easy to hard |
| **Selection** | No repeat questions, category rotation, difficulty scaling by round |
| **Game flow** | Question reveal -> Answer window -> Result reveal -> Score update -> Next question |
| **Results** | Final scoreboard with rankings, total points, best streak, and fastest answer |
| **Feedback** | Correct/incorrect indication, streak announcements, explanation of correct answer |

### Deliverable

A playable trivia game where 2-4 players answer multiple-choice questions under time pressure, earn points modified by speed and streak bonuses, and compete across 10-15 rounds with escalating difficulty. Questions load from an external data file with at least 30 entries. The game should feel like a game show: dramatic countdowns, satisfying correct-answer feedback, and a final results screen that makes the winner feel like a champion. A playtester should be able to author new questions in the data file without touching game code.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Question database design | Like designing a REST API schema -- well-defined fields, validation rules, and a contract that separates content from business logic |
| Timer-based answer windows | Like request timeouts with SLAs -- the client (player) must respond within a deadline, and late responses are rejected |
| Multiple input methods | Like supporting multiple authentication methods (OAuth, API key, SAML) behind a single auth interface -- the system does not care how you prove identity |
| Scoring with streaks and multipliers | Like rate-limiting with burst allowances -- sustained good performance (streaks) earns a higher throughput multiplier |
| Question selection algorithm | Like a load balancer with weighted routing -- distribute requests (questions) across categories while respecting constraints (no repeats, difficulty curve) |
| Content pipeline / authoring tools | Like a CI/CD pipeline for database migrations -- validate, transform, and deploy content changes with automated checks before they reach production |
| Live multiplayer synchronization | Like distributed consensus -- all nodes (players) must agree on the current state (question) before processing can proceed |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Question database design | Like a CMS schema for structured content -- each question is a content entry with typed fields, validation, and a preview rendering |
| Timer-based answer windows | Like form submission with a session timeout -- the UI communicates urgency through visual countdown and disables input when time expires |
| Multiple input methods | Like progressive enhancement for accessibility -- keyboard, mouse, touch, and screen reader support all flow through the same event handler abstraction |
| Scoring with streaks and multipliers | Like gamified UI animations -- a "combo" counter that scales visual feedback (bigger numbers, brighter colors) based on sustained user engagement |
| Question selection algorithm | Like a content recommendation feed -- showing varied, non-repeating content that matches the user's current context (difficulty level) |
| Content pipeline / authoring tools | Like a design system with Storybook -- tooling that lets content creators preview and validate their work before it ships to users |
| Live multiplayer synchronization | Like collaborative real-time editing (CRDT/OT) -- all connected clients must see the same document state with minimal latency |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Question database design | Like a labeled dataset -- each question is a data point with features (text, category, difficulty) and a label (correct answer), and schema quality determines model (game) quality |
| Timer-based answer windows | Like inference latency budgets -- the model (player) must return a prediction (answer) within a time constraint, with confidence (speed bonus) rewarded |
| Multiple input methods | Like multi-modal model inputs -- text, image, and audio all feed into the same prediction pipeline through modality-specific encoders |
| Scoring with streaks and multipliers | Like reward shaping in reinforcement learning -- bonus rewards for consistent performance (streaks) encourage stable, high-quality behavior over lucky guesses |
| Question selection algorithm | Like active learning sample selection -- choosing the next data point (question) that maximizes information gain while maintaining balanced coverage |
| Content pipeline / authoring tools | Like a data labeling pipeline with quality checks -- human annotators (authors) create content, automated validators catch errors, and statistics ensure balanced representation |
| Live multiplayer synchronization | Like parameter server synchronization in distributed training -- all workers must operate on the same model version (question) before computing gradients (answers) |

---

## Discussion Questions

1. **Knowledge breadth vs. depth:** Should a trivia game reward deep expertise in one category or broad knowledge across many? How does category selection (or the lack of it) change the competitive dynamics? What does your question pool's category distribution communicate to players about who the game is "for"?

2. **The content treadmill:** A trivia game with 100 questions is fun once. A trivia game with 10,000 questions is fun for months. How do you build a content pipeline that scales? What role could procedural generation or AI play in question authoring, and what are the risks of automated content in a game where factual accuracy is paramount?

3. **Speed vs. knowledge:** Speed bonuses reward quick answers, but they also reward impulsive guessing. How do you tune the speed bonus so that a thoughtful player who takes 10 seconds has a chance against a fast player who answers in 2 seconds? Should there be a penalty for wrong answers?

4. **Voice as input:** If players speak their answers aloud instead of pressing buttons, the game becomes a fundamentally different social experience -- everyone hears your answer (and your uncertainty). How does voice input change game design, cheating dynamics, and the emotional arc of a question?
