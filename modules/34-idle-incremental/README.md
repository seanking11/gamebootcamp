# Module 34: Idle / Incremental
**Build a game that plays itself -- and keeps players coming back | The Joy of Watching Numbers Go Up**
> "The perfect idle game makes you feel clever for doing nothing."
---

## Prerequisites

- **Module 1: Pong** -- You need a working game loop (update/render cycle) and basic input handling. The idle game will push your loop to handle exponential state changes every tick.

## Week 1: History & Design Theory

### The Origin

The idle genre emerged from a satirical experiment. In 2013, French programmer Orteil released **Cookie Clicker** as a browser game built in a single weekend. The premise was absurdly simple: click a cookie to get cookies, then spend cookies on grandmas and factories that produce cookies for you. It was designed partly as a commentary on the dopamine loops in social and mobile games. Instead of being dismissed, Cookie Clicker went viral. Players found genuine satisfaction in watching their cookie count climb from dozens to millions to undecillions. The joke became a genre. What Orteil accidentally proved was that the core loop of resource accumulation -- stripped of story, art, and complex mechanics -- was inherently compelling. The numbers themselves were the game.

### How the Genre Evolved

- **Cookie Clicker (Orteil, 2013)** -- The spark. A browser game where clicking produces cookies, and cookies buy buildings that produce more cookies automatically. Cookie Clicker introduced the prestige system ("ascension") where players could reset all progress in exchange for permanent heavenly chips that multiplied future production. This reset mechanic became the defining structural innovation of the genre, giving players a reason to start over and a sense of meta-progression beyond the raw numbers.

- **Adventure Capitalist (Hyper Hippo, 2015)** -- Took the idle formula to mobile and introduced streamlined prestige ("angel investors") and a clear visual hierarchy of businesses. Adventure Capitalist proved the genre worked on phones -- a platform where players naturally check in for short sessions. Its clean UI and intuitive tap-to-upgrade flow became a template for commercial idle games. It also demonstrated that idle games could sustain monetization through time-skip purchases without destroying balance.

- **Melvor Idle (Brendan Malcolm, 2021)** -- Combined idle mechanics with deep RPG systems inspired by RuneScape. Players train skills, fight monsters, and collect gear -- all while the game runs in the background. Melvor proved that idle mechanics could serve as the engine beneath complex, content-rich game systems. It showed the genre maturing beyond simple clickers into something with genuine strategic depth and hundreds of hours of progression.

### What Makes It "Great"

A great idle game respects the player's time while making them feel like a genius optimizer. The initial click-to-earn phase gives way to an automated economy where the player becomes a strategist, choosing which upgrades to buy, when to prestige, and how to allocate scarce multipliers. The tension between patience and action -- do you reset now for a small boost or grind longer for a bigger one -- creates real decision-making. The best idle games layer systems so that each prestige reveals new mechanics, keeping discovery alive long after the first cookie. And the numbers must feel good: watching "1.23e15" tick up to "1.24e15" should feel like progress, which means growth curves, formatting, and pacing all have to be carefully tuned.

### The Essential Mechanic

Purchasing upgrades that increase the rate of resource generation -- numbers go up.

---

## Week 2: Build the MVP

### What You're Building

A single-screen idle game where the player clicks to earn a primary currency, purchases generators that produce currency automatically, buys upgrades that multiply production rates, and can prestige to reset progress in exchange for a permanent multiplier. The game calculates offline progress when the player returns after being away.

### Core Concepts

**1. Exponential Growth Modeling**

Numbers in an idle game grow exponentially. A generator producing 1 unit per second seems slow, but with multiplicative upgrades it quickly reaches millions, billions, and beyond. You need to model this growth, format large numbers for display, and ensure your math stays stable at extreme scales.

```
// Growth per tick
function calculateProduction(generators, upgrades):
    total = 0
    for each generator in generators:
        base_rate = generator.base_production * generator.count
        multiplier = getMultiplierFromUpgrades(upgrades, generator.type)
        total += base_rate * multiplier
    return total

// Large number formatting
function formatNumber(n):
    if n < 1000:
        return toString(n, 1 decimal)
    if n < 1_000_000:
        return toString(n / 1000, 2 decimals) + "K"
    if n < 1_000_000_000:
        return toString(n / 1_000_000, 2 decimals) + "M"
    // ...continue for B, T, Qa, Qi...
    // Or use scientific notation:
    exponent = floor(log10(n))
    mantissa = n / (10 ^ exponent)
    return toString(mantissa, 2 decimals) + "e" + exponent
```

**Why it matters:** The entire feel of the game depends on growth pacing. Too slow and the player leaves. Too fast and there is no tension. Formatting matters because "1.23 Trillion" communicates progress better than "1234567890123."

**2. Prestige / Reset Loop**

The prestige system lets the player voluntarily reset most progress in exchange for a permanent multiplier. This creates a meta-progression layer: each run is faster than the last, and the player must decide the optimal moment to reset.

```
// Calculate prestige currency earned on reset
function calculatePrestigeReward(lifetimeEarnings, currentPrestigeCurrency):
    // Diminishing returns via square root or logarithm
    raw = floor(sqrt(lifetimeEarnings / PRESTIGE_THRESHOLD))
    reward = raw - currentPrestigeCurrency
    return max(0, reward)

// Apply prestige multiplier to all production
function getPrestigeMultiplier(prestigeCurrency):
    return 1 + (prestigeCurrency * PRESTIGE_BONUS_PER_POINT)

// Execute prestige reset
function prestige(gameState):
    reward = calculatePrestigeReward(gameState.lifetimeEarnings, gameState.prestigeCurrency)
    if reward <= 0:
        return  // not worth it yet
    gameState.prestigeCurrency += reward
    gameState.currency = 0
    gameState.generators = resetAllToZero()
    gameState.upgrades = resetNonPermanent()
    // prestigeCurrency persists across resets
```

**Why it matters:** Without prestige, the game is a straight line that eventually plateaus. The reset loop turns it into a spiral: each cycle is a fresh start with a permanent advantage, creating "just one more run" compulsion and making early-game content replayable.

**3. Offline Progress Calculation**

When the player closes the game and returns later, you calculate what would have happened in their absence. This is what makes an idle game idle -- progress does not require the player to be present.

```
function calculateOfflineProgress(gameState, lastSaveTimestamp):
    now = getCurrentTime()
    elapsedSeconds = (now - lastSaveTimestamp) / 1000

    // Cap offline time to prevent absurd jumps
    elapsedSeconds = min(elapsedSeconds, MAX_OFFLINE_SECONDS)

    // Simple: assume constant production rate during absence
    productionPerSecond = calculateProduction(gameState.generators, gameState.upgrades)
    offlineEarnings = productionPerSecond * elapsedSeconds

    // Optional: apply offline efficiency penalty (e.g., 50%)
    offlineEarnings = offlineEarnings * OFFLINE_EFFICIENCY

    gameState.currency += offlineEarnings
    gameState.lastSaveTimestamp = now
    return offlineEarnings  // show "Welcome back! You earned X while away"
```

**Why it matters:** Offline progress is the hook that brings players back. The "welcome back" screen showing accumulated earnings is one of the most satisfying moments in an idle game. It also means your game is always running in the player's mind even when it is not on screen.

**4. Upgrade Economy**

Upgrades are the player's primary decisions. Some increase production rates, some reduce costs, and all use cost-scaling formulas so each successive purchase is more expensive, creating natural pacing.

```
// Cost scaling: each purchase costs more
function getGeneratorCost(baseCost, owned, growthRate):
    return floor(baseCost * (growthRate ^ owned))
    // e.g., baseCost=10, growthRate=1.15
    // 0 owned: 10, 1 owned: 11, 5 owned: 20, 20 owned: 163

// Upgrade types
UPGRADE_TYPES:
    PRODUCTION_MULTIPLIER:  // "Grandmas are 2x more efficient"
        apply: generator.multiplier *= upgrade.value
    COST_REDUCTION:         // "Factories cost 25% less"
        apply: generator.costMultiplier *= (1 - upgrade.value)
    GLOBAL_MULTIPLIER:      // "All production x3"
        apply: globalMultiplier *= upgrade.value
    CLICK_POWER:            // "Each click produces 10x more"
        apply: clickValue *= upgrade.value

// Purchase logic
function buyUpgrade(gameState, upgradeId):
    upgrade = UPGRADES[upgradeId]
    if gameState.currency >= upgrade.cost AND meetsRequirements(upgrade):
        gameState.currency -= upgrade.cost
        applyUpgrade(gameState, upgrade)
        upgrade.purchased = true
```

**Why it matters:** The upgrade tree is where strategy lives. Players must choose between spending currency on more generators (linear scaling) or saving for an upgrade that multiplies existing output (multiplicative scaling). This decision space is what separates a thoughtful idle game from a mindless clicker.

**5. Multiple Currency / Generator Tiers**

Layered generators create depth: Tier 1 generates currency, Tier 2 generates Tier 1 generators, Tier 3 generates Tier 2 generators. Each tier adds an exponential layer to growth.

```
// Generator tiers: each tier produces the tier below it
GENERATORS:
    tier1_cursor:      { produces: "currency",      base_rate: 0.1 }
    tier2_grandma:     { produces: "currency",      base_rate: 1 }
    tier3_factory:     { produces: "currency",      base_rate: 8 }
    tier4_bank:        { produces: "currency",      base_rate: 47 }
    // OR: generators that produce generators
    tier1_worker:      { produces: "gold",           base_rate: 1 }
    tier2_manager:     { produces: "tier1_worker",   base_rate: 0.1 }
    tier3_executive:   { produces: "tier2_manager",  base_rate: 0.01 }

// Tick update with tiered production
function updateGenerators(generators, deltaTime):
    // Process from highest tier down
    for tier from highest to lowest:
        production = generators[tier].count * generators[tier].base_rate * deltaTime
        production *= getAllMultipliers(tier)
        if generators[tier].produces == "currency":
            gameState.currency += production
        else:
            targetTier = generators[tier].produces
            generators[targetTier].count += production  // fractional counts OK
```

**Why it matters:** Tiers give the player something new to work toward. When the current tier plateaus, unlocking the next tier resets the feeling of rapid growth. This is how idle games sustain engagement over days and weeks -- there is always a new layer to discover.

**6. Big Number Library**

Standard floating-point numbers lose precision around 2^53. Idle games routinely exceed this. You need a strategy for handling numbers that go to 1e308 and beyond.

```
// Option A: Use built-in BigInt (integer only, no decimals)
let currency = BigInt(0)
currency += BigInt(1000000000000000)

// Option B: Custom large number as {mantissa, exponent}
class BigNumber:
    mantissa: float   // 1.0 to 9.999...
    exponent: integer // power of 10

    function add(other):
        if this.exponent > other.exponent + 15:
            return this  // other is negligible
        diff = this.exponent - other.exponent
        newMantissa = this.mantissa + other.mantissa / (10 ^ diff)
        return normalize(newMantissa, this.exponent)

    function multiply(other):
        newMantissa = this.mantissa * other.mantissa
        newExponent = this.exponent + other.exponent
        return normalize(newMantissa, newExponent)

    function normalize(mantissa, exponent):
        while mantissa >= 10:
            mantissa /= 10
            exponent += 1
        while mantissa < 1 AND mantissa > 0:
            mantissa *= 10
            exponent -= 1
        return BigNumber(mantissa, exponent)

    function toString():
        return formatNumber(mantissa, exponent)  // "1.23e456"
```

**Why it matters:** When your player reaches 1e100 cookies and buys something that costs 9.7e99, the subtraction must be correct. Floating-point errors at these scales will break the game. A big number system is invisible infrastructure -- players never think about it, but everything collapses without it.

**7. Engagement Without Active Gameplay**

An idle game must reward players for returning without punishing them for leaving. Milestones, unlocks, and notifications create a rhythm of check-ins that feels rewarding rather than demanding.

```
// Milestone system
MILESTONES:
    { threshold: 1e6,   reward: "Unlock Factories",     message: "Millionaire!" }
    { threshold: 1e9,   reward: "Unlock Banks",          message: "Billionaire!" }
    { threshold: 1e12,  reward: "Unlock Prestige",       message: "Transcendent!" }

function checkMilestones(gameState):
    for each milestone in MILESTONES:
        if gameState.lifetimeEarnings >= milestone.threshold AND NOT milestone.claimed:
            milestone.claimed = true
            applyReward(gameState, milestone.reward)
            showNotification(milestone.message)

// Notification scheduling (for mobile/web push)
function scheduleReturnReminder(gameState):
    productionRate = calculateProduction(gameState)
    timeToNextMilestone = (nextMilestone.threshold - gameState.currency) / productionRate
    scheduleNotification(
        time: timeToNextMilestone,
        message: "Your generators have been busy! Come collect your earnings."
    )

// Welcome back screen
function onGameResume(gameState):
    offlineEarnings = calculateOfflineProgress(gameState)
    milestonesReached = getNewMilestones(gameState)
    showWelcomeBack(offlineEarnings, milestonesReached)
```

**Why it matters:** The idle game's primary competitor is every other app on the player's device. If there is no reason to come back, the player forgets the game exists. Milestones, unlocks, and well-timed notifications create a positive habit loop without making the game feel like a chore.

### Stretch Goals

- Add multiple prestige layers (prestige currency that can itself be prestiged).
- Implement an achievement system with hidden achievements that grant bonuses.
- Add a simple visual representation of generators (animated sprites or progress bars).
- Create an "ascension tree" where prestige currency is spent on permanent perks.
- Implement a statistics page tracking lifetime earnings, time played, total clicks, and prestiges.
- Add a "buy max" button that calculates how many generators the player can afford at once.

### MVP Spec

| Element | Scope |
|---|---|
| **Screen** | Single screen: currency display at top, click button, generator list, upgrade panel, prestige button |
| **Currency** | One primary currency (e.g., "coins"), one prestige currency (e.g., "gems") |
| **Generators** | 3-4 tiers, each with base production rate and scaling cost |
| **Upgrades** | 4-6 purchasable upgrades that multiply generator output |
| **Prestige** | One prestige loop: reset generators and upgrades, keep prestige currency, gain permanent multiplier |
| **Offline progress** | On load, calculate elapsed time and award earnings at current rate |
| **Big numbers** | Implement mantissa/exponent notation or use BigInt for currency values |
| **Display** | Format numbers with suffixes (K, M, B, T) or scientific notation above 1e15 |
| **Save system** | Auto-save to local storage every 30 seconds; load on startup |
| **Click action** | Manual click awards a base amount modified by click upgrades |

### Deliverable

A playable idle game where the player can click to earn currency, purchase at least three tiers of generators, buy upgrades that multiply production, prestige to reset with a permanent bonus, and return after closing the game to find offline earnings waiting. Numbers must scale cleanly into the billions and beyond. The game should be engaging enough that a playtester wants to check back after 10 minutes away.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Exponential growth modeling | Like modeling compound interest in a financial API -- small rates create enormous values over time, and you must handle precision at scale |
| Prestige / reset loop | Like database migration rollbacks with schema versioning -- you start fresh but carry forward structural improvements |
| Offline progress calculation | Like a batch job that runs overnight -- calculate the result of N seconds of processing without actually ticking N times |
| Upgrade economy | Like capacity planning for servers -- invest in horizontal scaling (more instances) or vertical scaling (bigger instances), each with different cost curves |
| Multiple currency / generator tiers | Like microservice dependencies -- Service A feeds Service B feeds Service C, and throughput at each tier compounds |
| Big number library | Like arbitrary-precision arithmetic in financial systems -- when double is not enough, you build or import a decimal library |
| Engagement without active gameplay | Like webhook notifications and scheduled cron jobs -- events fire on meaningful state changes rather than constant polling |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Exponential growth modeling | Like DOM node counts in a poorly optimized recursive component -- small inputs create enormous outputs, and you must format them for human readability |
| Prestige / reset loop | Like clearing local storage and refreshing the app but keeping your user preferences -- a clean start with accumulated wisdom |
| Offline progress calculation | Like service worker background sync -- computing what happened while the tab was closed and reconciling state on return |
| Upgrade economy | Like choosing npm packages for a build pipeline -- each dependency has a cost (bundle size) and a benefit (productivity), and you weigh tradeoffs |
| Multiple currency / generator tiers | Like component composition -- a Page contains Sections, Sections contain Cards, Cards contain Buttons, and changes cascade through the hierarchy |
| Big number library | Like handling internationalization of numbers -- different locales, different formats, and the need for a library when native support falls short |
| Engagement without active gameplay | Like push notifications and badge counts -- drawing the user back to the app with meaningful, non-spammy signals |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Exponential growth modeling | Like tracking model training loss on a log scale -- exponential curves are natural, and visualization requires careful axis scaling |
| Prestige / reset loop | Like hyperparameter tuning across training runs -- each run resets weights but carries forward knowledge about what configuration works |
| Offline progress calculation | Like computing batch inference results -- given inputs and a model, calculate the output for a time window without step-by-step simulation |
| Upgrade economy | Like feature engineering investment -- spending compute on a new feature (upgrade) that multiplicatively improves model performance versus just adding more training data (generators) |
| Multiple currency / generator tiers | Like data pipeline DAGs -- raw data feeds feature extraction, which feeds model training, which feeds prediction serving, each tier amplifying the one below |
| Big number library | Like numerical stability in deep learning -- overflow, underflow, and precision loss are constant threats, handled with log-space computation or mixed precision |
| Engagement without active gameplay | Like automated model monitoring dashboards and alerts -- the pipeline runs unattended, but meaningful anomalies trigger human review |

---

## Discussion Questions

1. **Balancing patience and impatience:** Idle games must be satisfying when the player is actively watching AND when they return after hours away. How do you tune production rates so that active play feels rewarding but offline progress does not make active play feel pointless?

2. **The ethics of engagement loops:** Idle games use the same psychological hooks as slot machines and social media feeds (variable reward schedules, loss aversion via reset decisions, notification-driven re-engagement). Where is the line between a well-designed game and a manipulative one? How would you design an idle game that respects the player's time?

3. **Numbers as content:** Most games have art, story, or level design as their primary content. In an idle game, the numbers themselves -- their growth rate, their formatting, the moment a new suffix appears -- ARE the content. What does this teach us about what makes any game feel like it has "progression"?

4. **Computational shortcuts:** Your offline calculation assumes a constant production rate, but in reality the player might have hit milestones or unlocked upgrades during that time. How would you model offline progress more accurately without simulating every tick? What tradeoffs exist between accuracy and performance?
