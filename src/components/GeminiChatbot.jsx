import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiTrash2, FiCpu, FiUserCheck } from 'react-icons/fi';
import api from '../api/axios';
import './GeminiChatbot.css';

const ROLES = [
  { id: 'shopping_assistant', label: '🛍️ Conseiller Achats' },
  { id: 'tech_expert', label: '⚡ Expert High-Tech' },
  { id: 'fashion_advisor', label: '👗 Styliste Mode & Beauté' },
  { id: 'customer_service', label: '🤝 Support & Commandes' },
];

const TASK_TYPES = [
  { id: 'general', label: 'Général (gemini-3.5-flash)' },
  { id: 'fast', label: 'Rapide (gemini-3.1-flash-lite)' },
  { id: 'complex', label: 'Complexe (gemini-3.1-pro-preview)' },
];

const DEFAULT_WELCOME = {
  role: 'assistant',
  content: 'Bonjour ! 👋 Je suis l\'assistant virtuel de BazarShop. Comment puis-je vous aider aujourd\'hui dans vos achats ?',
  modelUsed: 'gemini-3.5-flash',
};

export default function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [role, setRole] = useState('shopping_assistant');
  const [taskType, setTaskType] = useState('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_WELCOME]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/api/settings')
      .then((res) => {
        if (res.data && res.data.chatbot_actif !== undefined) {
          setEnabled(res.data.chatbot_actif);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        role,
        taskType,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply,
          modelUsed: res.data.modelUsed,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.response?.data?.error ||
            "Désolé, une erreur s'est produite lors de l'envoi du message. Veuillez réessayer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([DEFAULT_WELCOME]);
  };

  const suggestions = [
    'Quels sont les meilleurs smartphones disponibles ?',
    'Comment payer avec Wave ou Orange Money ?',
    'Avez-vous des promotions en ce moment ?',
    'Quels sont les délais de livraison ?',
  ];

  if (!enabled) return null;

  return (
    <div className="chatbot-drawer-container">
      {!isOpen && (
        <button
          className="chatbot-trigger-btn"
          onClick={() => setIsOpen(true)}
          title="Discuter avec l'assistant IA BazarShop"
          aria-label="Ouvrir le chat Gemini"
        >
          <FiMessageSquare />
          <span className="chatbot-badge-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div className="chatbot-title">
                <h3>BazarShop Assistant</h3>
                <p>Propulsé par Google Gemini</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-icon-btn"
                onClick={handleClearHistory}
                title="Effacer la conversation"
              >
                <FiTrash2 />
              </button>
              <button
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Fermer le chat"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Role & Model Controls */}
          <div className="chatbot-controls">
            <div className="chatbot-select-group">
              <label><FiUserCheck /> Rôle</label>
              <select
                className="chatbot-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="chatbot-select-group">
              <label><FiCpu /> Modèle</label>
              <select
                className="chatbot-select"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="chatbot-messages-thread">
            {messages.map((m, idx) => (
              <div key={idx} className={`chatbot-message ${m.role}`}>
                <div className="chatbot-bubble">{m.content}</div>
                {m.modelUsed && (
                  <span className="chatbot-model-tag">
                    {m.modelUsed}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 2 && !loading && (
            <div className="chatbot-suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="chatbot-suggestion-pill"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            className="chatbot-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className="chatbot-input"
              type="text"
              placeholder="Posez votre question à l'assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!input.trim() || loading}
              title="Envoyer"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
