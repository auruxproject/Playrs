"use client";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useStore, getPlayerCategory, getTierPriceMultiplier } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const { players, userCards, balance, bets, acceptBet, simulateMatchDay } = useStore();
  const { t } = useLanguage();
  const [betLoading, setBetLoading] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Top Movers: Sort players by absolute price change percent descending
  const topMovers = [...players]
    .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
    .slice(0, 4);

  // Ticker: Show all players
  const tickerItems = [...players];

  // Portfolio calculation
  const portfolioValuation = userCards.reduce((acc, card) => {
    const p = players.find((pl) => pl.id === card.playerId);
    if (!p) return acc;
    const baseVal = p.price;
    const cardTier = card.tier || (card.isGold ? "gold" : "standard");
    const category = getPlayerCategory(baseVal);
    const multiplier = getTierPriceMultiplier(cardTier, category, baseVal);
    return acc + baseVal * multiplier;
  }, 0);

  const initialInvestment = userCards.reduce((acc, card) => acc + card.acquiredPrice, 0);
  const pnl = portfolioValuation - initialInvestment;
  const pnlPercent = initialInvestment > 0 ? (pnl / initialInvestment) * 100 : 0;

  // Active open bets
  const openBets = bets.filter((b) => b.status === "open").slice(0, 3);

  const handleAcceptBet = async (betId: string) => {
    setBetLoading(betId);
    const res = acceptBet(betId);
    alert(res.message);
    setBetLoading(null);
  };

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const ownedCardsOfSelected = userCards.filter((c) => c.playerId === selectedPlayerId);

  // SVG Mini Chart for modal
  const renderMiniChart = (points: number[]) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points) - 1;
    const max = Math.max(...points) + 1;
    const range = max - min || 1;
    const w = 300; const h = 80;
    const svgPts = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    }).join(" ");
    const isUp = points[points.length - 1] >= points[0];
    return (
      <svg className="w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mcg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isUp ? "#3B82F6" : "#EF4444"} />
            <stop offset="100%" stopColor={isUp ? "#00D68F" : "#F97316"} />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#mcg)" strokeWidth="2.5" strokeLinecap="round" points={svgPts} />
        <circle cx={w} cy={h - ((points[points.length - 1] - min) / range) * h} r="4" fill={isUp ? "#00D68F" : "#EF4444"} />
      </svg>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Left Sidebar on Desktop */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto pb-20 md:pb-0">
        <Header title={t("home.title")} />

        {/* Ticker strip */}
        <div className="w-full overflow-hidden bg-background-secondary border-b border-border">
          <div className="flex whitespace-nowrap py-2 animate-fadeIn">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <Link
                href="/market"
                key={`${item.id}-${index}`}
                className="inline-flex items-center gap-2 px-4 border-r border-border hover:bg-background-tertiary transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-text-primary">{item.ticker}</span>
                <span className="font-mono-nums text-xs text-text-secondary">${item.price.toFixed(2)}</span>
                <span className={`font-mono-nums text-xs font-medium ${item.priceChangePercent >= 0 ? "text-green" : "text-red"}`}>
                  {item.priceChangePercent >= 0 ? "+" : ""}{item.priceChangePercent.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <main className="flex-1 px-4 py-4 max-w-5xl w-full mx-auto space-y-6">

          {/* Simulation Notification Panel (Mobile) */}
          <div className="md:hidden bg-background-secondary border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-subtle">
            <div>
              <p className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">{t("home.quick_sim")}</p>
              <p className="text-xs text-text-secondary mt-0.5">{t("home.quick_sim.desc")}</p>
            </div>
            <Button variant="primary" size="sm" onClick={simulateMatchDay} className="w-full sm:w-auto">
              {t("home.sim_btn")}
            </Button>
          </div>

          {/* Top Hero Layout: Portfolio info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Portfolio Card */}
            <Card variant="elevated" className="md:col-span-2 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">{t("home.portfolio_label")}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pnl >= 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                  {pnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
                </span>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold font-mono-nums text-text-primary">${portfolioValuation.toFixed(2)}</span>
                <span className={`text-sm ml-2 font-medium ${pnl >= 0 ? "text-green" : "text-red"}`}>
                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                </span>
              </div>
              <div className="h-16 bg-background-tertiary rounded-xl flex items-end justify-center overflow-hidden p-1">
                <svg className="w-full h-full opacity-80" viewBox="0 0 200 60" fill="none" preserveAspectRatio="none">
                  <path d="M0 45 L20 42 L40 46 L60 30 L80 35 L100 20 L120 25 L140 10 L160 18 L180 8 L200 2" stroke="url(#gradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#00D68F" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </Card>

            {/* Wallet Balance Card */}
            <Card variant="default" className="flex flex-col justify-between">
              <div>
                <span className="text-sm text-text-secondary">{t("home.balance")}</span>
                <div className="text-2xl font-bold font-mono-nums text-text-primary mt-2">
                  ${balance.toFixed(2)} <span className="text-xs text-text-tertiary font-normal">USDC</span>
                </div>
                <p className="text-xs text-text-tertiary mt-2">{t("home.balance.desc")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link href="/profile">
                  <Button variant="secondary" className="w-full text-xs py-2">{t("home.load")}</Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="primary" className="w-full text-xs py-2">{t("home.view_cards")}</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/market" className="w-full">
              <Button variant="buy" className="w-full flex flex-col items-center gap-1.5 py-4">
                <span className="text-xl">📈</span>
                <span className="text-xs font-semibold">{t("home.buy_ipo")}</span>
              </Button>
            </Link>
            <Link href="/bets" className="w-full">
              <Button variant="primary" className="w-full flex flex-col items-center gap-1.5 py-4">
                <span className="text-xl">⚽</span>
                <span className="text-xs font-semibold">{t("home.bets_p2p")}</span>
              </Button>
            </Link>
            <Link href="/portfolio" className="w-full">
              <Button variant="fire" className="w-full flex flex-col items-center gap-1.5 py-4">
                <span className="text-xl">🔥</span>
                <span className="text-xs font-semibold">{t("home.forge")}</span>
              </Button>
            </Link>
          </div>

          {/* Top Movers (Atletas Destacados) — clickable */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{t("home.top_players")}</h2>
                <p className="text-xs text-text-tertiary mt-0.5">{t("home.top_players.hint")}</p>
              </div>
              <Link href="/market" className="text-sm text-blue font-medium hover:underline">{t("common.see_market")}</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topMovers.map((player) => (
                <PlayerCard
                  key={player.id}
                  ticker={player.ticker}
                  name={player.name}
                  team={player.team}
                  position={player.position}
                  price={player.price}
                  change={player.priceChangePercent}
                  streak={player.streak}
                  isFrozen={player.isFrozen}
                  rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))}
                  onClick={() => setSelectedPlayerId(player.id)}
                />
              ))}
            </div>
          </section>

          {/* Active Bets */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text-primary">{t("home.popular_bets")}</h2>
              <Link href="/bets" className="text-sm text-blue font-medium hover:underline">{t("common.see_all")}</Link>
            </div>
            {openBets.length > 0 ? (
              <div className="space-y-3">
                {openBets.map((bet) => (
                  <Card key={bet.id} variant="interactive" padding="sm" className="relative overflow-hidden border-border/80">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded">{bet.playerTicker}</span>
                          <span className="text-[10px] text-text-tertiary">por @{bet.creator}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary mt-1.5">&quot;{bet.title}&quot;</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-nums text-sm font-bold text-gold">${bet.pool} USDC</p>
                        <p className="text-[9px] text-text-tertiary">{t("home.pool")} ${bet.stake} USDC</p>
                        <Button
                          variant="buy" size="sm" className="mt-2 text-xs py-1"
                          disabled={betLoading === bet.id}
                          onClick={() => handleAcceptBet(bet.id)}
                        >
                          {betLoading === bet.id ? t("home.accepting") : t("home.accept_duel")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-6 text-center text-text-secondary text-sm">
                {t("home.no_bets")}
              </div>
            )}
          </section>

          {/* Compliance Info Box */}
          <Card className="bg-background-secondary border-dashed">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center shrink-0">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{t("home.compliance.title")}</p>
                <p className="text-xs text-text-secondary mt-1">{t("home.compliance.desc")}</p>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* Bottom Nav on Mobile */}
      <BottomNav />

      {/* ─── Player Stats Modal ─── */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedPlayerId(null)}
        >
          <div
            className="relative w-full max-w-lg bg-background border border-border/60 rounded-3xl overflow-hidden shadow-strong"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-start justify-between p-5 border-b border-border bg-background-secondary/60">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white
                  ${selectedPlayer.position === "GK" ? "bg-amber-600" : selectedPlayer.position === "DF" ? "bg-purple" : selectedPlayer.position === "MD" ? "bg-blue" : "bg-green"}`}>
                  {selectedPlayer.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">{selectedPlayer.name}</h3>
                  <p className="text-xs text-text-secondary">{selectedPlayer.team} · {selectedPlayer.nationality}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant={selectedPlayer.position === "FW" ? "success" : selectedPlayer.position === "MD" ? "blue" : selectedPlayer.position === "DF" ? "purple" : "warning"}>
                      {selectedPlayer.position}
                    </Badge>
                    <span className="text-[9px] font-mono text-blue bg-blue/10 border border-blue/20 px-1.5 py-0.5 rounded">{selectedPlayer.ticker}</span>
                    {selectedPlayer.streak >= 3 && <Badge variant="fire">🔥 {selectedPlayer.streak}</Badge>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPlayerId(null)} className="text-text-tertiary hover:text-text-primary text-2xl cursor-pointer transition-colors">×</button>
            </div>

            {/* Body */}
            <div className="relative p-5 space-y-4 max-h-[65vh] overflow-y-auto">

              {/* Price + chart */}
              <div className="bg-background-secondary border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase text-text-tertiary font-mono tracking-wider block">{t("home.modal.current_value")}</span>
                    <span className="text-2xl font-black font-mono-nums text-text-primary">${selectedPlayer.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase text-text-tertiary font-mono tracking-wider block">{t("home.modal.change24h")}</span>
                    <span className={`text-lg font-bold font-mono-nums ${selectedPlayer.priceChangePercent >= 0 ? "text-green" : "text-red"}`}>
                      {selectedPlayer.priceChangePercent >= 0 ? "▲ +" : "▼ "}{Math.abs(selectedPlayer.priceChangePercent).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-[80px] bg-background-tertiary/60 rounded-xl overflow-hidden p-1">
                  {renderMiniChart(selectedPlayer.priceHistory || [])}
                </div>
              </div>

              {/* L5 Performance dots */}
              <div className="bg-background-secondary border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary font-mono">{t("home.modal.l5")}</span>
                  <span className="text-xs font-mono-nums font-bold text-blue">
                    {t("home.modal.avg")} {((selectedPlayer.last5Scores || []).reduce((s, v) => s + v, 0) / Math.max(1, (selectedPlayer.last5Scores || []).length)).toFixed(1)} pts
                  </span>
                </div>
                <div className="flex justify-around">
                  {(selectedPlayer.last5Scores || [0, 0, 0, 0, 0]).map((score, idx) => {
                    let c = "bg-red";
                    if (score >= 90) c = "bg-yellow-400";
                    else if (score >= 75) c = "bg-green";
                    else if (score >= 50) c = "bg-gold";
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className={`w-4 h-4 rounded-full ${c}`} />
                        <span className="text-[9px] font-mono-nums text-text-tertiary">{score.toFixed(0)}</span>
                        <span className="text-[8px] text-text-tertiary/60">P{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t("home.modal.goals"), value: selectedPlayer.goals || 0, icon: "⚽" },
                  { label: t("home.modal.assists"), value: selectedPlayer.assists || 0, icon: "🎯" },
                  { label: t("home.modal.pts_league"), value: selectedPlayer.pointsLastWeek, icon: "📊" },
                  { label: t("home.modal.streak_label"), value: `🔥${selectedPlayer.streak}`, icon: "" },
                  { label: t("home.modal.ipo_stock"), value: `${selectedPlayer.stockRemaining}/${selectedPlayer.stockTotal}`, icon: "📦" },
                  { label: t("home.modal.my_cards"), value: ownedCardsOfSelected.length, icon: "🃏" },
                ].map((s) => (
                  <div key={s.label} className="bg-background-tertiary border border-border/60 rounded-xl p-3 text-center">
                    <span className="block text-[8px] uppercase text-text-tertiary font-mono tracking-wider">{s.label}</span>
                    <span className="block text-sm font-bold text-text-primary mt-0.5">{typeof s.value === "number" ? s.value : s.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link href={`/market?tab=ipo`} className="flex-1">
                  <Button variant="buy" className="w-full font-bold text-sm">
                    {t("home.modal.buy_ipo")}
                  </Button>
                </Link>
                <Link href={`/market?tab=p2p`} className="flex-1">
                  <Button variant="secondary" className="w-full font-bold text-sm border border-border">
                    {t("home.modal.see_p2p")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
