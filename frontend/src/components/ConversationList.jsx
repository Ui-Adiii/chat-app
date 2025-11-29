import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import useStore from "@/store/useStore";
import { getAllConversations } from "@/services/message.service";
import { getAllUsers } from "@/services/auth.service";
import formatTimestamp from "@/utils/formatTime";
import { Loader } from "lucide-react";

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const { conversations, setConversations, contacts, setContacts, user } = useStore();
  const [loading, setLoading] = useState(true);
  // Add a key to force re-render when contacts change
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add effect to update key when contacts change
  useEffect(() => {
    setUpdateKey(prev => prev + 1);
  }, [contacts]);

  const fetchConversations = async () => {
    try {
      const response = await getAllConversations();
      if (response.status === "success") {
        setConversations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.status === "success") {
        setContacts(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find((p) => p._id !== user?._id);
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return "No messages yet";
    const { content, contentType, sender } = conversation.lastMessage;
    if (contentType === "image") return "📷 Image";
    if (contentType === "video") return "🎥 Video";
    const isFromMe = sender?._id === user?._id;
    return isFromMe ? `You: ${content || ""}` : content || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" key={updateKey}>
      <div className="p-2 sm:p-4 border-b shrink-0">
        <h2 className="text-base sm:text-lg font-semibold">Chats</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1 sm:p-2">
          {conversations.length === 0 && contacts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No conversations yet
            </div>
          ) : (
            <>
              {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                if (!otherUser) return null;
                console.log("Rendering conversation with otherUser:", otherUser);
                console.log("Conversation otherUser online status:", otherUser.isOnline);

                return (
                  <div
                    key={conversation._id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors mb-1 sm:mb-2 ${
                      selectedConversationId === conversation._id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={otherUser.profilePicture} />
                          <AvatarFallback>
                            {otherUser.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate text-sm sm:text-base">
                            {otherUser.username || "Unknown"}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatTimestamp(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {getLastMessagePreview(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 shrink-0 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {contacts
                .filter((u) => !conversations.some((c) => c.participants?.some((p) => p._id === u._id)))
                .map((userItem) => (
                  <div
                    key={userItem._id}
                    onClick={() =>
                      onSelectConversation({
                        _id: `new-${userItem._id}`,
                        participants: [user, userItem],
                        lastMessage: null,
                        unreadCount: 0,
                      })
                    }
                    className="p-3 rounded-lg cursor-pointer transition-colors mb-2 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userItem.profilePicture} />
                          <AvatarFallback>
                            {userItem.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {userItem.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {userItem.username || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {userItem.about || "No status"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;

