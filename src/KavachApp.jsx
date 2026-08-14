import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutGrid, Camera, ShieldAlert, Map as MapIcon, Bell, GitBranch, Search, X, Play,
  Upload, CheckCircle2, AlertTriangle, MapPin, ZoomIn, ZoomOut, Layers, ArrowRight,
  Clock, Radio, Target, ChevronRight, Menu, TreePine, Activity, Crosshair, RefreshCw,
  Check, ChevronDown, ScanLine, Waves, Compass, BellRing, ExternalLink
} from "lucide-react";

/* ============================== DEMO DATA ============================== */

const SPECIES_LIST = ["Asian Elephant", "Leopard", "Wild Boar", "Spotted Deer", "Tiger"];

const ZONES = [
  {
    id: "Z-01", name: "Northern Ridge", x: 20, y: 14, riskLevel: "LOW", risk: 18,
    species: "Spotted Deer", recentDetections: 5, historicalConflicts: 0,
    settlementProximity: "LOW",
    environmentalContext: "Open grassland ridge, well outside cultivated land. Sparse human footfall.",
    recommended: "ROUTINE MONITORING",
    factors: { wildlifeActivity: "LOW", historicalConflict: "LOW", settlementProximity: "LOW", temporalPattern: "LOW", environmentalContext: "LOW", spatialRelationship: "LOW" },
    topFactors: ["Low historical conflict", "Minimal settlement proximity", "Stable seasonal pattern"],
  },
  {
    id: "Z-02", name: "River Bend", x: 66, y: 24, riskLevel: "MEDIUM", risk: 52,
    species: "Wild Boar", recentDetections: 8, historicalConflicts: 2,
    settlementProximity: "MEDIUM",
    environmentalContext: "Riverine cropland adjacent to seasonal water source, drawing boar during dry months.",
    recommended: "INCREASE PATROL FREQUENCY",
    factors: { wildlifeActivity: "MEDIUM", historicalConflict: "MEDIUM", settlementProximity: "MEDIUM", temporalPattern: "MEDIUM", environmentalContext: "MEDIUM", spatialRelationship: "LOW" },
    topFactors: ["Crop-raiding pattern near fields", "Seasonal water dependency", "Moderate settlement proximity"],
  },
  {
    id: "Z-03", name: "Forest Edge", x: 30, y: 44, riskLevel: "MEDIUM", risk: 61,
    species: "Leopard", recentDetections: 7, historicalConflicts: 3,
    settlementProximity: "MEDIUM",
    environmentalContext: "Dense canopy edge bordering a livestock grazing belt; frequent dusk sightings.",
    recommended: "DEPLOY ADDITIONAL CAMERA TRAPS",
    factors: { wildlifeActivity: "MEDIUM", historicalConflict: "HIGH", settlementProximity: "MEDIUM", temporalPattern: "HIGH", environmentalContext: "MEDIUM", spatialRelationship: "MEDIUM" },
    topFactors: ["Historical conflict pattern", "Dusk/nocturnal activity spike", "Livestock grazing overlap"],
  },
  {
    id: "Z-04", name: "Settlement Corridor", x: 50, y: 60, riskLevel: "HIGH", risk: 89,
    species: "Asian Elephant", recentDetections: 12, historicalConflicts: 4,
    settlementProximity: "HIGH",
    environmentalContext: "Dense forest adjoining agricultural fields; monsoon vegetation growth increasing corridor overlap with settlement.",
    recommended: "PRIORITIZE MONITORING",
    factors: { wildlifeActivity: "HIGH", historicalConflict: "HIGH", settlementProximity: "HIGH", temporalPattern: "MEDIUM", environmentalContext: "MEDIUM", spatialRelationship: "HIGH" },
    topFactors: ["Recent wildlife activity", "Settlement proximity", "Historical conflict pattern"],
  },
  {
    id: "Z-05", name: "Hillside Trail", x: 76, y: 52, riskLevel: "LOW", risk: 24,
    species: "Spotted Deer", recentDetections: 4, historicalConflicts: 0,
    settlementProximity: "LOW",
    environmentalContext: "Elevated trail with light foliage; herds pass through en route to grazing meadow.",
    recommended: "ROUTINE MONITORING",
    factors: { wildlifeActivity: "LOW", historicalConflict: "LOW", settlementProximity: "LOW", temporalPattern: "LOW", environmentalContext: "MEDIUM", spatialRelationship: "LOW" },
    topFactors: ["Predictable migratory pattern", "Low settlement overlap", "No recorded conflict"],
  },
  {
    id: "Z-06", name: "Buffer Zone South", x: 40, y: 80, riskLevel: "HIGH", risk: 82,
    species: "Tiger", recentDetections: 6, historicalConflicts: 3,
    settlementProximity: "MEDIUM",
    environmentalContext: "Core-buffer boundary with rising nocturnal movement toward the reserve's southern edge.",
    recommended: "PRIORITIZE MONITORING",
    factors: { wildlifeActivity: "HIGH", historicalConflict: "HIGH", settlementProximity: "MEDIUM", temporalPattern: "HIGH", environmentalContext: "MEDIUM", spatialRelationship: "HIGH" },
    topFactors: ["Nocturnal movement near boundary", "Historical conflict pattern", "Core-buffer overlap"],
  },
  {
    id: "Z-07", name: "Valley Watch", x: 20, y: 76, riskLevel: "MEDIUM", risk: 58,
    species: "Leopard", recentDetections: 6, historicalConflicts: 2,
    settlementProximity: "MEDIUM",
    environmentalContext: "Narrow valley corridor linking two forest blocks, crossed by a footpath used at dawn.",
    recommended: "INCREASE PATROL FREQUENCY",
    factors: { wildlifeActivity: "MEDIUM", historicalConflict: "MEDIUM", settlementProximity: "MEDIUM", temporalPattern: "MEDIUM", environmentalContext: "LOW", spatialRelationship: "MEDIUM" },
    topFactors: ["Dawn footpath overlap", "Corridor connectivity", "Moderate conflict history"],
  },
];

const ZONE_BY_ID = Object.fromEntries(ZONES.map(z => [z.id, z]));

const DEMO_IMAGES = [
  { id: "img-1", label: "CT-104.JPG", desc: "Trail Cam · Zone Z-04 · 06:42", species: "Asian Elephant", confidence: 94, zone: "Z-04" },
  { id: "img-2", label: "CT-087.JPG", desc: "Trail Cam · Zone Z-06 · 21:15", species: "Tiger", confidence: 88, zone: "Z-06" },
  { id: "img-3", label: "CT-052.JPG", desc: "Trail Cam · Zone Z-03 · 19:03", species: "Leopard", confidence: 91, zone: "Z-03" },
];

let idCounter = 200;
const nextId = (prefix) => `${prefix}-${idCounter++}`;

const INITIAL_DETECTIONS = [
  { id: "D-104", species: "Asian Elephant", confidence: 94, zone: "Z-04", timestamp: "Today, 06:42" },
  { id: "D-099", species: "Wild Boar", confidence: 81, zone: "Z-02", timestamp: "Today, 05:10" },
  { id: "D-095", species: "Leopard", confidence: 91, zone: "Z-03", timestamp: "Yesterday, 19:03" },
  { id: "D-091", species: "Tiger", confidence: 88, zone: "Z-06", timestamp: "Yesterday, 21:15" },
  { id: "D-086", species: "Spotted Deer", confidence: 76, zone: "Z-01", timestamp: "2 days ago, 07:20" },
  { id: "D-081", species: "Leopard", confidence: 85, zone: "Z-07", timestamp: "2 days ago, 05:55" },
  { id: "D-077", species: "Spotted Deer", confidence: 79, zone: "Z-05", timestamp: "3 days ago, 17:40" },
  { id: "D-070", species: "Asian Elephant", confidence: 90, zone: "Z-04", timestamp: "3 days ago, 22:11" },
];

const INITIAL_ALERTS = [
  {
    id: "A-018", zone: "Z-06", species: "Tiger", risk: 82, priority: "HIGH", status: "PENDING",
    reason: "Elevated nocturnal movement near the southern buffer boundary",
    recommended: "PRIORITIZE MONITORING", timestamp: "Today, 05:12",
  },
  {
    id: "A-012", zone: "Z-02", species: "Wild Boar", risk: 52, priority: "MEDIUM", status: "ACKNOWLEDGED",
    reason: "Crop-raiding pattern detected near river bend fields",
    recommended: "INCREASE PATROL FREQUENCY", timestamp: "Yesterday, 19:20",
  },
];

const NAV_ITEMS = [
  { id: "command", label: "Command Center", icon: LayoutGrid },
  { id: "wildlife", label: "Wildlife Detection", icon: Camera },
  { id: "risk", label: "Risk Intelligence", icon: ShieldAlert },
  { id: "gis", label: "GIS Map", icon: MapIcon },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "pipeline", label: "Intelligence Pipeline", icon: GitBranch },
];

const PROCESSING_STAGES = ["INGESTING IMAGE", "RUNNING AI DETECTION", "EXTRACTING FEATURES", "DETECTION COMPLETE"];

/* ============================== STYLES ============================== */

const GlobalStyle = () => (
  <style>{`
    html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  min-width: 100%;
  min-height: 100vh;
  background: #050807;
}

* {
  box-sizing: border-box;
}
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .kavach, .kavach * { box-sizing: border-box; }
    .kavach {
      --void:#0A100C; --panel:#111A13; --panel-raised:#17221A; --panel-hi:#1D2A20;
      --line:#243428; --line-soft:#1A251C;
      --text:#E9EEE4; --text-muted:#8DA089; --text-dim:#5E6E5B;
      --amber:#E8A33D; --amber-dim:#7A5A24;
      --low:#4CAF6D; --medium:#E8A33D; --high:#E4553D;
      font-family:'IBM Plex Sans', sans-serif;
      background: radial-gradient(ellipse at top left, #10190F 0%, #0A100C 60%);
      color: var(--text);
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow-x: hidden;
    }
    .kavach .kv-display { font-family:'Rajdhani', sans-serif; letter-spacing: 0.02em; }
    .kavach .kv-mono { font-family:'IBM Plex Mono', monospace; }
    .kavach ::-webkit-scrollbar { width: 8px; height: 8px; }
    .kavach ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
    .kavach ::-webkit-scrollbar-track { background: transparent; }
    .kavach button { font-family: inherit; cursor: pointer; }
    .kavach input, .kavach select { font-family: inherit; }
    .kavach a { color: inherit; }

    @keyframes kv-pulse {
      0% { transform: scale(0.9); opacity: 0.9; }
      70% { transform: scale(2.4); opacity: 0; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes kv-spin { to { transform: rotate(360deg); } }
    @keyframes kv-sweep { to { transform: rotate(360deg); } }
    @keyframes kv-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes kv-slidein { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes kv-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
    .kv-fadein { animation: kv-fadein 0.35s ease both; }
    .kv-slidein { animation: kv-slidein 0.3s ease both; }

    .kv-scroll-thin::-webkit-scrollbar { width: 6px; }

    .kv-btn {
      display:inline-flex; align-items:center; gap:8px; border-radius:3px;
      padding:10px 16px; font-size:13px; font-weight:600; letter-spacing:0.04em;
      text-transform:uppercase; border:1px solid var(--line); background:var(--panel-raised);
      color:var(--text); transition: all .15s ease;
    }
    .kv-btn:hover { border-color: var(--amber-dim); background: var(--panel-hi); }
    .kv-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .kv-btn-primary { background: var(--amber); border-color: var(--amber); color:#1A1305; }
    .kv-btn-primary:hover { background:#f0b155; border-color:#f0b155; }
    .kv-btn-primary:disabled { background: var(--amber-dim); border-color: var(--amber-dim); color:#00000066;}
    .kv-btn-ghost { background:transparent; }

    .kv-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 4px; }
    .kv-tag {
      font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.08em;
      padding: 3px 7px; border-radius: 2px; border: 1px solid var(--line); color: var(--text-muted);
      text-transform: uppercase; display:inline-flex; align-items:center; gap:5px;
    }
  `}</style>
);

/* ============================== HELPERS ============================== */

function riskVar(level) {
  if (level === "HIGH") return "var(--high)";
  if (level === "MEDIUM") return "var(--medium)";
  return "var(--low)";
}

function getRiskLevel(risk) {
  if (risk >= 70) return "HIGH";
  if (risk >= 40) return "MEDIUM";
  return "LOW";
}

function getRecommendation(risk) {
  if (risk >= 70) return "PRIORITIZE RANGER PATROL + INCREASE CAMERA MONITORING";
  if (risk >= 40) return "INCREASE PATROL FREQUENCY + MONITOR AREA";
  return "CONTINUE ROUTINE MONITORING";
}

function RiskBadge({ level, size = "md" }) {
  const pad = size === "sm" ? "2px 7px" : "4px 10px";
  const fs = size === "sm" ? "10px" : "11px";
  return (
    <span className="kv-mono" style={{
      color: riskVar(level), border: `1px solid ${riskVar(level)}55`, background: `${riskVar(level)}14`,
      padding: pad, borderRadius: 2, fontSize: fs, letterSpacing: "0.08em", fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: riskVar(level) }} />
      {level}
    </span>
  );
}

function FeatureLevelPill({ level }) {
  return (
    <span className="kv-mono" style={{
      color: riskVar(level), fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
      border: `1px solid ${riskVar(level)}55`, padding: "3px 9px", borderRadius: 2, background: `${riskVar(level)}10`,
    }}>{level}</span>
  );
}

/* ============================== APP CONTEXT ============================== */

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function AppProvider({ children }) {
  const [page, setPage] = useState("command");
  const [detections, setDetections] = useState(INITIAL_DETECTIONS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [gisRiskFilter, setGisRiskFilter] = useState("all");
  const [gisSpeciesFilter, setGisSpeciesFilter] = useState("all");

  const [alertPriorityFilter, setAlertPriorityFilter] = useState("all");
  const [alertStatusFilter, setAlertStatusFilter] = useState("all");
  const [highlightAlertId, setHighlightAlertId] = useState(null);

  const [detectionZoneFilter, setDetectionZoneFilter] = useState("all");
  const [detectionSpeciesFilter, setDetectionSpeciesFilter] = useState("all");
  const [highlightDetectionId, setHighlightDetectionId] = useState(null);

  const [pendingRiskZoneId, setPendingRiskZoneId] = useState("Z-04");
  const [demoOpen, setDemoOpen] = useState(false);

  function navigate(target, opts = {}) {
    setPage(target);
    if (opts.zoneId !== undefined) setSelectedZoneId(opts.zoneId);
    if (opts.gisRiskFilter !== undefined) setGisRiskFilter(opts.gisRiskFilter);
    if (opts.gisSpeciesFilter !== undefined) setGisSpeciesFilter(opts.gisSpeciesFilter);
    if (opts.alertPriorityFilter !== undefined) setAlertPriorityFilter(opts.alertPriorityFilter);
    if (opts.alertStatusFilter !== undefined) setAlertStatusFilter(opts.alertStatusFilter);
    if (opts.highlightAlertId !== undefined) setHighlightAlertId(opts.highlightAlertId);
    if (opts.detectionZoneFilter !== undefined) setDetectionZoneFilter(opts.detectionZoneFilter);
    if (opts.detectionSpeciesFilter !== undefined) setDetectionSpeciesFilter(opts.detectionSpeciesFilter);
    if (opts.highlightDetectionId !== undefined) setHighlightDetectionId(opts.highlightDetectionId);
    if (opts.riskZoneId !== undefined) setPendingRiskZoneId(opts.riskZoneId);
  }

  function addDetection(det) {
    setDetections(prev => [det, ...prev]);
  }

  function createAlertForZone(zoneId) {
    const zone = ZONE_BY_ID[zoneId];
    const id = nextId("A");
    const alert = {
      id, zone: zone.id, species: zone.species, risk: zone.risk,
      priority: getRiskLevel(zone.risk), status: "PENDING",
      reason: `Elevated ${zone.factors.wildlifeActivity.toLowerCase()} wildlife activity near ${zone.settlementProximity.toLowerCase()} settlement proximity`,
      recommended: getRecommendation(zone.risk), timestamp: "Just now",
    };
    setAlerts(prev => [alert, ...prev]);
    return alert;
  }

  function acknowledgeAlert(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a));
  }

  const pendingAlertCount = alerts.filter(a => a.status === "PENDING").length;
  const highRiskZoneCount = ZONES.filter(z => z.riskLevel === "HIGH").length;
  const activeRiskZoneCount = ZONES.filter(z => z.riskLevel !== "LOW").length;

  const value = {
    page, navigate,
    detections, addDetection,
    alerts, createAlertForZone, acknowledgeAlert,
    selectedZoneId, setSelectedZoneId,
    gisRiskFilter, setGisRiskFilter, gisSpeciesFilter, setGisSpeciesFilter,
    alertPriorityFilter, setAlertPriorityFilter, alertStatusFilter, setAlertStatusFilter,
    highlightAlertId, setHighlightAlertId,
    detectionZoneFilter, setDetectionZoneFilter, detectionSpeciesFilter, setDetectionSpeciesFilter,
    highlightDetectionId, setHighlightDetectionId,
    pendingRiskZoneId, setPendingRiskZoneId,
    demoOpen, setDemoOpen,
    pendingAlertCount, highRiskZoneCount, activeRiskZoneCount,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ============================== SHELL ============================== */

function Sidebar({ collapsed, setCollapsed }) {
  const { page, navigate } = useApp();
  return (
    <div style={{
      width: collapsed ? 68 : 232, flexShrink: 0, background: "var(--panel)",
      borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column",
      transition: "width .2s ease", height: "100%",
    }}>
      <div style={{ padding: collapsed ? "20px 0" : "22px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: 4, background: "linear-gradient(135deg, var(--amber), #b5761f)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldAlert size={19} color="#1A1305" />
        </div>
        {!collapsed && (
          <div>
            <div className="kv-display" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1 }}>KAVACH</div>
            <div className="kv-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: 3 }}>EARLY-WARNING SYSTEM</div>
          </div>
        )}
      </div>
      <nav style={{ padding: "14px 10px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)} title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px 0" : "11px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 3, border: "none", background: active ? "var(--panel-hi)" : "transparent",
                borderLeft: active ? "2px solid var(--amber)" : "2px solid transparent",
                color: active ? "var(--text)" : "var(--text-muted)", textAlign: "left",
                fontSize: 13, fontWeight: active ? 600 : 500, transition: "all .15s ease",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--panel-raised)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={2} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <button onClick={() => setCollapsed(c => !c)} className="kv-btn kv-btn-ghost" style={{ margin: 10, justifyContent: "center", borderColor: "var(--line-soft)" }}>
        <Menu size={14} />
        {!collapsed && <span style={{ fontSize: 11 }}>COLLAPSE</span>}
      </button>
    </div>
  );
}

function GlobalSearch() {
  const { navigate } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    ZONES.forEach(z => {
      if (z.name.toLowerCase().includes(q) || z.id.toLowerCase().includes(q) || z.species.toLowerCase().includes(q)) {
        out.push({ type: "ZONE", label: `${z.id} · ${z.name}`, sub: z.species, action: () => navigate("gis", { zoneId: z.id, gisRiskFilter: "all", gisSpeciesFilter: "all" }) });
      }
    });
    INITIAL_DETECTIONS.concat([]).forEach(() => {}); // noop keep list stable
    return out;
  }, [query]);

  const dynamicResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    ZONES.forEach(z => {
      if (z.name.toLowerCase().includes(q) || z.id.toLowerCase().includes(q)) {
        out.push({ type: "ZONE", label: `${z.id} · ${z.name}`, sub: `${z.species} · ${z.riskLevel}`, action: () => { navigate("gis", { zoneId: z.id, gisRiskFilter: "all", gisSpeciesFilter: "all" }); setOpen(false); setQuery(""); } });
      }
    });
    SPECIES_LIST.forEach(sp => {
      if (sp.toLowerCase().includes(q)) {
        out.push({ type: "SPECIES", label: sp, sub: "Filter GIS map", action: () => { navigate("gis", { gisSpeciesFilter: sp, gisRiskFilter: "all", zoneId: null }); setOpen(false); setQuery(""); } });
      }
    });
    return out.slice(0, 8);
  }, [query, navigate]);

  return (
    <div ref={ref} style={{ position: "relative", width: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--panel-raised)", border: "1px solid var(--line)", borderRadius: 3, padding: "8px 12px" }}>
        <Search size={14} color="var(--text-dim)" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search zone, species, alert…"
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" }}
        />
        {query && <X size={13} color="var(--text-dim)" onClick={() => setQuery("")} />}
      </div>
      {open && query && (
        <div className="kv-panel kv-fadein" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, maxHeight: 280, overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
          {dynamicResults.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: "var(--text-dim)" }}>No matches for "{query}"</div>}
          {dynamicResults.map((r, i) => (
            <button key={i} onClick={r.action} style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid var(--line-soft)", textAlign: "left" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{r.label}</div>
                <div className="kv-mono" style={{ fontSize: 10.5, color: "var(--text-dim)" }}>{r.sub}</div>
              </div>
              <span className="kv-tag">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { page, setDemoOpen } = useApp();
  const current = NAV_ITEMS.find(n => n.id === page);
  return (
    <div style={{ padding: "18px 28px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, background: "rgba(10,16,12,0.7)", backdropFilter: "blur(6px)" }}>
      <div>
        <div className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.12em", marginBottom: 3 }}>KAVACH / {current?.id.toUpperCase()}</div>
        <div className="kv-display" style={{ fontSize: 22, fontWeight: 700 }}>{current?.label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <GlobalSearch />
        <button className="kv-btn kv-btn-primary" onClick={() => setDemoOpen(true)}>
          <Play size={13} /> RUN KAVACH DEMO
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const { page, demoOpen } = useApp();

  useEffect(() => {
    function handle() { setCollapsed(window.innerWidth < 980); }
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <div className="kavach" style={{ display: "flex", minHeight: "100vh" }}>
      <GlobalStyle />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ padding: "26px 28px 60px", flex: 1 }}>
          {page === "command" && <CommandCenter />}
          {page === "wildlife" && <WildlifeDetection />}
          {page === "risk" && <RiskIntelligence />}
          {page === "gis" && <GISMap />}
          {page === "alerts" && <AlertsPage />}
          {page === "pipeline" && <PipelinePage />}
        </div>
      </div>
      {demoOpen && <DemoModal />}
    </div>
  );
}

/* ============================== COMMAND CENTER ============================== */

function KPICard({ label, value, icon: Icon, accent, onClick, sub }) {
  return (
    <button onClick={onClick} className="kv-panel kv-fadein" style={{
      padding: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 14,
      transition: "all .15s ease", position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 34, height: 34, borderRadius: 3, background: `${accent}18`, border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={accent} />
        </div>
        <ChevronRight size={15} color="var(--text-dim)" />
      </div>
      <div>
        <div className="kv-display" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: "var(--text)" }}>{value}</div>
        <div className="kv-mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", marginTop: 8, textTransform: "uppercase" }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
      </div>
    </button>
  );
}

function CommandCenter() {
  const { navigate, detections, alerts, activeRiskZoneCount, highRiskZoneCount, pendingAlertCount } = useApp();
  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="kv-fadein">
      <div className="kv-panel" style={{ padding: "28px 30px", marginBottom: 22, background: "linear-gradient(120deg, rgba(232,163,61,0.08), rgba(17,26,19,0.4))", position: "relative", overflow: "hidden" }}>
        <div className="kv-tag" style={{ marginBottom: 12 }}><Radio size={11} /> DECISION-SUPPORT PROTOTYPE</div>
        <div className="kv-display" style={{ fontSize: 28, fontWeight: 700, maxWidth: 640, lineHeight: 1.15 }}>
          Human–wildlife conflict, seen before it happens.
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
          KAVACH links camera-trap detection, historical conflict data and settlement proximity into a single
          early-warning pipeline — flagging high-risk corridors before an encounter occurs. Final decisions remain
          with trained conservation professionals.
        </div>
        <button className="kv-btn kv-btn-primary" style={{ marginTop: 18 }} onClick={() => useApp().setDemoOpen ? null : null}>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KPICard label="Wildlife Detections" value={detections.length} icon={Camera} accent="#5AA9E6"
          sub="All logged camera-trap detections"
          onClick={() => navigate("wildlife", { detectionZoneFilter: "all", detectionSpeciesFilter: "all", highlightDetectionId: null })} />
        <KPICard label="Active Risk Zones" value={activeRiskZoneCount} icon={Activity} accent="var(--medium)"
          sub="Medium + high risk corridors"
          onClick={() => navigate("gis", { gisRiskFilter: "active", gisSpeciesFilter: "all", zoneId: null })} />
        <KPICard label="High-Risk Zones" value={highRiskZoneCount} icon={AlertTriangle} accent="var(--high)"
          sub="Zones flagged HIGH this cycle"
          onClick={() => navigate("gis", { gisRiskFilter: "high", gisSpeciesFilter: "all", zoneId: null })} />
        <KPICard label="Pending Alerts" value={pendingAlertCount} icon={BellRing} accent="var(--amber)"
          sub="Awaiting acknowledgement"
          onClick={() => navigate("alerts", { alertStatusFilter: "pending", alertPriorityFilter: "all" })} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <div className="kv-panel" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="kv-display" style={{ fontSize: 16, fontWeight: 700 }}>ZONE RISK OVERVIEW</div>
            <button className="kv-btn kv-btn-ghost" onClick={() => navigate("gis", { zoneId: null, gisRiskFilter: "all", gisSpeciesFilter: "all" })} style={{ fontSize: 11, padding: "6px 10px" }}>
              OPEN GIS MAP <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ZONES.map(z => (
              <button key={z.id} onClick={() => navigate("gis", { zoneId: z.id, gisRiskFilter: "all", gisSpeciesFilter: "all" })}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--panel-raised)", border: "1px solid var(--line-soft)", borderRadius: 3, textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line-soft)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="kv-mono" style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{z.id}</span>
                  <span style={{ fontSize: 13 }}>{z.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>· {z.species}</span>
                </div>
                <RiskBadge level={z.riskLevel} size="sm" />
              </button>
            ))}
          </div>
        </div>

        <div className="kv-panel" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="kv-display" style={{ fontSize: 16, fontWeight: 700 }}>RECENT ALERTS</div>
            <button className="kv-btn kv-btn-ghost" onClick={() => navigate("alerts", { alertStatusFilter: "all", alertPriorityFilter: "all" })} style={{ fontSize: 11, padding: "6px 10px" }}>
              VIEW ALL <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentAlerts.length === 0 && <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>No alerts yet — run the demo to generate one.</div>}
            {recentAlerts.map(a => (
              <button key={a.id} onClick={() => navigate("alerts", { alertStatusFilter: "all", alertPriorityFilter: "all", highlightAlertId: a.id })}
                style={{ padding: "10px 12px", background: "var(--panel-raised)", border: "1px solid var(--line-soft)", borderRadius: 3, textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="kv-mono" style={{ fontSize: 11 }}>{a.id} · {a.zone}</span>
                  <RiskBadge level={a.priority} size="sm" />
                </div>
                <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--text-muted)" }}>{a.species} — {a.status}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== WILDLIFE DETECTION ============================== */

function WildlifeDetection() {
  const { addDetection, navigate, detections, detectionZoneFilter, setDetectionZoneFilter,
    detectionSpeciesFilter, setDetectionSpeciesFilter, highlightDetectionId, setHighlightDetectionId } = useApp();

  const [selectedImageId, setSelectedImageId] = useState(null);
  const [uploadedName, setUploadedName] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [result, setResult] = useState(null);
  const timers = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const activeSource = uploadedName
    ? { label: uploadedName, species: DEMO_IMAGES[0].species, confidence: DEMO_IMAGES[0].confidence, zone: DEMO_IMAGES[0].zone, uploaded: true }
    : DEMO_IMAGES.find(d => d.id === selectedImageId);

  function pickDemo(id) {
    setUploadedName(null);
    setSelectedImageId(id);
    setResult(null);
  }
  function handleUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedImageId(null);
    setUploadedName(f.name);
    setResult(null);
  }

  function analyze() {
    if (!activeSource) return;
    setAnalyzing(true);
    setResult(null);
    setStageIdx(0);
    PROCESSING_STAGES.forEach((_, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setStageIdx(i), i * 650);
      timers.current.push(t);
    });
    const done = setTimeout(() => {
      const id = nextId("D");
      const det = { id, species: activeSource.species, confidence: activeSource.confidence, zone: activeSource.zone, timestamp: "Just now" };
      setResult(det);
      addDetection(det);
      setAnalyzing(false);
    }, PROCESSING_STAGES.length * 650);
    timers.current.push(done);
  }

  const filteredDetections = detections.filter(d =>
    (detectionZoneFilter === "all" || d.zone === detectionZoneFilter) &&
    (detectionSpeciesFilter === "all" || d.species === detectionSpeciesFilter)
  );

  return (
    <div className="kv-fadein" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
      <div className="kv-panel" style={{ padding: 22 }}>
        <div className="kv-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>1 · SELECT INPUT</div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 16 }}>Upload a camera-trap image or choose a demo capture.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          {DEMO_IMAGES.map(img => {
            const active = selectedImageId === img.id;
            return (
              <button key={img.id} onClick={() => pickDemo(img.id)}
                style={{
                  padding: 12, borderRadius: 3, border: `1px solid ${active ? "var(--amber)" : "var(--line-soft)"}`,
                  background: active ? "rgba(232,163,61,0.08)" : "var(--panel-raised)", textAlign: "left", display: "flex", flexDirection: "column", gap: 8,
                }}>
                <div style={{ width: "100%", height: 56, borderRadius: 3, background: "repeating-linear-gradient(45deg, #182419, #182419 6px, #14201700 6px, #14201700 12px)", border: "1px solid var(--line-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={18} color="var(--text-dim)" />
                </div>
                <div className="kv-mono" style={{ fontSize: 10.5 }}>{img.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>{img.desc}</div>
              </button>
            );
          })}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
        <button className="kv-btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileInputRef.current?.click()}>
          <Upload size={13} /> {uploadedName ? uploadedName : "UPLOAD YOUR OWN IMAGE"}
        </button>

        <button className="kv-btn kv-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} disabled={!activeSource || analyzing} onClick={analyze}>
          <ScanLine size={14} /> ANALYZE IMAGE
        </button>

        {analyzing && (
          <div className="kv-panel kv-fadein" style={{ marginTop: 16, padding: 16, background: "var(--panel-raised)" }}>
            {PROCESSING_STAGES.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", opacity: i <= stageIdx ? 1 : 0.35 }}>
                {i < stageIdx ? <CheckCircle2 size={14} color="var(--low)" /> : i === stageIdx ? <RefreshCw size={14} color="var(--amber)" style={{ animation: "kv-spin 1s linear infinite" }} /> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--line)" }} />}
                <span className="kv-mono" style={{ fontSize: 11.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {result && !analyzing && (
          <div className="kv-panel kv-fadein" style={{ marginTop: 16, padding: 18, borderColor: "var(--amber-dim)" }}>
            <div className="kv-tag" style={{ marginBottom: 10 }}>DEMO MODEL OUTPUT</div>
            <div className="kv-display" style={{ fontSize: 22, fontWeight: 700 }}>{result.species.toUpperCase()}</div>
            <div className="kv-mono" style={{ color: "var(--amber)", fontSize: 14, marginTop: 2 }}>{result.confidence}% CONFIDENCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div><div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>ZONE</div><div style={{ fontSize: 13 }}>{result.zone} · {ZONE_BY_ID[result.zone].name}</div></div>
              <div><div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>TIMESTAMP</div><div style={{ fontSize: 13 }}>{result.timestamp}</div></div>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={13} color="var(--low)" /><span className="kv-mono" style={{ fontSize: 11, color: "var(--low)" }}>DETECTION COMPLETE</span>
            </div>
            <button className="kv-btn kv-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
              onClick={() => navigate("risk", { riskZoneId: result.zone })}>
              ANALYZE CONFLICT RISK <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="kv-panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="kv-display" style={{ fontSize: 16, fontWeight: 700 }}>DETECTION HISTORY</div>
          <span className="kv-tag">DEMO DATA</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <select value={detectionSpeciesFilter} onChange={e => setDetectionSpeciesFilter(e.target.value)} style={selStyle}>
            <option value="all">All species</option>
            {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={detectionZoneFilter} onChange={e => setDetectionZoneFilter(e.target.value)} style={selStyle}>
            <option value="all">All zones</option>
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.id} · {z.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
          {filteredDetections.map(d => (
            <div key={d.id} onClick={() => setHighlightDetectionId(d.id)}
              style={{
                padding: "12px 14px", borderRadius: 3, border: `1px solid ${highlightDetectionId === d.id ? "var(--amber)" : "var(--line-soft)"}`,
                background: "var(--panel-raised)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
              }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.species}</div>
                <div className="kv-mono" style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 3 }}>{d.id} · {d.zone} · {d.timestamp}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="kv-mono" style={{ fontSize: 13, color: "var(--amber)" }}>{d.confidence}%</div>
                <button onClick={(e) => { e.stopPropagation(); navigate("risk", { riskZoneId: d.zone }); }} style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 10.5, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                  ANALYZE <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ))}
          {filteredDetections.length === 0 && <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>No detections match this filter.</div>}
        </div>
      </div>
    </div>
  );
}

const selStyle = {
  background: "var(--panel-raised)", border: "1px solid var(--line)", color: "var(--text)",
  fontSize: 12, padding: "8px 10px", borderRadius: 3, outline: "none",
};

/* ============================== RISK INTELLIGENCE ============================== */

function RiskIntelligence() {
  const { pendingRiskZoneId, setPendingRiskZoneId, navigate, createAlertForZone } = useApp();
  const zone = ZONE_BY_ID[pendingRiskZoneId] || ZONES[3];
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [alertCreated, setAlertCreated] = useState(null);
  const timers = useRef([]);

  useEffect(() => { setShowResult(false); setAlertCreated(null); }, [pendingRiskZoneId]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    setAnalyzing(true);
    setShowResult(false);
    const t = setTimeout(() => { setAnalyzing(false); setShowResult(true); }, 1100);
    timers.current.push(t);
  }

  function createAlert() {
    const a = createAlertForZone(zone.id);
    setAlertCreated(a);
  }

  const featureLabels = [
    ["Wildlife Activity", "wildlifeActivity"],
    ["Historical Conflict", "historicalConflict"],
    ["Settlement Proximity", "settlementProximity"],
    ["Temporal Pattern", "temporalPattern"],
    ["Environmental Context", "environmentalContext"],
    ["Spatial Relationship", "spatialRelationship"],
  ];

  return (
    <div className="kv-fadein" style={{ maxWidth: 880 }}>
      <div className="kv-panel" style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div className="kv-display" style={{ fontSize: 16, fontWeight: 700 }}>INPUT FEATURES</div>
          <select value={pendingRiskZoneId} onChange={e => setPendingRiskZoneId(e.target.value)} style={selStyle}>
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.id} · {z.name} ({z.species})</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {featureLabels.map(([label, key]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "var(--panel-raised)", border: "1px solid var(--line-soft)", borderRadius: 3 }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <FeatureLevelPill level={zone.factors[key]} />
            </div>
          ))}
        </div>
        <button className="kv-btn kv-btn-primary" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} disabled={analyzing} onClick={run}>
          {analyzing ? <><RefreshCw size={14} style={{ animation: "kv-spin 1s linear infinite" }} /> RUNNING RISK MODEL…</> : <><Crosshair size={14} /> RUN RISK ANALYSIS</>}
        </button>
      </div>

      {showResult && (
        <div className="kv-panel kv-fadein" style={{ padding: 24, borderColor: "var(--amber-dim)" }}>
          <div className="kv-tag" style={{ marginBottom: 12 }}>PROTOTYPE MODEL · ZONE {zone.id}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div className="kv-display" style={{ fontSize: 52, fontWeight: 700, color: riskVar(zone.riskLevel), lineHeight: 1 }}>{zone.risk}%</div>
            <RiskBadge level={zone.riskLevel} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>CONFLICT RISK SCORE — {zone.name}, {zone.species}</div>

          <div style={{ marginTop: 20 }}>
            <div className="kv-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10, letterSpacing: "0.06em" }}>TOP CONTRIBUTING FACTORS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {zone.topFactors.map((f, i) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--panel-raised)", borderRadius: 3, border: "1px solid var(--line-soft)" }}>
                  <span className="kv-mono" style={{ color: "var(--amber)", fontSize: 12 }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 14, background: "rgba(232,163,61,0.06)", border: "1px solid var(--amber-dim)", borderRadius: 3 }}>
            <div className="kv-mono" style={{ fontSize: 10.5, color: "var(--amber)", marginBottom: 4 }}>RECOMMENDED</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{getRecommendation(zone.risk)}</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button className="kv-btn" onClick={() => navigate("gis", { zoneId: zone.id, gisRiskFilter: "all", gisSpeciesFilter: "all" })}>
              <MapIcon size={13} /> VIEW ON GIS
            </button>
            {!alertCreated ? (
              <button className="kv-btn kv-btn-primary" onClick={createAlert}>
                <Bell size={13} /> CREATE ALERT
              </button>
            ) : (
              <button className="kv-btn" style={{ borderColor: "var(--low)", color: "var(--low)" }} onClick={() => navigate("alerts", { alertStatusFilter: "all", alertPriorityFilter: "all", highlightAlertId: alertCreated.id })}>
                <CheckCircle2 size={13} /> {alertCreated.id} CREATED — VIEW IN ALERTS
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== GIS MAP ============================== */

function ZoneMarker({ zone, muted, onClick, layer }) {
  const color = riskVar(zone.riskLevel);
  return (
    <div onClick={onClick} style={{
      position: "absolute", left: `${zone.x}%`, top: `${zone.y}%`, transform: "translate(-50%,-50%)",
      cursor: "pointer", opacity: muted ? 0.18 : 1, transition: "opacity .2s ease", zIndex: muted ? 1 : 2,
    }}>
      <div style={{ position: "relative", width: 18, height: 18 }}>
        {zone.riskLevel === "HIGH" && !muted && (
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${color}`, animation: "kv-pulse 1.8s ease-out infinite" }} />
        )}
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, border: "2px solid #0A100C", boxShadow: `0 0 10px ${color}88` }} />
      </div>
      <div className="kv-mono" style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", fontSize: 9.5, color: "var(--text-muted)", whiteSpace: "nowrap", background: "rgba(10,16,12,0.75)", padding: "1px 5px", borderRadius: 2 }}>
        {zone.id}
      </div>
    </div>
  );
}

function GISMap() {
  const { selectedZoneId, setSelectedZoneId, gisRiskFilter, setGisRiskFilter, gisSpeciesFilter, setGisSpeciesFilter, navigate } = useApp();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [layer, setLayer] = useState("risk");
  const dragState = useRef(null);

  const selectedZone = selectedZoneId ? ZONE_BY_ID[selectedZoneId] : null;

  function matchesFilter(z) {
    const riskOk = gisRiskFilter === "all" ? true
      : gisRiskFilter === "active" ? z.riskLevel !== "LOW"
      : z.riskLevel.toLowerCase() === gisRiskFilter;
    const speciesOk = gisSpeciesFilter === "all" || z.species === gisSpeciesFilter;
    return riskOk && speciesOk;
  }

  function onMouseDown(e) { dragState.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }; }
  function onMouseMove(e) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.ox + dx, y: dragState.current.oy + dy });
  }
  function onMouseUp() { dragState.current = null; }

  return (
    <div className="kv-fadein" style={{ display: "grid", gridTemplateColumns: selectedZone ? "1fr 340px" : "1fr", gap: 18 }}>
      <div className="kv-panel" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={gisRiskFilter} onChange={e => setGisRiskFilter(e.target.value)} style={selStyle}>
              <option value="all">Risk: All</option>
              <option value="low">Risk: Low</option>
              <option value="medium">Risk: Medium</option>
              <option value="high">Risk: High</option>
              <option value="active">Risk: Active (Med+High)</option>
            </select>
            <select value={gisSpeciesFilter} onChange={e => setGisSpeciesFilter(e.target.value)} style={selStyle}>
              <option value="all">Species: All</option>
              {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="kv-btn" onClick={() => setLayer(l => l === "risk" ? "species" : "risk")} style={{ fontSize: 11 }}>
              <Layers size={13} /> LAYER: {layer.toUpperCase()}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="kv-btn" onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))}><ZoomOut size={14} /></button>
            <button className="kv-btn" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}><Compass size={14} /></button>
            <button className="kv-btn" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}><ZoomIn size={14} /></button>
          </div>
        </div>

        <div
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{
            position: "relative", height: 560, borderRadius: 4, overflow: "hidden", border: "1px solid var(--line-soft)",
            background: "radial-gradient(circle at 30% 20%, #16241a 0%, #0d160f 55%, #0a100c 100%)",
            cursor: dragState.current ? "grabbing" : "grab",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px", transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "center",
          }} />
          <div style={{
            position: "absolute", width: 3, height: 3, borderRadius: "50%", left: "50%", top: "50%",
            transform: `translate(-50%,-50%) rotate(0deg)`, transformOrigin: "center",
          }}>
            <div style={{ position: "absolute", width: 420, height: 420, left: -210, top: -210, borderRadius: "50%", border: "1px solid rgba(232,163,61,0.08)" }} />
            <div style={{ position: "absolute", width: 420, height: 420, left: -210, top: -210, background: "conic-gradient(from 0deg, rgba(232,163,61,0.14), transparent 40deg)", borderRadius: "50%", animation: "kv-sweep 6s linear infinite" }} />
          </div>

          <div style={{ position: "absolute", inset: 0, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "center" }}>
            {ZONES.map(z => (
              <ZoneMarker key={z.id} zone={z} layer={layer} muted={!matchesFilter(z)}
                onClick={() => setSelectedZoneId(z.id)} />
            ))}
          </div>

          <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 14 }} className="kv-mono">
            {["LOW", "MEDIUM", "HIGH"].map(l => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "var(--text-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: riskVar(l) }} /> {l}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 12, right: 14 }} className="kv-tag">DEMO GIS · {ZONES.filter(matchesFilter).length} ZONES SHOWN</div>
        </div>
      </div>

      {selectedZone && (
        <div className="kv-panel kv-slidein" style={{ padding: 20, height: "fit-content", position: "sticky", top: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="kv-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{selectedZone.id}</div>
              <div className="kv-display" style={{ fontSize: 19, fontWeight: 700 }}>{selectedZone.name}</div>
            </div>
            <button onClick={() => setSelectedZoneId(null)} style={{ background: "transparent", border: "none", color: "var(--text-dim)" }}><X size={16} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
            <div className="kv-display" style={{ fontSize: 36, fontWeight: 700, color: riskVar(selectedZone.riskLevel) }}>{selectedZone.risk}%</div>
            <RiskBadge level={selectedZone.riskLevel} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{selectedZone.species}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            <InfoCell label="Recent Detections" value={selectedZone.recentDetections} />
            <InfoCell label="Historical Conflicts" value={selectedZone.historicalConflicts} />
            <InfoCell label="Settlement Proximity" value={selectedZone.settlementProximity} />
            <InfoCell label="Recommended" value={getRecommendation(selectedZone.risk)} small />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="kv-mono" style={{ fontSize: 10.5, color: "var(--text-dim)", marginBottom: 6 }}>ENVIRONMENTAL CONTEXT</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{selectedZone.environmentalContext}</div>
          </div>

          <button className="kv-btn kv-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
            onClick={() => navigate("risk", { riskZoneId: selectedZone.id })}>
            VIEW FULL RISK ANALYSIS <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, small }) {
  return (
    <div style={{ background: "var(--panel-raised)", border: "1px solid var(--line-soft)", borderRadius: 3, padding: "9px 11px" }}>
      <div className="kv-mono" style={{ fontSize: 9.5, color: "var(--text-dim)", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: small ? 11.5 : 14, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

/* ============================== ALERTS ============================== */

function AlertCard({ alert, highlighted }) {
  const { navigate, acknowledgeAlert } = useApp();
  return (
    <div className="kv-panel kv-fadein" style={{ padding: 18, borderColor: highlighted ? "var(--amber)" : "var(--line)", background: highlighted ? "rgba(232,163,61,0.05)" : "var(--panel)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RiskBadge level={alert.priority} />
          <span className="kv-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{alert.id}</span>
        </div>
        <span className="kv-tag" style={{ color: alert.status === "PENDING" ? "var(--amber)" : "var(--low)", borderColor: alert.status === "PENDING" ? "var(--amber-dim)" : "#2c4a35" }}>
          {alert.status}
        </span>
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 10 }}>
        <div className="kv-display" style={{ fontSize: 18, fontWeight: 700 }}>{alert.zone} · {ZONE_BY_ID[alert.zone].name}</div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{alert.species} — <span className="kv-mono" style={{ color: riskVar(alert.priority) }}>{alert.risk}% risk</span></div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.6 }}>{alert.reason}</div>
      <div style={{ marginTop: 10, padding: "8px 11px", background: "var(--panel-raised)", borderRadius: 3, border: "1px solid var(--line-soft)" }}>
        <span className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>RECOMMENDED · </span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{alert.recommended}</span>
      </div>
      <div className="kv-mono" style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 10 }}>{alert.timestamp}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="kv-btn" style={{ fontSize: 11 }} onClick={() => navigate("gis", { zoneId: alert.zone, gisRiskFilter: "all", gisSpeciesFilter: "all" })}>
          <MapIcon size={12} /> VIEW ON MAP
        </button>
        <button className="kv-btn" style={{ fontSize: 11 }} onClick={() => navigate("risk", { riskZoneId: alert.zone })}>
          <ShieldAlert size={12} /> VIEW ANALYSIS
        </button>
        {alert.status === "PENDING" && (
          <button className="kv-btn kv-btn-primary" style={{ fontSize: 11 }} onClick={() => acknowledgeAlert(alert.id)}>
            <Check size={12} /> ACKNOWLEDGE
          </button>
        )}
      </div>
    </div>
  );
}

function AlertsPage() {
  const { alerts, alertPriorityFilter, setAlertPriorityFilter, alertStatusFilter, setAlertStatusFilter, highlightAlertId } = useApp();
  const filtered = alerts.filter(a =>
    (alertPriorityFilter === "all" || a.priority.toLowerCase() === alertPriorityFilter) &&
    (alertStatusFilter === "all" || a.status.toLowerCase() === alertStatusFilter)
  );
  return (
    <div className="kv-fadein" style={{ maxWidth: 780 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <select value={alertPriorityFilter} onChange={e => setAlertPriorityFilter(e.target.value)} style={selStyle}>
          <option value="all">Priority: All</option>
          <option value="high">Priority: High</option>
          <option value="medium">Priority: Medium</option>
          <option value="low">Priority: Low</option>
        </select>
        <select value={alertStatusFilter} onChange={e => setAlertStatusFilter(e.target.value)} style={selStyle}>
          <option value="all">Status: All</option>
          <option value="pending">Status: Pending</option>
          <option value="acknowledged">Status: Acknowledged</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.length === 0 && <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No alerts match this filter.</div>}
        {filtered.map(a => <AlertCard key={a.id} alert={a} highlighted={highlightAlertId === a.id} />)}
      </div>
    </div>
  );
}

/* ============================== PIPELINE ============================== */

function PipelinePage() {
  const { navigate } = useApp();
  const stages = [
    { id: "CAMERA TRAP", icon: Camera, desc: "Field devices capture motion-triggered imagery across monitored corridors.", go: () => navigate("wildlife", {}) },
    { id: "AI DETECTION", icon: ScanLine, desc: "Species classification runs against each capture with a confidence score.", go: () => navigate("wildlife", {}) },
    { id: "CONTEXT INTEGRATION", icon: Layers, desc: "Detection is merged with historical conflict and settlement-proximity data.", go: () => navigate("risk", { riskZoneId: "Z-04" }) },
    { id: "RISK PREDICTION", icon: ShieldAlert, desc: "The risk model scores the encounter likelihood for the zone.", go: () => navigate("risk", { riskZoneId: "Z-04" }) },
    { id: "GIS HOTSPOT", icon: MapIcon, desc: "High-risk corridors are surfaced on the live map for spatial context.", go: () => navigate("gis", { zoneId: "Z-04", gisRiskFilter: "all", gisSpeciesFilter: "all" }) },
    { id: "EARLY ACTION", icon: Bell, desc: "An alert is raised so field teams can prioritize monitoring or patrol.", go: () => navigate("alerts", { alertStatusFilter: "all", alertPriorityFilter: "all" }) },
  ];
  return (
    <div className="kv-fadein" style={{ maxWidth: 620 }}>
      <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.6 }}>
        The chain from field observation to field action. Click any stage to open its working view.
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.id} style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--panel-raised)", border: "1px solid var(--amber-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color="var(--amber)" />
                </div>
                {i < stages.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--line)", minHeight: 34 }} />}
              </div>
              <button onClick={s.go} className="kv-panel" style={{ flex: 1, marginBottom: 18, padding: "14px 16px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--amber-dim)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
              >
                <div>
                  <div className="kv-display" style={{ fontSize: 15, fontWeight: 700 }}>{i + 1}. {s.id}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
                <ChevronRight size={16} color="var(--text-dim)" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== DEMO MODAL ============================== */

const DEMO_STEPS = [
  "Selecting camera-trap image",
  "Running AI detection",
  "Integrating context features",
  "Running risk prediction engine",
  "Computing conflict risk score",
  "Highlighting GIS hotspot",
  "Creating early-warning alert",
  "Updating Command Center",
];

function DemoModal() {
  const { setDemoOpen, addDetection, createAlertForZone, navigate } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const committed = useRef(false);
  const timers = useRef([]);

  const zone = ZONE_BY_ID["Z-04"];

  useEffect(() => {
    DEMO_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i);
        if (i === 6 && !committed.current) {
          committed.current = true;
          const det = { id: nextId("D"), species: "Asian Elephant", confidence: 94, zone: "Z-04", timestamp: "Just now" };
          addDetection(det);
          createAlertForZone("Z-04");
        }
        if (i === DEMO_STEPS.length - 1) {
          const t2 = setTimeout(() => setDone(true), 900);
          timers.current.push(t2);
        }
      }, i * 900);
      timers.current.push(t);
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function finish() {
    setDemoOpen(false);
    navigate("command", {});
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,10,7,0.78)", backdropFilter: "blur(3px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="kv-panel kv-fadein" style={{ width: "min(720px, 100%)", maxHeight: "88vh", overflowY: "auto", padding: 26, position: "relative" }}>
        <button onClick={() => setDemoOpen(false)} style={{ position: "absolute", top: 18, right: 18, background: "transparent", border: "none", color: "var(--text-dim)" }}><X size={18} /></button>
        <div className="kv-tag" style={{ marginBottom: 10 }}><Play size={11} /> KAVACH END-TO-END DEMO</div>
        <div className="kv-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Observation → Intelligence → Prediction → Location → Action</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
          {DEMO_STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", opacity: i <= step ? 1 : 0.32 }}>
              {i < step ? <CheckCircle2 size={15} color="var(--low)" /> : i === step ? <RefreshCw size={15} color="var(--amber)" style={{ animation: "kv-spin 1s linear infinite" }} /> : <div style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid var(--line)" }} />}
              <span className="kv-mono" style={{ fontSize: 12 }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {step >= 1 && (
          <div className="kv-panel kv-fadein" style={{ padding: 16, marginBottom: 12, background: "var(--panel-raised)" }}>
            <div className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>DETECTION</div>
            <div className="kv-display" style={{ fontSize: 20, fontWeight: 700 }}>ASIAN ELEPHANT</div>
            <div className="kv-mono" style={{ color: "var(--amber)", fontSize: 13 }}>94% CONFIDENCE · ZONE Z-04</div>
          </div>
        )}

        {step >= 2 && (
          <div className="kv-panel kv-fadein" style={{ padding: 16, marginBottom: 12, background: "var(--panel-raised)" }}>
            <div className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 8 }}>CONTEXT FEATURES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["Wildlife Activity", "HIGH"], ["Historical Conflict", "HIGH"], ["Settlement Proximity", "HIGH"], ["Temporal Pattern", "MEDIUM"], ["Environment", "MEDIUM"]].map(([l, v]) => (
                <span key={l} className="kv-mono" style={{ fontSize: 10.5, padding: "5px 9px", borderRadius: 2, border: `1px solid ${riskVar(v)}55`, color: riskVar(v) }}>{l}: {v}</span>
              ))}
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="kv-panel kv-fadein" style={{ padding: 16, marginBottom: 12, background: "var(--panel-raised)" }}>
            <div className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>RISK RESULT</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div className="kv-display" style={{ fontSize: 32, fontWeight: 700, color: "var(--high)" }}>89%</div>
              <RiskBadge level="HIGH" />
            </div>
          </div>
        )}

        {step >= 5 && (
          <div className="kv-panel kv-fadein" style={{ padding: 16, marginBottom: 12, background: "var(--panel-raised)" }}>
            <div className="kv-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 8 }}>GIS HOTSPOT</div>
            <div style={{ position: "relative", height: 90, borderRadius: 3, background: "radial-gradient(circle at 50% 50%, #16241a, #0a100c)", overflow: "hidden" }}>
              <ZoneMarker zone={zone} muted={false} onClick={() => {}} />
            </div>
          </div>
        )}

        {step >= 6 && (
          <div className="kv-panel kv-fadein" style={{ padding: 16, marginBottom: 4, borderColor: "var(--amber-dim)" }}>
            <div className="kv-mono" style={{ fontSize: 10, color: "var(--amber)", marginBottom: 6 }}>ALERT CREATED</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>HIGH PRIORITY · ZONE Z-04 · {getRecommendation(zone.risk)}</div>
          </div>
        )}

        {done && (
          <button className="kv-btn kv-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={finish}>
            RETURN TO COMMAND CENTER <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================== ROOT ============================== */

export default function KavachApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}