import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConversationList from "@/components/ConversationList";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import StatusList from "@/components/StatusList";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import useStore from "@/store/useStore";
import { logOut, updateProfile } from "@/services/auth.service";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { initializeSocket, disconnectSocket } from "@/services/socket.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Home = () => {

  const user = useStore((s) => s.user);
const setUser = useStore((s) => s.setUser);
const clearUser = useStore((s) => s.clearUser);

const selectedConversation = useStore((s) => s.selectedConversation);
const setSelectedConversation = useStore((s) => s.setSelectedConversation);

const setSocket = useStore((s) => s.setSocket);
const setIsConnected = useStore((s) => s.setIsConnected);

const addMessage = useStore((s) => s.addMessage);
const updateConversation = useStore((s) => s.updateConversation);
const addConversation = useStore((s) => s.addConversation);

const typingUsers = useStore((s) => s.typingUsers);
const updateUserPresence = useStore((s) => s.updateUserPresence);

const theme = useStore((s) => s.theme);
const setTheme = useStore((s) => s.setTheme);

  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    username: user?.username || "",
    about: user?.about || "",
    profilePicture: null,
  });
  const [preview, setPreview] = useState(user?.profilePicture || null);

  useEffect(() => {
    if (user?._id) {
      const socketInstance = initializeSocket(user._id);
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      // Socket event listeners
      socketInstance.on("connect", () => {
        setIsConnected(true);
        socketInstance.emit("user_connected", user._id);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      const handleIncomingMessage = (message) => {
        console.log("Received message in Home component:", message);
        const { selectedConversation: currentSelectedConversation, conversations: currentConversations } =
          useStore.getState();

        console.log("Current selected conversation:", currentSelectedConversation);
        console.log("Message conversation ID:", message.conversation);

        if (currentSelectedConversation?._id === message.conversation) {
          console.log("Adding message to current conversation");
          addMessage(message.conversation, message);
        }

        const existingConversation = currentConversations.find(
          (conv) => conv._id === message.conversation
        );

        if (existingConversation) {
          console.log("Updating existing conversation");
          updateConversation(message.conversation, {
            lastMessage: message,
            unreadCount:
              currentSelectedConversation?._id === message.conversation
                ? 0
                : (existingConversation.unreadCount || 0) + 1,
          });
        } else {
          console.log("Adding new conversation");
          addConversation({
            _id: message.conversation,
            participants: [message.sender, message.receiver],
            lastMessage: message,
            unreadCount: currentSelectedConversation?._id === message.conversation ? 0 : 1,
          });
        }
      };

      const handleMessageRead = () => {
        if (selectedConversation?._id) {
          // Update message status in store
        }
      };

      const handleUserStatus = ({ userId: statusUserId, isOnline, lastSeen }) => {
        updateUserPresence(statusUserId, { isOnline, lastSeen });
      };

      // Add socket event listeners for status updates
      const handleNewStatus = () => {
        // This will be handled in StatusList component
      };

      const handleStatusDeleted = () => {
        // This will be handled in StatusList component
      };

      const handleStatusViewed = () => {
        // This will be handled in StatusList component
      };

      // Fix: Change "receive_message" to "receiver_message" to match backend
      socketInstance.on("receiver_message", handleIncomingMessage);
      socketInstance.on("message_read", handleMessageRead);
      socketInstance.on("user_status", handleUserStatus);
      socketInstance.on("new_status", handleNewStatus);
      socketInstance.on("status_deleted", handleStatusDeleted);
      socketInstance.on("status_viewed", handleStatusViewed);

      return () => {
        disconnectSocket();
        // Fix: Change "receive_message" to "receiver_message" to match backend
        socketInstance.off("receiver_message", handleIncomingMessage);
        socketInstance.off("message_read", handleMessageRead);
        socketInstance.off("user_status", handleUserStatus);
        socketInstance.off("new_status", handleNewStatus);
        socketInstance.off("status_deleted", handleStatusDeleted);
        socketInstance.off("status_viewed", handleStatusViewed);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleLogout = async () => {
    try {
      await logOut();
      clearUser();
      disconnectSocket();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Error logging out");
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", settingsForm.username);
    formData.append("about", settingsForm.about);
    if (settingsForm.profilePicture) {
      formData.append("profilePicture", settingsForm.profilePicture);
    }

    try {
      const response = await updateProfile(formData);
      if (response.status === "success") {
        setUser(response.data);
        setShowSettings(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch {
      toast.error("Error updating profile");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettingsForm({ ...settingsForm, profilePicture: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const getOtherParticipant = () => {
    if (!selectedConversation?.participants) return null;
    return selectedConversation.participants.find((p) => p._id !== user?._id);
  };

  const otherParticipant = getOtherParticipant();
  const activeConversationId =
    selectedConversation?._id && !selectedConversation._id.startsWith("new-")
      ? selectedConversation._id
      : null;
  const isOtherUserTyping =
    !!(
      activeConversationId &&
      otherParticipant?._id &&
      typingUsers?.[activeConversationId]?.[otherParticipant._id]
    );

  const getPresenceContent = () => {
    if (!otherParticipant) {
      return { mode: "idle", text: "" };
    }
    if (isOtherUserTyping) {
      return { mode: "typing", text: "typing" };
    }
    if (otherParticipant.isOnline) {
      return { mode: "online", text: "Online" };
    }
    if (otherParticipant.about) {
      return { mode: "about", text: otherParticipant.about };
    }
    return { mode: "offline", text: "Offline" };
  };

  const presenceContent = getPresenceContent();

  const TypingBadge = () => (
    <div className="flex items-center gap-1 text-xs text-primary font-medium">
      <span className="italic">typing</span>
      <span className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );

  const PresenceRow = () => {
    if (!presenceContent.text) return null;
    if (presenceContent.mode === "typing") {
      return <TypingBadge />;
    }
    const indicatorColor =
      presenceContent.mode === "online"
        ? "bg-green-500"
        : presenceContent.mode === "offline"
        ? "bg-gray-400"
        : "bg-primary/60";
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className={`w-2 h-2 rounded-full ${indicatorColor}`} />
        <span className="truncate">{presenceContent.text}</span>
      </div>
    );
  };

  const receiverId = otherParticipant?._id;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background shrink-0">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">{user?.username || "User"}</p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 sm:h-10 sm:w-10"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 sm:h-5 sm:w-5 dark:hidden" />
      <Moon className="h-4 w-4 sm:h-5 sm:w-5 hidden dark:block" />

      <span className="sr-only">Toggle theme</span>
    </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] sm:w-full max-w-md">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="flex items-center justify-center">
                    <label htmlFor="profilePicture" className="cursor-pointer">
                      <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {preview ? (
                          <img
                            src={preview}
                            alt="Profile Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </label>
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={settingsForm.username}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, username: e.target.value })
                      }
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about">About</Label>
                    <Textarea
                      id="about"
                      value={settingsForm.about}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, about: e.target.value })
                      }
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-full sm:w-80 border-r bg-background flex flex-col shrink-0">
          <Tabs defaultValue="chats" className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b shrink-0">
              <TabsTrigger value="chats" className="flex-1 text-xs sm:text-sm">
                Chats
              </TabsTrigger>
              <TabsTrigger value="status" className="flex-1 text-xs sm:text-sm">
                Status
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
              <ConversationList
                onSelectConversation={setSelectedConversation}
                selectedConversationId={selectedConversation?._id}
              />
            </TabsContent>
            <TabsContent value="status" className="flex-1 m-0 overflow-hidden">
              <StatusList />
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area - Hidden on mobile when sidebar is visible, shown when conversation is selected */}
        {selectedConversation && (
          <div className="hidden sm:flex flex-1 flex-col bg-background">
            {/* Chat Header */}
            <div className="border-b p-2 sm:p-4 flex items-center gap-2 sm:gap-3 shrink-0">
              {otherParticipant && (
                <>
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={otherParticipant.profilePicture} />
                      <AvatarFallback>
                        {otherParticipant.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                        otherParticipant.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {otherParticipant.username || "Unknown"}
                    </p>
                    <PresenceRow />
                    {!isOtherUserTyping && otherParticipant.about && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        Status: {otherParticipant.about}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <MessageList
              conversationId={
                selectedConversation._id?.startsWith("new-")
                  ? null
                  : selectedConversation._id
              }
              otherParticipant={otherParticipant}
            />

            {/* Message Input */}
            <MessageInput
              conversationId={
                selectedConversation._id?.startsWith("new-")
                  ? selectedConversation._id
                  : selectedConversation._id
              }
              receiverId={receiverId}
            />
          </div>
        )}

        {/* Mobile Chat View - Full screen when conversation is selected */}
        {selectedConversation && (
          <div className="sm:hidden fixed inset-0 z-50 bg-background flex flex-col">
            {/* Mobile Chat Header */}
            <div className="border-b p-3 flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
                className="mr-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              {otherParticipant && (
                <>
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherParticipant.profilePicture} />
                      <AvatarFallback>
                        {otherParticipant.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                        otherParticipant.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {otherParticipant.username || "Unknown"}
                    </p>
                    <PresenceRow />
                    {!isOtherUserTyping && otherParticipant.about && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        Status: {otherParticipant.about}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <MessageList
              conversationId={
                selectedConversation._id?.startsWith("new-")
                  ? null
                  : selectedConversation._id
              }
              otherParticipant={otherParticipant}
            />

            {/* Message Input */}
            <MessageInput
              conversationId={
                selectedConversation._id?.startsWith("new-")
                  ? selectedConversation._id
                  : selectedConversation._id
              }
              receiverId={receiverId}
            />
          </div>
        )}

        {/* Empty State - Desktop only */}
        {!selectedConversation && (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Select a conversation to start chatting</p>
              <p className="text-sm">Or create a new one from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
