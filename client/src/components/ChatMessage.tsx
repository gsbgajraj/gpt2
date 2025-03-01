import { Message } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <Card className={`p-4 ${isUser ? "bg-primary/10" : "bg-card"}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        <div className="flex-1 prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({className, children}) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <SyntaxHighlighter
                    // @ts-ignore - types mismatch but the component works correctly
                    style={oneDark}
                    language={match[1]}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}