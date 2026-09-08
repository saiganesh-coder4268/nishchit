import React, { useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';

export default function NishchitAssistant({ busData, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I'm your Nishchit Transport Assistant. Ask me anything about ${busData?.busNumber || 'Bus 24'} or student ${currentUser?.studentName || 'Aarav'}'s transport status!`
    }

  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    const queryLower = userText.toLowerCase();

    // Add user message
    const newMsgs = [...messages, { sender: 'user', text: userText }];

    // Context-aware natural response generation based strictly on actual busData state
    let reply = "";
    const isLive = busData?.status === 'LIVE';
    const isCompleted = busData?.status === 'COMPLETED';
    const isNotStarted = !isLive && !isCompleted;
    const lastTime = busData?.lastUpdated ? new Date(busData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently';
    const startTime = busData?.startedAt ? new Date(busData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'not started';

    if (queryLower.includes('start') || queryLower.includes('begun') || queryLower.includes('leave')) {
      if (isLive) {
        reply = `Yes, ${busData?.busNumber || 'Bus 24'} started at ${startTime} and is currently ON THE WAY. Location was last updated at ${lastTime}.`;
      } else if (isCompleted) {
        reply = `Today's trip started at ${startTime} and has already COMPLETED safely.`;
      } else {
        reply = `No, ${busData?.busNumber || 'Bus 24'} has NOT started yet today. The driver will broadcast live tracking as soon as the bus departs.`;
      }
    } else if (queryLower.includes('where') || queryLower.includes('location') || queryLower.includes('map')) {
      if (isLive) {
        reply = `${busData?.busNumber || 'Bus 24'} is currently active on ${busData?.routeNumber || 'Route 04'} near coordinates (${busData?.latitude?.toFixed(4)}, ${busData?.longitude?.toFixed(4)}). Check the live map on your dashboard!`;
      } else if (isCompleted) {
        reply = `The trip is completed. The last recorded stop was near the school campus.`;
      } else {
        reply = `The bus is currently parked at school. Live GPS location will appear on your map once the trip starts.`;
      }
    } else if (queryLower.includes('delay') || queryLower.includes('late') || queryLower.includes('traffic')) {
      if (isLive) {
        reply = `${busData?.busNumber || 'Bus 24'} is currently active. Please check the communication panel for driver traffic announcements.`;
      } else {
        reply = `No delay alerts reported. The bus has not started the route yet.`;
      }
    } else {
      if (isLive) {
        reply = `${busData?.busNumber || 'Bus 24'} is LIVE (Started at ${startTime}). Last updated at ${lastTime}. Driver: ${busData?.driverName || 'Rajesh Kumar'}.`;
      } else if (isCompleted) {
        reply = `Today's transport trip for ${currentUser?.studentName || 'Aarav'} has ended successfully.`;
      } else {
        reply = `${busData?.busNumber || 'Bus 24'} status is NOT STARTED. I will notify you when live tracking begins!`;
      }
    }

    setMessages([...newMsgs, { sender: 'bot', text: reply }]);
    setInputQuery('');
  };

  return (
    <div className="ai-assistant-widget">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="ai-widget-trigger">
          <Sparkles size={18} />
          <span>Ask Nishchit Assistant</span>
        </button>

      ) : (
        <div className="ai-assistant-card">
          <div className="ai-card-header">
            <div className="ai-title">
              <Bot size={20} color="#2563eb" />
              <div>
                <strong>Nishchit Transport AI</strong>
                <span className="ai-sub">Instant Status Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="drawer-close-btn">
              <X size={18} />
            </button>
          </div>

          <div className="ai-messages-list">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.sender}`}>
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="ai-input-form">
            <input
              type="text"
              placeholder="e.g. Has my bus started?"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
