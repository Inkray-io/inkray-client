'use client';

import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { DoAgentAdapter } from '@/lib/chat/do-agent-adapter';

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const runtime = useLocalRuntime(DoAgentAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
