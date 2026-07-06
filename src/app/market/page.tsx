"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore, getCardValuation } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";

const leagues = ["Todas", "PL", "LaLiga", "Serie A", "Bundesliga", "Ligue 1"];
const positions = ["Todos", "GK", "DF", "MD", "FW"];

// Default export wraps in Suspense (required by Next.js for useSearchParams)
export default function MarketPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-text-secondary animate-pulse font-mono text-sm">Cargando mercado...</div>
      </div>
    }>
      <MarketPageContent />
    </Suspense>
  );
}

function MarketPageContent() {
  const { t } = useLanguage();
  const {
    players,
    userCards,
    p2pListings,
    buyPlayer,
    sellPlayer,
    listCardForSale,
    cancelP2PListing,
    buyP2PListing,
    balance
  } = useStore();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [marketTab, setMarketTab] = useState<"ipo" | "p2p">("ipo");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Sync tab status with URL Query Parameter
  useEffect(() => {
    if (tabParam === "p2p" || tabParam === "ipo") {
      setMarketTab(tabParam);
      // Reset selections when switching tabs
      setSelectedPlayerId(null);
      setSelectedListingId(null);
    }
  }, [tabParam]);
  const [search, setSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("Todas");
  const [selectedPosition, setSelectedPosition] = useState("Todos");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Fichaje Inicial states and helpers
  const [fichajeSubTab, setFichajeSubTab] = useState<"drops" | "rookies">("drops");
  const [simulatedHours, setSimulatedHours] = useState<0 | 24 | 48>(0);

  // Static lookup tables (display only — not oracle data)
  const PLAYER_AGES: Record<string, number> = {
    "mbp-rm": 27, "erh-mc": 25, "vnj-rm": 25, "bel-rm": 22,
    "yam-bl": 18, "cot-rm": 33, "sal-aj": 34, "van-li": 35,
    "mai-mu": 21, "end-rm": 19, "gul-rm": 21, "ram-ret": 40,
  };
  const PLAYER_MARKET_VALUES: Record<string, string> = {
    "mbp-rm": "€180M", "erh-mc": "€200M", "vnj-rm": "€200M", "bel-rm": "€180M",
    "yam-bl": "€160M", "cot-rm": "€25M", "sal-aj": "€30M", "van-li": "€20M",
    "mai-mu": "€40M", "end-rm": "€40M", "gul-rm": "€40M", "ram-ret": "—",
  };
  const PLAYER_HEIGHTS: Record<string, string> = {
    "mbp-rm": "1.78 m", "erh-mc": "1.94 m", "vnj-rm": "1.76 m", "bel-rm": "1.86 m",
    "yam-bl": "1.81 m", "cot-rm": "2.00 m", "sal-aj": "1.75 m", "van-li": "1.93 m",
    "mai-mu": "1.76 m", "end-rm": "1.80 m", "gul-rm": "1.80 m",
  };
  const PLAYER_FOOT: Record<string, string> = {
    "mbp-rm": "Izquierdo", "erh-mc": "Izquierdo", "vnj-rm": "Derecho", "bel-rm": "Derecho",
    "yam-bl": "Derecho", "cot-rm": "Derecho", "sal-aj": "Izquierdo", "van-li": "Derecho",
    "mai-mu": "Derecho", "end-rm": "Derecho", "gul-rm": "Izquierdo",
  };
  const PLAYER_LEAGUE_COUNTRY: Record<string, string> = {
    "mbp-rm": "España 🇪🇸", "erh-mc": "Inglaterra 🇬🇧", "vnj-rm": "España 🇪🇸", "bel-rm": "España 🇪🇸",
    "yam-bl": "España 🇪🇸", "cot-rm": "España 🇪🇸", "sal-aj": "Inglaterra 🇬🇧", "van-li": "Inglaterra 🇬🇧",
    "mai-mu": "Inglaterra 🇬🇧", "end-rm": "España 🇪🇸", "gul-rm": "España 🇪🇸",
  };
  const PLAYER_CAREER_GOALS: Record<string, number> = {
    "mbp-rm": 318, "erh-mc": 220, "vnj-rm": 162, "bel-rm": 74,
    "yam-bl": 32, "cot-rm": 0, "sal-aj": 328, "van-li": 30,
    "mai-mu": 14, "end-rm": 24, "gul-rm": 19,
  };
  const PLAYER_INT_CAPS: Record<string, number> = {
    "mbp-rm": 89, "erh-mc": 37, "vnj-rm": 72, "bel-rm": 44,
    "yam-bl": 17, "cot-rm": 101, "sal-aj": 97, "van-li": 73,
    "mai-mu": 9, "end-rm": 14, "gul-rm": 20,
  };
  const PLAYER_STYLE: Record<string, string> = {
    "mbp-rm": "⚡ Velocidad", "erh-mc": "🎯 Goleador", "vnj-rm": "🌪️ Regate",
    "bel-rm": "⚙️ Polivalente", "yam-bl": "✨ Prodigio", "cot-rm": "🧤 Reflejos",
    "sal-aj": "🔥 Consistencia", "van-li": "🏰 Liderazgo", "mai-mu": "🎭 Creatividad",
    "end-rm": "💥 Explosividad", "gul-rm": "🧠 Técnica",
  };

  const highestOwnedTier = userCards.reduce<"standard" | "silver" | "gold" | "diamond" | "legend">((highest, card) => {
    const tier = card.tier || (card.isGold ? "gold" : "standard");
    const weights = { standard: 1, silver: 2, gold: 3, diamond: 4, legend: 5 };
    if (weights[tier] > weights[highest]) {
      return tier;
    }
    return highest;
  }, "standard");

  const checkPriorityAccess = (player: any) => {
    if (!player.isHighHype) {
      return { hasAccess: true, reason: "" };
    }

    const tierWeights: Record<string, number> = { standard: 1, silver: 2, gold: 3, diamond: 4, legend: 5 };
    const userWeight = tierWeights[highestOwnedTier] || 1;

    if (simulatedHours === 0) {
      if (userWeight >= 4) { // Diamante / Leyenda
        return { hasAccess: true, reason: "" };
      }
      return {
        hasAccess: false,
        reason: "Requiere Nivel Diamante o Leyenda en Hora 0 (Acceso Oro en 24h, Público en 48h)"
      };
    } else if (simulatedHours === 24) {
      if (userWeight >= 3) { // Oro o superior
        return { hasAccess: true, reason: "" };
      }
      return {
        hasAccess: false,
        reason: "Requiere Nivel Oro o superior en Hora 24 (Acceso Público en 48h)"
      };
    }
    return { hasAccess: true, reason: "" };
  };

  // Auto-select first IPO player on mount so right panel is never empty
  useEffect(() => {
    const firstDrop = players.find(p => !p.isRookie && !p.isRetired);
    if (firstDrop && !selectedPlayerId) setSelectedPlayerId(firstDrop.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Profile modal state
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);

  // Custom listing price state
  const [listingPrices, setListingPrices] = useState<Record<string, string>>({});

  // Find selected listing if any
  const selectedListing = p2pListings.find((l) => l.id === selectedListingId);

  // If a listing is selected, use its player. Otherwise use the selectedPlayerId.
  const activePlayerId = selectedListing ? selectedListing.playerId : selectedPlayerId;
  const selectedPlayer = players.find((p) => p.id === activePlayerId);

  // User owned cards of the selected player
  const ownedCardsOfSelected = userCards.filter((c) => c.playerId === activePlayerId);

  // Filter players based on search / league / position
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.ticker.toLowerCase().includes(search.toLowerCase());

    const matchesLeague =
      selectedLeague === "Todas" ||
      (selectedLeague === "PL" && (player.team.includes("Man City") || player.team.includes("Liverpool"))) ||
      (selectedLeague === "LaLiga" && (player.team.includes("Real Madrid") || player.team.includes("FC Barcelona")));

    const matchesPosition =
      selectedPosition === "Todos" || player.position === selectedPosition;

    return matchesSearch && matchesLeague && matchesPosition;
  });

  const handleBuy = async (playerId: string) => {
    const res = await buyPlayer(playerId);
    alert(res.message);
  };

  const handleSell = async (cardId: string) => {
    const res = await sellPlayer(cardId);
    alert(res.message);
  };

  const handleListForSale = (cardId: string) => {
    const priceStr = listingPrices[cardId];
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      alert("Introduce un precio válido mayor a 0 USDC");
      return;
    }
    const res = listCardForSale(cardId, price);
    alert(res.message);
    if (res.success) {
      // Clear input
      setListingPrices(prev => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    }
  };

  const handleCancelListing = (listingId: string) => {
    const res = cancelP2PListing(listingId);
    alert(res.message);
  };

  const handleBuyP2P = (listingId: string) => {
    const res = buyP2PListing(listingId);
    alert(res.message);
  };

  // SVG Line Chart for player price history
  const renderPriceChart = (points: number[]) => {
    if (!points || points.length === 0) return null;
    const min = Math.min(...points) - 0.5;
    const max = Math.max(...points) + 0.5;
    const range = max - min || 1;
    const width = 400;
    const height = 150;

    const svgPoints = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="relative w-full h-[160px] bg-background-tertiary rounded-xl border border-border p-2 overflow-hidden mt-3">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#00D68F" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="url(#chartLine)"
            strokeWidth="3"
            strokeLinecap="round"
            points={svgPoints}
          />
          <polygon
            fill="url(#chartGlow)"
            points={`0,${height} ${svgPoints} ${width},${height}`}
          />
          <circle
            cx={width}
            cy={height - ((points[points.length - 1] - min) / range) * height}
            r="5"
            fill="#00D68F"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
        <span className="absolute top-2 right-2 text-[8px] font-mono-nums text-text-tertiary bg-background-secondary/80 px-2 py-0.5 rounded border border-border">
          Historial 30h
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Left Sidebar on Desktop */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto pb-20 md:pb-0">
        <Header title={marketTab === "ipo" ? t("market.ipo_tab") : t("market.p2p_tab")} />

        <main className="flex-1 px-4 py-4 max-w-5xl w-full mx-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left/Middle: Players search and Grid list */}
            <div className="lg:col-span-2 space-y-4">

              {/* Search */}
              <div>
                <Input
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>

              {/* League Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {leagues.map((league) => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedLeague === league
                        ? "bg-blue text-white shadow-glow-blue"
                        : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>

              {/* Position Filters */}
              <div className="flex gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                      selectedPosition === pos
                        ? "bg-blue text-white"
                        : "bg-background-secondary text-text-tertiary hover:bg-background-tertiary"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Market Type Switcher Tabs */}
              <div className="flex gap-3 border-b border-border/60 pb-1 mt-4">
                <button
                  onClick={() => setMarketTab("ipo")}
                  className={`pb-2.5 px-1 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                    marketTab === "ipo" ? "text-blue font-black" : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {t("market.ipo_tab")}
                  {marketTab === "ipo" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue shadow-glow-blue" />
                  )}
                </button>
                <button
                  onClick={() => setMarketTab("p2p")}
                  className={`pb-2.5 px-1 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                    marketTab === "p2p" ? "text-blue font-black" : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {t("market.p2p_tab")}
                  {marketTab === "p2p" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue shadow-glow-blue" />
                  )}
                </button>
              </div>

              {/* Fichaje Inicial Section */}
              {marketTab === "ipo" && (
                <section className="space-y-4">
                  {/* Timeline Simulator panel */}
                  <div className="relative bg-gradient-to-r from-blue/10 via-purple/10 to-blue/5 border border-blue/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden shadow-subtle">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue tracking-widest font-mono">{t("market.tier_sim")}</span>
                      <h4 className="text-xs font-bold text-text-primary mt-0.5">{t("market.tier_timeline")}</h4>
                      <p className="text-[10px] text-text-secondary">{t("market.tier_timeline.desc")}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 bg-background-tertiary p-1 rounded-xl border border-border">
                      {([0, 24, 48] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setSimulatedHours(h)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-colors ${
                            simulatedHours === h
                              ? "bg-blue text-white shadow-glow-blue"
                              : "text-text-secondary hover:bg-background-secondary"
                          }`}
                        >
                          {h === 0 ? t("market.h0") : h === 24 ? t("market.h24") : t("market.h48")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Tabs: Drops vs Rookies */}
                  <div className="flex gap-2 bg-background-secondary/40 border border-border/60 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setFichajeSubTab("drops")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                        fichajeSubTab === "drops"
                          ? "bg-blue text-white shadow-glow-blue/15"
                          : "text-text-secondary hover:bg-background-tertiary/50"
                      }`}
                    >
                      🎯 {t("market.drops")}
                    </button>
                    <button
                      onClick={() => setFichajeSubTab("rookies")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                        fichajeSubTab === "rookies"
                          ? "bg-purple text-white shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : "text-text-secondary hover:bg-background-tertiary/50"
                      }`}
                    >
                      ⚡ {t("market.rookies")}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                        {fichajeSubTab === "drops" ? t("market.ipo_active") : t("market.rookie_active")}
                      </h2>
                      <Badge variant="success">{t("market.ipo_tab")}</Badge>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {t("market.tier_label")}: <span className="text-gold font-bold uppercase">{highestOwnedTier}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredPlayers
                      .filter((p) => (fichajeSubTab === "drops" ? !p.isRookie : p.isRookie))
                      .map((player) => {
                        const access = checkPriorityAccess(player);
                        const isSelected = selectedPlayerId === player.id;

                        return (
                          <div
                            key={player.id}
                            onClick={() => {
                              setSelectedPlayerId(player.id);
                              setSelectedListingId(null);
                            }}
                            className={`cursor-pointer transition-transform relative rounded-2xl overflow-hidden border ${
                              isSelected
                                ? "border-blue scale-[0.98] shadow-glow-blue/15"
                                : !access.hasAccess
                                  ? "border-red/25 opacity-80"
                                  : "border-transparent"
                            }`}
                          >
                            <PlayerCard
                              ticker={player.ticker}
                              name={player.name}
                              team={player.team}
                              position={player.position}
                              price={player.price}
                              change={player.priceChangePercent}
                              stock={player.stockRemaining}
                              maxStock={player.stockTotal}
                              streak={player.streak}
                              isFrozen={player.isFrozen}
                              rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))}
                              onInfoClick={() => setProfilePlayerId(player.id)}
                            />

                            {/* Access overlay indicator */}
                            {player.isHighHype && (
                              <div className="absolute top-2 right-2 z-20">
                                {access.hasAccess ? (
                                  <span className="bg-green text-white text-[8px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded shadow-glow-green">
                                    ✓ {t("market.priority_ok")}
                                  </span>
                                ) : (
                                  <span className="bg-red text-white text-[8px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                    🔒 {t("market.blocked")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </section>
              ) /* End Fichaje Inicial */}

              {/* P2P Secondary Market Section */}
              {marketTab === "p2p" && (
                <section className="space-y-4">

                  {/* ── SELL CTA Banner ── */}
                  <div className="relative bg-gradient-to-r from-blue/10 via-purple/10 to-blue/5 border border-blue/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue/10 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">{t("market.sell_cta")}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {t("market.sell_cta.desc")}
                      </p>
                    </div>
                    <Link
                      href="/portfolio"
                      className="shrink-0 inline-flex items-center gap-2 bg-blue text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-glow-blue"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t("market.sell_cta.btn")}
                    </Link>
                  </div>

                  {/* ── Profile Banner: appears when a listing is selected ── */}
                  {selectedListing && selectedPlayer && (
                    <div className="bg-background-secondary border border-blue/40 rounded-2xl p-3 flex flex-wrap items-center gap-3 animate-fadeIn">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-sm border shrink-0 ${
                        selectedPlayer.position === "FW" ? "bg-green/10 border-green/30 text-green" :
                        selectedPlayer.position === "MD" ? "bg-blue/10 border-blue/30 text-blue" :
                        selectedPlayer.position === "DF" ? "bg-purple/10 border-purple/30 text-purple" :
                        "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}>
                        <span className="text-xs font-black">{selectedPlayer.position}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{selectedPlayer.name}</p>
                        <p className="text-[10px] text-text-secondary">{selectedPlayer.team} · {selectedPlayer.nationality}</p>
                      </div>
                      {PLAYER_AGES[selectedPlayer.id] && (
                        <div className="text-center shrink-0 bg-background-tertiary border border-border rounded-lg px-2.5 py-1.5">
                          <p className="text-[7px] font-mono text-text-tertiary uppercase tracking-wider">{t("market.profile_age")}</p>
                          <p className="text-sm font-bold text-text-primary">{PLAYER_AGES[selectedPlayer.id]}</p>
                        </div>
                      )}
                      {PLAYER_MARKET_VALUES[selectedPlayer.id] && (
                        <div className="text-center shrink-0 bg-background-tertiary border border-border rounded-lg px-2.5 py-1.5">
                          <p className="text-[7px] font-mono text-text-tertiary uppercase tracking-wider">{t("market.profile_val")}</p>
                          <p className="text-sm font-bold text-green">{PLAYER_MARKET_VALUES[selectedPlayer.id]}</p>
                        </div>
                      )}
                      <div className="text-center shrink-0 bg-blue/10 border border-blue/30 rounded-lg px-2.5 py-1.5">
                        <p className="text-[7px] font-mono text-text-tertiary uppercase tracking-wider">{t("market.profile_token_price")}</p>
                        <p className="text-sm font-bold text-blue">${selectedListing.price.toFixed(2)}</p>
                      </div>
                      <div className="text-center shrink-0 bg-background-tertiary border border-border rounded-lg px-2.5 py-1.5">
                        <p className="text-[7px] font-mono text-text-tertiary uppercase tracking-wider">{t("market.p2p_seller")}</p>
                        <p className="text-xs font-bold text-text-secondary">@{selectedListing.sellerName}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Header Row ── */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                        {t("market.active_offers")}
                      </h2>
                      <span className="text-[10px] text-text-tertiary uppercase font-mono">
                        {p2pListings.filter(l => l.sellerName !== "MiUsuarioP2P").length} {t("market.available")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green/10 border border-green/30 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold font-mono text-green uppercase tracking-wider">{t("market.p2p_tab")}</span>
                    </div>
                  </div>

                  {/* ── 2-column Listings Grid (other users' listings only) ── */}
                  {p2pListings.filter(l => l.sellerName !== "MiUsuarioP2P").length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {p2pListings.filter(l => l.sellerName !== "MiUsuarioP2P").map((listing) => {
                        const player = players.find(p => p.id === listing.playerId);
                        if (!player) return null;
                        const isSelected = selectedListingId === listing.id;
                        const cardTier = listing.tier || (listing.isGold ? "gold" : "standard");
                        const baseTierValuation = getCardValuation(player.price, cardTier);
                        const vsIPODiff = ((listing.price - baseTierValuation) / baseTierValuation) * 100;

                        const avatarBg =
                          cardTier === "silver" ? "bg-gradient-to-br from-slate-400/20 to-slate-600/30 border-slate-400/40" :
                          cardTier === "gold" ? "bg-gradient-to-br from-gold/20 to-amber-900/40 border-gold/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]" :
                          cardTier === "diamond" ? "bg-gradient-to-br from-cyan-400/20 to-cyan-700/30 border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]" :
                          cardTier === "legend" ? "bg-gradient-to-br from-fuchsia-500/30 to-indigo-900/50 border-fuchsia-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]" :
                          "bg-background-tertiary border-border/60";

                        const avatarText =
                          cardTier === "silver" ? "text-slate-300" :
                          cardTier === "gold" ? "text-gold" :
                          cardTier === "diamond" ? "text-cyan-300" :
                          cardTier === "legend" ? "text-fuchsia-300" :
                          "text-text-primary";

                        const shimmerBg =
                          cardTier === "silver" ? "from-slate-400/8" :
                          cardTier === "gold" ? "from-gold/8" :
                          cardTier === "diamond" ? "from-cyan-400/8" :
                          "from-fuchsia-500/12";

                        const tierLabel =
                          cardTier === "silver" ? "PLATA" :
                          cardTier === "gold" ? "ORO" :
                          cardTier === "diamond" ? "DIAMANTE" :
                          cardTier === "legend" ? "LEYENDA" : null;

                        const tierLabelColor =
                          cardTier === "silver" ? "bg-slate-400 text-background" :
                          cardTier === "gold" ? "bg-gold text-background" :
                          cardTier === "diamond" ? "bg-cyan-500 text-background" :
                          "bg-fuchsia-600 text-white";

                        const posColor =
                          player.position === "FW" ? "text-green bg-green/10 border-green/30" :
                          player.position === "MD" ? "text-blue bg-blue/10 border-blue/30" :
                          player.position === "DF" ? "text-purple bg-purple/10 border-purple/30" :
                          "text-amber-400 bg-amber-500/10 border-amber-500/30";

                        return (
                          <div
                            key={listing.id}
                            onClick={() => { setSelectedListingId(listing.id); setSelectedPlayerId(null); }}
                            className={`relative border rounded-2xl p-3.5 cursor-pointer transition-all overflow-hidden ${
                              isSelected
                                ? "border-blue bg-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                : "border-border/60 bg-background-secondary hover:border-border hover:bg-background-tertiary"
                            }`}
                          >
                            {/* Tier shimmer */}
                            {cardTier !== "standard" && (
                              <div className={`absolute inset-0 bg-gradient-to-br ${shimmerBg} via-transparent to-transparent pointer-events-none`} />
                            )}

                            {/* Top row: avatar + name/team + info button */}
                            <div className="relative flex items-center gap-2.5 mb-2.5">
                              <div className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center border shrink-0 ${avatarBg}`}>
                                <span className={`text-sm font-black leading-none ${avatarText}`}>
                                  {player.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                </span>
                                <span className="text-[6px] font-mono uppercase text-text-tertiary mt-0.5">{player.ticker.split("-")[0]}</span>
                                {tierLabel && (
                                  <span className={`absolute -top-1.5 -right-1.5 text-[6px] font-black px-1 py-0.5 rounded leading-none font-mono ${tierLabelColor}`}>
                                    {tierLabel.slice(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-text-primary truncate leading-tight">{player.name}</p>
                                <p className="text-[9px] text-text-tertiary truncate mt-0.5">{player.team}</p>
                              </div>
                              {/* Info button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); setProfilePlayerId(player.id); }}
                                className="w-6 h-6 rounded-full border border-border/60 bg-background-tertiary flex items-center justify-center text-text-tertiary hover:text-blue hover:border-blue/50 transition-all cursor-pointer shrink-0"
                                title="Ver perfil"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>

                            {/* Middle row: position badge + S/N */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border font-mono ${posColor}`}>
                                {player.position}
                              </span>
                              <span className="text-[8px] font-mono text-text-tertiary bg-background-tertiary border border-border/50 px-1.5 py-0.5 rounded">
                                {t("market.p2p_sn")} #{listing.serialNumber}
                              </span>
                            </div>

                            {/* Price row */}
                            <div className="flex items-baseline justify-between">
                              <span className="text-base font-black font-mono-nums text-green">${listing.price.toFixed(2)}</span>
                              <span className={`text-[9px] font-bold font-mono-nums ${vsIPODiff >= 0 ? "text-red" : "text-green"}`}>
                                {vsIPODiff >= 0 ? "+" : ""}{vsIPODiff.toFixed(1)}% {t("market.p2p_vs")}
                              </span>
                            </div>
                            <p className="text-[8px] text-text-tertiary font-mono mt-1">@{listing.sellerName}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-10 text-center">
                      <p className="text-text-secondary">{t("market.p2p_no_listings")}</p>
                    </div>
                  )}

                  {/* ── Mis fichas en venta (gestión) ── */}
                  {p2pListings.some(l => l.sellerName === "MiUsuarioP2P") && (
                    <div className="border border-blue/20 bg-blue/5 rounded-2xl p-3 space-y-2">
                      <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-blue">
                        {t("market.my_sales")} ({p2pListings.filter(l => l.sellerName === "MiUsuarioP2P").length})
                      </p>
                      {p2pListings.filter(l => l.sellerName === "MiUsuarioP2P").map((listing) => {
                        const player = players.find(p => p.id === listing.playerId);
                        if (!player) return null;
                        return (
                          <div key={listing.id} className="flex items-center justify-between bg-background-secondary border border-border/60 rounded-xl px-3 py-2">
                            <div>
                              <span className="text-xs font-bold text-text-primary">{player.name}</span>
                              <span className="text-[9px] text-text-tertiary ml-2 font-mono">{t("market.p2p_sn")} #{listing.serialNumber}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold font-mono-nums text-green">${listing.price.toFixed(2)}</span>
                              <button
                                onClick={() => handleCancelListing(listing.id)}
                                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border border-red/30 text-red bg-red/10 hover:bg-red/20 transition-colors cursor-pointer"
                              >
                                {t("market.p2p_cancel")}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

            </div>

            {/* Right: Selected Player Detail Drawer/Card */}
            <div className="space-y-4">
              {selectedPlayer ? (
                <Card variant="elevated" className="border-border/80 sticky top-4">
                  <div className="flex items-start justify-between border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue bg-blue/10 px-2 py-0.5 rounded">
                          {selectedPlayer.ticker}
                        </span>
                        {selectedListing ? (
                          <Badge variant="warning" className="text-[9px] font-bold">
                            {t("market.p2p_tab")}
                          </Badge>
                        ) : (
                          <Badge variant="blue" className="text-[9px] font-bold">
                            {t("market.ipo_tab")}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mt-2.5">{selectedPlayer.name}</h3>
                      <p className="text-xs text-text-secondary">
                        {selectedPlayer.team} • {selectedPlayer.nationality}
                      </p>
                      {selectedListing && (
                        <p className="text-[10px] text-text-tertiary mt-1">
                          {t("market.p2p_seller")} <span className="text-text-secondary font-bold">@{selectedListing.sellerName}</span>
                        </p>
                      )}
                    </div>
                    <Badge variant={
                      selectedPlayer.position === "FW" ? "success" :
                      selectedPlayer.position === "MD" ? "blue" :
                      selectedPlayer.position === "DF" ? "purple" : "warning"
                    }>
                      {selectedPlayer.position}
                    </Badge>
                  </div>

                  {/* Chart */}
                  <div className="py-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary font-mono">{t("stats.price_trend")}</p>
                    {renderPriceChart(selectedPlayer.priceHistory)}
                  </div>

                  {/* L5 Performance Section */}
                  <div className="py-3 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary font-mono">
                        {t("stats.last5")}
                      </span>
                      <span className="text-xs font-mono font-bold text-text-primary">
                        {t("stats.l5_avg")}: <span className="text-blue font-bold">{
                          (selectedPlayer.last5Scores && selectedPlayer.last5Scores.length > 0)
                            ? (selectedPlayer.last5Scores.reduce((sum, v) => sum + v, 0) / selectedPlayer.last5Scores.length).toFixed(1)
                            : "0.0"
                        } pts</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-background-secondary/50 border border-border/40 p-2.5 rounded-xl px-4">
                      {(selectedPlayer.last5Scores || []).map((score, idx) => {
                        let dotColorClass = "bg-red shadow-[0_0_8px_rgba(255,59,48,0.4)]";
                        if (score >= 90) {
                          dotColorClass = "bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_0_12px_rgba(250,204,21,0.8)] border border-yellow-200/50";
                        } else if (score >= 75) {
                          dotColorClass = "bg-green shadow-[0_0_8px_rgba(0,214,143,0.5)]";
                        } else if (score >= 50) {
                          dotColorClass = "bg-gold shadow-[0_0_8px_rgba(255,184,0,0.5)]";
                        }
                        return (
                          <div key={idx} className="group relative flex flex-col items-center gap-1 cursor-pointer">
                            <div className={`w-3.5 h-3.5 rounded-full ${dotColorClass} transition-transform group-hover:scale-125 duration-200`} />
                            <span className="text-[9px] font-mono-nums font-bold text-text-tertiary group-hover:text-text-primary transition-colors">
                              {score.toFixed(1)}
                            </span>
                            <div className="absolute bottom-full mb-1.5 hidden group-hover:block bg-background border border-border text-[9px] px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 font-mono">
                              Partido {idx + 1}: {score.toFixed(1)} pts
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono-nums">
                    <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                      <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("stats.last_match")}</span>
                      <span className="text-sm font-bold text-text-primary">{selectedPlayer.pointsLastWeek}</span>
                    </div>
                    <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                      <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("market.profile_streak")}</span>
                      <span className="text-sm font-bold text-gold">🔥 {selectedPlayer.streak}</span>
                    </div>
                    <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                      <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("stats.goals")} / {t("stats.assists")}</span>
                      <span className="text-sm font-bold text-text-primary">
                        ⚽ {selectedPlayer.goals || 0} / 🎯 {selectedPlayer.assists || 0}
                      </span>
                    </div>
                    <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                      <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">
                        {selectedListing ? t("market.p2p_sn") : t("market.stock")}
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        {selectedListing ? `#${selectedListing.serialNumber}` : `${selectedPlayer.stockRemaining}/${selectedPlayer.stockTotal}`}
                      </span>
                    </div>
                    {PLAYER_AGES[selectedPlayer.id] && (
                      <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("market.profile_age")}</span>
                        <span className="text-sm font-bold text-text-primary">{PLAYER_AGES[selectedPlayer.id]} {t("market.profile_age_suffix")}</span>
                      </div>
                    )}
                    {PLAYER_MARKET_VALUES[selectedPlayer.id] && (
                      <div className="bg-background-secondary border border-border p-2.5 rounded-xl text-center">
                        <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("market.profile_val")}</span>
                        <span className="text-sm font-bold text-green">{PLAYER_MARKET_VALUES[selectedPlayer.id]}</span>
                      </div>
                    )}
                  </div>

                  {/* Purchase/Buy Button */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">{t("common.price")}:</span>
                      <span className="font-mono-nums font-bold text-green">
                        ${selectedListing ? selectedListing.price.toFixed(2) : selectedPlayer.price.toFixed(2)} USDC
                      </span>
                    </div>

                    {selectedListing ? (
                      selectedListing.sellerName === "MiUsuarioP2P" ? (
                        <Button
                          variant="secondary"
                          className="w-full font-bold border border-border"
                          onClick={() => handleCancelListing(selectedListing.id)}
                        >
                          {t("market.cancel_sale")}
                        </Button>
                      ) : (
                        <Button
                          variant="buy"
                          className="w-full font-bold"
                          disabled={selectedPlayer.isFrozen}
                          onClick={() => handleBuyP2P(selectedListing.id)}
                        >
                          {selectedPlayer.isFrozen ? t("market.locked") : t("market.buy_p2p")}
                        </Button>
                      )
                    ) : (() => {
                      const accessStatus = checkPriorityAccess(selectedPlayer);
                      const isLocked = !accessStatus.hasAccess;
                      return (
                        <div className="space-y-2">
                          <Button
                            variant="buy"
                            className="w-full font-bold"
                            disabled={selectedPlayer.stockRemaining <= 0 || selectedPlayer.isFrozen || isLocked}
                            onClick={() => handleBuy(selectedPlayer.id)}
                          >
                            {selectedPlayer.isFrozen ? t("market.locked") :
                             selectedPlayer.stockRemaining <= 0 ? t("market.sold_out") :
                             isLocked ? t("market.blocked") : t("market.buy_ipo")}
                          </Button>
                          {isLocked && (
                            <p className="text-[10px] text-red font-semibold text-center border border-red/20 bg-red/5 p-2 rounded-lg leading-relaxed">
                              ⚠️ {accessStatus.reason}
                            </p>
                          )}
                          {selectedPlayer.isHighHype && !isLocked && (
                            <p className="text-[10px] text-green font-semibold text-center mt-1">
                              ✓ {t("market.priority_ok")} ({t("market.tier_label")}: {highestOwnedTier.toUpperCase()})
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* User owned cards listing & Sell buttons */}
                  {ownedCardsOfSelected.length > 0 && (
                    <div className="pt-4 border-t border-border space-y-2.5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary font-mono">
                        {t("market.my_cards")} ({ownedCardsOfSelected.length})
                      </p>
                      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                        {ownedCardsOfSelected.map((card) => {
                          const cardTier = card.tier || (card.isGold ? "gold" : "standard");
                          const containerClass =
                            cardTier === "silver" ? "bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/40" :
                            cardTier === "gold" ? "bg-gradient-to-r from-gold/15 to-transparent border-gold/40 shadow-[0_0_12px_rgba(245,158,11,0.05)]" :
                            cardTier === "diamond" ? "bg-gradient-to-r from-cyan-500/15 to-transparent border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.05)]" :
                            cardTier === "legend" ? "bg-gradient-to-r from-fuchsia-600/20 via-purple-600/10 to-transparent border-fuchsia-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]" :
                            "bg-background-secondary border-border hover:bg-background-tertiary";

                          const labelText =
                            cardTier === "silver" ? "Plata" :
                            cardTier === "gold" ? "Oro" :
                            cardTier === "diamond" ? "Diamante" :
                            cardTier === "legend" ? "Leyenda" :
                            "Estándar";

                          return (
                            <div
                              key={card.id}
                              className={`border rounded-xl p-3 flex flex-col gap-3 font-mono-nums transition-all ${containerClass}`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-text-primary text-xs">{t("market.p2p_sn")}: #{card.serialNumber || "1"}</span>
                                {cardTier !== "standard" && (
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-widest font-mono
                                    ${cardTier === "silver" ? "text-slate-300 bg-slate-400/10 border-slate-400/30" :
                                      cardTier === "gold" ? "text-gold bg-gold/10 border-gold/30" :
                                      cardTier === "diamond" ? "text-cyan-300 bg-cyan-500/10 border-cyan-400/30" :
                                      "text-fuchsia-300 bg-fuchsia-600/20 border-fuchsia-500/30"}`}
                                  >
                                    {labelText}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-text-secondary mt-1">
                                {t("common.price")}: <span className="text-green font-bold">${card.acquiredPrice.toFixed(2)} USDC</span>
                              </div>

                            {/* P2P Listing Form for this card */}
                            <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  placeholder={t("market.price_p2p")}
                                  value={listingPrices[card.id] || ""}
                                  onChange={(e) => setListingPrices(prev => ({ ...prev, [card.id]: e.target.value }))}
                                  className="w-full bg-background-tertiary border border-border rounded-lg py-1 px-2.5 text-xs text-text-primary focus:outline-none focus:border-blue"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-tertiary">USDC</span>
                              </div>
                              <Button
                                variant="buy"
                                size="sm"
                                className="text-[10px] px-3 py-1 bg-blue text-white font-bold"
                                disabled={selectedPlayer.isFrozen}
                                onClick={() => handleListForSale(card.id)}
                              >
                                {t("market.list_p2p")}
                              </Button>
                            </div>
                          </div>
                        ); })}
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-6 text-center sticky top-4 space-y-2">
                  <p className="text-text-secondary text-sm">{t("market.select_hint")}</p>
                  <p className="text-text-tertiary text-xs">{t("market.select_hint.desc")}</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════
          PLAYER PROFILE MODAL — "WOW" design
          Opens when clicking ℹ on any player card
         ══════════════════════════════════════════════ */}
      {profilePlayerId && (() => {
        const player = players.find(p => p.id === profilePlayerId);
        if (!player) return null;

        const positionCfg = {
          FW: {
            gradient: "from-green/20 via-green/8",
            glow: "shadow-[0_0_80px_rgba(0,214,143,0.25)]",
            border: "border-green/50",
            text: "text-green",
            bgAccent: "bg-green/15",
            label: t("pos.FW"),
            dot: "bg-green/30",
          },
          MD: {
            gradient: "from-blue/20 via-blue/8",
            glow: "shadow-[0_0_80px_rgba(59,130,246,0.25)]",
            border: "border-blue/50",
            text: "text-blue",
            bgAccent: "bg-blue/15",
            label: t("pos.MD"),
            dot: "bg-blue/30",
          },
          DF: {
            gradient: "from-purple/20 via-purple/8",
            glow: "shadow-[0_0_80px_rgba(168,85,247,0.25)]",
            border: "border-purple/50",
            text: "text-purple",
            bgAccent: "bg-purple/15",
            label: t("pos.DF"),
            dot: "bg-purple/30",
          },
          GK: {
            gradient: "from-amber-500/20 via-amber-500/8",
            glow: "shadow-[0_0_80px_rgba(245,158,11,0.25)]",
            border: "border-amber-500/50",
            text: "text-amber-400",
            bgAccent: "bg-amber-500/15",
            label: t("pos.GK"),
            dot: "bg-amber-500/30",
          },
        } as const;
        const cfg = positionCfg[player.position as keyof typeof positionCfg];

        const profileStats = [
          { label: t("market.profile_age"), value: PLAYER_AGES[player.id] ? `${PLAYER_AGES[player.id]} ${t("market.profile_age_suffix")}` : "—" },
          { label: t("market.profile_height"), value: PLAYER_HEIGHTS[player.id] ?? "—" },
          { label: t("market.profile_foot"), value: PLAYER_FOOT[player.id] ?? "—" },
          { label: t("market.profile_val"), value: PLAYER_MARKET_VALUES[player.id] ?? "—", highlight: true },
          { label: t("market.profile_country"), value: PLAYER_LEAGUE_COUNTRY[player.id] ?? "—" },
          { label: player.position === "GK" ? t("market.profile_caps") : t("market.profile_career"), value: player.position === "GK" ? (PLAYER_INT_CAPS[player.id]?.toString() ?? "—") : (PLAYER_CAREER_GOALS[player.id]?.toString() ?? "—"), highlight: true },
          { label: t("market.profile_caps"), value: PLAYER_INT_CAPS[player.id]?.toString() ?? "—", hidden: player.position === "GK" },
          { label: t("market.profile_style"), value: PLAYER_STYLE[player.id] ?? "—" },
        ].filter(s => !("hidden" in s && s.hidden));

        return (
          <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-background/75 backdrop-blur-lg p-0 sm:p-4"
            onClick={() => setProfilePlayerId(null)}
          >
            <div
              className={`w-full sm:max-w-md bg-background border border-border/70 sm:rounded-3xl rounded-t-3xl overflow-hidden ${cfg.glow} animate-fadeIn`}
              onClick={e => e.stopPropagation()}
            >
              {/* ── HEADER ── */}
              <div className={`relative bg-gradient-to-br ${cfg.gradient} to-transparent px-6 py-7 overflow-hidden border-b border-border/30`}>
                {/* Decorative blobs */}
                <div className={`absolute -top-10 -right-10 w-48 h-48 ${cfg.dot} rounded-full blur-3xl pointer-events-none`} />
                <div className={`absolute -bottom-6 -left-6 w-32 h-32 ${cfg.dot} rounded-full blur-2xl pointer-events-none`} />

                {/* Close button */}
                <button
                  onClick={() => setProfilePlayerId(null)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/70 border border-border/60 backdrop-blur-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  ×
                </button>

                <div className="relative z-10 flex items-center gap-5">
                  {/* Large avatar badge */}
                  <div className={`relative w-20 h-20 rounded-2xl border-2 ${cfg.border} ${cfg.bgAccent} backdrop-blur-sm flex flex-col items-center justify-center ${cfg.glow}`}>
                    <span className={`text-2xl font-black ${cfg.text} leading-none`}>
                      {player.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="text-[8px] font-mono text-text-tertiary mt-1 tracking-widest">{player.ticker}</span>
                    {/* Hot streak pulse */}
                    {player.streak >= 3 && (
                      <span className="absolute -top-2 -right-2 text-base leading-none animate-pulse">🔥</span>
                    )}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    {/* Position badge */}
                    <span className={`inline-flex items-center text-[9px] font-black px-2.5 py-1 rounded-lg border ${cfg.border} ${cfg.text} ${cfg.bgAccent} font-mono uppercase tracking-widest mb-2`}>
                      {cfg.label}
                    </span>
                    <h2 className="text-xl font-black text-text-primary leading-tight truncate">{player.name}</h2>
                    <p className="text-sm text-text-secondary mt-0.5">{player.team}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{player.nationality}</p>
                    {PLAYER_STYLE[player.id] && (
                      <p className={`text-[10px] font-bold mt-1.5 ${cfg.text}`}>{PLAYER_STYLE[player.id]}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STATS GRID ── */}
              <div className="px-5 pt-4 pb-2 grid grid-cols-4 gap-2">
                {profileStats.slice(0, 8).map(({ label, value, highlight }) => (
                  <div key={label} className="bg-background-secondary border border-border/50 rounded-xl p-2 text-center col-span-1">
                    <p className="text-[7px] font-mono uppercase tracking-wider text-text-tertiary leading-tight">{label}</p>
                    <p className={`text-[10px] font-bold mt-0.5 leading-tight ${highlight ? cfg.text : "text-text-primary"}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* ── PERFORMANCE SECTION ── */}
              <div className="px-5 pt-3 pb-5 space-y-3 border-t border-border/30 mt-2">
                {/* L5 dots */}
                {player.last5Scores && player.last5Scores.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary">{t("market.profile_last5")}</p>
                      <p className={`text-[9px] font-bold font-mono ${cfg.text}`}>
                        {t("stats.l5_avg")}: {(player.last5Scores.reduce((s, v) => s + v, 0) / player.last5Scores.length).toFixed(1)} pts
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {player.last5Scores.map((score, idx) => {
                        const dotColor =
                          score >= 90 ? "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.7)]" :
                          score >= 75 ? "bg-green shadow-[0_0_8px_rgba(0,214,143,0.5)]" :
                          score >= 50 ? "bg-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]" :
                          "bg-red/60";
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full ${dotColor} transition-transform hover:scale-125`} />
                            <span className="text-[9px] font-mono-nums font-bold text-text-tertiary">{score.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary text-center py-1">{t("market.profile_no_data")}</p>
                )}

                {/* Token stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background-secondary border border-border/50 rounded-xl p-2.5 text-center">
                    <p className="text-[7px] font-mono uppercase text-text-tertiary">{t("market.profile_token_price")}</p>
                    <p className={`text-sm font-black ${cfg.text} mt-0.5`}>${player.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-background-secondary border border-border/50 rounded-xl p-2.5 text-center">
                    <p className="text-[7px] font-mono uppercase text-text-tertiary">{t("market.profile_var")}</p>
                    <p className={`text-sm font-black mt-0.5 ${player.priceChangePercent >= 0 ? "text-green" : "text-red"}`}>
                      {player.priceChangePercent >= 0 ? "+" : ""}{player.priceChangePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-background-secondary border border-border/50 rounded-xl p-2.5 text-center">
                    <p className="text-[7px] font-mono uppercase text-text-tertiary">{t("market.profile_streak")}</p>
                    <p className="text-sm font-black text-gold mt-0.5">🔥 {player.streak}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Nav on Mobile */}
      <BottomNav />
    </div>
  );
}
