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
  otherPlayerChatEnabled?: boolean;
};

export const ChatWidget: React.FC<Props> = ({
  messages,
  currentUserId,
  playerNames,
  onSendMessage,
  disabled = false,
  onToggleChat,
  otherPlayerChatEnabled = true,
}) => {
  const CHAT_ENABLED_STORAGE_KEY = `chessroulette-chat-enabled-${currentUserId}`;
  
  const [lastDisabledMessages, setLastDisabledMessages] = useState<ChatMessage[]>(messages);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatEnabled, setIsChatEnabled] = useState(() => {
  const savedState = localStorage.getItem(CHAT_ENABLED_STORAGE_KEY);
  return savedState === null ? true : savedState === 'true';
});

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isChatEnabled) {
      setLastDisabledMessages(messages);
    }
  }, [isChatEnabled]);

  useEffect(() => {
    if (!isChatEnabled && messages.length > lastDisabledMessages.length) {
      setUnreadCount(messages.length - lastDisabledMessages.length);
    }
  }, [messages, isChatEnabled, lastDisabledMessages]);

  const newMessageCount = !isChatEnabled ? messages.length - lastDisabledMessages.length : 0;
  
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
    localStorage.setItem(CHAT_ENABLED_STORAGE_KEY, newState.toString());
    if (!newState) {
      setLastDisabledMessages(messages);
    }
    else {
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
        <div className="flex items-center gap-2">
          <Text className="text-sm font-semibold">Chat</Text>
          {!isChatEnabled && newMessageCount > 0 && (
            <span className="bg-[#07DA63] text-white rounded-full px-2 py-0.5 text-xs">
              {newMessageCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!otherPlayerChatEnabled && (
            <span className="text-xs text-gray-400">
              Opponent disabled chat
            </span>
          )}
          <label 
            className="inline-flex items-center cursor-pointer gap-2 flex-row-reverse" 
            title="Enable/Disable Chat"
          >
            <input 
              type="checkbox"
              checked={isChatEnabled}
              onChange={handleToggleChat}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-slate-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#07DA63] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07DA63]">
            </div>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">  
      {(isChatEnabled ? messages : lastDisabledMessages).map((msg, index) => {    
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
                  <div className={`max-w-xs max-w-[80%] bg-[#111111]/40 text-white border border-conversation-100 shadow-green-soft rounded-[20px] text-sm break-words ${isOwnMessage ? 'mr-4' : ''}`}>                  
                  <p className="flex p-[14px] justify-start text-left whitespace-pre-line">
                   {msg.content.match(/.{1,34}/g)?.join('\n') || msg.content}
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
          disabled={!isChatEnabled}
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