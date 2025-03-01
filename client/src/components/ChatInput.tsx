import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSubmit(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "Select a conversation to start chatting" : "Type your message..."}
        className="flex-1 resize-none"
        rows={1}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button type="submit" disabled={isLoading || !message.trim() || disabled}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current" />
        ) : (
          <SendHorizontal className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}