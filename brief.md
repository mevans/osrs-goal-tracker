Here is the complete MVP brief in plain text, consolidated and ready to hand to a technical agent.

---

OSRS Efficiency Planning Tool – MVP Brief

Overview

We are building an Old School RuneScape (OSRS) efficiency planning tool.

This is not a casual checklist app.

It is an efficiency engine that uses a graph UI to model:

* Hard requirements (quests, skills, unlocks)
* Optional improvements (QoL upgrades, DPS upgrades, etc.)
* Structural dependencies
* Frontier analysis (what’s available now)
* Bottlenecks (what blocks the most progress)

This is a planning tool, not a live tracker.

The graph is the visual layer.
The real product is the structural engine underneath.

---

Product Philosophy

This is not a to-do list.

It is a structural planning engine for efficient players.

Efficient players care about:

* What can I do right now?
* What is blocking the most progress?
* What improves my current grind?
* What unlocks the most downstream content?

In MVP, efficiency insight comes purely from structure.
No time modelling, no ROI scoring, no EHP calculations.

---

MVP Goal

Deliver a usable web app where users can:

1. Create a graph (“web”) of goals.
2. Add nodes (goals, quests, skill targets, unlocks).
3. Connect nodes via dependencies.
4. Expand “Quest Cape” into a full prerequisite graph.
5. See:

    * Available tasks
    * Blocked tasks
    * What blocks the most nodes
    * Optional improvements per goal
6. Share the web via a read-only link.

Out of scope for MVP:

* Time estimates
* ROI scoring
* EHP calculations
* GP/hr modelling
* Price APIs
* RuneLite integration
* Account type modelling (main vs iron)
* What-if simulations

---

Core Architecture

There are three layers:

1. Graph Model
2. Engine Layer (pure logic)
3. Template Expander Layer

These must be cleanly separated.

---

Graph Model

Node has:

* id
* type: goal | quest | skill | unlock
* title
* position (x, y)
* status: complete boolean
* optional data:

    * skillName and targetLevel (for skill nodes)
    * questId (for quest nodes)
    * notes (for goal/unlock)

Edge has:

* id
* from (prerequisite)
* to (dependent)
* type: requires | improves

Edge semantics:

A -> B means A affects B.

If type is “requires”:

* B is blocked until A is complete.

If type is “improves”:

* B is still available without A.

---

Derived Node State

For each node:

Complete:

* status.complete is true.

Blocked:

* At least one incomplete “requires” prerequisite.

Available:

* Not complete.
* All “requires” prerequisites complete.

Improvements:

* Nodes connected via “improves” edges.

---

Engine Layer (Pure Logic)

The engine must be UI-independent.

Required functionality:

* Get required prerequisites for a node.
* Get available nodes.
* Get blocked nodes.
* Get improvements for a selected node.
* Compute bottlenecks.

Bottleneck logic:

For each incomplete node A:

* Count how many nodes depend on A via “requires”.
* Sort descending.
* Return top N blockers.

No scoring or weighting required.

---

Template Expander System

Templates must be:

* Deterministic
* Idempotent (running twice does not duplicate nodes)
* Merge-aware (skill targets merged by max level)

Expansion must return:

* Nodes to add
* Edges to add
* Nodes to update (e.g. skill target increases)

Expansion must be previewable before applying.

---

First Template: Quest Cape

When user adds a “Quest Cape” node:

Offer expansion preview:

* Add all quest nodes.
* Add quest → quest prerequisite edges.
* Derive skill targets from all quest requirements.
* Merge skill targets by max level per skill.
* Add skill → quest edges (requires).
* Add quest → quest cape edge (requires).

Quest dataset must be bundled as static JSON with:

* id
* name
* quest prerequisites
* skill requirements

No runtime scraping or external API calls in MVP.

---

Node Types (MVP Only)

Keep strictly minimal:

1. Goal (generic milestone or grind)
2. Quest
3. Skill Target
4. Unlock / Upgrade

Do not include:

* Items
* Boss drop modelling
* Diaries
* Collection log
* Wealth goals

These are post-MVP features.

---

UI Requirements

Graph View:

* Pan and zoom.
* Drag nodes.
* Drag to create edges.
* Select node → side panel.
* Node color by type.
* Border style by state:

    * Grey = blocked
    * Blue = available
    * Green = complete.

Side Panel:

When node selected, show:

* Required prerequisites.
* Improvements.
* Dependents.
* Mark complete toggle.
* Expand template button (if applicable).

---

Planning Panels

Must include:

Available Now:

* All nodes that are not complete and not blocked.

Blocked:

* All nodes with incomplete required prerequisites.

Top Bottlenecks:

* Nodes blocking the most other nodes.

Improvements (per selected goal):

* All nodes connected via “improves” edges.

---

Persistence and Sharing

MVP storage options:

* Local storage
  or
* Simple backend storing webs, nodes, edges.

Must support:

* Save
* Load
* Share read-only link

No authentication required for MVP.

---

Technology Recommendation

Frontend:

Use React with React Flow (@xyflow/react) for the graph UI.

Reasons:

* Built specifically for interactive node/edge editors.
* Supports custom nodes and edges.
* Built-in minimap and controls.
* Easy to style requires vs improves edges.
* Well suited for structured editing rather than raw network visualization.

Keep the engine logic in pure TypeScript, independent of React Flow.
This ensures future flexibility if renderer changes.

Backend (optional MVP):

Simple REST or serverless endpoint for storing graph JSON.
No complex backend required initially.

---

Build Order

1. Define graph data model.
2. Implement engine logic (available/blocked/bottleneck).
3. Integrate React Flow for graph UI.
4. Implement manual node/edge creation.
5. Implement Quest Cape template expander.
6. Implement planning panels.
7. Implement save/share.

---

Post-MVP (Not Now)

Future expansions may include:

* Account type logic (main vs iron)
* Boostable skill logic
* Time estimates
* Unlock density scoring
* Diary template expander
* Boss-ready templates
* Item database integration
* ROI modelling

These are explicitly not part of MVP.

---

Final Statement

This project is an efficiency engine that happens to use a graph UI.

The MVP must:

* Prove the graph editor is usable.
* Prove expansion logic works.
* Prove frontier and bottleneck insights are useful.
* Stay lean enough to actually ship.

Everything else layers on top.
