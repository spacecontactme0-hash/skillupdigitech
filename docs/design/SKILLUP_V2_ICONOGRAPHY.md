# SkillUp Digitech Academy — Rebrand V2 Iconography Standard

**Registry:** `lib/icons.ts`  
**Library:** `lucide-react` (already installed; zero additional icon packages)

---

## 1. Visual Consistency Rules

- **Stroke Width:** Standardize on `1.75px` (`ICON_STROKE_WIDTH = 1.75`) for UI clarity across light and dark surfaces.
- **Sizing Scale:**
  - `14px` (`h-3.5 w-3.5`) — Inside badges, chips, and compact metadata rows.
  - `16px` (`h-4 w-4`) — Inside buttons, inputs, and navigation links.
  - `20px` (`h-5 w-5`) — Section headers, KPI tiles, and sidebar groups.
  - `24px` (`h-6 w-6`) — Empty-state badges and alert callouts.
- **Colour Pairing:**
  - On light backgrounds: `#231651` (Russian Violet), `#613399` (Electric Violet), or `#0A5C4A` (Emerald) for positive status.
  - On dark Russian Violet backgrounds: `#D6FFF6` (Mint) or `#FFFFFF`.
  - Never mix emoji icons with crisp Lucide icons inside the same component or card list.

---

## 2. Domain Icon Mapping (`SkillUpIcons`)

| Domain | Semantic Key | Lucide Icon |
|---|---|---|
| Navigation | `dashboard`, `explore`, `courses`, `search`, `settings` | `LayoutDashboard`, `Compass`, `BookOpen`, `Search`, `Settings` |
| Learning Tracks | `software`, `ai`, `design`, `social`, `video`, `project` | `Code2`, `Brain`, `Palette`, `Share2`, `Video`, `FolderGit2` |
| Campus & Cohorts | `campus`, `location`, `schedule`, `cohort`, `laptop`, `power`, `wifi` | `Building2`, `MapPin`, `Calendar`, `Users`, `Laptop`, `Zap`, `Wifi` |
| Credentials & Assessment | `graduation`, `certificate`, `verify`, `rubric`, `submission`, `billing` | `GraduationCap`, `Award`, `ShieldCheck`, `ClipboardCheck`, `FileCheck2`, `CreditCard` |
| Status & Feedback | `success`, `warning`, `error`, `info`, `help` | `CheckCircle2`, `AlertTriangle`, `AlertCircle`, `Info`, `HelpCircle` |
