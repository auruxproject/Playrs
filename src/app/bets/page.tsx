"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlayerCard } from "@/components/player/PlayerCard";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";

// ─── Position metadata ────────────────────────────────────────────────────────
const POSITION_INFO: Record<string, { label: string; icon: string; color: string }> = {
  GK: { label: "Portero", icon: "🧤", color: "bg-amber-500/15 border-amber-400/40 text-amber-600" },
  DF: { label: "Defensa", icon: "🛡️", color: "bg-purple/15 border-purple/40 text-purple" },
  MD: { label: "Mediocampista", icon: "🎯", color: "bg-blue/15 border-blue/40 text-blue" },
  FW: { label: "Delantero", icon: "⚽", color: "bg-green/15 border-green/40 text-green" },
};

// ─── Bet types per position ───────────────────────────────────────────────────
type BetMetric = {
  id: string;
  label: string;
  icon: string;
  description: string;
  isBinary?: boolean; // No numeric target needed
  unit?: string;
  defaultValue?: number;
};

const METRICS_BY_POSITION: Record<string, BetMetric[]> = {
  FW: [
    { id: "goals",        label: "Goles",               icon: "⚽", description: "Mínimo de goles anotados en el partido",        unit: "goles",    defaultValue: 1 },
    { id: "assists",      label: "Asistencias",          icon: "🎯", description: "Mínimo de asistencias de gol en el partido",    unit: "asist.",   defaultValue: 1 },
    { id: "shots",        label: "Tiros al Arco",        icon: "🥅", description: "Mínimo de disparos directos al arco",           unit: "tiros",    defaultValue: 2 },
    { id: "brace",        label: "Doblete",              icon: "🔥", description: "El jugador anota exactamente 2 goles",          isBinary: true },
    { id: "hattrick",     label: "Hat-trick",            icon: "🎩", description: "El jugador anota 3 o más goles en el partido",  isBinary: true },
    { id: "goalplusassist", label: "Gol + Asistencia",  icon: "💥", description: "El jugador anota Y asiste en el mismo partido", isBinary: true },
    { id: "points",       label: "Rendimiento",          icon: "📊", description: "Puntuación de rendimiento total en la jornada", unit: "pts",      defaultValue: 75 },
  ],
  MD: [
    { id: "assists",      label: "Asistencias",          icon: "🎯", description: "Mínimo de asistencias en el partido",           unit: "asist.",   defaultValue: 1 },
    { id: "keypasses",    label: "Pases Clave",          icon: "🔑", description: "Pases que generan ocasiones de gol",            unit: "pases",    defaultValue: 2 },
    { id: "goals",        label: "Goles",                icon: "⚽", description: "Mínimo de goles anotados en el partido",        unit: "goles",    defaultValue: 1 },
    { id: "deflections",  label: "Recuperaciones",       icon: "🛡️", description: "Balones recuperados al rival",                  unit: "recup.",   defaultValue: 3 },
    { id: "duels",        label: "Duelos Ganados",       icon: "💪", description: "Duelos físicos/aéreos ganados",                 unit: "duelos",   defaultValue: 4 },
    { id: "goalplusassist", label: "Gol + Asistencia",  icon: "💥", description: "El jugador anota Y asiste en el mismo partido", isBinary: true },
    { id: "points",       label: "Rendimiento",          icon: "📊", description: "Puntuación de rendimiento total en la jornada", unit: "pts",      defaultValue: 75 },
  ],
  DF: [
    { id: "cleanSheet",   label: "Portería a Cero",      icon: "🔒", description: "El equipo no recibe goles en el partido",       isBinary: true },
    { id: "deflections",  label: "Recuperaciones",       icon: "🛡️", description: "Balones recuperados al rival",                  unit: "recup.",   defaultValue: 3 },
    { id: "clearances",   label: "Despejes",             icon: "✊", description: "Despejes exitosos dentro del área",             unit: "despejes", defaultValue: 3 },
    { id: "interceptions", label: "Intercepciones",      icon: "✋", description: "Pases cortados antes de llegar al destino",     unit: "interc.",  defaultValue: 2 },
    { id: "goals",        label: "Gol (Set Piece)",      icon: "⚽", description: "Gol de córner, tiro libre o penalti",           isBinary: true },
    { id: "duels",        label: "Duelos Aéreos",        icon: "💪", description: "Duelos aéreos y de marcaje ganados",            unit: "duelos",   defaultValue: 4 },
    { id: "points",       label: "Rendimiento",          icon: "📊", description: "Puntuación de rendimiento total en la jornada", unit: "pts",      defaultValue: 60 },
  ],
  GK: [
    { id: "saves",        label: "Paradas",              icon: "🧤", description: "Atajadas exitosas al arco en el partido",       unit: "paradas",  defaultValue: 3 },
    { id: "cleanSheet",   label: "Portería a Cero",      icon: "🔒", description: "El portero no recibe ningún gol",              isBinary: true },
    { id: "penaltySaved", label: "Penal Detenido",       icon: "🛑", description: "Para al menos un penal en el partido",         isBinary: true },
    { id: "noErrors",     label: "Sin Errores",          icon: "⭐", description: "El portero no comete errores que lleven a gol", isBinary: true },
    { id: "consecutiveSaves", label: "Atajadas Consec.", icon: "🔥", description: "Serie de paradas consecutivas sin gol recibido", unit: "consec.", defaultValue: 3 },
    { id: "points",       label: "Rendimiento",          icon: "📊", description: "Puntuación de rendimiento total en la jornada", unit: "pts",      defaultValue: 65 },
  ],
};

// ─── Computed title builder ───────────────────────────────────────────────────
function buildBetTitle(
  playerName: string,
  metricId: string,
  targetValue: number,
  isRandom: boolean,
  randomDesc: string,
): string {
  if (isRandom) return randomDesc || `Jugada libre sobre ${playerName}`;
  const labels: Record<string, string> = {
    goals:          `¿${playerName} anotará ${targetValue} o más goles?`,
    assists:        `¿${playerName} registrará ${targetValue} o más asistencias?`,
    shots:          `¿${playerName} tendrá ${targetValue} o más tiros al arco?`,
    brace:          `¿${playerName} marcará un doblete (exactamente 2 goles)?`,
    hattrick:       `¿${playerName} anotará hat-trick (3+ goles)?`,
    goalplusassist: `¿${playerName} anotará Y asistirá en el mismo partido?`,
    points:         `¿${playerName} superará los ${targetValue} puntos de rendimiento en la jornada?`,
    keypasses:      `¿${playerName} completará ${targetValue} o más pases clave?`,
    deflections:    `¿${playerName} recuperará ${targetValue} o más balones?`,
    duels:          `¿${playerName} ganará ${targetValue} o más duelos?`,
    cleanSheet:     `¿${playerName} y su equipo mantendrán portería a cero?`,
    clearances:     `¿${playerName} realizará ${targetValue} o más despejes?`,
    interceptions:  `¿${playerName} cortará ${targetValue} o más pases del rival?`,
    saves:          `¿${playerName} realizará ${targetValue} o más paradas?`,
    penaltySaved:   `¿${playerName} detendrá al menos un penalti?`,
    noErrors:       `¿${playerName} terminará el partido sin errores que lleven a gol?`,
    consecutiveSaves: `¿${playerName} encadenará ${targetValue} o más atajadas consecutivas?`,
  };
  return labels[metricId] ?? `Desafío sobre ${playerName}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BetsPage() {
  const { players, bets, userCards, balance, createBet, acceptBet } = useStore();
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<"active" | "mine">("active");
  const [betLoading, setBetLoading] = useState<string | null>(null);
  const [activeVsBetId, setActiveVsBetId] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState<string>("");

  // ── Wizard state ───────────────────────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1..5
  const [isRandom, setIsRandom] = useState(false);

  // Step 1 — position
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  // Step 2 — player
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  // Step 3 — metric
  const [selectedMetric, setSelectedMetric] = useState<BetMetric | null>(null);
  // Step 4 — value
  const [targetValue, setTargetValue] = useState<number>(1);
  // Step 5 — stake + random desc
  const [stake, setStake] = useState<number>(10);
  const [randomDesc, setRandomDesc] = useState<string>("");

  // ── Derived data ───────────────────────────────────────────────────────────
  const ownedPlayerIds = Array.from(new Set(userCards.map((c) => c.playerId)));
  const playersForPosition = players
    .filter((p) => p.position === selectedPosition)
    .filter((p) =>
      !playerSearch ||
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.ticker.toLowerCase().includes(playerSearch.toLowerCase())
    );
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const selectedPlayerOwned = ownedPlayerIds.includes(selectedPlayerId);
  const metricsForPosition = METRICS_BY_POSITION[selectedPosition] ?? [];

  const openBets = bets.filter((b) => b.status === "open" && b.creator !== "Usuario123");
  const myBets   = bets.filter((b) => b.creator === "Usuario123" || ["accepted", "won", "lost", "resolved"].includes(b.status));

  // ── Wizard helpers ─────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(1);
    setIsRandom(false);
    setSelectedPosition("");
    setSelectedPlayerId("");
    setSelectedMetric(null);
    setTargetValue(1);
    setStake(10);
    setRandomDesc("");
  };

  const openWizard = () => { resetWizard(); setShowWizard(true); };
  const closeWizard = () => { setShowWizard(false); resetWizard(); };

  const goNext = () => setWizardStep((s) => Math.min(s + 1, isRandom ? 3 : 5));
  const goBack = () => setWizardStep((s) => Math.max(s - 1, 1));

  const selectPosition = (pos: string) => {
    setSelectedPosition(pos);
    setSelectedPlayerId("");
    setSelectedMetric(null);
    setPlayerSearch("");
  };

  const selectMetric = (m: BetMetric) => {
    setSelectedMetric(m);
    setTargetValue(m.defaultValue ?? 1);
  };

  const computedTitle = buildBetTitle(
    selectedPlayer?.name ?? "",
    selectedMetric?.id ?? "",
    targetValue,
    isRandom,
    randomDesc,
  );

  const handleSubmit = () => {
    if (!selectedPlayerId && !isRandom) return;
    const res = createBet({
      playerId: selectedPlayerId || players[0].id,
      title: computedTitle,
      stake: Number(stake),
      type: (selectedMetric?.id ?? "custom") as any,
    });
    alert(res.message);
    if (res.success) { closeWizard(); setActiveSubTab("mine"); }
  };

  const handleAcceptClick = (betId: string) => {
    setBetLoading(betId);
    const res = acceptBet(betId);
    alert(res.message);
    setBetLoading(null);
  };

  // ── Wizard step validation ─────────────────────────────────────────────────
  const canProceedStep = () => {
    if (wizardStep === 1) return !!selectedPosition;
    if (wizardStep === 2) return !!selectedPlayerId;
    if (wizardStep === 3) {
      if (isRandom) return randomDesc.trim().length >= 10;
      return !!selectedMetric;
    }
    if (wizardStep === 4) return selectedMetric?.isBinary || (targetValue > 0);
    if (wizardStep === 5) return stake >= 5 && stake <= 500 && balance >= stake + 1;
    return true;
  };

  // ── Wizard total steps ─────────────────────────────────────────────────────
  // Random: steps 1, 2, 3(desc), 5(stake) → mapped as 1→2→3→4
  // Normal: steps 1→2→3→4→5

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto pb-20 md:pb-0">
        <Header
          title={t("bets.title")}
          rightActions={
            <Button variant="buy" size="sm" onClick={openWizard}>
              {t("bets.new")}
            </Button>
          }
        />

        <main className="flex-1 px-4 py-4 max-w-4xl w-full mx-auto space-y-4">

          {/* Tabs */}
          <div className="flex gap-2">
            {(["active", "mine"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeSubTab === tab
                    ? "bg-blue text-white shadow-glow-blue"
                    : "bg-background-secondary text-text-secondary hover:bg-background-tertiary border border-border"
                }`}
              >
                {tab === "active" ? `${t("bets.tab_active")} (${openBets.length})` : `${t("bets.tab_mine")} (${myBets.length})`}
              </button>
            ))}
          </div>

          {/* ── Active bets list ─── */}
          {activeSubTab === "active" && (
            <div className="space-y-3">
              {openBets.length > 0 ? openBets.map((bet) => (
                <Card key={bet.id} variant="interactive" padding="md" className="border-border/80">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-mono font-bold text-blue bg-blue/10 px-2 py-0.5 rounded">{bet.playerTicker}</span>
                        <span className="text-text-tertiary">por @{bet.creator}</span>
                        <span className="text-[9px] uppercase font-bold text-text-tertiary bg-background-tertiary px-2 py-0.5 rounded font-mono border border-border">
                          {bet.type === "goals" ? t("bets.type.goals") : bet.type === "assists" ? t("bets.type.assists") : bet.type === "cleanSheet" ? t("bets.type.cleanSheet") : bet.type === "saves" ? t("bets.type.saves") : bet.type === "points" ? t("bets.type.points") : t("bets.type.points")}
                        </span>
                      </div>
                      <p className="text-base font-bold text-text-primary mt-2 leading-snug">&quot;{bet.title}&quot;</p>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between border-t sm:border-t-0 border-border pt-3 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-text-tertiary uppercase">{t("bets.pool")}</p>
                        <p className="font-mono-nums text-lg font-black text-gold">${bet.pool} USDC</p>
                        <p className="text-[9px] text-text-tertiary">{t("bets.stake_label")} ${bet.stake} USDC</p>
                      </div>
                      <Button
                        variant="buy" size="sm" className="mt-2 text-xs"
                        disabled={betLoading === bet.id}
                        onClick={() => handleAcceptClick(bet.id)}
                      >
                        {betLoading === bet.id ? t("bets.processing") : t("bets.accept")}
                      </Button>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-10 text-center">
                  <p className="text-text-secondary">{t("bets.no_active")}</p>
                  <p className="text-xs text-text-tertiary mt-1">{t("bets.no_active.cta")}</p>
                </div>
              )}
            </div>
          )}

          {/* ── My bets list ─── */}
          {activeSubTab === "mine" && (
            <div className="space-y-3">
              {myBets.length > 0 ? myBets.map((bet) => {
                const isCreator = bet.creator === "Usuario123";
                const statusMap: Record<string, { label: string; color: any }> = {
                  open:     { label: t("bets.status.open"), color: "warning" },
                  accepted: { label: t("bets.status.accepted"), color: "info" },
                  won:      { label: t("bets.status.won"), color: "success" },
                  lost:     { label: t("bets.status.lost"), color: "danger" },
                  resolved: { label: t("bets.status.resolved"), color: "blue" },
                };
                const st = statusMap[bet.status] ?? { label: bet.status, color: "warning" };
                return (
                  <Card key={bet.id} padding="md" className="border-border/80 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-mono font-bold text-text-secondary bg-background-tertiary px-2 py-0.5 rounded border border-border">{bet.playerTicker}</span>
                          <span className="text-text-tertiary">{isCreator ? t("bets.created_by_you") : `${t("bets.challenged_by")}${bet.creator}`}</span>
                        </div>
                        <p className="text-sm font-bold text-text-primary mt-2">&quot;{bet.title}&quot;</p>
                      </div>
                      <Badge variant={st.color}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t border-border/50 pt-3 text-xs font-mono-nums">
                      <div>
                        <span className="block text-[8px] uppercase text-text-tertiary font-mono">{t("bets.your_stake")}</span>
                        <span className="text-sm font-bold text-text-secondary">${bet.stake} USDC</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase text-text-tertiary font-mono">
                          {bet.status === "won" ? t("bets.collected") : t("bets.return_potential")}
                        </span>
                        <span className={`text-sm font-bold ${bet.status === "won" ? "text-green" : bet.status === "lost" ? "text-red" : "text-gold"}`}>
                          ${(bet.pool * 0.95).toFixed(2)} USDC
                        </span>
                      </div>
                    </div>
                    {bet.status !== "open" && (
                      <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-end">
                        <Button variant="secondary" size="sm" className="text-[10px] font-bold py-1 px-3.5 border border-border" onClick={() => setActiveVsBetId(bet.id)}>
                          {t("bets.view_fight")}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              }) : (
                <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-10 text-center">
                  <p className="text-text-secondary">{t("bets.no_mine")}</p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <Card className="border-dashed bg-background-secondary/50">
            <div className="text-center py-4 space-y-2">
              <p className="text-base font-bold text-text-primary">{t("bets.cta.title")}</p>
              <p className="text-xs text-text-tertiary max-w-sm mx-auto">{t("bets.cta.desc")}</p>
              <Button variant="primary" onClick={openWizard} className="mt-2">{t("bets.cta.btn")}</Button>
            </div>
          </Card>
        </main>
      </div>

      {/* ══════════════════════════════════════════
          WIZARD MODAL — Nueva Jugada P2P
      ══════════════════════════════════════════ */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-background border border-border/70 rounded-3xl overflow-hidden shadow-strong flex flex-col max-h-[92vh]">

            {/* Ambient glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-4 border-b border-border bg-background-secondary/60">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider font-mono">
                  {isRandom ? t("bets.wizard.random") : t("bets.wizard.new")}
                </h3>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {t("bets.wizard.step")} {wizardStep} {t("bets.wizard.of")} {isRandom ? 4 : 5} — {
                    wizardStep === 1 ? t("bets.wizard.s1.desc") :
                    wizardStep === 2 ? t("bets.wizard.s2.desc") :
                    wizardStep === 3 ? (isRandom ? t("bets.wizard.s3r.desc") : t("bets.wizard.s3.desc")) :
                    wizardStep === 4 ? (isRandom ? t("bets.wizard.s4r.desc") : t("bets.wizard.s4.desc")) :
                    t("bets.wizard.s5.desc")
                  }
                </p>
              </div>
              <button onClick={closeWizard} className="text-text-tertiary hover:text-text-primary text-2xl cursor-pointer transition-colors">×</button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-background-tertiary">
              <div
                className="h-full bg-gradient-to-r from-blue to-purple transition-all duration-500"
                style={{ width: `${(wizardStep / (isRandom ? 4 : 5)) * 100}%` }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 relative">

              {/* Random toggle — only visible on step 1 */}
              {wizardStep === 1 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple/10 to-blue/10 border border-purple/30">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{t("bets.wizard.random_mode")}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{t("bets.wizard.random_mode.desc")}</p>
                  </div>
                  <button
                    onClick={() => { setIsRandom((r) => !r); setWizardStep(1); }}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${isRandom ? "bg-purple" : "bg-border"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isRandom ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              )}

              {/* ── STEP 1: Position ─────────────────────────────────── */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                    {t("bets.wizard.s1.label")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(POSITION_INFO).map(([pos, info]) => {
                      const totalCount = players.filter((p) => p.position === pos).length;
                      const ownedCount = players.filter((p) => p.position === pos && ownedPlayerIds.includes(p.id)).length;
                      return (
                        <button
                          key={pos}
                          onClick={() => selectPosition(pos)}
                          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left group ${
                            selectedPosition === pos
                              ? `${info.color} shadow-medium`
                              : "bg-background-secondary border-border hover:border-blue/40 hover:bg-background-tertiary"
                          }`}
                        >
                          <span className="text-3xl block mb-2">{info.icon}</span>
                          <span className="block text-sm font-black text-text-primary">{pos}</span>
                          <span className="block text-xs text-text-secondary">{info.label}</span>
                          <span className="absolute top-2 right-2 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue/10 text-blue border border-blue/20">
                            {totalCount} {totalCount !== 1 ? t("bets.wizard.players_count") : t("bets.wizard.player_count")}
                          </span>
                          {ownedCount > 0 && (
                            <span className="absolute bottom-2 right-2 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-green/10 text-green border border-green/20">
                              {ownedCount} tuyas
                            </span>
                          )}
                          {selectedPosition === pos && (
                            <div className="absolute top-2 left-2 w-4 h-4 bg-blue rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Player ───────────────────────────────────── */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                    {t("bets.wizard.s2.label")} ({POSITION_INFO[selectedPosition]?.label})
                  </label>

                  {/* Fee info banner */}
                  <div className="flex gap-2 text-[10px] font-mono">
                    <span className="flex-1 text-center py-1.5 rounded-lg bg-green/10 border border-green/30 text-green font-bold">
                      {t("bets.wizard.fee_token")}
                    </span>
                    <span className="flex-1 text-center py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold font-bold">
                      {t("bets.wizard.fee_no_token")}
                    </span>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm pointer-events-none">🔍</span>
                    <input
                      type="text"
                      placeholder={t("bets.wizard.search")}
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="w-full bg-background-secondary border border-border rounded-xl py-2.5 pl-8 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue transition-colors placeholder:text-text-tertiary"
                    />
                  </div>

                  {playersForPosition.length === 0 ? (
                    <div className="text-center py-6 text-text-secondary text-sm">
                      {t("bets.wizard.no_players")}{playerSearch ? ` para "${playerSearch}"` : ""}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {playersForPosition.map((player) => {
                        const isOwned = ownedPlayerIds.includes(player.id);
                        return (
                          <button
                            key={player.id}
                            onClick={() => setSelectedPlayerId(player.id)}
                            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                              selectedPlayerId === player.id
                                ? "border-blue bg-blue/10 shadow-glow-blue/20"
                                : "border-border bg-background-secondary hover:border-blue/40 hover:bg-background-tertiary"
                            }`}
                          >
                            {/* Ownership / fee badge */}
                            <span className={`absolute top-2 right-2 text-[8px] font-black font-mono px-1.5 py-0.5 rounded ${
                              isOwned
                                ? "bg-green/15 text-green border border-green/30"
                                : "bg-gold/15 text-gold border border-gold/30"
                            }`}>
                              {isOwned ? "5%" : "15%"}
                            </span>

                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                                player.position === "GK" ? "bg-amber-500" : player.position === "DF" ? "bg-purple" : player.position === "MD" ? "bg-blue" : "bg-green"
                              }`}>
                                {player.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                              </div>
                              <div>
                                <span className="text-[9px] font-mono font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded block">{player.ticker}</span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-text-primary truncate pr-8">{player.name}</p>
                            <p className="text-[10px] text-text-secondary truncate">{player.team}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className={`text-[9px] font-bold font-mono ${player.priceChangePercent >= 0 ? "text-green" : "text-red"}`}>
                                {player.priceChangePercent >= 0 ? "▲" : "▼"} {Math.abs(player.priceChangePercent).toFixed(1)}%
                              </span>
                              {player.streak >= 3 && <span className="text-[9px]">🔥{player.streak}</span>}
                              {isOwned && <span className="text-[8px] text-green font-bold ml-auto">✓ tuyo</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Metric (or Random desc) ─────────────────── */}
              {wizardStep === 3 && !isRandom && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                    3. Tipo de jugada para {POSITION_INFO[selectedPosition]?.label}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {metricsForPosition.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => selectMetric(m)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center gap-3 ${
                          selectedMetric?.id === m.id
                            ? "border-blue bg-blue/10"
                            : "border-border bg-background-secondary hover:border-blue/30 hover:bg-background-tertiary"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary">{m.label}</p>
                          <p className="text-xs text-text-secondary">{m.description}</p>
                        </div>
                        {m.isBinary && (
                          <span className="text-[9px] font-bold text-purple bg-purple/10 border border-purple/20 px-1.5 py-0.5 rounded font-mono shrink-0">SÍ/NO</span>
                        )}
                        {selectedMetric?.id === m.id && (
                          <div className="w-5 h-5 bg-blue rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Random description input */}
              {wizardStep === 3 && isRandom && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                      Describe tu jugada libre
                    </label>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t("bets.wizard.s3r.desc2")}
                  </p>
                  {selectedPlayer && (
                    <div className="flex items-center gap-2 p-2.5 bg-background-secondary border border-border rounded-xl">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${
                        selectedPlayer.position === "GK" ? "bg-amber-500" : selectedPlayer.position === "DF" ? "bg-purple" : selectedPlayer.position === "MD" ? "bg-blue" : "bg-green"
                      }`}>
                        {selectedPlayer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{selectedPlayer.name}</p>
                        <p className="text-[10px] text-text-secondary">{selectedPlayer.team}</p>
                      </div>
                    </div>
                  )}
                  <textarea
                    rows={4}
                    placeholder={`${t("bets.wizard.ex_prefix")}: "${selectedPlayer?.name ?? t("bets.wizard.ex_player")} ${t("bets.wizard.ex_action")}"`}
                    value={randomDesc}
                    onChange={(e) => setRandomDesc(e.target.value)}
                    maxLength={200}
                    className="w-full bg-background-secondary border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-blue transition-colors resize-none placeholder:text-text-tertiary"
                  />
                  <div className="flex justify-between text-[10px] text-text-tertiary font-mono">
                    <span>{randomDesc.trim().length < 10 ? `${t("bets.wizard.min_chars")} (${randomDesc.trim().length}/10)` : t("bets.wizard.valid_desc")}</span>
                    <span>{randomDesc.length}/200</span>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Value ────────────────────────────────────── */}
              {wizardStep === 4 && !isRandom && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                    {t("bets.wizard.s4.label")}
                  </label>

                  {/* Selected metric recap */}
                  {selectedMetric && (
                    <div className="flex items-center gap-3 p-3 bg-background-secondary border border-border rounded-xl">
                      <span className="text-2xl">{selectedMetric.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{selectedMetric.label}</p>
                        <p className="text-xs text-text-secondary">{selectedMetric.description}</p>
                      </div>
                    </div>
                  )}

                  {selectedMetric?.isBinary ? (
                    <div className="space-y-3">
                      {/* Creator always = YES side — make it very clear */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* YES side */}
                        <div className="relative rounded-2xl p-4 border-2 border-green bg-green/10 text-center overflow-hidden">
                          <div className="absolute inset-0 bg-green/5 pointer-events-none" />
                          <span className="text-3xl block mb-1">{selectedMetric.icon}</span>
                          <span className="block text-[9px] font-black uppercase tracking-widest text-green font-mono">{t("bets.wizard.bet_you")}</span>
                          <span className="block text-2xl font-black text-green mt-0.5">{t("common.yes")}</span>
                          <span className="block text-[10px] text-green/80 mt-1 font-medium">{t("bets.wizard.believes_yes")}</span>
                        </div>
                        {/* NO side */}
                        <div className="relative rounded-2xl p-4 border-2 border-red/40 bg-red/5 text-center overflow-hidden">
                          <div className="absolute inset-0 bg-red/3 pointer-events-none" />
                          <span className="text-3xl block mb-1 opacity-50">❌</span>
                          <span className="block text-[9px] font-black uppercase tracking-widest text-red/60 font-mono">{t("bets.wizard.opponent")}</span>
                          <span className="block text-2xl font-black text-red/60 mt-0.5">{t("common.no")}</span>
                          <span className="block text-[10px] text-red/50 mt-1 font-medium">{t("bets.wizard.believes_no")}</span>
                        </div>
                      </div>
                      {/* Rule box */}
                      <div className="flex items-start gap-3 p-3.5 bg-gold/10 border border-gold/30 rounded-xl">
                        <span className="text-lg shrink-0 mt-0.5">⚖️</span>
                        <div>
                          <p className="text-xs font-black text-text-primary">{t("bets.wizard.resolution")}</p>
                          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                            {t("bets.wizard.resolution.desc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">{selectedMetric?.icon}</span>
                        <input
                          type="number"
                          min={1}
                          max={selectedMetric?.id === "points" ? 100 : 20}
                          step={1}
                          value={targetValue || ""}
                          onChange={(e) => setTargetValue(Number(e.target.value))}
                          className="w-full bg-background-secondary border border-border rounded-xl py-4 pl-12 pr-24 text-xl font-black font-mono-nums text-text-primary focus:outline-none focus:border-blue transition-colors text-center"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary font-mono pointer-events-none uppercase">
                          {selectedMetric?.unit ?? ""}
                        </span>
                      </div>
                      {/* Quick picker */}
                      <div className="flex gap-2 flex-wrap">
                        {(selectedMetric?.id === "points"
                          ? [50, 65, 75, 85, 90]
                          : [1, 2, 3, 4, 5]
                        ).map((v) => (
                          <button
                            key={v}
                            onClick={() => setTargetValue(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              targetValue === v
                                ? "bg-blue text-white border-blue"
                                : "bg-background-secondary border-border text-text-secondary hover:border-blue/40"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-tertiary font-mono">
                        {t("bets.wizard.challenge_wins")}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* ── STEP 5 (or 4 for random): Stake ─────────────────── */}
              {((wizardStep === 5 && !isRandom) || (wizardStep === 4 && isRandom)) && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono">
                    {isRandom ? "4" : "5"}. {t("bets.wizard.s5.label")}
                  </label>

                  {/* Preview box */}
                  <div className="bg-background-secondary border border-border/60 rounded-2xl p-4 space-y-1">
                    <span className="text-[9px] uppercase text-text-tertiary font-mono tracking-wider block">{t("bets.wizard.preview")}</span>
                    <p className="text-sm font-bold text-text-primary italic leading-relaxed mt-1">
                      &quot;{computedTitle}&quot;
                    </p>
                    {selectedPlayer && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                        <span className="text-[10px] text-text-tertiary font-mono">{selectedPlayer.name} · {selectedPlayer.ticker} · {POSITION_INFO[selectedPlayer.position]?.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Stake input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold pointer-events-none">$</span>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      step={5}
                      value={stake || ""}
                      onChange={(e) => setStake(Number(e.target.value))}
                      className="w-full bg-background-secondary border border-border rounded-xl py-4 pl-8 pr-20 text-xl font-black font-mono-nums text-text-primary focus:outline-none focus:border-blue transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-tertiary font-mono pointer-events-none">USDC</span>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 25, 50, 100].map((v) => (
                      <button
                        key={v}
                        onClick={() => setStake(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          stake === v
                            ? "bg-blue text-white border-blue"
                            : "bg-background-secondary border-border text-text-secondary hover:border-blue/40"
                        }`}
                      >
                        ${v}
                      </button>
                    ))}
                  </div>

                  {/* Stats — fee depends on whether user holds the player token */}
                  {(() => {
                    const feePercent = selectedPlayerOwned ? 0.05 : 0.15;
                    const feeLabel = selectedPlayerOwned ? t("bets.wizard.fee_token") : t("bets.wizard.fee_no_token");
                    const feeAmount = (stake * 2 * feePercent).toFixed(2);
                    const winAmount = (stake * 2 * (1 - feePercent)).toFixed(2);
                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-background-secondary border border-border rounded-xl p-2">
                            <span className="text-text-tertiary block">{t("bets.wizard.your_stake")}</span>
                            <span className="font-bold text-text-primary">${stake}</span>
                          </div>
                          <div className={`border rounded-xl p-2 ${selectedPlayerOwned ? "bg-green/10 border-green/30" : "bg-gold/10 border-gold/30"}`}>
                            <span className="text-text-tertiary block leading-tight">{feeLabel}</span>
                            <span className={`font-bold ${selectedPlayerOwned ? "text-green" : "text-gold"}`}>${feeAmount}</span>
                          </div>
                          <div className="bg-green/10 border border-green/30 rounded-xl p-2">
                            <span className="text-text-tertiary block">{t("bets.wizard.if_win")}</span>
                            <span className="font-bold text-green">${winAmount}</span>
                          </div>
                        </div>
                        {!selectedPlayerOwned && (
                          <p className="text-[10px] text-gold text-center font-mono">
                            {t("bets.wizard.buy_token_hint")}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {balance < stake + 1 && (
                    <p className="text-xs text-red font-bold text-center">
                      {t("bets.wizard.no_balance")} ${balance.toFixed(2)} USDC
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Footer navigation */}
            <div className="relative flex items-center justify-between px-6 py-4 border-t border-border bg-background-secondary/40">
              <button
                onClick={wizardStep === 1 ? closeWizard : goBack}
                className="px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-bold hover:bg-background-tertiary transition-colors cursor-pointer"
              >
                {wizardStep === 1 ? t("common.cancel") : t("common.back")}
              </button>

              {/* Step dots */}
              <div className="flex gap-1.5">
                {Array.from({ length: isRandom ? 4 : 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${
                      i + 1 === wizardStep ? "w-4 h-2 bg-blue" : i + 1 < wizardStep ? "w-2 h-2 bg-blue/50" : "w-2 h-2 bg-border"
                    }`}
                  />
                ))}
              </div>

              {((wizardStep === 5 && !isRandom) || (wizardStep === 4 && isRandom)) ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep() || balance < stake + 1}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green to-green-dark text-white text-sm font-black transition-all cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-blue"
                >
                  {t("bets.wizard.publish")}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceedStep()}
                  className="px-5 py-2.5 rounded-xl bg-blue text-white text-sm font-bold transition-all cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("common.next")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VS Arena Modal (unchanged) ─────────────────────────────────────── */}
      {activeVsBetId && (() => {
        const bet = bets.find((b) => b.id === activeVsBetId);
        if (!bet) return null;
        const player = players.find((p) => p.id === bet.playerId);
        if (!player) return null;
        const isUserCreator = bet.creator === "Usuario123";
        const creatorName = isUserCreator ? `${t("bets.arena.you")} (@Usuario123)` : `@${bet.creator}`;
        const challengerName = isUserCreator ? t("bets.arena.anon_challenger") : `${t("bets.arena.you")} (@Usuario123)`;
        let statusLabel = t("bets.arena.status.live");
        let outcomeMessage = t("bets.arena.outcome.live");
        if (bet.status === "won") {
          statusLabel = t("bets.arena.status.won");
          outcomeMessage = t("bets.arena.outcome.won");
        } else if (bet.status === "lost") {
          statusLabel = t("bets.arena.status.lost");
          outcomeMessage = t("bets.arena.outcome.lost");
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-green/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-red/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full max-w-4xl bg-background border border-border/80 rounded-3xl overflow-hidden shadow-strong max-h-[90vh] flex flex-col z-10">
              <div className="p-4 border-b border-border flex items-center justify-between bg-background-secondary/60">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚔️</span>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">{t("bets.arena.title")}</h3>
                  <Badge variant={bet.status === "accepted" ? "info" : bet.status === "won" ? "success" : "danger"}>{statusLabel}</Badge>
                </div>
                <button onClick={() => setActiveVsBetId(null)} className="text-text-secondary hover:text-text-primary text-2xl transition-colors cursor-pointer">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-bold tracking-widest text-text-tertiary bg-background-secondary border border-border px-2.5 py-1 rounded-full font-mono uppercase">{t("bets.arena.challenge")} {bet.playerTicker}</span>
                  <h2 className="text-xl md:text-2xl font-black text-text-primary max-w-2xl mx-auto leading-tight pt-1">&quot;{bet.title}&quot;</h2>
                  <p className="text-xs text-text-secondary max-w-lg mx-auto">{outcomeMessage}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-6 py-4">
                  <div className="md:col-span-4 flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-1">
                      <span className="text-xs text-text-secondary font-bold block">{creatorName}</span>
                      <span className="text-[10px] font-mono font-bold tracking-wider text-green bg-green/10 border border-green/30 px-3 py-0.5 rounded-full inline-block animate-pulse">{t("bets.arena.backs_yes")}</span>
                    </div>
                    <div className="w-48 transition-transform hover:scale-105 duration-300 rounded-2xl overflow-hidden border border-green/40 shadow-[0_0_25px_rgba(0,214,143,0.15)]">
                      <PlayerCard ticker={player.ticker} name={player.name} team={player.team} position={player.position} price={player.price} change={player.priceChangePercent} streak={player.streak} isFrozen={player.isFrozen} rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))} />
                    </div>
                  </div>
                  <div className="md:col-span-3 flex flex-col items-center justify-center space-y-4 py-6 md:py-0">
                    <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-background-secondary border-2 border-border shadow-medium">
                      <div className="absolute inset-0 rounded-full border border-dashed border-gold/40 animate-spin" style={{ animationDuration: "12s" }} />
                      <div className="absolute inset-2 rounded-full border border-double border-white/5 bg-background-tertiary flex items-center justify-center">
                        <span className="text-3xl font-black font-mono tracking-tighter text-gold animate-bounce" style={{ animationDuration: "1.5s" }}>VS</span>
                      </div>
                      <div className="absolute -top-1 -left-1 text-base animate-pulse">⚡</div>
                      <div className="absolute -bottom-1 -right-1 text-base animate-pulse" style={{ animationDelay: "0.5s" }}>⚡</div>
                    </div>
                    <div className="text-center font-mono-nums">
                      <span className="text-[9px] uppercase tracking-wider text-text-tertiary font-mono block">{t("bets.arena.combat_pool")}</span>
                      <span className="text-2xl font-black text-gold block mt-0.5">${bet.pool.toFixed(2)} USDC</span>
                      <span className="text-[10px] text-text-secondary block">{t("bets.arena.platform_fee")}</span>
                    </div>
                    <div className="w-full bg-background-secondary/40 border border-border p-2.5 rounded-xl text-[10px] space-y-1 text-center font-mono max-w-[200px]">
                      <span className="text-text-tertiary font-bold uppercase tracking-wider block border-b border-border/40 pb-1 mb-1">{t("bets.arena.live_stats")}</span>
                      <div className="flex justify-between text-text-secondary"><span>{t("bets.arena.l5_avg")}</span><span className="text-text-primary font-bold">{((player.last5Scores?.reduce((s, v) => s + v, 0) ?? 0) / Math.max(1, player.last5Scores?.length ?? 1)).toFixed(1)}</span></div>
                      <div className="flex justify-between text-text-secondary"><span>{t("bets.arena.streak")}</span><span className="text-gold font-bold">🔥 {player.streak}</span></div>
                      <div className="flex justify-between text-text-secondary"><span>{t("bets.arena.goals")}</span><span className="text-text-primary font-bold">⚽ {player.goals ?? 0}</span></div>
                    </div>
                  </div>
                  <div className="md:col-span-4 flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-1">
                      <span className="text-xs text-text-secondary font-bold block">{challengerName}</span>
                      <span className="text-[10px] font-mono font-bold tracking-wider text-red bg-red/10 border border-red/30 px-3 py-0.5 rounded-full inline-block animate-pulse">{t("bets.arena.backs_no")}</span>
                    </div>
                    <div className="w-48 transition-transform hover:scale-105 duration-300 rounded-2xl overflow-hidden border border-red/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
                      <PlayerCard ticker={player.ticker} name={player.name} team={player.team} position={player.position} price={player.price} change={player.priceChangePercent} streak={player.streak} isFrozen={player.isFrozen} rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))} />
                    </div>
                  </div>
                </div>
                <div className="bg-background-secondary border border-border p-3.5 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-text-secondary">
                  <span className="text-lg mt-0.5 shrink-0">🛡️</span>
                  <div>
                    <span className="font-bold text-text-primary block">{t("bets.arena.oracle.title")}</span>
                    <p className="mt-0.5 text-text-tertiary">{t("bets.arena.oracle.desc")}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border flex justify-end bg-background-secondary/30">
                <Button variant="primary" className="font-bold px-8 text-xs font-mono tracking-wide" onClick={() => setActiveVsBetId(null)}>{t("bets.arena.close")}</Button>
              </div>
            </div>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
