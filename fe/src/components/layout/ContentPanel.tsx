// src/components/layout/ContentPanel.tsx
import React from 'react';
import ChatHeader from '../chat/ChatHeader';
import ChatInput from '../chat/ChatInput';
import StoryReel from '../chat/StoryReel';
import Message from '../chat/Message';
import { messages, reels } from '@/data/mockData';

interface ContentPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  inputText,
  setInputText,
  onSend,
}) => {
  return (
    <>
      <ChatHeader />
      
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <StoryReel reels={reels} />
          
          <div className="space-y-5 py-2">
            {messages.map(message => (
              <Message key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
      
      <ChatInput 
        value={inputText}
        onChange={setInputText}
        onSend={onSend}
      />
    </>
  );
};

export default ContentPanel;