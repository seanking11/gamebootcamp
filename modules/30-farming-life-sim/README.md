# Module 30: Farming / Life Sim
**Tend a farm, befriend a village, and never have enough hours in the day | Pixel Valley Farm**
> "A great farming sim makes Tuesday feel different from Saturday and spring feel different from winter — time is not a resource to spend but a season to live through."
---

## Prerequisites

| Module | What You'll Reuse |
|--------|-------------------|
| Module 7 — Roguelike | Grid-based world, inventory management, tile interaction |
| Module 5 — Puzzle | Grid logic, spatial placement, state per cell |

---

## Week 1: History & Design Theory

### The Origin

In 1996, Yasuhiro Wada created **Harvest Moon** because he missed the rural countryside after moving to Tokyo. The game was a quiet rebellion against the prevailing design philosophy that games needed conflict, enemies, and win states. Instead, Harvest Moon gave the player a neglected farm and a single year to restore it. You tilled soil, planted seeds, watered crops, and waited. Days passed. Seasons changed. The town had people with names, schedules, and opinions about you. You could give gifts to a villager and, over months of in-game time, they would warm to you. The game ended after a year, and your "score" was the life you had built — the farm, the friendships, the animals you raised. Harvest Moon proved that the loop of planting, waiting, and harvesting was deeply satisfying not because of its mechanical complexity but because it mirrored the rhythms of real life compressed into something manageable.

### How the Genre Evolved

**Harvest Moon (1996)** — Wada's original established every pillar the genre still rests on: a calendar with seasons, crops that grow over real in-game days, an energy system limiting daily actions, NPCs with relationship meters, and a farm that visibly transforms through sustained effort. The critical design insight was that progression was measured in days and seasons, not levels and experience points. The player did not "beat" Harvest Moon; they inhabited it.

**Animal Crossing (2001)** — Nintendo took the farming sim concept and removed the farm. Animal Crossing ran on the console's real-time clock — if it was Tuesday morning in real life, it was Tuesday morning in the game. Seasons changed with real months. Villagers remembered if you had not visited in weeks. The game introduced the idea that a life sim does not need productivity as its core loop; simply existing in a pleasant world, decorating your house, catching bugs, and chatting with neighbors was enough. Animal Crossing proved that the "life" half of "life sim" could carry an entire game without the "farming" half.

**Stardew Valley (2016)** — Eric "ConcernedApe" Barone, working alone for four years, synthesized everything the genre had learned and added what it lacked. Stardew Valley kept Harvest Moon's farming loop but added a crafting system, a dungeon-crawling mine, a deep NPC relationship system with unique storylines per character, and seasonal festivals. Most importantly, Barone understood pacing: the game gently pressured the player to prioritize by making days short and activities numerous. You could never do everything in one day, and that forced meaningful choices. Stardew Valley became the genre's modern benchmark by being both broader and deeper than its predecessors while remaining the work of a single developer — proof that the genre's core loop is achievable at small scale.

### What Makes It "Great"

A great farming sim creates the feeling that you are living a small life, and that small life matters. It does this through the accumulation of tiny rituals — watering crops each morning, checking which villager is at the store today, noticing that the trees changed color because autumn arrived. The calendar is the secret weapon: it creates natural deadlines (plant by spring 15 or miss the harvest), natural variety (summer crops differ from fall crops), and natural milestones (your first winter, your first year). The relationship system adds emotional texture — you are not just optimizing a farm, you are building a community. And the daily time limit forces the most compelling question in all of game design: "What do I do with today?"

### The Essential Mechanic

Managing limited time each day across competing priorities — farming, socializing, exploring, crafting.

---

## Week 2: Build the MVP

### What You're Building

A **single-season farming sim** where the player manages a small grid-based farm over 28 in-game days (one season). Each day has limited hours (6 AM to midnight). The player can till soil, plant seeds, water crops, harvest grown crops, sell produce for gold, give gifts to two NPCs to raise friendship levels, and craft basic items. Crops take varying numbers of days to grow. The day ends when time runs out or the player sleeps. After 28 days, the season ends and the game shows a summary: total gold earned, crops harvested, and friendship levels reached.

### Core Concepts

**1. Calendar / Time System**

The game tracks the current day (1-28), the time of day (600-2400 in game-minutes), and advances the calendar when the player sleeps. Each in-game minute passes at an accelerated rate during gameplay, and certain actions consume chunks of time. The calendar drives everything: crop growth, NPC schedules, and the end-of-season deadline.

```
// Calendar state
calendar = {
    day: 1,
    season: "spring",
    timeOfDay: 600,    // 6:00 AM — day starts here
    WAKE_TIME: 600,
    MIDNIGHT: 2400,
    DAYS_PER_SEASON: 28
}

function advanceTime(minutes):
    calendar.timeOfDay += minutes
    if calendar.timeOfDay >= calendar.MIDNIGHT:
        forcePlayerSleep()

function sleepAndAdvanceDay():
    calendar.day += 1
    calendar.timeOfDay = calendar.WAKE_TIME

    if calendar.day > calendar.DAYS_PER_SEASON:
        triggerSeasonEnd()
        return

    // Advance all time-based systems
    growCrops()
    advanceNPCSchedules()
    triggerDailyEvents(calendar.day)

function getFormattedTime():
    hours = floor(calendar.timeOfDay / 100)
    minutes = calendar.timeOfDay % 100
    period = hours >= 12 ? "PM" : "AM"
    return formatTime(hours, minutes, period)
```

*Why it matters:* The calendar transforms an open-ended sandbox into a game with rhythm and stakes. Without it, the player can do everything eventually and nothing matters. With it, every day is a scarce resource — plant too late and the crop will not mature before season's end. The calendar creates urgency without enemies.

**2. Crop Growth Timers**

Each crop has a growth timeline: planted, watered, and then advancing through growth stages over multiple days. A crop advances one stage per day only if it was watered that day. If the player forgets to water, the crop stalls. Different crops take different numbers of days to mature, creating a planning challenge: quick crops (3 days) give fast returns, slow crops (10+ days) are more valuable but riskier.

```
CROP_DATA = {
    "turnip":   {stages: 3, sellPrice: 60,  seedCost: 20},
    "potato":   {stages: 5, sellPrice: 120, seedCost: 40},
    "melon":    {stages: 8, sellPrice: 300, seedCost: 80}
}

function plantCrop(tile, cropType):
    if tile.state != TILLED:
        return false
    tile.crop = {
        type: cropType,
        currentStage: 0,
        maxStages: CROP_DATA[cropType].stages,
        wateredToday: false
    }
    return true

function waterCrop(tile):
    if tile.crop != null and not tile.crop.wateredToday:
        tile.crop.wateredToday = true

function growCrops():
    // Called once per day during sleepAndAdvanceDay()
    for each tile in farm.tiles:
        if tile.crop != null:
            if tile.crop.wateredToday:
                tile.crop.currentStage += 1
            tile.crop.wateredToday = false  // Reset for new day

function isHarvestable(tile):
    return tile.crop != null and tile.crop.currentStage >= tile.crop.maxStages

function harvestCrop(tile):
    if isHarvestable(tile):
        cropType = tile.crop.type
        tile.crop = null
        tile.state = TILLED
        return CROP_DATA[cropType].sellPrice
    return 0
```

*Why it matters:* Crop timers are the genre's signature mechanic. The delay between planting and harvesting creates anticipation, and the requirement to water daily creates a ritual. The player is not just clicking buttons — they are tending something that grows on its own schedule. When a melon finally ripens after eight days of careful watering, the payoff feels earned in a way that instant rewards never do.

**3. NPC Relationship / Affection System**

Each NPC has a friendship level (0-100) that increases when the player gives them gifts or talks to them daily. Different NPCs prefer different gifts. At certain friendship thresholds, new dialogue unlocks and special events trigger. The system rewards consistent, long-term investment in relationships over one-time grand gestures.

```
NPC_DATA = {
    "robin": {
        lovedGifts: ["melon"],
        likedGifts: ["turnip", "potato"],
        schedule: {morning: "home", afternoon: "shop", evening: "home"}
    },
    "sam": {
        lovedGifts: ["potato"],
        likedGifts: ["turnip"],
        schedule: {morning: "beach", afternoon: "town_square", evening: "home"}
    }
}

function giveGift(npc, item):
    if npc.giftReceivedToday:
        return "Already received a gift today"

    if item in NPC_DATA[npc.name].lovedGifts:
        npc.friendship += LOVED_GIFT_POINTS    // +20
    else if item in NPC_DATA[npc.name].likedGifts:
        npc.friendship += LIKED_GIFT_POINTS    // +10
    else:
        npc.friendship += NEUTRAL_GIFT_POINTS  // +2

    npc.friendship = clamp(npc.friendship, 0, 100)
    npc.giftReceivedToday = true
    removeFromInventory(player, item)

    checkFriendshipMilestones(npc)

function talkToNPC(npc):
    if not npc.talkedToToday:
        npc.friendship += TALK_POINTS  // +1
        npc.talkedToToday = true
    return getDialogue(npc, npc.friendship)

function checkFriendshipMilestones(npc):
    if npc.friendship >= 25 and not npc.milestone25:
        npc.milestone25 = true
        triggerEvent(npc.name + "_friendship_25")
    if npc.friendship >= 50 and not npc.milestone50:
        npc.milestone50 = true
        triggerEvent(npc.name + "_friendship_50")
```

*Why it matters:* The relationship system is what turns a farming game into a life sim. Crops are satisfying but impersonal. NPCs give the world emotional texture and give the player a reason to care about the world beyond profit. The daily gift-and-talk ritual competes directly with farming time, forcing the central prioritization dilemma the genre is built on.

**4. Daily Time Budget**

Each day runs from 6 AM to midnight. Actions consume time: watering one tile takes 10 minutes, walking across the farm takes time proportional to distance, giving a gift takes 30 minutes (including travel and conversation). The player can never do everything they want in one day. This scarcity is the game's core tension — not enemies or puzzles, but the clock.

```
// Time costs for actions
TIME_COSTS = {
    TILL:     20,   // minutes
    WATER:    10,
    PLANT:    15,
    HARVEST:  10,
    GIVE_GIFT: 30,
    TALK:     15,
    CRAFT:    45,
    TRAVEL_PER_TILE: 2
}

function performAction(action, tile=null):
    timeCost = TIME_COSTS[action]

    // Add travel time if needed
    if tile != null:
        distance = manhattanDistance(player.position, tile.position)
        timeCost += distance * TIME_COSTS.TRAVEL_PER_TILE

    if calendar.timeOfDay + timeCost > calendar.MIDNIGHT:
        return "Not enough time today"

    advanceTime(timeCost)
    executeAction(action, tile)
    return "Success"

function getRemainingActions():
    remaining = calendar.MIDNIGHT - calendar.timeOfDay
    // Show player approximately how many actions they can fit
    return {
        wateringsPossible: floor(remaining / TIME_COSTS.WATER),
        giftssPossible: floor(remaining / TIME_COSTS.GIVE_GIFT),
        hoursLeft: remaining / 100
    }
```

*Why it matters:* The daily time budget is the invisible hand that shapes every decision in a farming sim. It is what makes "What do I do today?" a meaningful question. Without it, the player optimizes everything simultaneously and the game becomes a checklist. With it, every day is a tiny strategy puzzle: water all crops and skip the gift, or let the far-field crops go dry to catch Robin before she leaves the shop?

**5. Crafting / Recipe System**

The player can combine items from their inventory to create new items using a recipe lookup table. Recipes are discovered by reaching friendship milestones or found as rewards. Crafting consumes time and ingredients but produces items that are more valuable or more useful than their components — a scarecrow from wood and fiber, a sprinkler from iron and stone.

```
RECIPES = {
    "scarecrow":  {ingredients: {"wood": 5, "fiber": 3}, result: "scarecrow",  unlocked: true},
    "sprinkler":  {ingredients: {"iron": 2, "stone": 3}, result: "sprinkler",  unlocked: false},
    "jam":        {ingredients: {"melon": 1, "sugar": 1}, result: "melon_jam", unlocked: false}
}

function canCraft(recipe, inventory):
    if not recipe.unlocked:
        return false
    for each ingredient, count in recipe.ingredients:
        if inventory.getCount(ingredient) < count:
            return false
    return true

function craft(recipeName, inventory):
    recipe = RECIPES[recipeName]
    if not canCraft(recipe, inventory):
        return null

    // Consume ingredients
    for each ingredient, count in recipe.ingredients:
        inventory.remove(ingredient, count)

    // Consume time
    advanceTime(TIME_COSTS.CRAFT)

    // Add result
    item = createItem(recipe.result)
    inventory.add(item)
    return item

function unlockRecipe(recipeName):
    RECIPES[recipeName].unlocked = true
    showNotification("New recipe learned: " + recipeName)
```

*Why it matters:* Crafting adds a second economy to the game. Gold is the obvious currency, but ingredients are the hidden one. That melon is worth 300 gold if you sell it, but it is also the key ingredient in melon jam (worth 500 gold) and Robin's loved gift (+20 friendship). Crafting forces the player to think about items not just as products but as resources with multiple competing uses.

**6. Seasonal Content**

The season determines which crops can be planted, what items appear in the shop, what the weather does, and which events trigger. In the MVP, there is one season (spring) with its own crop set, but the system is designed so that swapping in summer, fall, or winter means changing a data table, not rewriting code. Crops planted out of season die on day 1 of the new season.

```
SEASONAL_DATA = {
    "spring": {
        availableCrops: ["turnip", "potato"],
        weather: ["sunny", "sunny", "rainy", "sunny", "cloudy"],
        events: {day_5: "flower_festival", day_20: "egg_hunt"},
        shopInventory: ["turnip_seed", "potato_seed", "fertilizer"]
    },
    "summer": {
        availableCrops: ["melon", "tomato"],
        weather: ["sunny", "sunny", "sunny", "sunny", "thunderstorm"],
        events: {day_10: "beach_party", day_25: "fireworks"},
        shopInventory: ["melon_seed", "tomato_seed", "sprinkler"]
    }
}

function getSeasonData():
    return SEASONAL_DATA[calendar.season]

function isValidCropForSeason(cropType):
    return cropType in getSeasonData().availableCrops

function getWeather(day):
    weatherPattern = getSeasonData().weather
    return weatherPattern[day % weatherPattern.length]

function checkDailyEvent():
    events = getSeasonData().events
    eventKey = "day_" + calendar.day
    if eventKey in events:
        triggerFestival(events[eventKey])

function onSeasonChange():
    // Kill out-of-season crops
    for each tile in farm.tiles:
        if tile.crop != null:
            if not isValidCropForSeason(tile.crop.type):
                tile.crop = null  // Crop dies
```

*Why it matters:* Seasons give the game a macro-rhythm on top of the daily micro-rhythm. Days create urgency ("water before bed"); seasons create strategy ("I need to plant melons by summer day 5 to harvest before fall"). Seasonal content also keeps the game fresh — the world looks different, the shop sells different things, and different festivals break up the routine. One data table per season means content scales without code changes.

**7. Tool Upgrade Progression**

The player starts with basic tools (watering can waters one tile, hoe tills one tile). By spending gold and materials at the blacksmith, tools upgrade: a copper watering can waters three tiles in a row, a steel hoe tills a 3x3 area. Upgrades take two in-game days (the tool is unavailable while being upgraded), creating another time-management tradeoff.

```
TOOL_LEVELS = {
    "watering_can": [
        {level: "basic",  tilesAffected: 1, pattern: [[0,0]]},
        {level: "copper", tilesAffected: 3, pattern: [[0,0],[1,0],[2,0]]},
        {level: "steel",  tilesAffected: 9, pattern: [[-1,-1],[0,-1],[1,-1],
                                                       [-1,0],[0,0],[1,0],
                                                       [-1,1],[0,1],[1,1]]}
    ],
    "hoe": [
        {level: "basic",  tilesAffected: 1, pattern: [[0,0]]},
        {level: "copper", tilesAffected: 3, pattern: [[0,0],[1,0],[2,0]]},
        {level: "steel",  tilesAffected: 9, pattern: [[-1,-1],[0,-1],[1,-1],
                                                       [-1,0],[0,0],[1,0],
                                                       [-1,1],[0,1],[1,1]]}
    ]
}

UPGRADE_COSTS = {
    "copper": {gold: 500,  materials: {"copper_ore": 5}, daysToComplete: 2},
    "steel":  {gold: 1500, materials: {"iron_ore": 10},  daysToComplete: 2}
}

function upgradeTool(toolName, targetLevel):
    cost = UPGRADE_COSTS[targetLevel]
    if player.gold < cost.gold:
        return "Not enough gold"
    if not hasAllMaterials(player.inventory, cost.materials):
        return "Missing materials"

    player.gold -= cost.gold
    removeMaterials(player.inventory, cost.materials)
    player.tools[toolName].upgrading = true
    player.tools[toolName].readyOnDay = calendar.day + cost.daysToComplete

function useTool(toolName, targetTile):
    tool = player.tools[toolName]
    if tool.upgrading:
        return "Tool is being upgraded"

    level = TOOL_LEVELS[toolName][tool.currentLevel]
    for each offset in level.pattern:
        affectedTile = getTile(targetTile.x + offset[0], targetTile.y + offset[1])
        if affectedTile != null:
            applyToolEffect(toolName, affectedTile)
```

*Why it matters:* Tool upgrades are the farming sim's answer to the power curve. Early game, watering 20 tiles takes 20 actions and 200 minutes. Late game, the same task takes 3 actions and 30 minutes. This frees up time for the activities the player could not afford before — crafting, socializing, exploring. The two-day upgrade delay adds a strategic wrinkle: upgrade during a rainy stretch (when you do not need to water) to minimize the cost.

### Stretch Goals

- Add a mine or foraging area that the player can explore for crafting materials
- Implement weather effects (rain auto-waters crops, storms damage unharvested produce)
- Add a second season with different crops and events
- Create an animal husbandry system (buy a chicken, feed it daily, collect eggs)
- Add a shipping bin that sells items overnight with price fluctuations

### MVP Spec

| Component | Minimum Viable Version |
|-----------|----------------------|
| Grid | 12x12 farm plot with interactable tiles |
| Calendar | 28-day single season (spring), time from 6 AM to midnight |
| Crops | 3 types with different growth rates and values (turnip, potato, melon) |
| Daily Actions | Till, plant, water, harvest, give gift, talk, craft — each costs time |
| Inventory | 12-slot grid, items stack, drag to use |
| NPCs | 2 named characters with schedules, gift preferences, and friendship meters |
| Crafting | 3 recipes (1 unlocked from start, 2 unlocked via friendship) |
| Tools | Watering can and hoe, 1 upgrade tier (copper) |
| Economy | Sell crops for gold, buy seeds and upgrades |
| End State | Season ends after 28 days, summary screen shows stats |

### Deliverable

A playable single-season farming sim where the player manages a grid-based farm over 28 in-game days. Each day has a time budget that forces prioritization between farming tasks, NPC relationships, and crafting. Crops grow over multiple days with daily watering. Two NPCs respond to gifts and conversation with increasing friendship levels. The game demonstrates the core tension of the genre: there is always more to do than time allows, and every choice to do one thing is a choice not to do another.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|-------------|---------|
| Calendar / Time System | Like a cron scheduler — events trigger on specific dates, daily jobs run at "midnight" (day rollover), and the entire system is driven by a monotonically advancing clock |
| Crop Growth Timers | Like a multi-stage CI/CD pipeline — each stage must complete before the next begins, and a missed step (forgetting to water) blocks the pipeline until the next trigger |
| NPC Relationship System | Like a rate-limited API with persistent state — you can only interact once per "day," each interaction increments a counter, and at certain thresholds the API returns new response types |
| Daily Time Budget | Like a request timeout budget — each operation costs time from a shared pool, and when the budget is exhausted, remaining operations are dropped (you fall asleep) |
| Crafting / Recipe System | Like a dependency resolution system — a recipe declares its inputs, the system checks if all dependencies are available, consumes them, and produces the output artifact |
| Seasonal Content | Like feature flags driven by a deployment calendar — different configurations activate based on the current "season," swapping available endpoints and behaviors without changing core logic |
| Tool Upgrade Progression | Like scaling up infrastructure — a bigger server (better tool) processes more requests (tiles) per cycle, but the upgrade has downtime (two days at the blacksmith) |

### Frontend Developers

| Core Concept | Analogy |
|-------------|---------|
| Calendar / Time System | Like a scheduling component that drives conditional rendering — the current date determines which UI elements appear, which actions are available, and when transitions fire |
| Crop Growth Timers | Like a multi-step progress indicator — each stage is a visual state (seed, sprout, mature), and progression happens only when the user completes the required interaction (watering) each interval |
| NPC Relationship System | Like progressive disclosure in a UI — as the user engages more (friendship increases), new features and content unlock, revealing deeper layers of the interface |
| Daily Time Budget | Like a rate limiter on user actions — each interaction costs from a finite daily budget, and a progress bar shows remaining capacity, shaping how users prioritize their clicks |
| Crafting / Recipe System | Like a form with validation — each required field (ingredient) must be filled, and the submit button (craft) is disabled until all requirements are met |
| Seasonal Content | Like a theming system — the same components render with different styles, data, and assets based on the active theme (season), swapped via a context provider |
| Tool Upgrade Progression | Like upgrading from manual CSS to a utility framework — the same tasks get done with fewer keystrokes, freeing you to focus on layout and design instead of repetitive property declarations |

### Data / ML Engineers

| Core Concept | Analogy |
|-------------|---------|
| Calendar / Time System | Like a time-series index — all game events are keyed to a discrete timestamp (day number), enabling queries like "what happened on day 14" and aggregations like "total yield this season" |
| Crop Growth Timers | Like a training run with checkpoints — each epoch (day) advances the model (crop) one step, but only if the required data (water) was provided; missing data stalls training |
| NPC Relationship System | Like a recommendation system's user profile — each interaction updates the affinity score, and at certain score thresholds the system surfaces new content (events, dialogue) |
| Daily Time Budget | Like a compute budget for hyperparameter search — you have N GPU-hours (in-game hours) per trial (day), and you must decide which experiments (actions) to run given the constraint |
| Crafting / Recipe System | Like a data pipeline with transformation steps — raw inputs pass through a defined recipe (DAG) to produce a derived output, and missing upstream data blocks the pipeline |
| Seasonal Content | Like dataset versioning — each season is a different data split with its own distributions (crop types, event frequencies), and the model (player strategy) must adapt to each |
| Tool Upgrade Progression | Like scaling from single-GPU to multi-GPU training — the same operation processes more data per step, reducing wall-clock time without changing the underlying algorithm |

---

## Discussion Questions

1. **The Cozy Tension Paradox:** Farming sims are marketed as relaxing, but their core mechanic is time pressure — you literally cannot do everything in one day. How does Stardew Valley make scarcity feel gentle instead of stressful? What design techniques can you use to create urgency without anxiety?

2. **Content Depth vs. Breadth:** Your MVP has 3 crops and 2 NPCs. A full Stardew Valley has 40+ crops and 30+ NPCs. At what point does adding more content stop being "more game" and start being "more database"? How do you design a content pipeline that scales without requiring new code per item?

3. **The Gift Economy:** NPC relationship systems in farming sims are often criticized as transactional — "give person their favorite item, receive friendship points." How could you redesign the relationship system to feel more organic? What would a relationship system that responds to behavior patterns rather than item gifts look like?

4. **Real Time vs. Game Time:** Animal Crossing uses real-world time; Stardew Valley uses compressed game time. Each approach has profound implications for player behavior. What are the tradeoffs, and which would you choose for a mobile farming sim versus a PC farming sim? How does the time model affect monetization risk?
