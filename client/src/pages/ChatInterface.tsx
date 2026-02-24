import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, AlertCircle, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ChatInterface() {
  const [, setLocation] = useLocation();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chats
  const { data: chatsData, isLoading: isLoadingChats, refetch: refetchChats } = trpc.byok.chat.list.useQuery();

  // Fetch selected chat messages
  const { data: chatData, isLoading: isLoadingChat, refetch: refetchChat } = trpc.byok.chat.get.useQuery(
    { chatId: selectedChatId || 0 },
    { enabled: !!selectedChatId }
  );

  // Check if API key is configured
  const { data: keyStatus } = trpc.byok.apiKey.exists.useQuery();

  // Create new chat mutation
  const createChatMutation = trpc.byok.chat.create.useMutation({
    onSuccess: (data) => {
      toast.success("Chat created successfully!");
      refetchChats();
      setSelectedChatId(data.chatId);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create chat");
    },
  });

  // Send message mutation
  const sendMessageMutation = trpc.byok.message.send.useMutation({
    onSuccess: () => {
      setMessageInput("");
      refetchChat();
      toast.success("Message sent!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Delete chat mutation
  const deleteChatMutation = trpc.byok.chat.delete.useMutation({
    onSuccess: () => {
      toast.success("Chat deleted!");
      setSelectedChatId(null);
      refetchChats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete chat");
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData?.messages]);

  const handleCreateChat = async () => {
    if (!keyStatus?.exists) {
      toast.error("Please configure your API key first");
      setLocation("/api-key-setup");
      return;
    }

    await createChatMutation.mutateAsync({
      title: `Chat ${(chatsData?.chats.length || 0) + 1}`,
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChatId) {
      toast.error("Please select a chat first");
      return;
    }

    if (!messageInput.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        chatId: selectedChatId,
        content: messageInput.trim(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      await deleteChatMutation.mutateAsync({ chatId });
    }
  };

  if (!keyStatus?.exists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              API Key Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              You need to configure your API key before you can start chatting.
            </p>
            <Button onClick={() => setLocation("/api-key-setup")} className="w-full">
              Setup API Key
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar - Chat List */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Chats</CardTitle>
              <Button
                onClick={handleCreateChat}
                disabled={createChatMutation.isPending}
                className="w-full mt-4"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoadingChats ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : chatsData?.chats.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No chats yet</p>
                ) : (
                  chatsData?.chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChatId === chat.id
                          ? "bg-blue-100 text-blue-900"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      <div
                        onClick={() => setSelectedChatId(chat.id)}
                        className="flex-1 min-w-0"
                      >
                        <p className="font-medium truncate text-sm">{chat.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedChatId === chat.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="mt-2 text-red-600 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="md:col-span-3">
          {!selectedChatId ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-slate-600 mb-4">Select a chat or create a new one to start</p>
                <Button onClick={handleCreateChat} disabled={createChatMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Chat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Chat</CardTitle>
                <CardDescription>
                  {chatData?.chat.title || "Loading..."}
                </CardDescription>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
                {isLoadingChat ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : chatData?.messages.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No messages yet. Start the conversation!</p>
                ) : (
                  chatData?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-slate-200 text-slate-900"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading || sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !messageInput.trim() || sendMessageMutation.isPending}
                  >
                    {isLoading || sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
