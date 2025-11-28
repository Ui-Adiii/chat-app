import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image as ImageIcon, X } from "lucide-react";
import useStore from "@/store/useStore";
import { sendMessage } from "@/services/message.service";
import { toast } from "react-toastify";

const MessageInput = ({ conversationId, receiverId }) => {
  const {
    user,
    addMessage,
    socket,
    addConversation,
    updateConversation,
    selectedConversation,
    setSelectedConversation,
  } = useStore();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && socket && conversationId && receiverId) {
        socket.emit("typing_stop", { conversationId, receiverId });
      }
    };
  }, [socket, conversationId, receiverId]);

  const handleTyping = () => {
    if (!socket || !conversationId || !receiverId || !user?._id) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing_start", { conversationId, receiverId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("typing_stop", { conversationId, receiverId });
      }
    }, 1000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
      } else {
        toast.error("Please select an image or video file");
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!receiverId) {
      toast.error("Please select a conversation");
      return;
    }
    if (!user?._id) {
      toast.error("User not authenticated");
      return;
    }

    // Stop typing indicator
    if (isTypingRef.current && socket) {
      isTypingRef.current = false;
      socket.emit("typing_stop", { conversationId, receiverId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const formData = new FormData();
    // Ensure all fields are strings for FormData
    formData.append("senderId", String(user._id));
    formData.append("receiverId", String(receiverId));
    if (message.trim()) {
      formData.append("content", message.trim());
    }
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    formData.append("messageStatus", "send");

    try {
      const response = await sendMessage(formData);
      if (response.status === "success") {
        const savedMessage = response.data;
        const actualConversationId = savedMessage?.conversation || conversationId;
        addMessage(actualConversationId, savedMessage);
        updateConversation(actualConversationId, {
          lastMessage: savedMessage,
          unreadCount: 0,
        });

        if (conversationId?.startsWith("new-") && actualConversationId) {
          const participants = [savedMessage.sender, savedMessage.receiver].filter(Boolean);
          const newConversation = {
            _id: actualConversationId,
            participants,
            lastMessage: savedMessage,
            unreadCount: 0,
          };
          addConversation(newConversation);
          setSelectedConversation(newConversation);
        } else if (selectedConversation?._id === conversationId && actualConversationId !== conversationId) {
          setSelectedConversation({
            ...selectedConversation,
            _id: actualConversationId,
          });
        }

        setMessage("");
        removeFile();
      } else {
        toast.error(response.message || "Failed to send message");
      }
    } catch (error) {
      toast.error("Error sending message");
      console.error(error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-2 sm:p-4 bg-background shrink-0">
  
      {/* Preview Box */}
      {preview && (
        <div className="relative mb-3 inline-block rounded-md overflow-hidden shadow-md">
          {selectedFile?.type.startsWith("image/") ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-28 sm:max-h-40 rounded-md object-cover"
            />
          ) : (
            <video
              src={preview}
              className="max-h-28 sm:max-h-40 rounded-md"
              controls
            />
          )}
  
          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 bg-black/40 text-white hover:bg-black/60 rounded-full"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
  
      {/* Input Row */}
      <div className="flex items-end gap-2 sm:gap-3">
  
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
  
        {/* Media Upload Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-11 sm:w-11 rounded-full hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
  
        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="
              min-h-[48px] sm:min-h-[58px] 
              max-h-[120px] sm:max-h-[160px] 
              resize-none text-sm sm:text-base 
              rounded-xl border shadow-inner
              py-3 px-4 bg-muted/30 focus:bg-background transition-all
            "
            rows={1}
          />
        </div>
  
        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() && !selectedFile}
          size="icon"
          className="
            h-9 w-9 sm:h-11 sm:w-11 
            rounded-full 
            bg-primary text-primary-foreground
            hover:bg-primary/90
            disabled:opacity-50
          "
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
  
};

export default MessageInput;

