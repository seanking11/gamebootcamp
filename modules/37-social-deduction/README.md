# Module 37: Social Deduction
**Build a game where trust is a weapon and suspicion is a strategy | Who Among Us?**
> "In a game of perfect information, the best player wins. In a game of hidden information, the best liar wins."
---

## Prerequisites

- **Module 1: Pong** -- You need a working game loop and basic input handling.
- **Module 35: Party Game** -- You need multiplayer input handling, lobby/join systems, and round-based game structure. Social deduction builds on the party game framework with hidden roles and asymmetric information.

## Week 1: History & Design Theory

### The Origin

The social deduction genre was invented in the psychology department of Moscow State University. In 1986, Dimitry Davidoff created **Mafia** as a classroom exercise exploring the tension between an informed minority and an uninformed majority. The rules were elegant: a small group of "mafia" members secretly chose someone to eliminate each night, while the larger group of "townspeople" debated during the day about who to vote out. No board, no cards, no technology -- just people, deception, and the human inability to reliably detect lies. Mafia spread virally through campuses and social circles across the Soviet Union and eventually worldwide. It proved that the most compelling game mechanic is not any system a designer can build but rather the human instinct to read faces, challenge stories, and construct theories about who is lying. Every social deduction game since is a descendant of Davidoff's experiment.

### How the Genre Evolved

- **Mafia / Werewolf (Dimitry Davidoff, 1986; Andrew Plotkin, 1997)** -- Mafia established the genre's DNA: hidden roles, day/night cycles, group discussion, and elimination voting. Andrew Plotkin's re-skin as "Werewolf" in 1997 added thematic flavor and made the game more accessible to Western audiences. The core insight was that the game needed no referee AI, no complex rules, and no technology -- just a social contract where some players lie and others try to catch them. The role of the moderator (a non-player who manages the night phase) became a design challenge that later digital versions would solve.

- **Town of Salem (BlankMediaGames, 2014)** -- Brought social deduction to the browser with dozens of unique roles (Sheriff, Doctor, Serial Killer, Jester), text-based chat for discussion, and automated night phases. Town of Salem proved the genre could work digitally without voice chat or physical presence. It also demonstrated the design space of roles: every new role with unique night abilities created new strategic layers and new ways to deceive. The Jester role -- a player who wins by tricking others into voting them out -- showed that asymmetric win conditions create emergent gameplay.

- **Among Us (InnerSloth, 2018/2020)** -- Replaced the text-based discussion format with real-time spatial gameplay. Crewmates walk around a map completing tasks while impostors sabotage and kill. The genius of Among Us was giving players physical alibis: "I was in Medbay doing the scan" is verifiable if someone else was there too. The emergency meeting system (find a body, hit the button) triggers discussion phases organically rather than by timer. Among Us became a global phenomenon during 2020 by combining accessible controls, short game sessions, and the irresistible drama of accusing friends of murder.

### What Makes It "Great"

A great social deduction game creates genuine tension from asymmetric knowledge. The impostors know everything; the crew knows almost nothing. This imbalance generates the core emotions: paranoia for the crew, exhilaration for the impostors, and mounting dread for everyone as the player count shrinks. The discussion phase is where the game truly lives -- accusation, defense, alliance, and betrayal all happen through conversation, making every group's experience unique. The best games give both sides meaningful actions (tasks for crew, kills and sabotage for impostors) so that no one is ever just waiting. And the moment of truth -- the vote that eliminates a player, the reveal of whether they were innocent or guilty -- must land with weight, because that moment is what makes players immediately queue up for another round.

### The Essential Mechanic

Deception and detection -- game mechanics create structured social interaction where lying is a core strategy.

---

## Week 2: Build the MVP

### What You're Building

A social deduction game for 4-8 players where one or two players are secretly assigned the "impostor" role while the rest are "crew." Crew members complete tasks to win. Impostors fake tasks and eliminate crew members. When a body is found or an emergency meeting is called, all players discuss and vote to eliminate a suspect. The game ends when all impostors are eliminated (crew wins) or impostors equal or outnumber crew (impostor wins).

### Core Concepts

**1. Hidden Role Assignment**

At game start, roles are secretly assigned. Each player knows their own role but does not know the roles of others (except impostors, who know each other). The assignment must be random, fair, and provably hidden from other players.

```
function assignRoles(players, impostorCount):
    // Validate impostor count
    assert impostorCount < players.length / 2  // impostors must be minority

    // Shuffle and assign
    shuffled = shuffleArray(copyOf(players))
    roles = {}

    for i in range(shuffled.length):
        if i < impostorCount:
            roles[shuffled[i].id] = IMPOSTOR
        else:
            roles[shuffled[i].id] = CREW

    // Notify each player privately
    for each player in players:
        player.role = roles[player.id]
        showRoleReveal(player, roles[player.id])
        // On shared screen: each player looks away while one peeks
        // On networked: send role to individual device

    // Impostors learn who their partners are
    impostors = players.filter(p => p.role == IMPOSTOR)
    for each impostor in impostors:
        impostor.knownImpostors = impostors.map(i => i.id)

    return roles

// For shared-screen play: sequential role reveal
function sequentialRoleReveal(players, roles):
    for each player in players:
        showScreen("Pass the device to " + player.name)
        waitForConfirm()
        showScreen("Your role: " + roles[player.id], duration: 3 seconds)
        showScreen("Pass to the next player")
        waitForConfirm()
```

**Why it matters:** The entire game rests on role secrecy. If a player's role is leaked -- through a screen reflection, a tell in the UI, or a bug in the assignment -- the game is ruined. The reveal sequence must be designed for the physical context (shared screen, individual phones, or networked) and must feel dramatic, not administrative.

**2. Voting / Accusation System**

During discussion phases, players nominate suspects and vote to eliminate someone. The player with the most votes is removed from the game. Ties and abstentions must be handled. The voting system is where the social deduction becomes concrete -- talk is cheap, but a vote has consequences.

```
class VotingSystem:
    nominations = {}    // nominatorId -> nominatedPlayerId
    votes = {}          // voterId -> votedPlayerId (or SKIP)
    alivePlayers = []
    phase = DISCUSSION  // DISCUSSION -> VOTING -> RESULTS

    function startDiscussion(durationSeconds):
        phase = DISCUSSION
        timer = durationSeconds
        // Players discuss freely (voice chat, text, or in-person)
        // No mechanical action during this phase

    function startVoting():
        phase = VOTING
        votes = {}
        // Each player selects who to eliminate (or skip)

    function castVote(voterId, targetId):
        if voterId in votes:
            return  // already voted
        if voterId NOT in alivePlayers:
            return  // dead players cannot vote
        votes[voterId] = targetId  // targetId can be SKIP

        if votes.length == alivePlayers.length:
            resolveVote()

    function resolveVote():
        phase = RESULTS
        tallies = countVotes(votes)
        skipVotes = tallies.get(SKIP, 0)
        maxVotes = max(tallies.values())

        // Check for tie or skip majority
        playersWithMax = [p for p, count in tallies if count == maxVotes AND p != SKIP]

        if skipVotes >= maxVotes OR playersWithMax.length > 1:
            // Tie or skip wins: no one is eliminated
            showResult("No one was ejected. (Tie/Skip)")
        else:
            eliminated = playersWithMax[0]
            eliminatePlayer(eliminated)
            // Reveal role (optional: some variants keep it hidden)
            showResult(eliminated.name + " was ejected. They were " + eliminated.role)

    function eliminatePlayer(player):
        player.alive = false
        alivePlayers.remove(player)
        checkWinCondition()
```

**Why it matters:** The vote is the moment where social pressure becomes game mechanics. A wrong vote eliminates an innocent player and brings the impostors closer to victory. A correct vote removes a threat. Allowing "skip" prevents the crew from being forced into blind guesses. The post-vote role reveal (or concealment) dramatically changes the information landscape for remaining players.

**3. Phase-based Gameplay**

The game alternates between distinct phases: a free-roam/task phase where players move and act, and a discussion/voting phase triggered by events. Each phase has different rules, inputs, and UI.

```
GAME_PHASES:
    ROLE_REVEAL    // Show each player their role
    FREE_ROAM      // Players move, do tasks, impostors can kill
    BODY_FOUND     // Transition: someone reported a body
    DISCUSSION     // Players discuss (timer)
    VOTING         // Players vote (timer)
    VOTE_RESULT    // Show who was eliminated
    GAME_OVER      // Show win/loss screen

class GamePhaseManager:
    currentPhase = ROLE_REVEAL

    function update(deltaTime):
        switch currentPhase:
            case ROLE_REVEAL:
                if allPlayersHaveSeenRole():
                    transitionTo(FREE_ROAM)

            case FREE_ROAM:
                updatePlayerMovement()
                updateTasks()
                updateImpostorActions()
                if bodyReported OR emergencyMeetingCalled:
                    transitionTo(BODY_FOUND)
                if checkWinCondition() != null:
                    transitionTo(GAME_OVER)

            case BODY_FOUND:
                showBodyLocation()
                playAlertAnimation()
                transitionTo(DISCUSSION, after: 2 seconds)

            case DISCUSSION:
                timer -= deltaTime
                if timer <= 0:
                    transitionTo(VOTING)

            case VOTING:
                timer -= deltaTime
                // Auto-skip for players who haven't voted
                if timer <= 0:
                    autoSkipRemainingVoters()
                    resolveVote()
                    transitionTo(VOTE_RESULT)

            case VOTE_RESULT:
                showEjectionAnimation()
                if checkWinCondition() != null:
                    transitionTo(GAME_OVER)
                else:
                    transitionTo(FREE_ROAM, after: 3 seconds)
```

**Why it matters:** Phase separation creates rhythm. Free-roam is tense and quiet -- footsteps, tasks, and paranoid glances. Discussion is loud and chaotic -- accusations, alibis, and alliances. The shift between these modes creates an emotional roller coaster that a single-phase game cannot match. Clear phase transitions also prevent exploits (no killing during discussion, no voting during free-roam).

**4. Task / Objective System**

Crew members have a secondary win condition: complete all tasks. Tasks give crew members a reason to move around the map and create alibis ("I was in the engine room doing my task"). The task bar also creates time pressure for impostors.

```
TASK_TYPES:
    SIMPLE:   { duration: 2s,  locations: 1 }  // flip a switch
    SHORT:    { duration: 5s,  locations: 1 }  // enter a code
    LONG:     { duration: 5s,  locations: 2 }  // start in room A, finish in room B

class TaskSystem:
    totalTaskSteps = 0
    completedTaskSteps = 0

    function assignTasks(players, taskPool):
        for each player in players:
            if player.role == CREW:
                player.tasks = selectRandomTasks(taskPool, count: TASKS_PER_PLAYER)
                for each task in player.tasks:
                    totalTaskSteps += task.steps

    function startTask(player, taskLocation):
        task = player.tasks.find(t => t.location == taskLocation AND NOT t.completed)
        if task == null:
            return  // no task here for this player
        showTaskUI(task)  // mini-game or progress bar
        // Player is "busy" and cannot move during task

    function completeTask(player, task):
        task.completed = true
        completedTaskSteps += 1
        updateTaskBar(completedTaskSteps / totalTaskSteps)
        if completedTaskSteps >= totalTaskSteps:
            triggerCrewWin("All tasks completed!")

    function getTaskBarProgress():
        return completedTaskSteps / totalTaskSteps  // 0.0 to 1.0

    // Impostors see fake task list but completion doesn't count
    function fakeTask(impostor, taskLocation):
        showFakeTaskUI()  // looks the same to observers
        // No progress added to task bar
```

**Why it matters:** Tasks serve three design purposes simultaneously. First, they are an alternative win condition that prevents the game from becoming pure voting elimination. Second, they force movement, which creates encounters and alibis. Third, the task bar is a visible clock: if the impostors do not act fast enough, the crew will simply complete all tasks and win. This forces impostors to take risks.

**5. Kill / Sabotage Mechanics**

Impostors can eliminate crew members and sabotage systems. Both actions must be performed without being seen. Kill cooldowns prevent reckless play, and sabotage creates diversions that split the crew.

```
class ImpostorActions:
    killCooldown = 30        // seconds between kills
    killRange = 1.5          // distance units
    timeSinceLastKill = 30   // start ready

    function update(deltaTime):
        timeSinceLastKill += deltaTime

    function canKill():
        return timeSinceLastKill >= killCooldown

    function attemptKill(impostor, target):
        if NOT canKill():
            return false
        if distance(impostor.position, target.position) > killRange:
            return false
        if target.role == IMPOSTOR:
            return false  // cannot kill partner
        if NOT target.alive:
            return false

        // Execute kill
        target.alive = false
        target.deathPosition = target.position
        timeSinceLastKill = 0
        spawnBody(target.deathPosition, target.id)
        showKillAnimation(impostor, target)
        return true

    // Sabotage: create a crisis that distracts the crew
    SABOTAGE_TYPES:
        LIGHTS:   { effect: reduceCrewVision, duration: 30s, fixLocation: "Electrical" }
        REACTOR:  { effect: countdownToLoss,  duration: 45s, fixLocation: "Reactor" }
        DOORS:    { effect: lockRoomDoors,     duration: 15s, fixLocation: null }

    function sabotage(type):
        if activeSabotage != null:
            return  // one at a time
        activeSabotage = SABOTAGE_TYPES[type]
        applySabotageEffect(activeSabotage)
        // Crew must go to fixLocation and complete repair to end sabotage
```

**Why it matters:** The kill cooldown is the impostor's core tension: you can only act every 30 seconds, so timing and positioning matter enormously. Sabotage adds a strategic layer -- calling lights off creates cover for a kill, and reactor meltdown forces the crew to split up and rush to a specific location. These tools give the impostor player agency and require them to plan, not just hide.

**6. Information Asymmetry**

The fundamental mechanic of social deduction is that different players have different information. Impostors know who each other are; crew members know only their own role. The game's systems must carefully control what each player can see and know.

```
// What each role knows
INFORMATION_RULES:
    CREW:
        knows: [own_role, own_tasks, task_bar_progress, who_is_alive]
        sees: [other_players_in_vision_range, bodies_in_vision_range]
        does_not_know: [other_roles, who_killed_whom, what_happened_outside_vision]

    IMPOSTOR:
        knows: [own_role, other_impostors, all_above]
        sees: [all_above, sabotage_options]
        does_not_know: [crew_task_assignments]

// Vision system: players only see what's in range
function getVisibleEntities(player, allEntities):
    visible = []
    for each entity in allEntities:
        dist = distance(player.position, entity.position)
        if dist <= player.visionRange:
            // Check line-of-sight (walls block vision)
            if hasLineOfSight(player.position, entity.position):
                visible.append(entity)
    return visible

// Information revealed through gameplay
function onBodyReport(reporter, body):
    // Everyone learns: who reported, where the body was
    sharedInfo = {
        reporter: reporter.id,
        victim: body.playerId,
        location: body.position
    }
    // But NOT: who killed them, when they died, who was nearby
    broadcastToAllPlayers(sharedInfo)

// The "trust graph" emerges from discussion
// Players build mental models:
// "Red says they were in Medbay, but Blue says Medbay was empty"
// The game provides facts; players must construct theories
```

**Why it matters:** Information asymmetry is not a feature of social deduction -- it IS social deduction. Every design decision must be evaluated through the lens of "what does each player know?" If the crew has too much information, the impostor cannot hide. If the crew has too little, discussion is pointless guessing. The sweet spot is where crew members have enough partial information to construct theories but not enough to be certain.

**7. Proximity / Visibility Mechanics**

Who can see what -- and who was near the body -- drives spatial deduction. Vision range, line of sight, and movement tracking create physical alibis and evidence that fuel discussion.

```
// Vision range varies by role and game state
VISION_CONFIG:
    CREW_NORMAL:     range = 5.0
    CREW_LIGHTS_OFF: range = 2.0   // sabotage reduces crew vision
    IMPOSTOR:        range = 7.0   // impostors always see further
    GHOST:           range = INFINITE  // dead players see everything

// Proximity detection for kills and reports
function getNearbyPlayers(player, allPlayers, range):
    return allPlayers.filter(p =>
        p.id != player.id AND
        p.alive AND
        distance(player.position, p.position) <= range
    )

// Body discovery
function checkForBodies(player, bodies):
    for each body in bodies:
        if distance(player.position, body.position) <= REPORT_RANGE:
            showReportButton(player)
            if player.pressesReport():
                triggerEmergencyMeeting(reporter: player, body: body)

// Movement history (for post-game review or admin tools)
class MovementTracker:
    history = {}  // playerId -> [{position, timestamp}]

    function recordPosition(playerId, position, timestamp):
        history[playerId].append({position, timestamp})

    // "Where was Red 30 seconds ago?"
    function getPositionAt(playerId, timestamp):
        entries = history[playerId]
        return interpolate(entries, timestamp)

    // "Who was near Electrical when the lights went out?"
    function getPlayersNearLocation(location, timestamp, range):
        nearby = []
        for each playerId in history:
            pos = getPositionAt(playerId, timestamp)
            if distance(pos, location) <= range:
                nearby.append(playerId)
        return nearby
```

**Why it matters:** Physical space turns abstract suspicion into concrete evidence. "I saw Red walk toward Electrical, and then the lights went off" is a deduction based on proximity and timing. Vision limitations mean players cannot see everything, which creates pockets of uncertainty that impostors exploit. The map is not just a play space -- it is an information environment where every hallway is a potential alibi or accusation.

### Stretch Goals

- Add unique crew roles with special abilities (Scanner who can confirm one player, Medic who can protect one player per night).
- Implement vent/shortcut system for impostors to move unseen.
- Add a "ghost task" system so eliminated players can still contribute by completing tasks.
- Create a post-game replay showing all player movements and the impostor's perspective.
- Add emergency meeting cooldowns and limits.
- Implement a text chat or voice proximity chat system for discussion phases.

### MVP Spec

| Element | Scope |
|---|---|
| **Players** | 4-8 players (networked via local server, or hot-seat with hidden role screens) |
| **Roles** | 2 roles: Crew and Impostor (1-2 impostors depending on player count) |
| **Map** | Single 2D map with 4-6 rooms connected by hallways |
| **Tasks** | 3-5 simple tasks per crew member (interact with a location, wait for progress bar) |
| **Kill** | Impostors can eliminate adjacent crew members with a cooldown |
| **Report** | Players can report bodies they find, triggering a meeting |
| **Discussion** | Timed discussion phase (60-90 seconds) |
| **Voting** | Each player votes to eliminate or skips, majority rules, ties result in no elimination |
| **Vision** | Limited vision range for crew; larger range for impostors |
| **Win conditions** | Crew wins by completing all tasks or ejecting all impostors; Impostors win when they equal remaining crew |
| **UI** | Top bar: task progress, alive count. Player: role indicator, task list, kill/report/sabotage buttons |

### Deliverable

A playable social deduction game where players are assigned hidden roles, move around a 2D map, complete tasks or perform kills, report bodies to trigger discussion phases, and vote to eliminate suspects. The game must support at least 4 players with functional win conditions for both sides. A playtest session should produce genuine accusations, defenses, and the satisfying reveal of whether the voted player was crew or impostor.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Hidden role assignment | Like secrets management -- each service (player) receives its own credentials (role) at startup, and leaking any secret compromises the system |
| Voting / accusation system | Like distributed consensus with Byzantine fault tolerance -- the majority must agree on which node is faulty while some nodes are actively lying |
| Phase-based gameplay | Like a state machine in a workflow engine -- each phase has entry/exit conditions, allowed actions, and transitions triggered by events |
| Task / objective system | Like background worker jobs -- tasks run independently, report completion to a shared progress tracker, and the system succeeds when all jobs finish |
| Kill / sabotage mechanics | Like a security breach simulation -- an attacker operates within the system, exploiting cooldown windows and creating diversions (DDoS) to mask their actions |
| Information asymmetry | Like role-based access control (RBAC) -- each user sees only what their permissions allow, and the system must never leak information across permission boundaries |
| Proximity / visibility mechanics | Like network topology and service discovery -- a service can only see other services within its subnet, and network partitions create information gaps |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Hidden role assignment | Like personalized UI rendering -- each user sees a different version of the interface based on their role, and the client must never expose another user's view |
| Voting / accusation system | Like a poll or survey component with real-time results -- users submit choices, and the aggregated result is revealed after everyone has voted |
| Phase-based gameplay | Like a multi-step form wizard with conditional routing -- the current step determines available actions, and navigation between steps is controlled by events |
| Task / objective system | Like a progress tracker in an onboarding flow -- individual steps complete independently, a shared progress bar fills, and completion triggers a success state |
| Kill / sabotage mechanics | Like destructive UI actions (delete, override) behind confirmation gates -- the action is powerful, has a cooldown (rate limiting), and the user must be positioned correctly (context) |
| Information asymmetry | Like conditional rendering based on user role -- admin users see more of the UI than regular users, and the DOM must not contain hidden elements that dev tools could reveal |
| Proximity / visibility mechanics | Like viewport-based lazy loading -- only render elements that are within the user's visible area, and off-screen content remains unknown until scrolled into view |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Hidden role assignment | Like train/test split labels -- each data point (player) has a hidden label (role) that determines how it is processed, and label leakage invalidates the experiment |
| Voting / accusation system | Like ensemble model voting for classification -- each model (player) casts a vote for a class (suspect), and the majority prediction determines the output |
| Phase-based gameplay | Like alternating training phases (e.g., GAN training) -- the generator phase and discriminator phase have different objectives and update rules that alternate |
| Task / objective system | Like a distributed training job with a shared loss metric -- each worker computes local gradients (tasks), and the global model improves when all contributions are aggregated |
| Kill / sabotage mechanics | Like adversarial attacks on a model -- an adversary injects perturbations (kills, sabotage) that degrade system performance while trying to remain undetected |
| Information asymmetry | Like the explore/exploit tradeoff in multi-armed bandits -- the crew must explore (gather information) to improve their model of who is suspicious, while impostors exploit their superior knowledge |
| Proximity / visibility mechanics | Like spatial locality in graph neural networks -- a node can only aggregate information from its neighbors within a radius, and distant nodes are invisible until connected through traversal |

---

## Discussion Questions

1. **Designing for deception:** Most games penalize dishonesty (anti-cheat, fair play rules). Social deduction games require and reward it. How does designing a system where lying is a valid strategy change your approach to game rules, player communication, and community management?

2. **The spectator problem:** Eliminated players must wait until the game ends, which can be 10+ minutes. Among Us partially solved this with ghost tasks. What other approaches could keep eliminated players engaged without giving them the ability to influence the living players?

3. **Scaling trust:** Mafia works with 7+ players in a room. Among Us works with 4-10 online. How does player count change the social dynamics? At what point is the group too small for deception to work (everyone has too much information) or too large for discussion to be productive?

4. **Asymmetric fun:** Is it more fun to be the impostor or the crew? Most players report preferring impostor, but the crew outnumbers impostors 3-to-1 or more. How do you make the crew role compelling enough that players do not feel disappointed when they are not the impostor?
