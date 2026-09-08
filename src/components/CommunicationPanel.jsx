import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { database } from '../firebase';
import { 
  MessageSquare, Send, AlertTriangle, X 
} from 'lucide-react';

export default function CommunicationPanel({ currentUser, busData, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const busId = currentUser?.busId || busData?.busNumber || 'BUS24';
  const role = currentUser?.role || 'parent';
  const isDriver = role === 'driver';

  // Listen to Realtime DB messages for busId
  useEffect(() => {
    const messagesRef = ref(database, `messages/${busId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [busId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text, isQuick = false) => {
    if (!text.trim()) return;

    try {
      const messagesRef = ref(database, `messages/${busId}`);
      await push(messagesRef, {
        senderId: currentUser?.uid || 'user-1',
        senderName: currentUser?.name || (isDriver ? 'Rajesh Kumar' : 'Demo Parent'),
        senderRole: role,
        message: text.trim(),
        timestamp: Date.now(),
        isQuickMessage: isQuick
      });

      setInputText('');
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText, false);
  };

  // Quick Predefined Status Buttons for Driver
  const quickMessages = [
    { label: "⚠️ Running Late", text: "Bus is running about 10 minutes late today." },
    { label: "🚧 Traffic Delay", text: "Heavy traffic near main junction. Expect slight delay." },
    { label: "🛑 Temporary Stop", text: "Bus stopped temporarily for safety check." },
    { label: "📍 Be Ready", text: "Bus is approaching upcoming stop. Please be ready!" }
  ];

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="communication-drawer">
      <div className="drawer-header">
        <div className="drawer-title">
          <MessageSquare size={20} color="#2563eb" />
          <div>
            <h3>{busData?.busNumber || 'Bus 24'} Communication</h3>
            <span className="drawer-sub">
              {isDriver ? 'Broadcast to Parents' : `Contact Driver (${busData?.driverName || 'Rajesh Kumar'})`}
            </span>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="drawer-close-btn">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Driver Safety Warning */}
      {isDriver && (
        <div className="driver-safety-notice">
          <AlertTriangle size={16} />
          <span>Please do not type while driving. Use quick status taps below.</span>
        </div>
      )}

      {/* Predefined Quick Status Chips (Driver Mode) */}
      {isDriver && (
        <div className="quick-messages-section">
          <span className="quick-label">One-Tap Quick Status:</span>
          <div className="quick-chips-grid">
            {quickMessages.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(item.text, true)}
                className="quick-chip-btn"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="messages-feed">
        {messages.length === 0 ? (
          <div className="empty-feed">
            <MessageSquare size={32} className="text-light" />
            <p>No messages sent yet today.</p>
            <span>Updates and quick status notifications will appear here.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid || msg.senderRole === role;
            return (
              <div
                key={msg.id}
                className={`message-bubble-wrapper ${isMe ? 'mine' : 'other'} ${msg.isQuickMessage ? 'quick-msg' : ''}`}
              >
                <div className="message-sender-name">
                  {msg.senderName} ({msg.senderRole.toUpperCase()})
                </div>
                <div className="message-bubble">
                  <p>{msg.message}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleFormSubmit} className="message-input-bar">
        <input
          type="text"
          placeholder={isDriver ? "Type custom update to parents..." : "Send a message to driver..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" disabled={!inputText.trim()} className="btn btn-primary btn-icon">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
