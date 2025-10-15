import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@app/modules/Match/movex/types';
import { Text } from '@app/components/Text';
import { User } from '@app/modules/User';

type Props = {
  messages: ChatMessage[];
  currentUserId: User['id'];
  playerNames: { [playerId: string]: string };
  onSendMessage: (content: string) => void;
  disabled?: boolean;
};

export const ChatWidget: React.FC<Props> = ({
  messages,
  currentUserId,
  playerNames,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sr-RS', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-op-widget rounded-lg shadow-2xl">
      <div className="p-3 border-b border-gray-700">
        <Text className="text-sm font-semibold">Chat</Text>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === currentUserId;
          return (
            <div
              key={index}
              className={`flex flex-col ${
                isOwnMessage ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">
                {playerNames[msg.senderId] || 'Unknown'} · {formatTime(msg.timestamp)}
              </div>
              <div
                className={`max-w-[80%] p-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <Text className="text-sm break-words">{msg.content}</Text>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled} 
            placeholder={disabled ? 'Chat onemogućen' : 'Unesite poruku...'}
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            maxLength={200}
          />
          <button
            onClick={handleSendMessage}
            disabled={disabled || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Pošalji
          </button>
        </div>
      </div>
    </div>
  );
};