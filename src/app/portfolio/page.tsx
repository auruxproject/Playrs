"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { PlayerCard } from "@/components/player/PlayerCard";
import { useStore, getPlayerCategory, getForgeRequirements, getTierPriceMultiplier, getP2PVolumeFeePercent, getBetFeePercent, getReferralBonusPercent, RETIRED_REASSIGN_FEE } from "@/context/StoreContext";

export default function PortfolioPage() {
  const { t } = useLanguage();
  const { players, userCards, sellPlayer, forgeCard, assignRetiredTeam, balance } = useStore();
  const [filterTab, setFilterTab] = useState<"all" | "standard" | "silver" | "gold" | "diamond" | "legend">("all");
  const [sortBy, setSortBy] = useState<"acquiredAt" | "serialNumber" | "l5Performance">("acquiredAt");

  // Forging States
  const [selectedForgePlayerId, setSelectedForgePlayerId] = useState("yam-bl"); // Yamal has 30 standard cards, perfect for silver forge
  const [targetForgeTier, setTargetForgeTier] = useState<"silver" | "gold" | "diamond" | "legend">("silver");
  const [isForging, setIsForging] = useState(false);
  const [forgeSuccessPlayerId, setForgeSuccessPlayerId] = useState<string | null>(null);
  const [forgeSuccessTier, setForgeSuccessTier] = useState<"silver" | "gold" | "diamond" | "legend" | null>(null);

  // Card detail focus modal
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

  // Retired legend team assignment
  const [retiredAssignTeam, setRetiredAssignTeam] = useState<string>("");

  // Selected player for forge info
  const forgePlayer = players.find((p) => p.id === selectedForgePlayerId);
  const playerPrice = forgePlayer ? forgePlayer.price : 0;
  const category = getPlayerCategory(playerPrice);
  const { cards: cardsRequired, fee: usdcFee } = getForgeRequirements(targetForgeTier, category);

  // Source tier required to forge to target tier
  const sourceTier: "standard" | "silver" | "gold" | "diamond" =
    targetForgeTier === "silver" ? "standard" :
    targetForgeTier === "gold" ? "silver" :
    targetForgeTier === "diamond" ? "gold" : "diamond";

  // Count matching source cards owned by the user
  const matchingSourceCardsCount = userCards.filter(
    c => c.playerId === selectedForgePlayerId && (c.tier || (c.isGold ? "gold" : "standard")) === sourceTier
  ).length;

  // Calculate portfolio summaries dynamically using the 5-tier multipliers
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
  const totalGain = portfolioValuation - initialInvestment;
  const gainPct = initialInvestment > 0 ? (totalGain / initialInvestment) * 100 : 0;

  // Filter user cards
  const filteredCards = userCards.filter((card) => {
    const cardTier = card.tier || (card.isGold ? "gold" : "standard");
    if (filterTab === "all") return true;
    return cardTier === filterTab;
  });

  // Sort filtered cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "serialNumber") {
      return (a.serialNumber || 0) - (b.serialNumber || 0);
    }
    if (sortBy === "l5Performance") {
      const playerA = players.find((p) => p.id === a.playerId);
      const playerB = players.find((p) => p.id === b.playerId);
      const avgA = playerA && playerA.last5Scores && playerA.last5Scores.length > 0
        ? playerA.last5Scores.reduce((sum, v) => sum + v, 0) / playerA.last5Scores.length
        : 0;
      const avgB = playerB && playerB.last5Scores && playerB.last5Scores.length > 0
        ? playerB.last5Scores.reduce((sum, v) => sum + v, 0) / playerB.last5Scores.length
        : 0;
      return avgB - avgA; // Descending
    }
    // Default acquiredAt descending
    return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
  });

  const handleSellClick = async (cardId: string) => {
    const res = await sellPlayer(cardId);
    alert(res.message);
    setFocusedCardId(null);
  };

  const handleForgeClick = () => {
    setIsForging(true);

    // Simulate premium forging animation (visual delay); la forja real se confirma en el servidor.
    setTimeout(async () => {
      const res = await forgeCard(selectedForgePlayerId, targetForgeTier);
      setIsForging(false);

      if (res.success) {
        setForgeSuccessTier(targetForgeTier);
        setForgeSuccessPlayerId(selectedForgePlayerId);
      } else {
        alert(res.message);
      }
    }, 2500);
  };

  // Helper to get tier text label
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "silver": return "Plata";
      case "gold": return "Oro Élite";
      case "diamond": return "Diamante";
      case "legend": return "Leyenda";
      case "standard":
      default: return "Estándar";
    }
  };

  const getBenefitsComparison = () => {
    const curTier = sourceTier;
    const nextTier = targetForgeTier;
    const cat = category;

    const p2pFeeCur = `${(getP2PVolumeFeePercent(curTier, cat) * 100).toFixed(1)}%`;
    const p2pFeeNext = `${(getP2PVolumeFeePercent(nextTier, cat) * 100).toFixed(1)}%`;

    const betFeeCur = `${(getBetFeePercent(curTier, cat) * 100).toFixed(1)}%`;
    const betFeeNext = `${(getBetFeePercent(nextTier, cat) * 100).toFixed(1)}%`;

    const refP2PCur = `${(getReferralBonusPercent(curTier, cat, "secondary") * 100).toFixed(0)}%`;
    const refP2PNext = `${(getReferralBonusPercent(nextTier, cat, "secondary") * 100).toFixed(0)}%`;

    const refIPOCur = `${(getReferralBonusPercent(curTier, cat, "primary") * 100).toFixed(1)}%`;
    const refIPONext = `${(getReferralBonusPercent(nextTier, cat, "primary") * 100).toFixed(1)}%`;

    const ipoCur = curTier === "standard" ? "Público (48h)" :
                   curTier === "silver" ? "Público (48h)" :
                   curTier === "gold" ? "Oro (24h)" : "Priority (0h)";

    const ipoNext = nextTier === "silver" ? "Público (48h)" :
                    nextTier === "gold" ? "Oro (24h)" : "Priority (0h)";

    const getDaoVotes = (tier: "standard" | "silver" | "gold" | "diamond" | "legend") => {
      if (tier === "standard") return "0 votos";
      if (tier === "silver") return cat === "c3" || cat === "c4" || cat === "c5" ? "2 votos" : "1 voto";
      if (tier === "gold") return cat === "c3" || cat === "c4" || cat === "c5" ? "5 votos" : "3 votos";
      if (tier === "diamond") return cat === "c3" || cat === "c4" || cat === "c5" ? "10 votos" : "7 votos";
      return cat === "c3" || cat === "c4" || cat === "c5" ? "25 votos" : "15 votos";
    };
    const daoCur = getDaoVotes(curTier);
    const daoNext = getDaoVotes(nextTier);

    const getRaffleTickets = (tier: "standard" | "silver" | "gold" | "diamond" | "legend") => {
      if (tier === "standard") return "0 tix";
      if (tier === "silver") return cat === "c3" || cat === "c4" || cat === "c5" ? "2 tix" : "1 tix";
      if (tier === "gold") return cat === "c3" || cat === "c4" || cat === "c5" ? "6 tix" : "3 tix";
      if (tier === "diamond") return cat === "c3" || cat === "c4" || cat === "c5" ? "20 tix" : "10 tix";
      return cat === "c3" || cat === "c4" || cat === "c5" ? "50 tix" : "25 tix";
    };
    const raffleCur = getRaffleTickets(curTier);
    const raffleNext = getRaffleTickets(nextTier);

    return [
      { label: "Comisión Venta P2P", cur: p2pFeeCur, next: p2pFeeNext, highlight: true },
      { label: "Comisión Rake Apuestas", cur: betFeeCur, next: betFeeNext, highlight: true },
      { label: "Bono Referidos P2P (Fee Share)", cur: refP2PCur, next: refP2PNext, highlight: true },
      { label: "Bono Referidos IPO (Vol. Share)", cur: refIPOCur, next: refIPONext, highlight: true },
      { label: "Acceso Fichajes", cur: ipoCur, next: ipoNext, highlight: false },
      { label: "Votos DAO Draft", cur: daoCur, next: daoNext, highlight: false },
      { label: "Sorteos Mensuales (Rifas)", cur: raffleCur, next: raffleNext, highlight: false },
    ];
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground relative">
      {/* Left Sidebar on Desktop */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto pb-20 md:pb-0">
        <Header title={t("portfolio.title")} />

        <main className="flex-1 px-4 py-4 max-w-5xl w-full mx-auto space-y-4">

          {/* Portfolio Summary Card */}
          <Card variant="elevated" className="border-border/80">
            <div className="text-center mb-4">
              <p className="text-xs text-text-secondary uppercase tracking-widest font-mono">{t("portfolio.value")}</p>
              <p className="text-4xl font-bold font-mono-nums text-text-primary mt-1">
                ${portfolioValuation.toFixed(2)} <span className="text-lg font-normal text-text-tertiary">USDC</span>
              </p>
              <p className={`text-sm font-semibold mt-1.5 ${totalGain >= 0 ? "text-green" : "text-red"}`}>
                {totalGain >= 0 ? "+" : ""}${totalGain.toFixed(2)} ({totalGain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
              </p>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-4 border-t border-border text-center text-xs font-mono-nums">
              <div>
                <p className="text-[9px] text-text-tertiary uppercase font-mono">{t("portfolio.invested")}</p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">${initialInvestment.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-tertiary uppercase font-mono">{t("portfolio.total_cards")}</p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">{userCards.length}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-tertiary uppercase font-mono">Plata / Oro</p>
                <p className="text-xs font-bold text-slate-300 mt-0.5">
                  {userCards.filter(c => c.tier === "silver").length} / <span className="text-gold">{userCards.filter(c => c.tier === "gold" || c.isGold).length}</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] text-text-tertiary uppercase font-mono">Diamante</p>
                <p className="text-xs font-bold text-cyan-400 mt-0.5">{userCards.filter(c => c.tier === "diamond").length}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-tertiary uppercase font-mono">Leyenda</p>
                <p className="text-xs font-bold text-fuchsia-400 mt-0.5">{userCards.filter(c => c.tier === "legend").length}</p>
              </div>
            </div>
          </Card>

          {/* Core Grid and Forge Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Cards Inventory Column */}
            <div className="lg:col-span-2 space-y-4">

              {/* Filters and Sorting Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-secondary/40 border border-border/60 p-3 rounded-2xl">
                {/* Filter Tabs */}
                <div className="flex gap-1 flex-wrap">
                  {(["all", "standard", "silver", "gold", "diamond", "legend"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        filterTab === tab
                          ? "bg-blue text-white shadow-glow-blue/20"
                          : "text-text-secondary hover:bg-background-secondary"
                      }`}
                    >
                      {tab === "all" ? t("portfolio.tabs.cards") : getTierLabel(tab)}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-tertiary font-mono uppercase text-[9px] tracking-wider">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-background-tertiary border border-border rounded-xl px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-blue cursor-pointer font-sans"
                  >
                    <option value="acquiredAt">{t("portfolio.acquired")} (Reciente)</option>
                    <option value="serialNumber">{t("portfolio.serial")} (Menor a Mayor)</option>
                    <option value="l5Performance">L5 (Mayor a Menor)</option>
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              {sortedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sortedCards.map((card) => {
                    const player = players.find((p) => p.id === card.playerId);
                    if (!player) return null;
                    const cardTier = card.tier || (card.isGold ? "gold" : "standard");
                    const category = getPlayerCategory(player.price);
                    const multiplier = getTierPriceMultiplier(cardTier, category, player.price);

                    return (
                      <div
                        key={card.id}
                        onClick={() => setFocusedCardId(card.id)}
                        className="hover:scale-[1.02] transition-transform duration-300"
                      >
                        <PlayerCard
                          ticker={player.ticker}
                          name={player.name}
                          team={player.team}
                          position={player.position}
                          price={player.price * multiplier}
                          change={player.priceChangePercent}
                          streak={player.streak}
                          tier={cardTier}
                          isFrozen={player.isFrozen}
                          rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-background-secondary border border-border border-dashed rounded-2xl p-8 text-center text-text-secondary text-sm">
                  {t("portfolio.no_cards")} &quot;{getTierLabel(filterTab)}&quot;.
                </div>
              )}
            </div>

            {/* Right Side: Interactive Forge Panel */}
            <div className="space-y-4">
              <Card variant="elevated" className="border-gold shadow-glow-gold/10 sticky top-4">

                {/* Panel Title */}
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold via-amber-500 to-amber-700 flex items-center justify-center shadow-subtle shrink-0">
                    <span className="text-xl">⚒️</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                      {t("portfolio.forge.title")}
                    </h3>
                    <p className="text-[10px] text-text-tertiary">{t("portfolio.forge.desc")}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-3 text-xs">
                  {/* Select player for forge */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1 font-mono">
                      1. Atleta a Forjar
                    </label>
                    <select
                      value={selectedForgePlayerId}
                      onChange={(e) => setSelectedForgePlayerId(e.target.value)}
                      className="w-full bg-background-secondary border border-border rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-blue cursor-pointer"
                    >
                      {players.map((p) => {
                        const countText = userCards.filter(c => c.playerId === p.id).length;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.ticker}) — {countText} cards
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Select Target Tier */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1 font-mono">
                      2. Nivel de Destino
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(["silver", "gold", "diamond", "legend"] as const).map((tierOption) => {
                        const isSelected = targetForgeTier === tierOption;
                        const label = tierOption === "silver" ? "Plata" : tierOption === "gold" ? "Oro" : tierOption === "diamond" ? "Diam." : "Ley.";
                        const btnColor =
                          tierOption === "silver" ? "border-slate-400 text-slate-300" :
                          tierOption === "gold" ? "border-gold text-gold" :
                          tierOption === "diamond" ? "border-cyan-400 text-cyan-300" :
                          "border-fuchsia-400 text-fuchsia-300";
                        return (
                          <button
                            key={tierOption}
                            onClick={() => setTargetForgeTier(tierOption)}
                            className={`px-1.5 py-2 border rounded-xl font-mono text-[9px] uppercase font-black tracking-widest text-center cursor-pointer transition-all ${
                              isSelected ? `${btnColor} bg-white/5 font-extrabold scale-95 shadow-subtle` : "border-border text-text-tertiary hover:bg-white/5"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock check box */}
                  {forgePlayer && (
                    <div className="bg-background-secondary border border-border p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary">
                          Fichas <span className="font-bold text-text-primary uppercase">{sourceTier}</span>:
                        </span>
                        <span className={`font-mono-nums font-bold ${matchingSourceCardsCount >= cardsRequired ? "text-green animate-pulse" : "text-red"}`}>
                          {matchingSourceCardsCount} / {cardsRequired}
                        </span>
                      </div>

                      {/* Progress bar visual */}
                      <div className="w-full h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            matchingSourceCardsCount >= cardsRequired ? "bg-green" : "bg-red"
                          }`}
                          style={{ width: `${Math.min(100, (matchingSourceCardsCount / cardsRequired) * 100)}%` }}
                        />
                      </div>

                      {matchingSourceCardsCount >= cardsRequired ? (
                        <p className="text-[9px] text-green font-medium">✓ Tienes suficientes fichas {sourceTier.toUpperCase()} para forjar.</p>
                      ) : (
                        <p className="text-[9px] text-text-tertiary">
                          Faltan {cardsRequired - matchingSourceCardsCount} fichas {sourceTier.toUpperCase()} de este jugador.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Benefits comparison Table */}
                  {forgePlayer && (
                    <div className="bg-background-secondary/30 border border-border/60 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary font-mono border-b border-border/40 pb-1">
                        Comparación de Beneficios (C{(category.substring(1)).toUpperCase()})
                      </p>
                      <div className="space-y-1.5 text-[10px]">
                        {getBenefitsComparison().map((benefit, i) => (
                          <div key={i} className="flex items-center justify-between text-text-tertiary font-mono-nums">
                            <span>{benefit.label}:</span>
                            <span className="font-bold">
                              <span className="text-text-tertiary">{benefit.cur}</span>
                              <span className="text-text-tertiary mx-1">→</span>
                              <span className={benefit.highlight ? "text-green font-bold" : "text-text-primary"}>
                                {benefit.next}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Costs detail */}
                  {forgePlayer && (
                    <div className="space-y-1.5 font-mono-nums border-t border-border pt-3">
                      <div className="flex justify-between text-text-tertiary">
                        <span>Fichas quemadas ({cardsRequired}):</span>
                        <span className="text-text-secondary">${(forgePlayer.price * cardsRequired).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-tertiary">
                        <span>Multiplicador Destino:</span>
                        <span className="text-text-secondary">
                          ×{getTierPriceMultiplier(targetForgeTier, category, forgePlayer.price).toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-border pt-1.5 text-text-primary">
                        <span>Costo de {t("portfolio.forge.fee")}</span>
                        <span className="text-gold">${usdcFee.toFixed(2)} USDC</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="fire"
                    className="w-full font-bold pt-3"
                    disabled={matchingSourceCardsCount < cardsRequired || balance < usdcFee || isForging}
                    onClick={handleForgeClick}
                  >
                    {isForging ? "Abriendo Fragua..." : `${t("portfolio.forge.btn")} ${targetForgeTier.toUpperCase()}`}
                  </Button>
                </div>
              </Card>
            </div>

          </div>
        </main>
      </div>

      {/* Forging Animation Overlay */}
      {isForging && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="text-center space-y-6 max-w-sm px-4">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-gold border-r-transparent border-b-gold-dark border-l-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
              <div className="absolute inset-2 rounded-full border border-white/5 bg-background-secondary flex items-center justify-center shadow-glow-gold/25">
                <span className="text-5xl animate-bounce" style={{ animationDuration: '0.8s' }}>⚒️</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-gold uppercase tracking-widest font-mono animate-pulse">
                Fraguando Token
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Fundiendo {cardsRequired} fichas {sourceTier.toUpperCase()} de {forgePlayer?.name} e inyectando {usdcFee} USDC de colateral de red...
              </p>
            </div>

            <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gold rounded-full animate-pulse-slow" style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Rarity Card Grand Reveal Modal */}
      {forgeSuccessPlayerId && forgeSuccessTier && (() => {
        const player = players.find((p) => p.id === forgeSuccessPlayerId);
        if (!player) return null;

        const category = getPlayerCategory(player.price);
        const multiplier = getTierPriceMultiplier(forgeSuccessTier, category, player.price);

        const cardStyles =
          forgeSuccessTier === "silver" ? { label: "Plata", color: "text-slate-300", glow: "shadow-[0_0_50px_rgba(148,163,184,0.3)]", bgGlow: "bg-slate-400/10", border: "border-slate-400" } :
          forgeSuccessTier === "gold" ? { label: "Oro Élite", color: "text-gold", glow: "shadow-[0_0_50px_rgba(245,158,11,0.3)]", bgGlow: "bg-gold/15", border: "border-gold" } :
          forgeSuccessTier === "diamond" ? { label: "Diamante", color: "text-cyan-400", glow: "shadow-[0_0_50px_rgba(6,182,212,0.35)]", bgGlow: "bg-cyan-500/15", border: "border-cyan-400" } :
          { label: "Leyenda", color: "text-fuchsia-400", glow: "shadow-[0_0_60px_rgba(168,85,247,0.4)]", bgGlow: "bg-fuchsia-500/20", border: "border-fuchsia-500" };

        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-fadeIn">
            {/* Glowing background burst */}
            <div className={`absolute w-[500px] h-[500px] ${cardStyles.bgGlow} rounded-full blur-[120px] pointer-events-none animate-pulse-slow`} />

            <div className="text-center space-y-8 max-w-md w-full z-10">

              <div className="space-y-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold ${cardStyles.color} uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10`}>
                  ⭐ ASCENSO CONSEGUIDO ⭐
                </span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight pt-3">
                  ¡NUEVA FICHA {cardStyles.label.toUpperCase()}!
                </h2>
                <p className="text-xs text-text-secondary">
                  Has bloqueado un precio base con prima del +{((multiplier - 1)*100).toFixed(0)}% y reducciones operativas en P2P.
                </p>
              </div>

              {/* Reveal Player Card */}
              <div className={`w-56 mx-auto hover:scale-105 transition-transform duration-500 ${cardStyles.glow} rounded-2xl overflow-hidden border ${cardStyles.border}`}>
                <PlayerCard
                  ticker={player.ticker}
                  name={player.name}
                  team={player.team}
                  position={player.position}
                  price={player.price * multiplier}
                  change={player.priceChangePercent}
                  streak={player.streak}
                  tier={forgeSuccessTier}
                  rating={Math.min(5, Math.max(0, (player.globalRating ?? player.pointsLastWeek) / 20))}
                />
              </div>

              <div className="pt-4">
                <Button
                  variant="fire"
                  className="font-bold px-12 py-3.5 text-xs tracking-wider"
                  onClick={() => {
                    setForgeSuccessPlayerId(null);
                    setForgeSuccessTier(null);
                  }}
                >
                  VOLVER A MI PORTAFOLIO
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Focused Card Detail Modal */}
      {focusedCardId && (() => {
        const card = userCards.find((c) => c.id === focusedCardId);
        if (!card) return null;
        const player = players.find((p) => p.id === card.playerId);
        if (!player) return null;

        const cardTier = card.tier || (card.isGold ? "gold" : "standard");
        const category = getPlayerCategory(player.price);
        const multiplier = getTierPriceMultiplier(cardTier, category, player.price);
        const finalValue = player.price * multiplier;

        const isStandard = cardTier === "standard";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card variant="elevated" className="w-full max-w-sm border-border animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                  {t("portfolio.card_detail")}
                </h3>
                <button
                  onClick={() => setFocusedCardId(null)}
                  className="text-text-secondary hover:text-text-primary text-xl cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-2 space-y-1">
                <Badge variant={
                  cardTier === "silver" ? "default" :
                  cardTier === "gold" ? "gold" :
                  cardTier === "diamond" ? "info" :
                  cardTier === "legend" ? "fire" : "default"
                } className="mx-auto uppercase font-mono text-[9px] tracking-widest font-black">
                  {getTierLabel(cardTier)}
                </Badge>
                <h4 className="text-lg font-bold text-text-primary pt-1">{player.name}</h4>
                <p className="text-xs text-text-secondary font-mono">{player.ticker}</p>
              </div>

              <div className="bg-background-secondary p-3 rounded-xl space-y-2 text-xs font-mono-nums">
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase font-mono">{t("portfolio.serial")}:</span>
                  <span className="text-text-primary font-bold">S/N: #{card.serialNumber || "1"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase font-mono">{t("portfolio.tier_label")}:</span>
                  <span className={`font-bold ${
                    cardTier === "silver" ? "text-slate-300" :
                    cardTier === "gold" ? "text-gold" :
                    cardTier === "diamond" ? "text-cyan-400" :
                    cardTier === "legend" ? "text-fuchsia-400" : "text-text-secondary"
                  }`}>
                    {getTierLabel(cardTier).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase font-mono">{t("portfolio.acquired")}:</span>
                  <span className="text-text-secondary">{new Date(card.acquiredAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase font-mono">{t("portfolio.acquired_price")}:</span>
                  <span className="text-text-secondary">${card.acquiredPrice.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase font-mono">Prima Aplicada:</span>
                  <span className="text-text-secondary">×{multiplier.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 font-bold">
                  <span className="text-text-primary uppercase font-mono">{t("portfolio.value")}:</span>
                  <span className="text-green">${finalValue.toFixed(2)} USDC</span>
                </div>
              </div>

              {/* Retired Legend Team Assignment */}
              {player.isRetired && (
                <div className="border border-border/60 rounded-xl p-3 space-y-2.5 bg-background-secondary/50">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">{t("portfolio.retired.current")}</p>
                  {card.retiredAssignedTeam ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">{card.retiredAssignedTeam}</span>
                      <Badge variant="success" className="text-[9px] font-mono">{t("portfolio.retired.assign")}</Badge>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400 font-mono">{t("portfolio.retired.none")} — precio congelado en $0 cambio/jornada</p>
                  )}
                  <p className="text-[10px] text-text-tertiary leading-relaxed">
                    {t("portfolio.retired.warning")}
                  </p>
                  <div className="flex gap-1.5">
                    <select
                      value={retiredAssignTeam}
                      onChange={(e) => setRetiredAssignTeam(e.target.value)}
                      className="flex-1 text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Elige equipo histórico...</option>
                      {(player.historicalTeams ?? []).map((teamName) => (
                        <option key={teamName} value={teamName}>{teamName}</option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      className="text-xs px-3 font-bold shrink-0"
                      disabled={!retiredAssignTeam}
                      onClick={() => {
                        if (!retiredAssignTeam) return;
                        const res = assignRetiredTeam(card.id, retiredAssignTeam);
                        alert(res.message);
                        if (res.success) setRetiredAssignTeam("");
                      }}
                    >
                      {card.retiredFreeAssignmentUsed
                        ? `${t("portfolio.retired.paid_btn")} ($${RETIRED_REASSIGN_FEE[card.tier]} USDC)`
                        : t("portfolio.retired.free_btn")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setFocusedCardId(null)}
                >
                  {t("common.close")}
                </Button>
                <Button
                  variant="sell"
                  className="flex-1 font-bold"
                  disabled={player.isFrozen && !player.isRetired}
                  onClick={() => handleSellClick(card.id)}
                >
                  {player.isFrozen && !player.isRetired ? "Mercado Cerrado" : t("portfolio.sell_btn")}
                </Button>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Bottom Nav on Mobile */}
      <BottomNav />
    </div>
  );
}
