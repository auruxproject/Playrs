"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useStore, getReferralBonusPercent } from "@/context/StoreContext";

export default function ProfilePage() {
  const {
    balance,
    transactions,
    referralCode,
    referralsCount,
    referralEarnings,
    depositFunds,
    withdrawFunds,
    username,
    userAvatar,
    userTier,
    isInfluencer,
    toggleInfluencer
  } = useStore();
  const { t } = useLanguage();

  // On-Ramp and Off-Ramp State
  const [depositAmount, setDepositAmount] = useState<string>("50.00");
  const [depositMethod, setDepositMethod] = useState<"solana" | "cryptomus">("solana");
  
  const [withdrawAmount, setWithdrawAmount] = useState<string>("50.00");
  const [withdrawMethod, setWithdrawMethod] = useState<"solana" | "cryptomus">("solana");

  const [copied, setCopied] = useState(false);

  const codeToCopy = isInfluencer ? "VALOR-INFLUENCER-VIP" : referralCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(t("profile.alert.invalid_amount"));
      return;
    }
    depositFunds(amountNum, depositMethod);
    alert(`${t("profile.alert.deposit_ok")} ${amountNum.toFixed(2)} USDC`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(t("profile.alert.invalid_amount"));
      return;
    }
    const res = withdrawFunds(amountNum, withdrawMethod);
    alert(res.message);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Left Sidebar on Desktop */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-y-auto pb-20 md:pb-0">
        <Header title={t("profile.title")} />

        <main className="flex-1 px-4 py-4 max-w-4xl w-full mx-auto space-y-4">
          
          {/* Header User profile card */}
          <div className="flex flex-col items-center py-4 bg-background-secondary border border-border rounded-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue/5 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-blue mb-2.5 text-3xl">
              {userAvatar}
            </div>
            <h2 className="text-lg font-bold text-text-primary">{username}</h2>
            <p className="text-xs text-text-tertiary">{t("profile.verified")} {userTier.toUpperCase()}</p>
          </div>

          {/* Wallet & On/Off Ramp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Wallet Info & Deposit */}
              <Card variant="elevated" className="border-border/80 space-y-4">
                <div className="border-b border-border pb-3">
                  <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-mono">{t("profile.wallet")}</span>
                  <p className="text-2xl font-bold font-mono-nums text-green mt-1">
                    ${balance.toFixed(2)} <span className="text-xs font-normal text-text-secondary">USDC</span>
                  </p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">{t("profile.deposit.title")}</h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-tertiary mb-1 font-mono">
                      {t("profile.deposit.amount")}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="10"
                        max="10000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full pl-3 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-text-tertiary">
                        USDC
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-tertiary mb-1 font-mono">
                      {t("profile.deposit.method")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDepositMethod("solana")}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                          depositMethod === "solana"
                            ? "bg-blue/15 border-blue text-blue"
                            : "bg-background border-border text-text-secondary hover:border-border/80"
                        }`}
                      >
                        <span className="text-xs">🪙 Solana Network</span>
                        <span className="text-[9px] font-medium opacity-80">{t("profile.deposit.instant")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositMethod("cryptomus")}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                          depositMethod === "cryptomus"
                            ? "bg-blue/15 border-blue text-blue"
                            : "bg-background border-border text-text-secondary hover:border-border/80"
                        }`}
                      >
                        <span className="text-xs">💳 Cryptomus Gateway</span>
                        <span className="text-[9px] font-medium opacity-80">{t("profile.deposit.card")}</span>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const amountNum = parseFloat(depositAmount) || 0;
                    const isSol = depositMethod === "solana";
                    const fee = isSol ? 0 : amountNum * 0.015;
                    const net = isSol ? amountNum : amountNum - fee;
                    return (
                      <div className="bg-background-tertiary border border-border p-3 rounded-xl space-y-1.5 text-xs font-mono-nums">
                        <div className="flex justify-between text-text-secondary text-[10px]">
                          <span>{t("profile.deposit.fee")} ({isSol ? "0%" : "1.5%"}):</span>
                          <span>${fee.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between font-bold text-text-primary border-t border-border pt-1.5 text-xs">
                          <span>{t("profile.deposit.net")}</span>
                          <span className="text-green">${net.toFixed(2)} USDC</span>
                        </div>
                      </div>
                    );
                  })()}

                  <Button type="submit" variant="buy" className="w-full font-bold text-xs py-3 shadow-glow-blue">
                    {t("profile.deposit.btn")}
                  </Button>
                </form>
              </Card>

              {/* Withdraw Section */}
              <Card variant="default" className="border-border space-y-4">
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">{t("profile.withdraw.title")}</h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-tertiary mb-1 font-mono">
                      {t("profile.withdraw.amount")}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="10"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full pl-3 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-text-tertiary">
                        USDC
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-tertiary mb-1 font-mono">
                      {t("profile.withdraw.dest")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod("solana")}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                          withdrawMethod === "solana"
                            ? "bg-blue/15 border-blue text-blue"
                            : "bg-background-secondary border-border text-text-secondary hover:border-border/80"
                        }`}
                      >
                        <span className="text-xs">🪙 Solana Wallet</span>
                        <span className="text-[9px] font-medium opacity-80">{t("profile.withdraw.network_fee")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod("cryptomus")}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                          withdrawMethod === "cryptomus"
                            ? "bg-blue/15 border-blue text-blue"
                            : "bg-background-secondary border-border text-text-secondary hover:border-border/80"
                        }`}
                      >
                        <span className="text-xs">💳 Cryptomus Off-ramp</span>
                        <span className="text-[9px] font-medium opacity-80">{t("profile.withdraw.exit_fee")}</span>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const amountNum = parseFloat(withdrawAmount) || 0;
                    const isSol = withdrawMethod === "solana";
                    const fee = isSol ? 0.50 : amountNum * 0.02;
                    const net = Math.max(0, amountNum - fee);
                    return (
                      <div className="bg-background-tertiary border border-border p-3 rounded-xl space-y-1.5 text-xs font-mono-nums">
                        <div className="flex justify-between text-text-secondary text-[10px]">
                          <span>{t("profile.withdraw.fee")} ({isSol ? t("profile.withdraw.fixed") : "2.0%"}):</span>
                          <span>${fee.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between font-bold text-text-primary border-t border-border pt-1.5 text-xs">
                          <span>{t("profile.withdraw.net")}</span>
                          <span className="text-blue">${net.toFixed(2)} USDC</span>
                        </div>
                        {isSol && amountNum <= 0.5 && amountNum > 0 && (
                          <p className="text-[9px] text-red font-sans mt-1">
                            {t("profile.withdraw.min_warn")}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <Button type="submit" variant="primary" className="w-full font-bold text-xs py-3">
                    {t("profile.withdraw.btn")}
                  </Button>
                </form>
              </Card>

              {/* Referrals Code Section */}
              <Card className="md:col-span-2 border-gold shadow-glow-gold/10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                        {t("profile.referral.title")}
                      </h4>
                      {(() => {
                        if (isInfluencer) {
                          return (
                            <p className="text-[10px] text-amber-400 font-medium">
                              {t("profile.referral.influencer_desc")}
                            </p>
                          );
                        }
                        const pMin = (getReferralBonusPercent(userTier, "c1", "primary") * 100).toFixed(1);
                        const pMax = (getReferralBonusPercent(userTier, "c5", "primary") * 100).toFixed(1);
                        const sMin = (getReferralBonusPercent(userTier, "c1", "secondary") * 100).toFixed(0);
                        const sMax = (getReferralBonusPercent(userTier, "c5", "secondary") * 100).toFixed(0);

                        const pRange = pMin === pMax ? `${pMin}%` : `${pMin}% - ${pMax}%`;
                        const sRange = sMin === sMax ? `${sMin}%` : `${sMin}% - ${sMax}%`;

                        return (
                          <p className="text-xs text-text-tertiary">
                            {t("profile.referral.earn")} {pRange} {t("profile.referral.in_ipo")} {sRange} {t("profile.referral.in_p2p")}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    {isInfluencer ? (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-gradient-to-r from-purple to-gold text-background-primary shadow-sm border border-gold/30 animate-pulse">
                        {t("profile.influencer.badge")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-background-tertiary text-text-secondary border border-border">
                        {t("profile.tier.badge")} {userTier === "standard" ? t("profile.tier.standard") : userTier}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-background-tertiary border border-border rounded-xl p-3.5 flex items-center justify-between mb-4">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("profile.referral.code")}</span>
                    <span className="font-mono-nums text-lg font-black text-gold mt-1 block">
                      {codeToCopy}
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleCopyCode} className="text-xs">
                    {copied ? t("common.copied") : t("common.copy")}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center font-mono-nums text-xs">
                  <div className="bg-background-secondary border border-border p-3 rounded-xl">
                    <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("profile.referral.friends")}</span>
                    <span className="text-base font-black text-text-primary block mt-1">
                      {isInfluencer ? 142 : referralsCount}
                    </span>
                  </div>
                  <div className="bg-background-secondary border border-border p-3 rounded-xl">
                    <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">{t("profile.referral.earnings")}</span>
                    <span className="text-base font-black text-green block mt-1">
                      ${(isInfluencer ? 1240.50 : referralEarnings).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                {/* Influencer Mode Toggle Banner */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between bg-gradient-to-r from-purple/10 to-gold/10 border border-gold/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <h5 className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono">
                          {t("profile.influencer.title")}
                        </h5>
                        <p className="text-[9px] text-text-tertiary">
                          {t("profile.influencer.desc")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleInfluencer}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isInfluencer ? 'bg-gold' : 'bg-background-tertiary border-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background-primary shadow ring-0 transition duration-200 ease-in-out ${
                          isInfluencer ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>

            </div>
          </main>
      </div>

      {/* Bottom Nav on Mobile */}
      <BottomNav />
    </div>
  );
}
