import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  status?: "sent" | "delivered" | "error";
};

type Related = Record<string, string>;

const ChatPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [related, setRelated] = useState<Related | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleClear = () => {
    setMessages([]);
    setError("");
    setRelated(null);
  };

  const sendMessage = async (messageText: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInputMessage("");
    setError("");
    setRelated(null);
    try {
      const response = await fetch("http://localhost:3000/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.text }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || data.reply || "Sorry, I could not process your request.",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setRelated(data.related || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
  };

  const handleRelatedClick = (intent: string) => {
    sendMessage(intent);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white shadow-2xl rounded-r-3xl p-6 items-center justify-between">
        <div className="w-full flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-blue-700 tracking-tight">VipraCo</span>
            <span className="text-xs text-gray-400">HR Assistant</span>
          </div>
          <nav className="w-full mt-8">
            <button onClick={handleClear} className="w-full flex items-center gap-2 px-4 py-3 text-base text-gray-600 hover:bg-blue-50 rounded-xl transition font-medium">
              <span className="material-icons text-lg">delete_sweep</span>Clear Chat
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-base text-red-600 hover:bg-red-50 rounded-xl transition font-medium mt-2">
              <span className="material-icons text-lg">logout</span>Logout
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-300 mt-8">&copy; {new Date().getFullYear()} VipraCo</div>
      </aside>
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur border-b px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-blue-800 tracking-tight">HR Assistant Chat</h1>
            <p className="text-sm text-blue-400 mt-1">Ask about leaves, policies, or HR-related questions</p>
          </div>
        </header>
        {/* Messages */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shadow-lg">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-blue-900">Welcome to VipraCo HR Assistant</h3>
              <p className="mt-2 text-blue-400">Start a conversation by typing a message below.</p>
            </div>
          )}
          {messages.map((message, idx) => {
            const isLastBot =
              message.sender === "bot" &&
              messages.filter((m) => m.sender === "bot").slice(-1)[0] === message;
            return (
              <div key={message.id} className={`flex w-full ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`relative max-w-[80%] md:max-w-lg px-5 py-3 rounded-2xl shadow-md transition-all duration-200 ${message.sender === "user" ? "bg-blue-600 text-white rounded-br-md ml-auto" : "bg-white border border-blue-100 text-gray-900 rounded-bl-md mr-auto"}`}>
                  {/* Avatar */}
                  <div className={`absolute -top-6 ${message.sender === "user" ? "right-0" : "left-0"}`}>
                    {message.sender === "user" ? (
                      <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center shadow">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="pl-10 pr-2">
                    <p className="text-base leading-relaxed break-words">{message.text}</p>
                    <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-blue-400"}`}>{formatTime(message.timestamp)}</p>
                    {/* Show related questions below the last bot message */}
                    {isLastBot && related && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs text-blue-400 font-semibold uppercase tracking-wide">Suggested</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(related).map(([intent, question]) => (
                            <button
                              key={intent}
                              onClick={() => handleRelatedClick(intent)}
                              className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-200 text-blue-700 border border-blue-200 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                              disabled={isLoading}
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow">
                <svg className="h-5 w-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <span className="text-base text-blue-400">VipraCo is typing...</span>
            </div>
          )}
          {error && (
            <div className="flex justify-center animate-fade-in">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 shadow">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>
        {/* Input Form */}
        <footer className="bg-white/80 backdrop-blur border-t px-4 md:px-8 py-5 flex items-center shadow-lg">
          <form onSubmit={handleSubmit} className="flex w-full gap-3 items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-blue-200 px-5 py-3 text-base placeholder-blue-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:opacity-50 bg-blue-50 transition"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleSubmit(e as any); } }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default ChatPage; 