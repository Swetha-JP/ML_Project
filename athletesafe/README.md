# AthleteSafe

**Injury Risk Prediction in Athletes using Machine Learning on Biomechanical & Historical Data**

AthleteSafe is a sports-performance and injury-risk assessment platform for analysing athlete biomechanical measurements, training workload, recovery, fatigue, sleep, and previous injury history. It estimates injury risk and explains the contributing factors.

> **V1 — Frontend Prototype.** All predictions are rule-based simulations. No real ML model, backend, or database is connected yet. The architecture is designed so a real FastAPI + ML backend can be dropped in for V2 without redesigning the frontend.

---

## Live Dev Server

```bash
npm run dev
# → http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | Pure CSS (custom design system, no Tailwind) |
| Fonts | Plus Jakarta Sans · JetBrains Mono |
| State | React Context API |

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Deep Graphite sidebar with nav
│   │   └── TopHeader.tsx        # Athlete switcher + header
│   ├── ui/
│   │   ├── RiskBadge.tsx        # LOW / MODERATE / HIGH / CRITICAL
│   │   ├── RiskScore.tsx        # Radial SVG risk gauge
│   │   ├── RiskFactor.tsx       # Horizontal impact bar
│   │   ├── MetricCard.tsx       # Performance snapshot cards
│   │   ├── ProgressBar.tsx      # Semantic progress bars
│   │   ├── ChartCard.tsx        # Chart wrapper with header
│   │   ├── StatusIndicator.tsx  # Dot + label status
│   │   ├── Toast.tsx            # Toast notifications
│   │   └── Modal.tsx            # Generic modal
│   └── AthleteProfile.tsx       # Full athlete profile side drawer
├── context/
│   └── AppContext.tsx           # Global state + CRUD operations
├── data/
│   ├── athletes.ts              # 6 realistic mock athletes
│   └── assessmentHistory.ts     # Mock assessment records
├── pages/
│   ├── Dashboard.tsx            # Main performance overview
│   ├── RiskAssessment.tsx       # 5-section assessment form
│   ├── PoseAnalysis.tsx         # Image upload → pose → risk
│   ├── Athletes.tsx             # Read-only athlete directory
│   ├── AthleteManagement.tsx    # Full CRUD athlete management
│   ├── Analytics.tsx            # Performance analytics charts
│   ├── RiskHistory.tsx          # Assessment history table
│   └── Recommendations.tsx      # Grouped recommendation library
├── services/
│   ├── predictionService.ts     # Simulated risk prediction engine
│   └── poseAnalysisService.ts   # Simulated pose analysis engine
├── types/
│   └── index.ts                 # All TypeScript types
├── App.tsx                      # Router + layout shell
├── main.tsx                     # Entry point
└── index.css                    # Complete design system CSS
```

---

## Pages & Features

### Dashboard `/`
- Radial injury risk visualisation with previous vs current comparison
- 4 performance snapshot metrics: Training Load, Recovery, Fatigue, Sleep
- Interactive risk trajectory chart (7D / 30D toggle)
- Training load bar chart with baseline reference
- Recovery vs fatigue trend chart
- Risk drivers with horizontal impact bars
- Protective factors
- Recommendations preview
- Dynamic — switches with selected athlete from header

### Risk Assessment `/assessment`
Five-section structured form:
1. Athlete Information
2. Injury History
3. Training Load
4. Recovery & Wellness
5. Biomechanical Data

Animated loading pipeline → full prediction result with risk score, primary contributors, protective factors, what to monitor, and recommendations.

### Pose Analysis `/pose` ⭐ New
- Drag-and-drop or browse image upload
- Sport context selector for sport-specific angle norms
- 8-step animated analysis pipeline
- SVG skeleton overlay drawn directly on the uploaded image (17-point COCO keypoints)
- Joint angle table (9 joints) with normal range comparison and status (normal / caution / risk)
- Body segment findings (expandable)
- Risk drivers and protective factors
- Recommendations and what to monitor
- Full result with overall risk score and model confidence

> V2 will connect to a real computer-vision endpoint (MediaPipe Pose / OpenPose / custom model).

### Athletes `/athletes`
- Searchable, filterable, sortable athlete directory
- Sport and risk level filters
- Click row to open full profile drawer
- Athlete profile: risk trend chart, biomechanical profile, injury timeline, recommendations

### Manage Athletes `/manage` — Full CRUD
| Operation | Description |
|---|---|
| **Create** | Add Athlete modal — 4 sections, validation, risk auto-inferred |
| **Read** | Table with live stats strip (total, low/moderate/high/critical counts) |
| **Update** | Edit modal pre-filled with athlete data |
| **Delete** | Confirmation modal before removal |

Extra row actions: view profile, set as active dashboard athlete.

### Performance Analytics `/analytics`
- Injury risk trend (14-day)
- Squad risk distribution pie chart
- Training load bar chart
- Recovery & fatigue trend
- Multi-athlete comparison (select up to 4, compare 5 metrics)

### Risk History `/history`
- Full assessment records table
- Filters: athlete, risk level, search
- Click row to open assessment detail modal with risk factors

### Recommendations `/recommendations`
Collapsible categories:
- Training Load Management
- Recovery Optimisation
- Fatigue Monitoring
- Sleep & Rest
- Previous Injury Monitoring

Each recommendation has: Issue · Impact · Suggested action · Priority level

---

## Mock Data

Six athletes covering different sports, positions, and risk categories:

| Athlete | Sport | Risk Level |
|---|---|---|
| Alex Morgan | Football | High (72%) |
| Marcus James | Basketball | Critical (88%) |
| Priya Sharma | Athletics | Moderate (41%) |
| Jamie Chen | Tennis | Low (28%) |
| Daniel Osei | Cricket | High (61%) |
| Sofia Mendes | Football | Moderate (52%) |

---

## Design System

**Colours**

| Name | Hex | Usage |
|---|---|---|
| Deep Graphite | `#171A1C` | Sidebar, strong areas |
| Warm Ivory | `#F4F1EA` | App background |
| Muted Sage | `#8FA69A` | Low risk, healthy states |
| Burnt Copper | `#B96545` | Brand, actions, high risk |
| Slate | `#596267` | Secondary text |
| Signal Red | `#D94A4A` | Critical risk only |
| Amber | `#C8953A` | Moderate risk |

**Risk Colour Semantics**
```
LOW      → Muted Sage  #8FA69A
MODERATE → Amber       #C8953A
HIGH     → Burnt Copper #B96545
CRITICAL → Signal Red  #D94A4A
```

**Typography**
- UI: `Plus Jakarta Sans`
- Data / metrics / angles: `JetBrains Mono`

---

## Running Locally

```bash
# Install
npm install

# Dev server (port 3000)
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

---

## V2 Roadmap

When connecting a real backend, replace these service files:

```
src/services/predictionService.ts   → FastAPI /predict endpoint
src/services/poseAnalysisService.ts → CV model /analyze-pose endpoint
```

Expected V2 additions:
- FastAPI backend with trained ML model
- Real MediaPipe / OpenPose computer vision
- PostgreSQL athlete database
- JWT authentication
- Wearable data integration (HRV, GPS load)
- Real-time risk alerts

---

## Disclaimer

AthleteSafe provides training and wellness decision-support insights. It is **not a medical diagnostic system**. All risk estimates in V1 are simulated for demonstration purposes. Always consult qualified sports medicine and physiotherapy professionals.

---

*AthleteSafe V1 Prototype · Sports Performance Intelligence*
