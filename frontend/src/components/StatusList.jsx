import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, X, Eye, Clock } from "lucide-react";
import useStore from "@/store/useStore";
import { getAllStatuses, createStatus, deleteStatus, viewStatus } from "@/services/status.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import formatTimestamp from "@/utils/formatTime";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trash2} from "lucide-react";

const StatusList = () => {
  const { statuses, setStatuses, user, addStatus, removeStatus, updateStatus, socket } = useStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [statusContent, setStatusContent] = useState("");
  const [viewingStatusId, setViewingStatusId] = useState(null);
  const fileInputRef = React.useRef(null);

  const viewingStatus = React.useMemo(
    () => statuses.find((status) => status._id === viewingStatusId),
    [statuses, viewingStatusId]
  );

  const formatViewerDetails = (viewer, index = 0) => {
    if (!viewer) {
      return {
        id: `unknown-${index}`,
        name: "Unknown viewer",
        subtitle: "",
        avatar: "",
      };
    }
    if (typeof viewer === "string") {
      return {
        id: `${viewer}-${index}`,
        name: "Unknown viewer",
        subtitle: "",
        avatar: "",
      };
    }
    return {
      id: viewer._id || viewer.id || viewer.username || viewer.email || `viewer-${index}`,
      name: viewer.username || viewer.email || "Unknown viewer",
      subtitle: viewer.about || viewer.statusMessage || "",
      avatar: viewer.profilePicture,
    };
  };

  const fetchStatuses = React.useCallback(async () => {
    try {
      const response = await getAllStatuses();
      if (response.status === "success") {
        setStatuses(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  }, [setStatuses]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    if (!socket) return;

    const handleNewStatus = (status) => {
      addStatus(status);
    };

    const handleStatusDeleted = (statusId) => {
      removeStatus(statusId);
    };

    const handleStatusViewed = ({ statusId, viewers }) => {
      if (!statusId) return;
      updateStatus(statusId, { viewers: viewers || [] });
    };

    socket.on("new_status", handleNewStatus);
    socket.on("status_deleted", handleStatusDeleted);
    socket.on("status_viewed", handleStatusViewed);

    return () => {
      socket.off("new_status", handleNewStatus);
      socket.off("status_deleted", handleStatusDeleted);
      socket.off("status_viewed", handleStatusViewed);
    };
  }, [socket, addStatus, removeStatus, updateStatus]);

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

  const handleCreateStatus = async () => {
    if (!statusContent.trim() && !selectedFile) {
      toast.error("Please add content or media");
      return;
    }

    const formData = new FormData();
    if (statusContent.trim()) {
      formData.append("content", statusContent);
    }
    if (selectedFile) {
      formData.append("status", selectedFile);
    }

    try {
      const response = await createStatus(formData);
      if (response.status === "success") {
        addStatus(response.data);
        toast.success("Status created successfully");
        setShowCreateDialog(false);
        setStatusContent("");
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(response.message || "Failed to create status");
      }
    } catch (error) {
      toast.error("Error creating status");
      console.error(error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      const response = await deleteStatus(statusId);
      if (response.status === "success") {
        removeStatus(statusId);
        toast.success("Status deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete status");
      }
    } catch (error) {
      toast.error("Error deleting status");
      console.error(error);
    }
  };

  const handleViewStatus = async (statusId) => {
    if (!statusId) return;
    try {
      const response = await viewStatus(statusId);
      if (response.status === "success") {
        // Update status with new viewer count
        updateStatus(statusId, { viewers: response.data?.viewers || [] });
      }
    } catch (error) {
      console.error("Error viewing status:", error);
    }
  };

  const groupedStatuses = statuses.reduce((acc, status) => {
    const userId = status.user?._id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(status);
    return acc;
  }, {});

  const getStatusExpiryTime = (expiryAt) => {
    const now = new Date();
    const expiry = new Date(expiryAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <div className="p-3 sm:p-4 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Status Updates
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Share moments that disappear in 24 hours
            </p>
          </div>
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
  <div className="p-4 flex  gap-2 md:gap-4 lg:gap-6">

    {/* If no statuses */}
    {Object.entries(groupedStatuses).length === 0 ? (
      <div className="col-span-full flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No status yet</p>
      </div>
    ) : (
      Object.entries(groupedStatuses).map(([userId, userStatuses]) => {
        const statusUser = userStatuses[0]?.user;
        const latest = userStatuses[0];
        const isMine = statusUser?._id === user?._id;

        return (
          <div
            key={userId}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => {
              handleViewStatus(latest._id);
              setViewingStatusId(latest._id);
            }}
          >
            {/* Status ring wrapper */}
            <div className="
              relative h-20 w-20 sm:h-24 sm:w-24 
              rounded-full p-[3px]
              bg-gradient-to-tr from-green-500 to-green-600
              group-hover:from-green-600 group-hover:to-green-700
              transition-all duration-200
              shadow-sm group-hover:shadow-md
            ">
              {/* Avatar */}
              <div className="h-full w-full rounded-full overflow-hidden bg-background">
                <Avatar className="h-full w-full">
                  <AvatarImage src={statusUser?.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {statusUser?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Online indicator (optional) */}
              {statusUser?.isOnline && (
                <div className="
                  absolute bottom-1 right-1 
                  h-3 w-3 rounded-full 
                  bg-green-500 border-2 border-background 
                  shadow
                " />
              )}
            </div>

            {/* Username */}
            <p className="
              mt-2 text-sm font-medium text-center truncate w-24
              group-hover:text-primary transition-colors
            ">
              {isMine ? "My Status" : statusUser?.username}
            </p>

            {/* Time */}
            <p className="text-[11px] text-muted-foreground">
              {formatTimestamp(latest.createdAt)}
            </p>
          </div>
        );
      })
    )}
  </div>
</ScrollArea>


      {/* Create Status Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw]  sm:w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {preview && (
              <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                {selectedFile?.type.startsWith("image/") ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain bg-muted"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="w-full max-h-96 bg-muted"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12"
              >
                <Plus className="h-5 w-5 mr-2" />
                {preview ? "Change Photo/Video" : "Add Photo/Video"}
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">What's on your mind?</label>
              <textarea
                value={statusContent}
                onChange={(e) => setStatusContent(e.target.value)}
                placeholder="Share your thoughts, ideas, or moments..."
                className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStatus} disabled={!statusContent.trim() && !selectedFile}>
                Post Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Status Dialog */}
      {viewingStatus && (
  <Dialog open={!!viewingStatus} onOpenChange={() => setViewingStatusId(null)}>
    <DialogContent className="w-[95vw] sm:w-full max-w-3xl p-0 gap-0 overflow-hidden">

      <div className="relative">

        {/* DELETE BUTTON (only for my status) */}
        {viewingStatus?.user?._id === user?._id && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-4 left-4 bg-red-600/90 hover:bg-red-700 backdrop-blur-md shadow-md"
            onClick={() => {
              handleDeleteStatus(viewingStatus._id);   // your function
              setViewingStatusId(null);               // close modal
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* CLOSE BUTTON */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-background/80 backdrop-blur-md"
          onClick={() => setViewingStatusId(null)}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* IMAGE STATUS */}
        {viewingStatus.contentType === "image" && (
          <img
            src={viewingStatus.content}
            alt="Status"
            className="w-full max-h-[80vh] object-contain"
          />
        )}

        {/* VIDEO STATUS */}
        {viewingStatus.contentType === "video" && (
          <video
            src={viewingStatus.content}
            controls
            autoPlay
            className="w-full max-h-[80vh]"
          />
        )}

        {/* TEXT STATUS */}
        {viewingStatus.contentType === "text" && (
          <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 min-h-[300px] flex items-center justify-center">
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-center max-w-2xl">
              {viewingStatus.content}
            </p>
          </div>
        )}
      </div>

      {/* VIEWERS SECTION (unchanged) */}
      {viewingStatus?.user?._id === user?._id && (
        <div className="p-4 border-t space-y-3 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Viewed by</p>
            </div>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">
              {viewingStatus.viewers?.length || 0}{" "}
              {viewingStatus.viewers?.length === 1 ? "person" : "people"}
            </span>
          </div>

          {viewingStatus.viewers?.length ? (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {viewingStatus.viewers.map((viewer, index) => {
                const { id, name, subtitle, avatar } = formatViewerDetails(viewer, index);
                return (
                  <div key={id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>
                        {name?.[0]?.toUpperCase() || "V"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No one has viewed this status yet.</p>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>
)}
    </div>
  );
};

export default StatusList;
