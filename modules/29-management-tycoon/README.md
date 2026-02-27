# Module 29: Management / Tycoon
**Build and run a business where every system pulls against every other | Theme Park Tycoon**
> "The player should feel like a plate-spinner at the circus — the moment one plate is stable, two others start wobbling."
---

## Prerequisites

| Module | What You'll Reuse |
|--------|-------------------|
| Module 6 — Tower Defense | Economy loops, income/expense balancing, entity pathing |
| Module 5 — Puzzle | Grid-based placement, spatial reasoning |

---

## Week 1: History & Design Theory

### The Origin

The management genre was born from a single question Will Wright asked in 1989: what if the player was not a character inside the world but the invisible hand shaping it? **SimCity** gave players a blank grid and a budget, then let them zone residential, commercial, and industrial areas while watching simulated citizens — "Sims" — move in, commute, complain, and leave. There was no win condition. The game was the system itself, and the joy came from watching your decisions ripple through interconnected feedback loops: build too many factories and pollution drives residents away; build too few and unemployment rises. Wright called it a "software toy," and it invented an entire genre by proving that watching a system respond to your choices could be just as compelling as any action sequence.

### How the Genre Evolved

**SimCity (1989)** — Will Wright established the template: a grid-based world, zoning mechanics, budgets, and a simulation that runs on its own while the player nudges it with infrastructure decisions. The key innovation was that the city felt alive. Traffic jams, fires, and crime emerged not from scripts but from the interplay of systems. SimCity proved that "management" could mean designing the rules a world lives by, not micromanaging every actor.

**RollerCoaster Tycoon (1999)** — Chris Sawyer, working almost entirely in assembly language, narrowed the scope from an entire city to a single theme park and deepened every system. Guests had individual needs — hunger, thirst, nausea, excitement — and would pathfind to rides, food stalls, and bathrooms based on those needs. The financial model was razor-sharp: ride ticket prices, staff wages, loan interest, and guest satisfaction all fed into a cash flow that could tip into bankruptcy if you overborrowed. Sawyer showed that a tighter scope with deeper simulation could be more compelling than a broader one.

**Two Point Hospital (2018)** — Two Point Studios modernized the tycoon formula with clarity of information. The game features humorous fictional diseases, but underneath the comedy lies a serious management simulation: room layouts affect staff efficiency, patient flow creates bottlenecks, training staff takes them off the floor temporarily, and reputation attracts harder cases. The breakthrough was in UI design — overlays, graphs, and dashboards that made the simulation legible to the player without dumbing it down. Two Point Hospital proved that the genre's biggest design challenge is not the simulation itself but communicating it.

### What Makes It "Great"

A great management game creates a web of systems where every decision has second-order consequences. Hiring more staff costs money, which means raising prices, which lowers satisfaction, which reduces visitors, which reduces income. The player is constantly triangulating between competing pressures, and the game never tells them the "right" answer — it just shows them the results. The best tycoon games feel like they are running a real business: you are never "done," there is always a metric that could be better, and the satisfaction comes from watching your carefully tuned machine hum along — until some new variable throws everything off balance.

### The Essential Mechanic

Balancing interconnected systems where optimizing one often worsens another.

---

## Week 2: Build the MVP

### What You're Building

A **Mini Theme Park Tycoon** played on a grid. The player places attractions (rides, food stalls, restrooms) using a budget. Visitors arrive, pathfind to attractions based on their needs, queue up, get served, gain or lose satisfaction, and eventually leave. The player earns income from ticket sales and stall purchases, pays maintenance costs, and must keep satisfaction high enough to attract more visitors. The game runs at selectable speed (1x, 2x, 4x). If cash drops below zero, the park goes bankrupt and the game ends. A simple dashboard displays visitor count, average satisfaction, and cash flow.

### Core Concepts

**1. Simulation Loop**

Entities (visitors) have internal needs and behaviors that tick forward each update cycle. Every frame (or fixed timestep), each visitor evaluates its current state — hungry, bored, needs restroom — and acts on the most pressing need. The simulation loop is the heartbeat of the entire game; everything else hangs off it.

```
// Simulation loop — runs every tick
function simulationTick(deltaTime, speedMultiplier):
    scaledDelta = deltaTime * speedMultiplier

    // Spawn new visitors based on park reputation
    if shouldSpawnVisitor(park.reputation):
        visitor = createVisitor(park.entrance)
        park.visitors.add(visitor)

    for each visitor in park.visitors:
        // Needs decay over time
        visitor.hunger += HUNGER_RATE * scaledDelta
        visitor.boredom += BOREDOM_RATE * scaledDelta
        visitor.bladder += BLADDER_RATE * scaledDelta

        updateVisitorBehavior(visitor, scaledDelta)

    // Update all facility queues
    for each facility in park.facilities:
        processFacilityQueue(facility, scaledDelta)

    // Financial tick
    park.cash += calculateIncome(scaledDelta)
    park.cash -= calculateExpenses(scaledDelta)

    if park.cash < 0:
        triggerBankruptcy()
```

*Why it matters:* The simulation loop is what makes a management game feel alive. Without it, placing buildings on a grid is just a puzzle. With it, the grid becomes a living system that responds to your design choices in ways you did not fully anticipate.

**2. Satisfaction / Demand Modeling**

Visitor happiness is a function of multiple weighted inputs. Each visitor tracks individual satisfaction based on how well their needs are being met, wait times, prices, and variety. Aggregate satisfaction becomes the park's reputation, which controls visitor inflow. This is the core feedback loop that connects every system in the game.

```
function calculateVisitorSatisfaction(visitor):
    satisfaction = BASE_SATISFACTION

    // Penalize unmet needs
    if visitor.hunger > HUNGER_THRESHOLD:
        satisfaction -= (visitor.hunger - HUNGER_THRESHOLD) * HUNGER_PENALTY
    if visitor.boredom > BOREDOM_THRESHOLD:
        satisfaction -= (visitor.boredom - BOREDOM_THRESHOLD) * BOREDOM_PENALTY
    if visitor.bladder > BLADDER_THRESHOLD:
        satisfaction -= (visitor.bladder - BLADDER_THRESHOLD) * BLADDER_PENALTY

    // Penalize long waits
    satisfaction -= visitor.totalWaitTime * WAIT_PENALTY

    // Bonus for variety of rides visited
    uniqueRides = countUniqueRidesVisited(visitor)
    satisfaction += uniqueRides * VARIETY_BONUS

    return clamp(satisfaction, 0, 100)

function updateParkReputation(park):
    totalSat = sum(visitor.satisfaction for visitor in park.visitors)
    park.reputation = totalSat / park.visitors.length
```

*Why it matters:* Satisfaction modeling is what transforms a placement game into a management game. When the player realizes that cheap food lowers wait times but tanks satisfaction from quality, and expensive food raises satisfaction but creates longer queues — that is the moment they start truly managing.

**3. Placement and Zoning**

The player places facilities on a grid, and each facility has a zone of influence — a radius within which visitors can detect and navigate toward it. Placement is the player's primary verb: where you put things determines traffic flow, queue lengths, and whether visitors can find what they need before frustration sets in.

```
function placeFacility(grid, facility, gridX, gridY):
    // Check if cells are available
    for dx in range(facility.width):
        for dy in range(facility.height):
            if grid[gridX + dx][gridY + dy].occupied:
                return PLACEMENT_BLOCKED

    // Place on grid
    for dx in range(facility.width):
        for dy in range(facility.height):
            grid[gridX + dx][gridY + dy].occupied = true
            grid[gridX + dx][gridY + dy].facility = facility

    facility.position = (gridX, gridY)

    // Register zone of influence
    for each cell in getCellsInRadius(gridX, gridY, facility.influenceRadius):
        cell.nearbyFacilities.add(facility)

    park.cash -= facility.buildCost
    return PLACEMENT_SUCCESS

function findNearestFacility(visitor, facilityType):
    currentCell = grid[visitor.gridX][visitor.gridY]
    candidates = currentCell.nearbyFacilities.filter(f => f.type == facilityType)
    if candidates.isEmpty():
        // Expand search to full park
        candidates = park.facilities.filter(f => f.type == facilityType)
    return candidates.sortByDistance(visitor.position).first()
```

*Why it matters:* Placement is the player's primary design tool. The grid is not just a container — it is the canvas the player paints on. Good placement reduces visitor walking time, prevents bottlenecks, and creates natural flow. Bad placement creates frustrated visitors wandering past empty stalls to reach the one overloaded food court.

**4. Financial Model**

Income and expenses flow continuously. Rides generate ticket revenue per visitor served, food stalls earn per sale, and the park pays maintenance costs per facility per tick. The player can adjust prices, but higher prices reduce visitor satisfaction. Cash flow is displayed in real time, and if cash hits zero, the game ends. The financial model turns every design decision into a cost-benefit analysis.

```
function calculateIncome(scaledDelta):
    income = 0
    for each facility in park.facilities:
        if facility.type == RIDE:
            income += facility.visitorsServedThisTick * facility.ticketPrice
        else if facility.type == FOOD_STALL:
            income += facility.salesThisTick * facility.itemPrice
    // Entry fee per new visitor
    income += park.newVisitorsThisTick * park.entryFee
    return income

function calculateExpenses(scaledDelta):
    expenses = 0
    for each facility in park.facilities:
        expenses += facility.maintenanceCost * scaledDelta
    return expenses

function canAfford(cost):
    return park.cash >= cost

// Display cash flow
function getCashFlowPerMinute():
    return (recentIncome - recentExpenses) / timeWindow
```

*Why it matters:* The financial model is the constraint that makes placement meaningful. Without money, placing buildings is free and the game is trivial. With a budget, every ride is an investment that must pay for itself, and the player must think about return on investment — not just satisfaction.

**5. Time Acceleration**

The player can toggle simulation speed between 1x, 2x, and 4x. This is implemented by multiplying the delta time passed to the simulation loop. The key challenge is ensuring that nothing breaks at higher speeds — visitors should not teleport through walls, queues should not overflow, and financial calculations should not drift. Time acceleration respects the player's time while keeping the simulation deterministic.

```
// Speed settings
SPEED_OPTIONS = [1.0, 2.0, 4.0]
currentSpeedIndex = 0

function setSpeed(index):
    currentSpeedIndex = index

function getSpeedMultiplier():
    return SPEED_OPTIONS[currentSpeedIndex]

// In the main game loop
function gameLoop(deltaTime):
    multiplier = getSpeedMultiplier()

    // Cap scaled delta to prevent physics explosions
    scaledDelta = min(deltaTime * multiplier, MAX_TICK_DELTA)

    // If speed is very high, run multiple sub-ticks
    if scaledDelta > TICK_THRESHOLD:
        subTicks = ceil(scaledDelta / TICK_THRESHOLD)
        subDelta = scaledDelta / subTicks
        for i in range(subTicks):
            simulationTick(subDelta)
    else:
        simulationTick(scaledDelta)

    renderFrame()  // Render always runs at normal speed
```

*Why it matters:* Management games involve waiting — waiting for visitors to arrive, waiting for cash to accumulate, waiting for problems to emerge. Time acceleration lets the player skip the boring parts while maintaining the simulation's integrity. The sub-tick approach prevents the classic bug where a 4x speed visitor "teleports" past a food stall they should have stopped at.

**6. UI for Complex Systems**

A management game lives or dies by its information architecture. The player must be able to see park-wide stats (total visitors, cash, reputation) at a glance, drill down into individual facility performance, and spot problems before they cascade. The MVP needs at minimum: a top bar with cash, visitor count, and reputation; a selected-facility panel showing queue length and revenue; and color-coded overlays on the grid showing satisfaction zones.

```
function renderDashboard(park):
    // Top bar — always visible
    drawText("Cash: $" + formatNumber(park.cash), TOP_BAR_Y)
    drawText("Visitors: " + park.visitors.length, TOP_BAR_Y)
    drawText("Reputation: " + round(park.reputation) + "%", TOP_BAR_Y)

    // Cash flow indicator (green if positive, red if negative)
    cashFlow = getCashFlowPerMinute()
    color = cashFlow >= 0 ? GREEN : RED
    drawText(formatCashFlow(cashFlow) + "/min", TOP_BAR_Y, color)

function renderSatisfactionOverlay(grid):
    for each cell in grid:
        if cell.hasVisitors():
            avgSat = averageSatisfaction(cell.visitors)
            // Green = happy, Yellow = neutral, Red = unhappy
            overlayColor = lerpColor(RED, GREEN, avgSat / 100)
            drawCellOverlay(cell.x, cell.y, overlayColor, alpha=0.4)

function renderFacilityPanel(facility):
    drawPanel("Selected: " + facility.name)
    drawText("Queue: " + facility.queue.length + "/" + facility.maxQueue)
    drawText("Revenue: $" + facility.totalRevenue)
    drawText("Maintenance: $" + facility.maintenanceCost + "/min")
    drawText("Profit: $" + (facility.totalRevenue - facility.totalMaintenance))
```

*Why it matters:* The simulation can be deep and accurate, but if the player cannot read it, they cannot play it. UI is not a cosmetic layer — it is the player's primary interface with the simulation. Two Point Hospital's breakthrough was not a better simulation than Theme Hospital; it was a better dashboard. Information architecture determines whether a management game feels strategic or opaque.

**7. Emergent Behavior from Simple Rules**

Each visitor follows simple individual rules — find the nearest facility that satisfies my most pressing need, walk there, queue, get served, repeat. No single visitor is interesting. But when hundreds of visitors follow these rules simultaneously, patterns emerge that the designer never explicitly coded: traffic jams near popular rides, "dead zones" where no one walks, rush-hour surges at food stalls after a long ride lets out. Emergent behavior is the reward for building a proper simulation.

```
function updateVisitorBehavior(visitor, scaledDelta):
    switch visitor.state:
        case ENTERING:
            visitor.target = park.entrance
            moveToward(visitor, visitor.target, scaledDelta)
            if arrived(visitor, visitor.target):
                visitor.state = DECIDING

        case DECIDING:
            need = getMostPressingNeed(visitor)
            // need returns: {type: "ride"|"food"|"restroom", urgency: float}
            facility = findNearestFacility(visitor, need.type)
            if facility != null:
                visitor.target = facility
                visitor.state = WALKING
            else:
                visitor.satisfaction -= NO_FACILITY_PENALTY
                visitor.state = LEAVING

        case WALKING:
            moveToward(visitor, visitor.target.position, scaledDelta)
            if arrived(visitor, visitor.target.position):
                visitor.state = QUEUING
                visitor.target.queue.add(visitor)

        case QUEUING:
            visitor.waitTime += scaledDelta
            // Visitors leave queue if wait is too long
            if visitor.waitTime > MAX_WAIT_TOLERANCE:
                visitor.target.queue.remove(visitor)
                visitor.satisfaction -= LONG_WAIT_PENALTY
                visitor.state = DECIDING

        case BEING_SERVED:
            // Handled by facility processing
            pass

        case LEAVING:
            moveToward(visitor, park.exit, scaledDelta)
            if arrived(visitor, park.exit):
                park.visitors.remove(visitor)

function getMostPressingNeed(visitor):
    needs = [
        {type: "food",     urgency: visitor.hunger},
        {type: "ride",     urgency: visitor.boredom},
        {type: "restroom", urgency: visitor.bladder}
    ]
    return needs.sortBy(n => n.urgency).last()
```

*Why it matters:* Emergent behavior is the magic of management games. The designer builds simple rules; the player discovers complex patterns. When a player notices that visitors leaving the roller coaster always flood the nearby food stall, they did not read that in a tutorial — they observed it in the simulation. That moment of discovery is what separates a management game from a spreadsheet.

### Stretch Goals

- Add a loan system where the player can borrow money at interest to fund expansion
- Implement staff entities (janitors, mechanics) that must be hired and routed to facilities
- Add random events (rainstorm lowers outdoor ride satisfaction, VIP visitor with high expectations)
- Create a mini-map overlay showing real-time traffic heatmaps
- Add sound effects that change with park activity level (crowd noise, ride sounds)

### MVP Spec

| Component | Minimum Viable Version |
|-----------|----------------------|
| Grid | 16x16 tile map, camera can pan |
| Facilities | 3 types: Ride (cures boredom), Food Stall (cures hunger), Restroom (cures bladder) |
| Visitors | Spawn at entrance, pathfind to needs, queue, get served, leave |
| Needs System | Hunger, boredom, bladder — each decays over time |
| Satisfaction | Per-visitor score based on needs met, wait times, variety |
| Reputation | Average satisfaction drives visitor spawn rate |
| Financial Model | Entry fee + per-use charges, maintenance costs, bankruptcy = game over |
| Time Controls | 1x / 2x / 4x speed toggle |
| UI | Top bar (cash, visitors, reputation), facility panel on click, satisfaction overlay |
| Win/Lose | No explicit win — survive as long as possible; lose at $0 cash |

### Deliverable

A playable management simulation where the player places three facility types on a grid, watches visitors autonomously navigate to satisfy their needs, manages cash flow through pricing and placement decisions, and can accelerate time. The game must demonstrate emergent visitor behavior (traffic patterns, queue bottlenecks), a functional financial model that can bankrupt the player, and a dashboard that communicates system state clearly enough for the player to make informed decisions.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|-------------|---------|
| Simulation Loop | Like a job scheduler ticking through a task queue — each entity processes its current state and transitions, similar to a state machine in a workflow engine |
| Satisfaction / Demand Modeling | Like calculating a service's health score from multiple metrics (latency, error rate, throughput) — weighted inputs producing a single composite score |
| Placement and Zoning | Like deploying services across availability zones — placement affects latency (visitor walk time) and load balancing (queue distribution) |
| Financial Model | Like cloud cost management — each resource has a running cost, usage generates revenue, and you must stay within budget or get shut down |
| Time Acceleration | Like running a load test at 2x or 4x replay speed — the simulation must remain correct at any speed, just as a replay must maintain event ordering |
| UI for Complex Systems | Like a Grafana dashboard — raw metrics are useless without visualization; the dashboard IS the product for whoever is operating the system |
| Emergent Behavior | Like unexpected traffic patterns in a microservice mesh — each service follows simple routing rules, but the aggregate creates hotspots and cascading failures no one designed |

### Frontend Developers

| Core Concept | Analogy |
|-------------|---------|
| Simulation Loop | Like a Redux store where every tick dispatches actions for each entity — state updates flow through reducers and the UI re-renders to reflect the new world state |
| Satisfaction / Demand Modeling | Like computing a derived value from multiple reactive signals — when any input changes, the satisfaction score recomputes automatically |
| Placement and Zoning | Like absolute positioning elements on a CSS grid — each facility occupies cells, and influence radius is like proximity-based styling (elements within range get affected) |
| Financial Model | Like a shopping cart with running totals — every add/remove updates the subtotal, taxes, and shipping, and checkout (bankruptcy) is blocked if the balance is insufficient |
| Time Acceleration | Like adjusting the playback rate on a video element — the content is the same, just faster, and you need to ensure animations and transitions still look correct |
| UI for Complex Systems | Like building an analytics dashboard with multiple coordinated views — selecting one element highlights related data across all panels, providing drill-down capability |
| Emergent Behavior | Like users naturally forming navigation patterns on a website that you never designed for — heatmaps reveal desire paths that emerge from simple link-following rules |

### Data / ML Engineers

| Core Concept | Analogy |
|-------------|---------|
| Simulation Loop | Like a simulation stepping through discrete time — each tick is an epoch where every agent updates, similar to an agent-based model in computational social science |
| Satisfaction / Demand Modeling | Like a multi-input regression model — satisfaction is the target variable, and needs, wait time, and price are features with learned (or tuned) weights |
| Placement and Zoning | Like feature spatial indexing — placing facilities with influence radii is a nearest-neighbor problem where visitors query a spatial data structure for the best option |
| Financial Model | Like tracking a model's cost-per-prediction against revenue-per-prediction — the system is only viable if inference revenue exceeds compute and maintenance costs |
| Time Acceleration | Like fast-forwarding a simulation to collect more training data — running Monte Carlo rollouts at accelerated speed while ensuring numerical stability |
| UI for Complex Systems | Like building a model monitoring dashboard — precision, recall, drift, and throughput must all be visible at once so the operator can intervene before the system degrades |
| Emergent Behavior | Like emergent clusters in agent-based simulations — individual agents follow simple reward-seeking rules, but the population-level behavior reveals structure (traffic, queues, dead zones) that was never explicitly programmed |

---

## Discussion Questions

1. **The Information Problem:** RollerCoaster Tycoon lets you click on any individual guest to see their thoughts ("I'm hungry," "This ride was great!"). Two Point Hospital uses overlays and graphs. Which approach better serves the player, and at what scale does one break down? How would you design information access for a park with 500 visitors versus 50?

2. **Depth vs. Readability:** Adding more interconnected systems (weather, staff morale, ride breakdowns) makes the simulation richer but harder to understand. Where is the line between "deep" and "opaque"? How do you decide which systems to simulate and which to abstract away in an MVP?

3. **Emergent Behavior as a Design Tool:** In your MVP, visitors following simple need-based rules will create traffic patterns. But what if those patterns produce degenerate strategies (put one of each facility at the entrance and visitors never walk far)? How do you design simple rules that produce interesting emergent behavior rather than trivially optimal solutions?

4. **The Tycoon Difficulty Curve:** Most tycoon games start easy (few visitors, simple needs) and get harder (more visitors, complex needs, competition). But the player also gets richer and more experienced. How do you design difficulty scaling that stays challenging without feeling punitive — where the player's growing skill is matched by growing complexity?
