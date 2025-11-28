import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import formatTimestamp from "@/utils/formatTime";
import useStore from "@/store/useStore";
import { getMessages } from "@/services/message.service";
import { Loader } from "lucide-react";

const MessageList = ({ conversationId, otherParticipant }) => {
  const { messages, setMessages, user, typingUsers, setTyping, socket } = useStore();
  const [loading, setLoading] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const conversationMessages = React.useMemo(() => messages[conversationId] || [], [messages, conversationId]);

  const fetchMessages = React.useCallback(async () => {
    if (!conversationId || conversationId.startsWith("new-")) return;
    
    setLoading(true);
    try {
      const response = await getMessages(conversationId);
      if (response.status === "success") {
        setMessages(conversationId, response.data || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, setMessages]);

  useEffect(() => {
    if (conversationId && !conversationId.startsWith("new-")) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTyping = ({ userId, conversationId: convId, isTyping }) => {
      if (convId === conversationId) {
        setTyping(conversationId, userId, isTyping);
      }
    };

    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("user_typing", handleTyping);
    };
  }, [socket, conversationId, setTyping]);

  const isOtherUserTyping = conversationId && typingUsers[conversationId] && 
    otherParticipant && typingUsers[conversationId][otherParticipant._id];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <ScrollArea className="flex-1 p-2 sm:p-4" ref={scrollRef}>
      <div className="space-y-2 sm:space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">
            No messages yet. Start a conversation!
          </div>
        ) : (
          conversationMessages.map((message) => {
            const isFromMe = message.sender?._id === user?._id;
            return (
              <div
                key={message._id}
                className={`flex gap-2 sm:gap-3 ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isFromMe && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                    <AvatarImage src={message.sender?.profilePicture} />
                    <AvatarFallback>
                      {message.sender?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${
                    isFromMe ? "items-end" : "items-start"
                  }`}
                >
                  {!isFromMe && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {message.sender?.username || "Unknown"}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 ${
                      isFromMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.contentType === "image" && message.imageOrVideoUrl && (
                      <img
                        src={message.imageOrVideoUrl}
                        alt="Shared image"
                        className="max-w-full rounded-md mb-1 sm:mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          setViewingMedia({
                            type: "image",
                            url: message.imageOrVideoUrl,
                          })
                        }
                      />
                    )}
                    {message.contentType === "video" && message.imageOrVideoUrl && (
                      <video
                        src={message.imageOrVideoUrl}
                        controls
                        className="max-w-full rounded-md mb-1 sm:mb-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingMedia({
                            type: "video",
                            url: message.imageOrVideoUrl,
                          });
                        }}
                      />
                    )}
                    {message.content && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">{message.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.createdAt)}
                    </span>
                    {isFromMe && (
                      <span className="text-xs text-muted-foreground">
                        {message.messageStatus === "read"
                          ? "✓✓"
                          : message.messageStatus === "delivered"
                          ? "✓✓"
                          : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        {isOtherUserTyping && (
          <div className="flex gap-2 items-center px-2 py-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherParticipant?.profilePicture} />
              <AvatarFallback>
                {otherParticipant?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-xs text-muted-foreground italic">
              {otherParticipant?.username || "Someone"} is typing...
            </span>
          </div>
        )}
      </div>
    </ScrollArea>
    {viewingMedia && (
      <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl p-0 overflow-hidden bg-black/95">
          <div className="relative flex items-center justify-center bg-black">
            {viewingMedia.type === "image" ? (
              <img
                src={viewingMedia.url}
                alt="Attachment"
                className="max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={viewingMedia.url}
                controls
                autoPlay
                className="max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default MessageList;

