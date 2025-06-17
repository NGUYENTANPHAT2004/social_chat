// src/components/chat/ChatInput.tsx
import React from 'react';
import { Paperclip, Image, Mic, Send, Smile } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend }) => (
  <div className="p-3 border-t border-gray-200 flex items-center bg-white">
    <div className="flex space-x-1 mr-2">
      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
        <Paperclip size={20} />
      </button>
      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
        <Image size={20} />
      </button>
    </div>
    
    <div className="flex-grow relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className="w-full py-2.5 px-4 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white pr-20"
      />
      <div className="absolute right-2 top-1.5 flex space-x-1">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
          <Smile size={20} />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
          <Mic size={20} />
        </button>
        <button 
          className={`p-1.5 rounded-full ${value.trim() ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-gray-100'} transition-all`}
          onClick={onSend}
          disabled={!value.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  </div>
);

export default ChatInput;