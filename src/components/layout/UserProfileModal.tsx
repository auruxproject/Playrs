"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  sender: "carlos" | "user";
  text: string;
  timestamp: string;
}

export function UserProfileModal() {
  const { 
    balance, 
    userTier, 
    username, 
    setUsername, 
    userAvatar, 
    setUserAvatar,
    transactions,
    isProfileOpen,
    setIsProfileOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Available avatars
  const avatarList = ["👤", "💻", "🧠", "⚽", "⚡", "👑", "🚀", "🛡️", "🔥", "🏆", "🌟"];
  const uniqueAvatars = Array.from(new Set(avatarList));

  // Address
  const solanaAddress = "Hw2vQ1eB8x9uS3mN6tP4rA7yD5zW8xK2q3vS9aB";

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isProfileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isProfileOpen]);

  if (!isProfileOpen) return null;

  // Tier parameters
  const tierConfig = {
    standard: {
      name: "Estándar",
      color: "from-gray-500 to-gray-700 text-gray-200 border-gray-600",
      bgGlow: "bg-gray-500/5",
      limits: { deposit: "$1,000 USDC", withdraw: "$500 USDC" },
      conciergeAccessible: false,
    },
    silver: {
      name: "Plata",
      color: "from-slate-300 to-slate-500 text-slate-100 border-slate-400",
      bgGlow: "bg-slate-400/5",
      limits: { deposit: "$1,000 USDC", withdraw: "$500 USDC" },
      conciergeAccessible: false,
    },
    gold: {
      name: "Oro",
      color: "from-yellow-400 via-amber-500 to-yellow-600 text-white border-amber-400 shadow-glow-gold/20 animate-pulse-slow",
      bgGlow: "bg-amber-500/10",
      limits: { deposit: "$10,000 USDC", withdraw: "$5,000 USDC" },
      conciergeAccessible: true,
    },
    diamond: {
      name: "Diamante",
      color: "from-cyan-400 via-blue-500 to-indigo-600 text-white border-cyan-400 shadow-glow-blue/20",
      bgGlow: "bg-cyan-500/10",
      limits: { deposit: "$50,000 USDC", withdraw: "$25,000 USDC" },
      conciergeAccessible: true,
    },
    legend: {
      name: "Leyenda",
      color: "from-purple-500 via-pink-500 to-red-500 text-white border-pink-400 shadow-glow-purple/30 animate-pulse-slow",
      bgGlow: "bg-pink-500/15",
      limits: { deposit: "Sin límite", withdraw: "Sin límite" },
      conciergeAccessible: true,
    },
  };

  const currentTierInfo = tierConfig[userTier];

  const handleCopy = () => {
    navigator.clipboard.writeText(solanaAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chat initiation
  const startChat = () => {
    setIsChatOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          sender: "carlos",
          text: "¡Hola! Bienvenido al soporte Concierge VIP de Playrs. Mi nombre es Carlos Gómez y soy tu asesor dedicado.\n\nEstoy aquí para guiarte en todos los procesos operativos de la plataforma, explicarte los modos de juego (Fichaje Inicial, Mercado P2P, Forja, Jugadas P2P) y mostrarte cómo funcionan las comisiones y la red de Solana. Por políticas de seguridad, no puedo realizar análisis estadísticos ni dar consejos de inversión. ¿En qué duda técnica te puedo colaborar hoy?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const predefinedQuestions = [
    {
      q: "🎯 ¿Cómo funciona el Fichaje Inicial?",
      a: "El Fichaje Inicial es nuestro mercado primario, dividido en 'Drops de Temporada' y 'Draft de Rookies'. Los lanzamientos con mucho 'Hype' cuentan con acceso prioritario escalonado por horas según el Tier de tu cuenta (Leyenda/Diamante en la Hora 0, Oro en la Hora 24 y Plata/Standard en la Hora 48). Las fichas normales se liberan para todos a la vez.",
    },
    {
      q: "🪙 Depósitos y retiros en Solana / Cryptomus",
      a: "Ofrecemos dos métodos principales:\n\n1. **Solana Wallet (Direct USDC):** 0% de comisión en depósitos. Para retiros tiene un fee fijo de red de 0.50 USDC.\n2. **Cryptomus Gateway:** Para depositar con tarjetas y múltiples criptomonedas con un 1.5% de comisión. El retiro cobra 2.0% de fee.",
    },
    {
      q: "✨ ¿Cómo funciona la Forja de Fichas?",
      a: "La Forja te permite subir la categoría de tus fichas (Standard ➔ Plata ➔ Oro ➔ Diamante ➔ Leyenda) al fusionar copias del mismo jugador de rango anterior. Tener fichas de rango más alto aplica multiplicadores a las cotizaciones de tu portafolio y reduce comisiones de venta P2P y rake en apuestas.",
    },
    {
      q: "💼 Oportunidades de negocio y referidos",
      a: "Puedes ganar USDC mediante:\n1. **Trading P2P:** Comprando base y vendiendo a mayor precio impulsado por el rendimiento real del Oráculo Matemático.\n2. **Jugadas P2P:** Retando a otros usuarios en pools de apuestas de rendimiento.\n3. **Referidos Élite:** Obtienes el 0.5% del volumen de trading de tus invitados.",
    },
  ];

  const handleSendQuestion = (question: string, answer: string) => {
    const userMsg: ChatMessage = {
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const carlosMsg: ChatMessage = {
        sender: "carlos",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, carlosMsg]);
    }, 800);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const userMsg: ChatMessage = {
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let responseText = "";

      if (lower.includes("comprar") || lower.includes("invertir") || lower.includes("subira") || lower.includes("subirá") || lower.includes("ganar dinero") || lower.includes("consejo") || lower.includes("analisis") || lower.includes("análisis")) {
        responseText = "Como tu asesor Concierge VIP de Playrs, te recuerdo que no realizo análisis de rendimiento de jugadores ni proporciono recomendaciones de inversión. Mi labor es ayudarte en los procesos técnicos y operativos de la plataforma (retiros, Forja, Solana, depósitos). El análisis estadístico e histórico de mercado debe ser realizado por cada usuario para diseñar su propia estrategia.";
      } else {
        responseText = `He recibido tu consulta operativa. Como tu Concierge VIP, te comento que para cualquier duda sobre los procesos de la plataforma (como las comisiones de Cryptomus/Solana, el Fichaje Inicial, o cómo forjar tus fichas), puedes hacer clic en las opciones predeterminadas o solicitar una explicación técnica detallada de los límites de tu cuenta. ¿Hay alguna operación específica que quieras realizar?`;
      }

      const carlosMsg: ChatMessage = {
        sender: "carlos",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, carlosMsg]);
    }, 800);
  };

  const handleCloseModal = () => {
    if (isChatOpen) setIsChatOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-stretch md:items-start bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop (Only active on desktop) */}
      <div 
        className="absolute inset-0 cursor-default hidden md:block" 
        onClick={handleCloseModal} 
      />

      {/* Drawer Container: Right Sidebar on Desktop, fullscreen on mobile */}
      <div className="w-full md:w-[420px] h-full md:h-screen bg-background-secondary border-t md:border-t-0 md:border-l border-border shadow-strong flex flex-col relative z-10 transition-all duration-300 animate-slideUp md:animate-slideLeft rounded-none md:rounded-l-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background-tertiary">
          <div className="flex items-center gap-2">
            <span className="text-base">👤</span>
            <h3 className="font-bold text-text-primary text-sm font-sans tracking-wide">PANEL DE PERFIL</h3>
          </div>
          <button 
            onClick={handleCloseModal} 
            className="p-1 rounded-lg hover:bg-background/80 transition-colors text-text-secondary cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-background-tertiary/50">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-xs font-bold font-mono transition-colors cursor-pointer border-b-2 text-center ${
              activeTab === "profile" 
                ? "border-blue text-blue bg-background/30" 
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background-tertiary/20"
            }`}
          >
            👤 MI PERFIL
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-xs font-bold font-mono transition-colors cursor-pointer border-b-2 text-center ${
              activeTab === "history" 
                ? "border-blue text-blue bg-background/30" 
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background-tertiary/20"
            }`}
          >
            📜 TRANSACCIONES
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {activeTab === "profile" ? (
            <>
              {/* Profile Card & Customization */}
              <div className="space-y-4 p-4 rounded-xl border border-border bg-background/50 relative overflow-hidden">
                <div className={`absolute inset-0 pointer-events-none opacity-40 blur-xl ${currentTierInfo.bgGlow}`} />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Big Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue via-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-glow-blue shrink-0">
                    {userAvatar}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <span className="block text-sm font-extrabold text-text-primary truncate">
                      {username}
                    </span>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-gradient-to-r text-center ${currentTierInfo.color}`}>
                      Tier: {currentTierInfo.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[8px] uppercase font-bold text-text-tertiary font-mono">SALDO</span>
                    <span className="text-sm font-black text-green block font-mono-nums mt-0.5">
                      ${balance.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono">USDC</span>
                  </div>
                </div>

                {/* Edit Username Field */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <label className="block text-[10px] uppercase font-bold text-text-tertiary font-mono">
                    Editar Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-text-primary focus:outline-none focus:border-blue transition-colors"
                    placeholder="Escribe tu username..."
                    maxLength={16}
                  />
                </div>

                {/* Edit Avatar Selector Grid */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] uppercase font-bold text-text-tertiary font-mono">
                    Seleccionar Avatar
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {uniqueAvatars.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setUserAvatar(emoji)}
                        className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          userAvatar === emoji
                            ? "bg-blue/15 border-blue scale-110 shadow-glow-blue/20"
                            : "bg-background border-border hover:border-border/80"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Solana Linked Address Card */}
              <div className="bg-background-tertiary border border-border rounded-xl p-3.5 space-y-2">
                <span className="block text-[10px] uppercase font-bold text-text-tertiary font-mono">
                  Wallet Solana Vinculada
                </span>
                <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl text-xs font-mono text-text-secondary">
                  <span className="text-blue shrink-0">SOL:</span>
                  <span className="truncate flex-1">{solanaAddress}</span>
                  <button 
                    onClick={handleCopy} 
                    className="p-1 hover:text-blue transition-colors cursor-pointer text-text-tertiary shrink-0" 
                    title="Copiar Address"
                  >
                    {copied ? "¡Copiado!" : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction limits */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                  🛡️ Límites diarios de transacciones
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background-tertiary border border-border p-3 rounded-xl text-center">
                    <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">Límite Depósito</span>
                    <span className="text-sm font-bold text-text-primary block mt-1 font-mono-nums">
                      {currentTierInfo.limits.deposit}
                    </span>
                  </div>
                  <div className="bg-background-tertiary border border-border p-3 rounded-xl text-center">
                    <span className="block text-[8px] uppercase tracking-wider text-text-tertiary font-mono">Límite Retiro</span>
                    <span className="text-sm font-bold text-text-primary block mt-1 font-mono-nums">
                      {currentTierInfo.limits.withdraw}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-text-tertiary leading-relaxed">
                  *Los límites se actualizan dinámicamente en base al rango de tu cuenta. Adquiere fichas en la Forja para obtener límites ilimitados.
                </p>
              </div>

              {/* VIP Concierge Section (Only visible for Gold, Diamond, Legend Tiers) */}
              {currentTierInfo.conciergeAccessible && (
                <div className="border border-border rounded-xl overflow-hidden bg-background-tertiary/10">
                  <div className="bg-background-tertiary border-b border-border p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                          Soporte VIP Concierge
                        </h4>
                        <span className="inline-block text-[8px] font-bold px-1.5 py-0.2 rounded font-mono bg-green/10 text-green border border-green/25">
                          ACTIVO 24/7
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span className="w-1.5 h-1.5 bg-green rounded-full shadow-glow-green animate-pulse" />
                      <span>Carlos en línea</span>
                    </div>
                  </div>

                  <div className="p-4 bg-background/30 space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-background-secondary border border-border/80 p-3 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-blue/20 border border-blue/40 flex items-center justify-center text-lg shrink-0">
                          👨‍💼
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-text-primary">Carlos Gómez</span>
                          <span className="block text-[10px] text-text-tertiary">Director de Cuentas Elite y Operaciones</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Como asesor dedicado, Carlos Gómez puede guiarte sobre los procesos técnicos de depósitos, retiros en Solana, la Forja o el mercado P2P.
                      </p>
                      
                      {!isChatOpen ? (
                        <Button 
                          variant="buy" 
                          className="w-full text-xs font-bold py-2.5 shadow-glow-blue"
                          onClick={startChat}
                        >
                          💬 Chatear con Carlos Gómez
                        </Button>
                      ) : (
                        /* Embedded Chat Box */
                        <div className="border border-border rounded-xl overflow-hidden bg-background-secondary flex flex-col h-[280px]">
                          
                          {/* Chat messages */}
                          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs font-sans">
                            {messages.map((msg, index) => (
                              <div 
                                key={index} 
                                className={`flex flex-col max-w-[85%] ${
                                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                                }`}
                              >
                                <span className="text-[8px] text-text-tertiary mb-0.5 font-mono">{msg.sender === "user" ? "Tú" : "Carlos"} • {msg.timestamp}</span>
                                <div className={`p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed ${
                                  msg.sender === "user" 
                                    ? "bg-blue text-white rounded-tr-none" 
                                    : "bg-background-tertiary text-text-primary border border-border rounded-tl-none"
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Predefined prompts */}
                          <div className="px-2.5 py-1.5 border-t border-border bg-background-tertiary flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {predefinedQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSendQuestion(q.q, q.a)}
                                className="bg-background-secondary border border-border text-[9px] font-bold text-text-secondary hover:text-blue hover:border-blue/50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                              >
                                {q.q.split(" ")[0]} {q.q.substring(q.q.indexOf(" ") + 1)}
                              </button>
                            ))}
                          </div>

                          {/* Chat Input form */}
                          <form onSubmit={handleCustomSend} className="p-2 border-t border-border flex gap-1.5 bg-background-tertiary">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder="Escribe tu duda técnica..."
                              className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-blue"
                            />
                            <button
                              type="submit"
                              className="bg-blue text-white font-bold px-3 py-1.5 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer shadow-glow-blue"
                            >
                              Enviar
                            </button>
                          </form>

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Transactions list (Tab 2) */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary font-mono">
                  Registro de Actividades USDC
                </span>
                <span className="text-[9px] font-mono font-bold bg-blue/10 text-blue border border-blue/20 px-2 py-0.5 rounded">
                  USDC Ledger
                </span>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-background/40 border border-border rounded-xl p-3 flex justify-between items-center text-xs font-mono-nums"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <span className="font-bold text-text-primary block truncate">{tx.type}</span>
                        <span className="text-text-secondary block text-[10px] leading-relaxed break-words">
                          {tx.description}
                        </span>
                        <span className="text-[9px] text-text-tertiary block">
                          {new Date(tx.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black ${tx.amount >= 0 ? "text-green" : "text-red"}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)} USDC
                        </span>
                        <span className="block text-[8px] text-green font-bold font-mono tracking-wider mt-0.5">COMPLETO</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-background-secondary border border-border border-dashed rounded-xl p-8 text-center text-text-secondary">
                    No tienes transacciones registradas.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
