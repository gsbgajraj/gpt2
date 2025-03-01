import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Message, Conversation } from "@shared/schema";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusIcon, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { logout } = useAuth();

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"]
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedConversation}`],
    enabled: !!selectedConversation
  });

  const newConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations");
      return res.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(conversation.id);
    }
  });

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { 
        message,
        conversationId: selectedConversation
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedConversation}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 md:hidden z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-200 ease-in-out
        border-r border-border bg-background p-4 flex flex-col
      `}>
        <div className="flex items-center justify-between mb-4 mt-12 md:mt-0">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button variant="ghost" size="icon" onClick={() => newConversationMutation.mutate()}>
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={selectedConversation === conv.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => {
                setSelectedConversation(conv.id);
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
            >
              {conv.title}
            </Button>
          ))}
        </div>

        <Button variant="ghost" className="mt-4" onClick={logout}>
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto p-4">
          {isLoadingMessages || isLoadingConversations ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : selectedConversation ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation or start a new one
            </div>
          )}
        </main>
        <div className="border-t border-border">
          <div className="max-w-3xl mx-auto p-4">
            <ChatInput 
              onSubmit={(message) => mutation.mutate(message)}
              isLoading={mutation.isPending}
              disabled={!selectedConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}