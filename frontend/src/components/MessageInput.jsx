import React, { useEffect, useState, useRef } from "react";
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
  const [isSending, setIsSending] = useState(false);

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
        isTypingRef.current = false;
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
    }, 3000);
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

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("senderId", String(user._id));
      formData.append("receiverId", String(receiverId));
      if (message.trim()) formData.append("content", message.trim());
      if (selectedFile) formData.append("file", selectedFile);
      formData.append("messageStatus", "send");

      const response = await sendMessage(formData);

      if (response.status === "success") {
        const savedMessage = response.data;

        const actualConversationId =
          savedMessage?.conversation || conversationId;

        addMessage(actualConversationId, savedMessage);
        updateConversation(actualConversationId, {
          lastMessage: savedMessage,
          unreadCount: 0,
        });

        setMessage("");
        removeFile();
      } else {
        toast.error(response.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("Error sending message");
    } finally {
      setIsSending(false);
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

      <div className="flex items-end gap-2 sm:gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-11 sm:w-11 rounded-full hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

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

        <Button
          onClick={handleSend}
          disabled={isSending || (!message.trim() && !selectedFile)}
          size="icon"
          className="
            h-9 w-9 sm:h-11 sm:w-11 
            rounded-full 
            bg-primary text-primary-foreground
            hover:bg-primary/90
            disabled:opacity-50
          "
        >
          {isSending ? (
            <Send className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
          ) : (
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
