# CyberForge Dashboard Components 🎯

Complete suite of modern, responsive security analysis dashboards with real-time visualizations.

## 📊 Dashboard Components

### 1. Enhanced Vulnerability Report
**Status:** ✅ 100% Complete  
**File:** `components/EnhancedVulnerabilityReport.tsx`

**Features:**
- 4-tab interface (Overview, Details, Metrics, Exploitability)
- 6 chart types: Pie, Bar, Area, Line, Scatter, Radar
- Severity distribution visualization
- Timeline analysis
- CVSS score breakdown
- Code snippet viewer with syntax highlighting

**Usage:**
```tsx
import { EnhancedVulnerabilityReport } from './components';

<EnhancedVulnerabilityReport data={vulnerabilityData} />
```

---

### 2. Crash Deduplication Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/CrashDedupDashboard.tsx`

**Features:**
- Crash clustering with similarity grouping
- 3 chart types: Pie (severity), Bar (top clusters), Line (minimization)
- Advanced filtering and search
- Fingerprint display (stack hash, exception type)
- Tainted variable tracking
- Expandable cluster details

**Usage:**
```tsx
import { CrashDedupDashboard } from './components';

<CrashDedupDashboard 
  clusters={crashClusters}
  onPromoteCluster={handlePromote}
  onMinimizeCrash={handleMinimize}
/>
```

---

### 3. Corpus Manager Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/CorpusManagerDashboard.tsx`

**Features:**
- Seed corpus evolution timeline (Area chart)
- Coverage vs Crashes scatter plot
- Golden seed promotion
- Upload/Download functionality
- Seed filtering (all/golden/interesting/crashes)
- Coverage scoring visualization

**Usage:**
```tsx
import { CorpusManagerDashboard } from './components';

<CorpusManagerDashboard 
  seeds={seedList}
  evolution={evolutionData}
  onPromoteToGolden={handlePromote}
  onUploadSeeds={handleUpload}
  onDownloadCorpus={handleDownload}
/>
```

---

### 4. Test Exporter Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/TestExporterDashboard.tsx`

**Features:**
- 5 framework support: Jest, Pytest, JUnit, Mocha, Go
- Configuration UI (target function, imports, setup/teardown)
- Test case list with generate/view/copy/download/run actions
- Expandable code preview with syntax highlighting
- Responsive grid layout

**Usage:**
```tsx
import { TestExporterDashboard } from './components';

<TestExporterDashboard 
  testCases={testCases}
  onGenerateTest={handleGenerate}
  onRunTest={handleRun}
/>
```

**Supported Frameworks:**
- Jest (JavaScript/TypeScript)
- Pytest (Python)
- JUnit (Java)
- Mocha (JavaScript)
- Go Test (Go)

---

### 5. API Replayer Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/APIReplayerDashboard.tsx`

**Features:**
- Request sequence viewer with timeline
- 5 mutation strategies: Header Fuzzing, Body Mutation, Parameter Fuzzing, Auth Bypass, Sequence Fuzzing
- Mutation intensity selector (Low/Medium/High)
- OAuth2 flow tracker (4-step visualization)
- HAR/Postman import
- Method distribution (Pie chart)
- Response time analysis (Line chart)
- Expandable request/response details

**Usage:**
```tsx
import { APIReplayerDashboard } from './components';

<APIReplayerDashboard 
  sessions={replaySessions}
  activeSession={currentSession}
  replayResults={results}
  onImportHAR={handleHARImport}
  onStartReplay={handleStart}
/>
```

---

### 6. SARIF Viewer Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/SARIFViewerDashboard.tsx`

**Features:**
- GitHub PR annotation preview
- CI badge generator with live preview
- PR comment template generator
- Severity distribution (Pie chart)
- Top files with issues (Bar chart)
- Inline code snippets
- Suggested fixes display
- Raw JSON viewer
- Filter by severity
- Search by rule ID or message

**Usage:**
```tsx
import { SARIFViewerDashboard } from './components';

<SARIFViewerDashboard 
  report={sarifReport}
  onImport={handleImport}
  onExport={handleExport}
  onGenerateBadge={handleBadgeGeneration}
/>
```

**GitHub Integration:**
- Auto-generated CI badges
- PR comment templates
- Inline code annotations
- Status checks formatting

---

### 7. Live Fuzzing Dashboard
**Status:** ✅ 100% Complete  
**File:** `components/LiveFuzzingDashboard.tsx`

**Features:**
- Real-time WebSocket updates
- 5 live metric cards: Exec/sec, Coverage, Corpus Size, Total Crashes, Unique Crashes
- 6 charts:
  - Coverage Growth (Area chart)
  - Execution Speed (Line chart)
  - Corpus Size (Area chart)
  - Crash Discovery (Multi-line chart)
  - System Metrics (CPU/Memory - Line chart)
- Time range selector (1m/5m/15m/All)
- Recent crashes list with stack traces
- Control panel (Start/Pause/Stop/Reset/Export)
- Animated live indicators

**Usage:**
```tsx
import { LiveFuzzingDashboard } from './components';

<LiveFuzzingDashboard 
  isRunning={isFuzzing}
  currentMetrics={metrics}
  metricsHistory={history}
  recentCrashes={crashes}
  webSocketUrl="ws://localhost:3000/fuzzing"
  onStart={handleStart}
  onPause={handlePause}
/>
```

**WebSocket Message Format:**
```typescript
{
  timestamp: number;
  execsPerSec: number;
  coverage: number; // 0.0 to 1.0
  corpusSize: number;
  crashes: number;
  uniqueCrashes: number;
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
}
```

---

## 🎨 Design System

### Colors
- **Critical/Error:** `#EF4444` (Red)
- **High/Warning:** `#F59E0B` (Orange)
- **Medium:** `#FBBF24` (Yellow)
- **Low/Info:** `#3B82F6` (Blue)
- **Success:** `#10B981` (Green)
- **Note:** `#8B5CF6` (Purple)

### Animations
All dashboards use Framer Motion for:
- Staggered list animations
- Card entrance effects
- Expandable sections
- Live pulse animations

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

All dashboards use Tailwind's responsive classes: `md:`, `lg:`, `xl:`

---

## 📦 Dependencies

```json
{
  "recharts": "^2.12.7",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.553.0",
  "react": "^19.1.1",
  "typescript": "^5.7.3"
}
```

---

## 🚀 Integration Guide

### 1. Import Components
```tsx
import {
  EnhancedVulnerabilityReport,
  CrashDedupDashboard,
  CorpusManagerDashboard,
  TestExporterDashboard,
  APIReplayerDashboard,
  SARIFViewerDashboard,
  LiveFuzzingDashboard
} from './components';
```

### 2. Add to Routes
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/vulnerabilities/:id" element={<EnhancedVulnerabilityReport />} />
  <Route path="/crashes" element={<CrashDedupDashboard />} />
  <Route path="/corpus" element={<CorpusManagerDashboard />} />
  <Route path="/tests" element={<TestExporterDashboard />} />
  <Route path="/api-replay" element={<APIReplayerDashboard />} />
  <Route path="/sarif" element={<SARIFViewerDashboard />} />
  <Route path="/live-fuzzing" element={<LiveFuzzingDashboard />} />
</Routes>
```

### 3. Backend Integration
Each dashboard expects specific data structures. See TypeScript interfaces exported from each component:

```tsx
import type {
  CrashCluster,
  Seed,
  TestCase,
  HTTPRequest,
  SARIFReport,
  FuzzingMetrics
} from './components';
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Chart interactions (hover, click)
- [ ] Expandable sections
- [ ] Filter/search functionality
- [ ] Button actions (export, download, etc.)
- [ ] WebSocket connections (Live Fuzzing)
- [ ] File imports (HAR, Postman, SARIF)

### Integration Testing
```bash
# Start backend services
npm run server

# Start frontend
npm run dev

# Test endpoints
curl http://localhost:3000/api/vulnerabilities
curl http://localhost:3000/api/crashes
curl http://localhost:3000/api/corpus
```

---

## 📈 Performance

### Optimization Tips
1. **Lazy Load Charts:** Use React.lazy() for chart-heavy dashboards
2. **Virtualization:** For large lists (1000+ items), use react-window
3. **Debounce Search:** Debounce search inputs (300ms recommended)
4. **Memoization:** Use React.memo for chart components
5. **WebSocket Throttling:** Throttle live updates to 1-2 per second

### Bundle Size
| Component | Size (gzipped) |
|-----------|---------------|
| EnhancedVulnerabilityReport | ~45KB |
| CrashDedupDashboard | ~38KB |
| CorpusManagerDashboard | ~35KB |
| TestExporterDashboard | ~42KB |
| APIReplayerDashboard | ~48KB |
| SARIFViewerDashboard | ~52KB |
| LiveFuzzingDashboard | ~55KB |

---

## 🐛 Troubleshooting

### Charts Not Rendering
- Ensure recharts is installed: `npm install recharts`
- Check parent container has height/width defined
- Verify data format matches chart expectations

### WebSocket Errors (Live Fuzzing)
- Check WebSocket URL is correct
- Verify backend WebSocket server is running
- Check CORS policy allows WebSocket connections

### TypeScript Errors
- Update `@types/react`: `npm install -D @types/react@latest`
- Check tsconfig.json includes `"jsx": "react-jsx"`

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Export all dashboards to PDF
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [ ] Custom chart color themes
- [ ] Collaborative annotations
- [ ] AI-powered insights

### Reusable Component Extraction
The following components can be extracted to reduce duplication:
- `ChartCard.tsx` - Wrapper for all chart containers
- `StatCard.tsx` - Animated metric cards
- `FilterBar.tsx` - Unified filter/search UI
- `ExpandableSection.tsx` - Collapsible content areas

---

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Tailwind for styling (no custom CSS)
3. Add prop types and interfaces
4. Include JSDoc comments for exported components
5. Test responsive design on multiple viewports

---

**Built with ❤️ by the CyberForge Team**
