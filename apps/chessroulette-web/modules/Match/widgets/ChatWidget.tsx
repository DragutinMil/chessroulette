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
  onToggleChat?: (enabled: boolean) => void; 
};

export const ChatWidget: React.FC<Props> = ({
  messages,
  currentUserId,
  playerNames,
  onSendMessage,
  disabled = false,
  onToggleChat,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [lastVisibleMessages, setLastVisibleMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatEnabled) {
      setLastVisibleMessages(messages);
    }
  }, [messages, isChatEnabled]);

  useEffect(() => {
    if (!isChatEnabled && messages.length > lastVisibleMessages.length) {
      setUnreadCount(messages.length - lastVisibleMessages.length);
    }
  }, [messages, isChatEnabled, lastVisibleMessages]);  

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

const handleToggleChat = () => {
  const newState = !isChatEnabled;
  setIsChatEnabled(newState);
  if (!newState) {
    // Ako isključujemo chat, zapamtimo trenutne poruke
    setLastVisibleMessages(messages);
  }
  else{
    setUnreadCount(0);
  }
  onToggleChat?.(newState);
};

  const handleSendMessage = () => {
    if (inputValue.trim() && !disabled && isChatEnabled) {
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
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <Text className="text-sm font-semibold">Chat</Text>
        <div className="flex items-center gap-2">
        {!isChatEnabled && unreadCount > 0 && (
            <span className="bg-[#07DA63] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {unreadCount}
            </span>
          )}
        
        <button
          onClick={handleToggleChat}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            isChatEnabled 
            ? 'bg-[#07DA63] hover:bg-[#06c459] text-white' // Zelena boja koja se koristi u chat-u
            : 'bg-[#D9D9D9]/20 hover:bg-[#D9D9D9]/30 text-white opacity-50' // Prigušena siva
          }`}
        >
          {isChatEnabled ? 'Enabled' : 'Disabled'}
        </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">  {(isChatEnabled ? messages : lastVisibleMessages).map((msg, index) => {
          const isOwnMessage = msg.senderId === currentUserId;
          const displayName = playerNames[msg.senderId] || 'Unknown';
          
          const renderAvatar = () => (
            <div className="w-9 h-9 min-w-8 flex items-center justify-center rounded-full bg-[#111111]/40 border border-conversation-100 text-[#07DA63] font-semibold text-sm"
              style={{ boxShadow: 'rgba(7, 218, 99, 0.1) 0px 0px 10px 0px' }}
            >
              {getInitials(displayName)}
            </div>
          );

          return (
            <div key={index} className="mb-1 pt-1 text-[15px] md:pt-2 md:mb-2">
              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-center`}>
                {!isOwnMessage && (
                  <div className="mr-4">
                    {renderAvatar()}
                  </div>
                )}
                <div className={`max-w-xs max-w-[80%] bg-[#111111]/40 text-white border border-conversation-100 shadow-green-soft rounded-[20px] text-sm ${isOwnMessage ? 'mr-4' : ''}`}>
                  <p className="flex p-[14px] justify-start text-left whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
                {isOwnMessage && renderAvatar()}
              </div>
              <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-[52px]' : 'text-left ml-[52px]'}`}>
                {displayName} · {formatTime(msg.timestamp)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex mb-2 mt-2 md:mt-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || !isChatEnabled}
          placeholder={disabled ? 'Chat disabled' : !isChatEnabled ? 'Chat disabled' : 'Type your message...'}
          className={`w-full text-sm rounded-[20px] border transition-colors duration-200 px-4 py-2 ${
          disabled || !isChatEnabled
            ? 'bg-[#111111]/20 border-[#D9D9D9]/20 text-gray-500 placeholder-gray-600'
            : 'border-conversation-100 bg-[#111111]/40 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300'
              }`}
          style={{ 
          boxShadow: disabled || !isChatEnabled 
              ? 'none'
              : 'rgba(7, 218, 99, 0.5) 0px 0px 10px 0px' 
            }}
          maxLength={200}
          />
          <button
            onClick={handleSendMessage}
            disabled={disabled || !isChatEnabled || !inputValue.trim()}
            className={`group relative p-1 px-2 text-sm rounded-2xl flex items-center justify-center gap-1 ml-2 px-4 py-2 duration-200 ${
              disabled || !isChatEnabled || !inputValue.trim()
                ? 'bg-[#D9D9D9]/20 opacity-30 hover:cursor-default'
                : 'bg-[#07DA63] hover:bg-[#06c459]'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 16 16" 
              fill="currentColor" 
              aria-hidden="true" 
              data-slot="icon" 
              className="h-5 w-5"
            >
              <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.25a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .811 1.022 24.89 24.89 0 0 0 11.668-5.115.75.75 0 0 0 0-1.175A24.89 24.89 0 0 0 2.869 2.298Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};