# Navigation route map (Menu-Sidebar ↔ pages)

Fill this in as you lock each screen. **Product owner:** add **PNG filenames** inside the draft folder for that menu (see **Draft folder** column). **Implementer (Claude / dev):** add **URL path** and **component file** when wired.

**Canonical Overview mockup (implement this version):** `docs/pages/Overview/overview-v1.2.png` — earlier `overview-v1.png` is archival only.

**Frozen shell:** `docs/Menu-Sidebar/README.md` + `docs/Menu-Sidebar/menu-sidebar-v5.2-reference.png`

**Draft folders:** `docs/pages/<Menu label>/` — see `docs/pages/README.md`.

## Main menu

| Menu label (Menu-Sidebar) | Draft folder (put mockups here) | URL path (code) | Page component (code) | Visual draft file(s) | Notes |
|---------------------------|----------------------------------|-----------------|-------------------------|------------------------|-------|
| Overview | `docs/pages/Overview/` | *TBD* | *TBD* | **`overview-v1.2.png` (canonical)**; `overview-v1.png` (archive) | v1.2: calendar widget is **single-day (today)** agenda view, not month grid; updates conceptually each calendar day. Section titles will become links later. |
| Tasks | `docs/pages/Tasks/` | *TBD* | *TBD* | **`tasks-v2.0.png` (canonical)**; `tasks-v1.1.png`, `tasks-v1.0.png` (archive) | v2.0: v1.1 **four widgets** unchanged, plus **full My KPIs block** from old KPI page: Flywheel label, five stage summary cards (Deliver/Capture/Share/Attract/Book), KPI cards with trend + chart + log entry (see `src/pages/KPIDashboard.tsx`). v1.1: four widgets only. |
| Calendar | `docs/pages/Calendar/` | *TBD* | *TBD* | | |
| Booking Agent | `docs/pages/Booking Agent/` | *TBD* | *TBD* | | |
| Idea Board | `docs/pages/Idea Board/` | *TBD* | *TBD* | | |

## Admin menu

| Menu label (Menu-Sidebar) | Draft folder (put mockups here) | URL path (code) | Page component (code) | Visual draft file(s) | Notes |
|---------------------------|----------------------------------|-----------------|-------------------------|------------------------|-------|
| Team Hub | `docs/pages/Team Hub/` | *TBD* | *TBD* | | |
| Assign Tasks | `docs/pages/Assign Tasks/` | *TBD* | *TBD* | | |
| Members | `docs/pages/Members/` | *TBD* | *TBD* | | |
| Metrics | `docs/pages/Metrics/` | *TBD* | *TBD* | | |
| Settings | `docs/pages/Settings/` | *TBD* | *TBD* | | |

## Header (not in sidebar)

| Area | Behavior | Visual draft | Notes |
|------|------------|--------------|-------|
| Profile (right) | Account + sign out | *(same as Menu-Sidebar mockup)* | |

---

`*TBD*` = to be decided when Menu-Sidebar is implemented against current `src/App.tsx` routes.
