# Team Sprint Feature Design Document

## 1. Data Model Design

### 1.1. Sprint Entity
- **Table**: `sprints`
- **Fields**:
  - `id` (PK)
  - `board_id` (FK): Board = Team context
  - `name`: Sprint name (e.g., "Sprint 14")
  - `start_date`: DateTime
  - `end_date`: DateTime
  - `status`: Enum (PLANNED, ACTIVE, COMPLETED)
  - `goal_text`: Text (Simple goal summary)
  - `capacity`: Integer (Story points or hours)
  - `created_at`, `updated_at`

### 1.2. Goal Entity (OKR support)
- **Table**: `goals`
- **Fields**:
  - `id` (PK)
  - `board_id` (FK)
  - `title`: String
  - `description`: Text
  - `status`: Enum (ON_TRACK, AT_RISK, OFF_TRACK, COMPLETED)
  - `progress`: Integer (0-100, manual or auto-calculated)
  - `metric_type`: Enum (MANUAL, CARD_COUNT, STORY_POINTS)

### 1.3. Card Entity Updates
- **Table**: `cards`
- **Add Fields**:
  - `sprint_id` (FK, Nullable): Link to specific sprint. Null means Backlog.
  - `story_points` (Integer): For capacity planning.
  - `original_card_id` (FK, Nullable): For tracking rollover history (cloned from).

### 1.4. Sprint Snapshot (For Reports)
- **Table**: `sprint_snapshots`
- **Fields**:
  - `id` (PK)
  - `sprint_id` (FK)
  - `snapshot_date`: Date
  - `total_points`: Integer (Scope)
  - `completed_points`: Integer (Burn-up)
  - `remaining_points`: Integer (Burn-down)
  - `status_counts`: JSON (e.g., {"todo": 5, "doing": 2, "done": 3})

---

## 2. API Design

### 2.1. Sprint Management
- `GET /api/boards/{boardId}/sprints`: List all sprints (Active, Planned, Past).
- `POST /api/boards/{boardId}/sprints`: Create new sprint.
- `PUT /api/sprints/{sprintId}/start`: Start sprint (Validation: No other active sprint).
- `PUT /api/sprints/{sprintId}/complete`: Complete sprint -> Trigger Rollover logic.

### 2.2. Planning & Assignment
- `POST /api/sprints/{sprintId}/cards`: Bulk assign cards to sprint.
- `DELETE /api/sprints/{sprintId}/cards/{cardId}`: Move card back to backlog.
- `GET /api/boards/{boardId}/backlog`: Get cards with `sprint_id IS NULL` AND `archived = false`.

### 2.3. Reports
- `GET /api/sprints/{sprintId}/burndown`: Return snapshot series.
- `GET /api/boards/{boardId}/velocity`: Return last N completed sprints' points.

---

## 3. Frontend Architecture

### 3.1. Global State (Zustand/Context)
- `boardConfig`: Add `mode` ('KANBAN' | 'SPRINT').
- `activeSprint`: Store current active sprint details.

### 3.2. Component Structure
- `BoardDetailPage`
  - `SprintHeader` (New): Visible only in Sprint Mode + Active Sprint.
    - Props: `sprintName`, `daysLeft`, `progress`, `goal`.
  - `ViewSwitcher`: Toggle between "Board View" and "Planning View".
  - `BoardView` (Existing Kanban):
    - Filter: Show only cards where `sprint_id === activeSprint.id`.
  - `PlanningView` (New):
    - `BacklogPanel`: List of unassigned cards.
    - `SprintListPanel`: Accordion of Planned Sprints.
      - `CapacityBar`: Visual indicator (Assigned Points / Total Capacity).

---

## 4. Business Logic & Workflows

### 4.1. Sprint Start
- Condition: No other `ACTIVE` sprint in the board.
- Action: Set status to `ACTIVE`, capture initial snapshot.

### 4.2. Sprint Completion & Rollover
- Trigger: User clicks "Complete Sprint".
- Logic:
  1. Find all `DONE` cards -> Mark as completed in sprint.
  2. Find all `NOT DONE` cards:
     - **Clone** the card (Title, Description, Assignees, Labels).
     - Set new card's `sprint_id` to Next Sprint (or Backlog).
     - Mark old card as `ROLLED_OVER` (custom status or flag) for record keeping.
  3. Set Sprint status to `COMPLETED`.

### 4.3. Snapshot Batch
- Schedule: Every 12 hours (e.g., 00:00, 12:00).
- Logic: For every `ACTIVE` sprint, calculate totals and save to `sprint_snapshots`.
