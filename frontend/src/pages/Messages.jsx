import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { WS_ROOT } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { playSound } from '../utils/sounds';
import { Button, Badge, LoadingSpinner, EmptyState, Input, SearchInput } from '../components/ui';
import { cn } from '../styles/designSystem';

// ── FriendActionButton — defined outside Messages to avoid re-creation on every render ──
const FriendActionButton = ({ targetUser, status, onStartChat, onSendRequest, onShowRequests }) => {
  if (status === 'friends') return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onStartChat(targetUser.id)}
      className="text-green-600 hover:bg-green-50 hover:text-green-700"
      title="Message"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </Button>
  );
  if (status === 'sent') return (
    <Badge variant="slate" size="sm">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Sent
    </Badge>
  );
  if (status === 'received') return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onShowRequests}
      className="bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white animate-pulse"
    >
      Accept?
    </Button>
  );
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSendRequest(targetUser.id)}
      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      title="Add Friend"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    </Button>
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatMessagePreview = (msg) => {
  if (!msg) return '';
  if (msg.content) return msg.content;
  if (msg.message_type === 'image') return '📷 Photo';
  if (msg.message_type === 'file') return `📎 ${msg.attachment_filename || 'File'}`;
  return '';
};

const MessageAttachmentBody = ({ msg, isMine }) => {
  const isImage = msg.message_type === 'image' || msg.attachment_is_image;
  if (isImage && msg.attachment_url) {
    return (
      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block" onClick={e => e.stopPropagation()}>
        <img
          src={msg.attachment_url}
          alt={msg.attachment_filename || 'Image'}
          className="max-w-full max-h-64 rounded-xl object-contain"
          loading="lazy"
        />
      </a>
    );
  }
  if (msg.message_type === 'file' && msg.attachment_url) {
    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        download={msg.attachment_filename}
        onClick={e => e.stopPropagation()}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMine
          ? 'bg-blue-700/30 border-blue-400/30 hover:bg-blue-700/40'
          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-blue-500/40' : 'bg-blue-100'}`}>
          <svg className={`w-5 h-5 ${isMine ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold truncate ${isMine ? 'text-white' : 'text-slate-800'}`}>{msg.attachment_filename || 'File'}</p>
          {msg.file_size_bytes ? (
            <p className={`text-[10px] ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>{formatFileSize(msg.file_size_bytes)}</p>
          ) : null}
        </div>
      </a>
    );
  }
  return null;
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedRoomRef = useRef(null); // always current selectedRoom for WS closures
  const fileInputRef = useRef(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('chats');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Friendship
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allFriendships, setAllFriendships] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Group creation
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Edit / delete
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Typing
  const lastTypingSentRef = useRef(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerTypingName, setPeerTypingName] = useState('');

  // Group settings panel state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupSettingsTab, setGroupSettingsTab] = useState('members');
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [activeMoreMenu, setActiveMoreMenu] = useState(null);

  const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '✨'];
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberResults, setAddMemberResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroupName, setSavingGroupName] = useState(false);

  // Members panel (read-only, for all group members)
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  // Pinned messages panel
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const safeSend = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only scroll if the last message is new or if we're at the bottom
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      scrollToBottom();
    }
  }, [messages.length, peerTyping]);

  // Keep selectedRoomRef in sync so WS closures always see current room
  useEffect(() => { selectedRoomRef.current = selectedRoom; }, [selectedRoom]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  useEffect(() => {
    fetchRooms();
    fetchFriends();
    fetchFriendships();

    // OPTIMIZATION: connect WS once on mount to room '0' (personal channel).
    // This single persistent connection receives all cross-room events
    // (new_message_notify, room_update, friendship_update, forced_logout).
    // We do NOT reconnect when selectedRoom changes — that was causing
    // group_add/group_discard Redis commands on every room click.
    connectWebSocket('0');

    // Fallback polling — only fires if WS is disconnected (60s interval)
    const interval = setInterval(() => {
      fetchRooms();
      fetchFriendships();
    }, 60000);

    return () => {
      clearInterval(interval);
      socketRef.current?.close();
    };
  }, []);

  // When a room is selected: fetch its messages and join its WS group.
  // OPTIMIZATION: instead of closing/reopening the WS (which causes Redis
  // group_add + group_discard), we keep the same WS and send a 'join_room'
  // signal. The server handles group membership server-side.
  // For now we still open a room-specific WS for the room group broadcast,
  // but we reuse the existing connection if already on that room.
  useEffect(() => {
    if (!selectedRoom) return;

    setMessages([]); // Clear previous room's messages immediately to avoid stale flash
    fetchMessages(selectedRoom.id);
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, unread_count: 0 } : r));

    // Connect to the specific room's WS group for room-scoped events
    // (typing indicators, delivery receipts). Reuses existing connection
    // if already on this room — no extra Redis cmds.
    connectWebSocket(selectedRoom.id);
  }, [selectedRoom?.id]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    const t = setTimeout(handleSearchUsers, 300);
    return () => clearTimeout(t);
  }, [userSearchQuery, activeTab]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchRooms = async () => {
    try {
      const r = await api.get('/chat/rooms/');
      setRooms(r.data);
    } catch { toast.error('Failed to load conversations'); }
    finally { setLoading(false); }
  };

  const fetchFriends = async () => {
    if (!user) return;
    try { const r = await api.get('/friendships/my_friends/'); setFriends(r.data); }
    catch { console.error('Failed to load friends'); }
  };

  const fetchFriendships = async () => {
    if (!user) return;
    try {
      const r = await api.get('/friendships/');
      setAllFriendships(r.data);
      setRequests(r.data.filter(f => f.status === 'pending' && f.to_user === user?.id));
    } catch { console.error('Failed to load friendships'); }
  };

  const fetchMessages = async (roomId) => {
    try {
      setLoadingMessages(true);
      const r = await api.get(`/chat/messages/?room_id=${roomId}`);
      setMessages(r.data);
      setTimeout(scrollToBottom, 50);

      // Send read receipt for the last message so server marks all as read
      const lastMsg = r.data[r.data.length - 1];
      if (lastMsg && lastMsg.sender !== user?.id) {
        setTimeout(() => {
          safeSend({ type: 'read', message_id: lastMsg.id });
        }, 200);
      }

      // Zero unread count for this room immediately
      setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, unread_count: 0 } : rm));
    } catch { toast.error('Failed to load messages'); }
    finally { setLoadingMessages(false); }
  };

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) { setSearchResults([]); return; }
    try {
      setIsSearching(true);
      const r = await api.get(`/users/search/?q=${userSearchQuery.trim()}`);
      setSearchResults(r.data);
    } catch { console.error('Search failed'); }
    finally { setIsSearching(false); }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const checkMessagingAllowed = () => {
    if (user?.is_suspended) {
      Swal.fire({
        title: 'Account Suspended',
        text: 'Your messaging privileges have been revoked.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return false;
    }

    if (user?.is_muted) {
      const remaining = user.mute_until ? new Date(user.mute_until) - new Date() : 0;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      Swal.fire({
        title: 'Messaging Muted',
        text: remaining > 0 ? `You are currently muted. Remaining time: ${timeStr}` : 'You are currently muted.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return false;
    }

    return true;
  };

  const clearPendingFile = () => {
    setPendingPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedRoom) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File must be 25 MB or smaller');
      return;
    }
    setPendingPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    });
    setPendingFile(file);
  };

  const handleComposerPaste = (e) => {
    const file = e.clipboardData?.files?.[0];
    if (!file || !selectedRoom) return;
    if (!file.type.startsWith('image/')) return;
    e.preventDefault();
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image must be 25 MB or smaller');
      return;
    }
    setPendingPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingFile(file);
  };

  const handleSendAttachment = async () => {
    if (!pendingFile || !selectedRoom || uploadingAttachment) return;
    if (!checkMessagingAllowed()) return;

    const formData = new FormData();
    formData.append('room_id', selectedRoom.id);
    formData.append('file', pendingFile);
    if (newMessage.trim()) formData.append('caption', newMessage.trim());
    if (replyingTo) formData.append('parent_id', replyingTo.id);

    setUploadingAttachment(true);
    try {
      await api.post('/chat/messages/send_media/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearPendingFile();
      setNewMessage('');
      setReplyingTo(null);
      playSound('messageSent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  useEffect(() => {
    clearPendingFile();
  }, [selectedRoom?.id]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!selectedRoom) return;

    if (pendingFile) {
      handleSendAttachment();
      return;
    }

    if (!newMessage.trim()) return;
    if (!checkMessagingAllowed()) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Clear typing timeout and send "not typing" signal
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    safeSend({ type: 'typing', is_typing: false });
    lastTypingSentRef.current = 0;

    const msgPayload = {
      type: 'message',
      message: content,
    };
    if (replyingTo) {
      msgPayload.parent_id = replyingTo.id;
    }

    safeSend(msgPayload);
    playSound('messageSent');
    setReplyingTo(null);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedRoom) return;

    const now = Date.now();
    // Throttle typing signals: send immediately on first stroke, then every 3s
    if (now - lastTypingSentRef.current > 3000) {
      safeSend({ type: 'typing', is_typing: true });
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      safeSend({ type: 'typing', is_typing: false });
      lastTypingSentRef.current = 0; // Reset so next stroke sends immediately
    }, 1500);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedFriends.length === 0) return;
    try {
      const r = await api.post('/chat/rooms/', {
        name: groupName,
        is_group: true,
        participants: selectedFriends
      });
      setShowGroupModal(false);
      setGroupName('');
      setSelectedFriends([]);
      setSelectedRoom(r.data);
      fetchRooms();
      toast.success('Group chat created!');
    } catch { toast.error('Failed to create group'); }
  };

  const handlePinRoom = async (room) => {
    const isPinned = room.is_pinned;
    try {
      if (isPinned) await api.post(`/chat/rooms/${room.id}/unpin/`);
      else await api.post(`/chat/rooms/${room.id}/pin/`);

      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_pinned: !isPinned } : r));
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(prev => ({ ...prev, is_pinned: !isPinned }));
      }
      toast.success(isPinned ? 'Unpinned' : 'Pinned to top');
    } catch { toast.error('Action failed'); }
  };

  const handleEditMessage = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/chat/messages/${msgId}/edit/`, { content: editContent });
      setEditingMessage(null);
      setEditContent('');
    } catch { toast.error('Failed to edit message'); }
  };

  const handleDeleteMessage = async (msgId) => {
    const result = await Swal.fire({
      title: 'Unsend message?',
      text: 'This will remove the message for everyone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, unsend',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/chat/messages/${msgId}/`);
    } catch { toast.error('Failed to unsend message'); }
  };

  const handleReportMessage = async (msgId) => {
    const { value: reason } = await Swal.fire({
      title: 'Report Message',
      input: 'textarea',
      inputLabel: 'Why are you reporting this message?',
      inputPlaceholder: 'e.g., Harassment, Inappropriate content...',
      inputAttributes: {
        'aria-label': 'Type your reason here'
      },
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-[2rem]',
        input: 'text-sm'
      }
    });

    if (reason) {
      try {
        await api.post('/chat/reports/', {
          message: msgId,
          reason: reason
        });
        toast.success('Report submitted successfully');
      } catch (err) {
        toast.error('Failed to submit report');
      }
    }
  };

  const handleReactToMessage = (messageId, emoji) => {
    safeSend({
      type: 'reaction',
      message_id: messageId,
      emoji: emoji
    });
    setShowReactionPicker(null);
  };

  const handlePinMessage = async (msg) => {
    try {
      if (msg.is_pinned) await api.post(`/chat/messages/${msg.id}/unpin/`);
      else await api.post(`/chat/messages/${msg.id}/pin/`);
      // Update locally immediately, WS will sync others
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !msg.is_pinned } : m));
    } catch { toast.error('Failed to toggle pin'); }
  };

  const handleDeleteConversation = async (roomId) => {
    const result = await Swal.fire({
      title: 'Delete conversation?',
      text: 'All messages will be removed for you',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete everything',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/chat/rooms/${roomId}/delete_conversation/`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (selectedRoom?.id === roomId) setSelectedRoom(null);
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleAcceptRequest = async (reqId) => {
    try {
      await api.post(`/friendships/${reqId}/accept/`);
      toast.success('Friend request accepted!');
      fetchFriendships();
      fetchFriends();
    } catch { toast.error('Failed to accept request'); }
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      await api.post('/friendships/', { to_user: targetUserId });
      toast.success('Friend request sent!');
      fetchFriendships();
    } catch { toast.error('Failed to send request'); }
  };

  const startPrivateChat = async (targetUserId) => {
    try {
      const r = await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: targetUserId });
      const room = r.data;
      setRooms(prev => prev.some(rm => rm.id === room.id) ? prev : [room, ...prev]);
      setSelectedRoom(room);
      setActiveTab('chats');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start chat';
      toast.error(msg);
    }
  };

  const handleSearchAddMembers = async (q) => {
    setAddMemberSearch(q);
    if (!q.trim()) { setAddMemberResults([]); return; }
    try {
      setIsSearchingMembers(true);
      const r = await api.get(`/users/search/?q=${q.trim()}`);
      // Filter out existing participants
      const existingIds = selectedRoom.participants_details.map(p => p.id);
      setAddMemberResults(r.data.filter(u => !existingIds.includes(u.id)));
    } catch { console.error('Search failed'); }
    finally { setIsSearchingMembers(false); }
  };

  const handleAddMember = async (targetUserId) => {
    try {
      const r = await api.post(`/chat/rooms/${selectedRoom.id}/add_participants/`, { user_ids: [targetUserId] });
      setSelectedRoom(r.data);
      setAddMemberResults(prev => prev.filter(u => u.id !== targetUserId));
      toast.success('Member added');
    } catch { toast.error('Failed to add member'); }
  };

  const handleRemoveMember = async (targetUserId) => {
    const result = await Swal.fire({
      title: 'Remove member?',
      text: 'They will no longer see this group',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove them',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    try {
      const r = await api.post(`/chat/rooms/${selectedRoom.id}/remove_participant/`, { user_id: targetUserId });
      setSelectedRoom(r.data);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim() || newGroupName === selectedRoom.name) return;
    try {
      setSavingGroupName(true);
      const r = await api.patch(`/chat/rooms/${selectedRoom.id}/rename/`, { name: newGroupName });
      setSelectedRoom(r.data);
      toast.success('Group renamed');
    } catch { toast.error('Failed to rename group'); }
    finally { setSavingGroupName(false); }
  };

  const handleDeleteGroup = async () => {
    const result = await Swal.fire({
      title: 'Delete group permanently?',
      text: 'This will remove the group and all messages for EVERYONE. This action is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete permanently',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/chat/rooms/${selectedRoom.id}/delete_group/`);
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setSelectedRoom(null);
      setShowGroupSettings(false);
      toast.success('Group deleted permanently');
    } catch { toast.error('Failed to delete group'); }
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-blue-400/50', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-4', 'ring-blue-400/50', 'ring-offset-2'), 2000);
    }
  };

  const openGroupSettings = () => {
    setNewGroupName(selectedRoom.name);
    setGroupSettingsTab('members');
    setShowGroupSettings(true);
  };

  const getFriendshipStatus = (userId) => {
    const f = allFriendships.find(fr => fr.from_user === userId || fr.to_user === userId);
    if (!f) return null;
    if (f.status === 'accepted') return 'friends';
    if (f.from_user === user?.id) return 'sent';
    if (f.to_user === user?.id) return 'received';
    return null;
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const filteredRooms = useMemo(() => {
    let list = [...rooms];
    if (searchQuery.trim()) {
      list = list.filter(r => {
        const name = r.is_group ? r.name : r.participants_details.find(p => p.id !== user?.id)?.full_name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    // Sort: Pinned first, then by last message timestamp (updated_at)
    return list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }, [rooms, searchQuery, user?.id]);

  const organizedSearchResults = useMemo(() => {
    const results = {
      admins: [],
      teachers: [],
      studentGroups: {}
    };

    searchResults.forEach(u => {
      if (u.role === 'admin') results.admins.push(u);
      else if (u.role === 'teacher') results.teachers.push(u);
      else if (u.role === 'student') {
        const groupName = u.profile?.grade_level || 'Other Students';
        if (!results.studentGroups[groupName]) results.studentGroups[groupName] = [];
        results.studentGroups[groupName].push(u);
      }
    });

    return results;
  }, [searchResults]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0); // OPTIMIZATION: exponential backoff

  const connectWebSocket = useCallback((roomId) => {
    const token = localStorage.getItem('access_token');
    if (!token || !roomId) return;

    if (socketRef.current) {
      // If already connected to this room, don't reconnect
      if (socketRef.current.url.includes(`/ws/chat/${roomId}/`) && socketRef.current.readyState <= 1) {
        return;
      }
      socketRef.current.onclose = null;
      socketRef.current.close();
    }

    const ws = new WebSocket(`${WS_ROOT}/ws/chat/${roomId}/?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS connected to room', roomId);
      // Reset backoff on successful connection
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'error') {
          console.error('Moderation error received:', data.message);
          toast.error(data.message, { duration: 4000 });
          Swal.fire({
            title: 'Action Restricted',
            text: data.message,
            icon: 'error',
            confirmButtonColor: '#2563eb',
            customClass: {
              popup: 'rounded-[2rem]',
              title: 'text-lg font-black uppercase tracking-tight',
              htmlContainer: 'text-sm font-medium text-slate-500'
            }
          });
          return;
        }

        if (data.type === 'forced_logout') {
          Swal.fire({
            title: 'Account Suspended',
            text: data.message || 'Your account has been suspended by a moderator.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            allowOutsideClick: false,
            confirmButtonText: 'Logout'
          }).then(async () => {
            // Blacklist the refresh token on the backend before clearing local state
            try { await api.post('/logout/'); } catch { /* ignore */ }
            window.dispatchEvent(new CustomEvent('auth:logout'));
            navigate('/login');
          });
          return;
        }

        if (data.type === 'typing') {
          if (data.sender_id !== user?.id) {
            setPeerTyping(data.is_typing);
            setPeerTypingName(data.sender_name || '');
          }
          return;
        }
        if (data.type === 'delivered') {
          setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, is_delivered: true } : m));
          return;
        }
        if (data.type === 'read') {
          setMessages(prev => prev.map(m =>
            m.id <= data.message_id && m.sender === user?.id
              ? { ...m, is_read: true, is_delivered: true } : m
          ));
          return;
        }
        if (data.type === 'message') {
          const msg = data;
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender !== user?.id) {
            safeSend({ type: 'read', message_id: msg.id });
            // Play incoming sound only if message is from someone else
            playSound('message');
          }
          // Update room state live (for sorting and preview)
          setRooms(prev => prev.map(r =>
            r.id === data.room_id
              ? {
                ...r,
                last_message: msg,
                last_action_type: 'message',
                last_action_sender: msg.sender,
                last_action_sender_name: msg.sender_name,
                last_action_content: formatMessagePreview(msg),
                updated_at: msg.timestamp,
                unread_count: (msg.sender !== user?.id && selectedRoomRef.current?.id !== data.room_id)
                  ? (r.unread_count || 0) + 1
                  : r.unread_count,
              }
              : r
          ));
        }

        if (data.type === 'message_reaction') {
          setMessages(prev => prev.map(m =>
            m.id === data.message_id ? { ...m, reactions: data.reactions } : m
          ));
          // Update room preview for reaction
          setRooms(prev => prev.map(r => {
            if (r.id === data.room_id) {
              return {
                ...r,
                last_action_type: 'reaction',
                last_action_sender: data.user_id,
                last_action_sender_name: data.user_name,
                last_action_content: data.emoji,
                updated_at: new Date().toISOString(),
              };
            }
            return r;
          }));
        }

        if (data.type === 'message_deleted') {
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
          setRooms(prev => prev.map(r => {
            if (r.id === data.room_id) {
              return {
                ...r,
                last_action_type: 'unsend',
                last_action_sender: data.deleted_by,
                last_action_sender_name: data.deleted_by_name,
                updated_at: new Date().toISOString(),
              };
            }
            return r;
          }));
        }

        if (data.type === 'message_edited') {
          setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, content: data.content, is_edited: true } : m));
          setRooms(prev => prev.map(r => {
            if (r.id === data.room_id) {
              return {
                ...r,
                last_action_type: 'edit',
                last_action_sender: data.edited_by,
                last_action_sender_name: data.edited_by_name,
                last_action_content: data.content,
                updated_at: new Date().toISOString(),
              };
            }
            return r;
          }));
        }

        if (data.type === 'message_pinned') {
          setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, is_pinned: data.is_pinned } : m));
        }

        // Live Room/Event updates
        if (data.type === 'new_message_notify') {
          const currentRoomId = selectedRoomRef.current?.id;
          setRooms(prev => prev.map(r => {
            if (r.id !== data.room_id) return r;
            return {
              ...r,
              last_message: { content: data.content, timestamp: data.timestamp, sender_name: data.sender_name },
              last_action_type: 'message',
              last_action_sender: data.sender_id,
              last_action_sender_name: data.sender_name,
              last_action_content: data.content,
              updated_at: data.timestamp,
              unread_count: currentRoomId === data.room_id
                ? 0
                : (r.unread_count || 0) + 1,
            };
          }));
          return;
        }

        if (data.type === 'room_update') {
          const updated = data.room;
          if (data.event === 'new_room') {
            setRooms(prev => {
              if (prev.some(r => r.id === updated.id)) return prev;
              toast(`New chat: ${updated.is_group ? updated.name : updated.participants_details?.find(p => p.id !== user?.id)?.full_name}`, { icon: '💬' });
              return [updated, ...prev];
            });
          } else if (data.event === 'group_deleted') {
            setRooms(prev => prev.filter(r => r.id !== data.room_id));
            setSelectedRoom(prev => {
              if (prev?.id === data.room_id) {
                setMessages([]);
                setShowGroupSettings(false);
                toast('This group was deleted by the creator.', { icon: '🗑️' });
                return null;
              }
              return prev;
            });
          } else {
            setRooms(prev => prev.map(r => r.id === updated.id ? { ...updated, unread_count: r.unread_count } : r));
            setSelectedRoom(prev => prev?.id === updated.id ? updated : prev);
          }
        }

        if (data.type === 'user_online' || data.type === 'peer_presence') {
          const isOnline = data.type === 'user_online' ? true : data.is_online;
          const updateOnlineStatus = (list) => list.map(u => u.id === data.user_id ? { ...u, is_online: isOnline } : u);
          setFriends(updateOnlineStatus);
          setRooms(prev => prev.map(r => ({
            ...r,
            participants_details: updateOnlineStatus(r.participants_details || [])
          })));
          setSelectedRoom(prev => prev ? {
            ...prev,
            participants_details: updateOnlineStatus(prev.participants_details || [])
          } : null);
        }

        if (data.type === 'friendship_update') {
          // Refresh friends and requests list live
          fetchFriends();
          fetchFriendships();
          if (data.event === 'request_received') {
            toast(`New friend request!`, { icon: '🤝' });
          } else if (data.event === 'request_accepted') {
            toast(`Friend request accepted!`, { icon: '✨' });
          }
        }

      } catch (err) {
        console.error('Error parsing chat message', err);
      }
    };

    ws.onclose = (e) => {
      console.log('Chat WS disconnected', e.code, e.reason);
      if (e.code !== 1000 && e.code !== 1001) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        // OPTIMIZATION: exponential backoff — 3s → 6s → 12s → 24s → 48s → 60s (cap)
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(3000 * Math.pow(2, attempts), 60000);
        reconnectAttemptsRef.current = attempts + 1;
        reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(roomId), delay);
      }
    };

    ws.onerror = (err) => {
      console.error('Chat WS error', err);
      ws.close();
    };
  }, [user?.id]);
  // NOTE: selectedRoom is intentionally NOT in deps — connectWebSocket takes roomId as a
  // parameter and must NOT be recreated on every room change, as that would break the
  // exponential-backoff reconnect closure which captures roomId from the call site.

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <LoadingSpinner />
    </div>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] overflow-hidden">
      {/* DepEd Official Header */}
      <div className="bg-white border-b-4 border-blue-600 px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              Official Messaging
            </h1>
            <p className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide mt-0.5">
              School Communications
            </p>
          </div>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="flex flex-1 min-h-0 bg-white shadow-xl overflow-hidden border-t border-slate-200 relative">

      {/* ── Sidebar (Room List) ── */}
      <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-100 flex-col bg-slate-50/30 min-w-0 overflow-hidden`}>

        {/* Header */}
        <div className="p-2 md:p-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight">Messages</h2>
            <button onClick={() => setShowGroupModal(true)}
              className="p-1 md:p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95" title="New Group Chat">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-4 gap-1 mb-2 md:mb-4 bg-slate-100/50 p-1 rounded-xl shrink-0">
            {['chats', 'friends', 'requests', 'search'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative py-1.5 md:py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}>
                {tab}
                {tab === 'requests' && requests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] border-2 border-white animate-pulse">
                    {requests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative">
            <input type="text"
              placeholder={activeTab === 'search' ? 'Search users...' : 'Search...'}
              value={activeTab === 'search' ? userSearchQuery : searchQuery}
              onChange={e => activeTab === 'search' ? setUserSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 md:py-1.5 bg-slate-100 border-transparent rounded-lg text-base md:text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" />
            <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">

          {/* CHATS */}
          {activeTab === 'chats' && (
            filteredRooms.length === 0
              ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                  title="No conversations found"
                  description={searchQuery ? "Try a different search" : "Start a conversation with friends"}
                  className="p-8"
                />
              )
              : filteredRooms.map(room => {
                const otherUser = !room.is_group ? room.participants_details.find(p => p.id !== user?.id) : null;
                const displayName = room.is_group ? room.name : otherUser?.full_name;
                const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const isSelected = selectedRoom?.id === room.id;
                const memberCount = room.participants_details?.length || 0;

                return (
                  <button key={room.id} onClick={() => setSelectedRoom(room)}
                    className={`w-full p-2 md:p-3 flex items-center gap-2 md:gap-2.5 transition-all border-b border-slate-50 min-w-0 overflow-hidden ${isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : 'hover:bg-white'}`}>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {room.is_group ? (
                        /* Group — stacked people icon on indigo */
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      ) : (
                        /* Private — profile pic or initials */
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-[10px] md:text-sm shadow-md overflow-hidden">
                          {otherUser?.profile?.profile_picture
                            ? <img src={otherUser.profile.profile_picture} alt="" className="w-full h-full object-cover" />
                            : initials}
                        </div>
                      )}
                      {/* Pin indicator */}
                      {room.is_pinned && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm z-10">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </div>
                      )}
                      {/* Online dot for private chats */}
                      {!room.is_group && otherUser?.is_online && (
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white ${room.is_pinned ? 'mr-0' : ''}`} />
                      )}
                      {/* Member count badge for groups */}
                      {room.is_group && (
                        <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[7px] md:text-[8px] font-black rounded-full px-1 py-0.5 border border-white leading-none">
                          {memberCount}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <h4 className={`text-[11px] md:text-sm truncate uppercase tracking-tight ${room.unread_count > 0 ? 'font-black text-slate-900' : 'font-black text-slate-800'}`}>{displayName}</h4>
                          {room.is_group && (
                            <Badge variant="indigo" size="sm" className="text-[6px] uppercase">Grp</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {room.last_message && (
                            <span className={`text-[8px] font-bold ${room.unread_count > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                              {new Date(room.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {/* Unread badge */}
                          {room.unread_count > 0 && (
                            <Badge variant="blue" size="sm" className="min-w-[14px] h-[14px] px-1">
                              {room.unread_count > 99 ? '99+' : `+${room.unread_count}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className={`text-[10px] md:text-xs truncate font-medium max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-full ${room.unread_count > 0 ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>
                        {(() => {
                          const sender = room.last_action_sender === user?.id ? 'You' : (room.last_action_sender_name?.split(' ')[0] || 'Someone');

                          if (room.last_action_type === 'reaction') {
                            return `${sender} reacted ${room.last_action_content} to a message`;
                          }
                          if (room.last_action_type === 'unsend') {
                            return `${sender} unsent a message`;
                          }
                          if (room.last_action_type === 'edit') {
                            return `${sender} edited a message: ${room.last_action_content}`;
                          }

                          // Default message display
                          if (room.last_message) {
                            const preview = formatMessagePreview(room.last_message);
                            return room.is_group
                              ? `${room.last_message.sender_name?.split(' ')[0] || 'Someone'}: ${preview}`
                              : preview;
                          }

                          return room.is_group ? `${memberCount} members` : 'No messages yet';
                        })()}
                      </p>
                    </div>
                  </button>
                );
              })
          )}

          {/* FRIENDS */}
          {activeTab === 'friends' && (
            friends.length === 0
              ? <div className="p-8 text-center"><p className="text-sm text-slate-400 font-medium">No friends yet</p></div>
              : friends.map(friend => (
                <div key={friend.id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 border-b border-slate-50 hover:bg-white transition-all group min-w-0 overflow-hidden">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                      {friend.first_name?.[0]}{friend.last_name?.[0]}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${friend.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{friend.full_name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate">{friend.role} • {friend.is_online ? 'Online' : 'Offline'}</p>
                  </div>
                  <button onClick={() => startPrivateChat(friend.id)}
                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all sm:opacity-0 md:group-hover:opacity-100 active:scale-95 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.001 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </button>
                </div>
              ))
          )}

          {/* REQUESTS */}
          {activeTab === 'requests' && (
            requests.length === 0
              ? <div className="p-8 text-center"><p className="text-sm text-slate-400 font-medium">No pending requests</p></div>
              : requests.map(req => (
                <div key={req.id} className="p-3 md:p-4 border-b border-slate-50 bg-blue-50/30 min-w-0">
                  <div className="flex items-center gap-3 mb-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-violet-200 flex items-center justify-center text-blue-700 font-bold shadow-sm shrink-0">
                      {req.from_user_details.first_name?.[0]}{req.from_user_details.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{req.from_user_details.full_name}</h4>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate">{req.from_user_details.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">Accept</button>
                    <button className="flex-1 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">Ignore</button>
                  </div>
                </div>
              ))
          )}

          {/* SEARCH */}
          {activeTab === 'search' && (
            isSearching
              ? <div className="flex items-center justify-center p-12"><LoadingSpinner size="sm" /></div>
              : searchResults.length === 0
                ? <EmptyState
                    className="py-12"
                    title={userSearchQuery ? 'No users found' : 'Start searching'}
                    description={userSearchQuery ? 'Try different keywords' : 'Search for teachers or classmates'}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                  />
                : (
                  <div className="divide-y divide-slate-50">
                    {organizedSearchResults.admins.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrators</h5>
                        </div>
                        {organizedSearchResults.admins.map(u => (
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all min-w-0 overflow-hidden">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} status={getFriendshipStatus(u.id)} onStartChat={startPrivateChat} onSendRequest={sendFriendRequest} onShowRequests={() => setActiveTab('requests')} />
                          </div>
                        ))}
                      </div>
                    )}
                    {organizedSearchResults.teachers.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faculty Members</h5>
                        </div>
                        {organizedSearchResults.teachers.map(u => (
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all min-w-0 overflow-hidden">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} status={getFriendshipStatus(u.id)} onStartChat={startPrivateChat} onSendRequest={sendFriendRequest} onShowRequests={() => setActiveTab('requests')} />
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.entries(organizedSearchResults.studentGroups).map(([grpName, students]) => (
                      <div key={grpName}>
                        <div className="px-4 py-2 bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{grpName}</h5>
                        </div>
                        {students.map(u => (
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all min-w-0 overflow-hidden">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} status={getFriendshipStatus(u.id)} onStartChat={startPrivateChat} onSendRequest={sendFriendRequest} onShowRequests={() => setActiveTab('requests')} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white min-w-0 relative overflow-hidden z-0`}>
        {selectedRoom ? (
          <>
            {/* Chat Header — desktop redesign */}
            <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
              {/* Left: avatar + name + status */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 overflow-hidden ${selectedRoom.is_group ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-fuchsia-500'}`}>
                  {selectedRoom.is_group ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : selectedRoom.participants_details.find(p => p.id !== user?.id)?.profile?.profile_picture ? (
                    <img src={selectedRoom.participants_details.find(p => p.id !== user?.id).profile.profile_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedRoom.participants_details.find(p => p.id !== user?.id)?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {selectedRoom.is_group
                        ? selectedRoom.name
                        : selectedRoom.participants_details.find(p => p.id !== user?.id)?.full_name}
                    </h3>
                    {selectedRoom.is_group && (
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">Group</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedRoom.is_group ? (
                      <span className="text-[10px] text-slate-400">{selectedRoom.participants_details?.length || 0} members</span>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedRoom.participants_details?.find(p => p.id !== user?.id)?.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-400">
                          {selectedRoom.participants_details?.find(p => p.id !== user?.id)?.is_online ? 'Active now' : 'Offline'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: compact icon actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Pinned messages */}
                <button onClick={() => setShowPinnedPanel(v => !v)} title="Pinned messages"
                  className={`p-2 rounded-lg transition-all no-min ${showPinnedPanel ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                </button>
                {/* Pin conversation */}
                <button onClick={() => handlePinRoom(selectedRoom)} title={selectedRoom.is_pinned ? 'Unpin' : 'Pin conversation'}
                  className={`p-2 rounded-lg transition-all no-min ${selectedRoom.is_pinned ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {/* Group members */}
                {selectedRoom.is_group && (
                  <button onClick={() => setShowMembersPanel(v => !v)} title="Members"
                    className={`p-2 rounded-lg transition-all no-min ${showMembersPanel ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}
                {/* Group settings */}
                {selectedRoom.is_group && selectedRoom.created_by === user?.id && (
                  <button onClick={openGroupSettings} title="Group settings"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all no-min">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                {/* Divider */}
                <div className="w-px h-5 bg-slate-200 mx-1" />
                {/* Delete conversation */}
                <button onClick={() => handleDeleteConversation(selectedRoom.id)} title="Delete conversation"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all no-min">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Header — mobile (compact) */}
            <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white sticky top-0 z-10 h-14">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setSelectedRoom(null)}
                  className="p-2 -ml-1 text-slate-500 hover:text-blue-600 transition-all shrink-0 no-min active:scale-90 rounded-xl hover:bg-blue-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-[9px] shadow-sm shrink-0 overflow-hidden ${selectedRoom.is_group ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-fuchsia-500'}`}>
                  {selectedRoom.is_group ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : selectedRoom.participants_details.find(p => p.id !== user?.id)?.profile?.profile_picture ? (
                    <img src={selectedRoom.participants_details.find(p => p.id !== user?.id).profile.profile_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedRoom.participants_details.find(p => p.id !== user?.id)?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                    {selectedRoom.is_group ? selectedRoom.name : selectedRoom.participants_details.find(p => p.id !== user?.id)?.full_name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {!selectedRoom.is_group && (
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedRoom.participants_details?.find(p => p.id !== user?.id)?.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                    )}
                    <span className="text-[10px] text-slate-400 truncate">
                      {selectedRoom.is_group
                        ? `${selectedRoom.participants_details?.length || 0} members`
                        : (selectedRoom.participants_details?.find(p => p.id !== user?.id)?.is_online ? 'Active now' : 'Offline')}
                    </span>
                  </div>
                </div>
              </div>
              {/* Mobile header actions — compact icon row */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setShowPinnedPanel(v => !v)}
                  className={`p-2 rounded-xl transition-all no-min active:scale-90 ${showPinnedPanel ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Pinned">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                </button>
                {selectedRoom.is_group && (
                  <button onClick={() => setShowMembersPanel(v => !v)}
                    className={`p-2 rounded-xl transition-all no-min active:scale-90 ${showMembersPanel ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Members">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </button>
                )}
                {selectedRoom.is_group && selectedRoom.created_by === user?.id && (
                  <button onClick={openGroupSettings}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all no-min active:scale-90"
                    title="Settings">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                )}
                <button onClick={() => handleDeleteConversation(selectedRoom.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all no-min active:scale-90"
                  title="Delete">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/20">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender === user?.id;
                  const showAvatar = i === 0 || messages[i - 1].sender !== msg.sender;
                  const isEditing = editingMessage?.id === msg.id;

                  // ── Date Separator Logic ───────────────────────────────────
                  const showDateSeparator = (() => {
                    if (i === 0) return true;
                    const prevMsg = messages[i - 1];
                    const currDate = new Date(msg.timestamp);
                    const prevDate = new Date(prevMsg.timestamp);

                    // Show if different day
                    if (currDate.toDateString() !== prevDate.toDateString()) return true;

                    // Show if gap > 1 hour
                    const diff = currDate - prevDate;
                    if (diff > 1000 * 60 * 60) return true;

                    return false;
                  })();

                  const formatSeparatorDate = (timestamp) => {
                    const date = new Date(timestamp);
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();

                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (isToday) return timeStr;

                    const yesterday = new Date();
                    yesterday.setDate(now.getDate() - 1);
                    if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${timeStr}`;

                    // Within a week
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(now.getDate() - 7);
                    if (date > oneWeekAgo) {
                      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + timeStr;
                    }

                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
                  };

                  return (
                    <div key={msg.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-6 md:my-8">
                          <div className="px-4 py-1.5 bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 rounded-full text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] shadow-sm">
                            {formatSeparatorDate(msg.timestamp)}
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2 group overflow-visible`}>
                        {/* Avatar for other person */}
                        {!isMine && (
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden ${showAvatar ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'opacity-0'}`}>
                            {showAvatar && (msg.sender_profile_picture
                              ? <img src={msg.sender_profile_picture} alt="" className="w-full h-full object-cover" />
                              : msg.sender_name?.charAt(0).toUpperCase())}
                          </div>
                        )}

                        <div className="max-w-[82%] md:max-w-[58%] flex flex-col min-w-0">
                          {/* Sender name for group chats */}
                          {!isMine && showAvatar && selectedRoom.is_group && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-0.5">{msg.sender_name}</span>
                          )}

                          {/* Edit mode */}
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <input
                                autoFocus
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleEditMessage(msg.id);
                                  if (e.key === 'Escape') { setEditingMessage(null); setEditContent(''); }
                                }}
                                className="px-3 py-2 rounded-xl border border-blue-300 text-base md:text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => { setEditingMessage(null); setEditContent(''); }}
                                  className="px-2.5 py-1 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                                  Cancel
                                </button>
                                <button onClick={() => handleEditMessage(msg.id)}
                                  className="px-2.5 py-1 text-[10px] md:text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              {/* Reply quote — attached to top of bubble, no gap */}
                              {msg.parent_message_details && (
                                <button
                                  onClick={() => scrollToMessage(msg.parent_message_details.id)}
                                  className={`w-full flex ${isMine ? 'justify-end' : 'justify-start'} active:opacity-70 transition-opacity`}>
                                  <div className={`max-w-full px-3 py-1.5 text-[10px] rounded-t-xl rounded-b-none border-l-2 truncate hover:opacity-80 transition-opacity ${isMine
                                    ? 'bg-blue-700/40 text-violet-100 border-blue-300/60'
                                    : 'bg-slate-100 text-slate-500 border-slate-300'
                                    }`}>
                                    <span className="font-bold">↩ {msg.parent_message_details.sender_name}:</span>{' '}
                                    <span className="opacity-80">{formatMessagePreview(msg.parent_message_details)}</span>
                                  </div>
                                </button>
                              )}

                              {/* Hover/Tap actions — desktop only (hover), mobile uses tap on bubble */}
                              <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${isMine ? '-left-[72px]' : '-right-[72px]'} transition-all z-20 opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible`}>
                                {/* React Button */}
                                <button
                                  onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-amber-500 hover:border-amber-200 shadow-sm transition-all no-min"
                                  title="React">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>

                                {/* Reply Button */}
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 shadow-sm transition-all no-min"
                                  title="Reply">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                </button>

                                {/* More Button */}
                                <button
                                  onClick={() => setActiveMoreMenu(activeMoreMenu === msg.id ? null : msg.id)}
                                  className={`p-1.5 bg-white border rounded-lg shadow-sm transition-all no-min ${activeMoreMenu === msg.id ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-200'}`}
                                  title="More">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Bubble */}
                              <div
                                id={`msg-${msg.id}`}
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    setActiveMoreMenu(activeMoreMenu === msg.id ? null : msg.id);
                                  }
                                }}
                                className={`text-sm font-medium shadow-sm relative transition-all duration-200 break-words whitespace-pre-wrap max-w-full select-none md:select-text cursor-pointer md:cursor-default ${msg.parent_message_details ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'
                                  } ${isMine
                                    ? `bg-blue-600 text-white ${msg.parent_message_details ? '' : 'rounded-br-none'}`
                                    : `bg-white text-slate-700 border border-slate-100 ${msg.parent_message_details ? '' : 'rounded-bl-none'}`
                                  } ${msg.is_pinned ? 'ring-2 ring-amber-400 ring-offset-1' : ''} ${(msg.attachment_url && !msg.content) ? 'p-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                                {msg.is_pinned && (
                                  <span className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 px-2 pt-1">📌 Pinned</span>
                                )}
                                {(msg.message_type === 'image' || msg.message_type === 'file') && msg.attachment_url && (
                                  <MessageAttachmentBody msg={msg} isMine={isMine} />
                                )}
                                {msg.content && (
                                  <span className={msg.attachment_url ? 'block px-2 pb-1 pt-1' : ''}>{msg.content}</span>
                                )}
                                {msg.is_edited && (
                                  <span className="ml-1.5 text-[9px] md:text-[10px] opacity-60 italic">edited</span>
                                )}

                                {/* Reactions display */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                  <div className={`absolute -bottom-2.5 ${isMine ? '-right-1' : '-left-1'} flex items-center gap-0.5 bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm z-10 animate-in zoom-in duration-200`}>
                                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                                      <span key={emoji} className="text-[10px] md:text-xs cursor-default flex items-center gap-0.5" title={users.map(u => u.user_name).join(', ')}>
                                        {emoji}
                                        {users.length > 1 && (
                                          <span className="text-[8px] md:text-[9px] font-black text-slate-400">{users.length}</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Timestamp + receipt */}
                          {!isEditing && (
                            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && (
                                <span title={msg.is_read ? 'Read' : msg.is_delivered ? 'Delivered' : 'Sent'}>
                                  {msg.is_read ? (
                                    <svg className="w-3 md:w-3.5 h-3 md:h-3.5 text-blue-400" viewBox="0 0 16 11" fill="currentColor">
                                      <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z" />
                                      <path d="M14.571.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-.5-.583a.75.75 0 1 1 1.138-.976l.007.008 5.855-6.484a.75.75 0 0 1 1.06-.025z" />
                                    </svg>
                                  ) : msg.is_delivered ? (
                                    <svg className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-400" viewBox="0 0 16 11" fill="currentColor">
                                      <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z" />
                                      <path d="M14.571.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-.5-.583a.75.75 0 1 1 1.138-.976l.007.008 5.855-6.484a.75.75 0 0 1 1.06-.025z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-2.5 md:w-3 h-2.5 md:h-3 text-slate-400" viewBox="0 0 12 11" fill="currentColor">
                                      <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z" />
                                    </svg>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {peerTyping && (
              <div className="px-4 md:px-6 pb-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm">
                  <span className="text-xs text-slate-500">{peerTypingName || 'Someone'} is typing</span>
                  <span className="flex gap-0.5 items-end ml-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-slate-100 shrink-0">
              {/* Reply Preview — inline strip above input */}
              {replyingTo && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-b border-violet-100">
                  <div className="w-0.5 h-8 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Replying to {replyingTo.sender_name}</p>
                    <p className="text-xs text-slate-500 truncate">{formatMessagePreview(replyingTo)}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded no-min flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Attachment preview */}
              {pendingFile && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  {pendingPreviewUrl ? (
                    <img src={pendingPreviewUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-lg">📎</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{pendingFile.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(pendingFile.size)}</p>
                  </div>
                  <button type="button" onClick={clearPendingFile}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded no-min flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Input row */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-2.5" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0.625rem))' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex-shrink-0 no-min disabled:opacity-40"
                  title="Attach photo or file">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder={pendingFile ? 'Add a caption (optional)...' : 'Type a message...'}
                  value={newMessage}
                  onChange={handleTyping}
                  onPaste={handleComposerPaste}
                  style={{ fontSize: '16px' }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={uploadingAttachment || (!newMessage.trim() && !pendingFile)}
                  className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 no-min shadow-sm shadow-blue-200">
                  {uploadingAttachment ? (
                    <LoadingSpinner size="xs" className="text-white" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>

            {/* ── Reaction Picker ── */}
            {showReactionPicker && (
              <div className="absolute inset-0 z-[100] pointer-events-none">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto"
                  onClick={() => setShowReactionPicker(null)} />

                {/* Mobile: bottom sheet */}
                <div className="absolute bottom-0 inset-x-0 pointer-events-auto md:hidden animate-slide-up">
                  <div className="bg-white rounded-t-2xl shadow-2xl px-4 pt-4 pb-6">
                    <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">React to message</p>
                    <div className="flex items-center justify-around">
                      {COMMON_EMOJIS.map(emoji => (
                        <button key={emoji}
                          onClick={() => handleReactToMessage(showReactionPicker, emoji)}
                          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-slate-50 active:scale-125 transition-all">
                          <span className="text-3xl">{emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop: centered pill */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                  <div className="relative bg-white border border-slate-200 rounded-full shadow-2xl p-1.5 flex items-center gap-1 animate-scale-in pointer-events-auto">
                    {COMMON_EMOJIS.map(emoji => (
                      <button key={emoji}
                        onClick={() => handleReactToMessage(showReactionPicker, emoji)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-2xl active:scale-125">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── More Menu ── */}
            {activeMoreMenu && (
              <div className="absolute inset-0 z-[100] pointer-events-none">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto"
                  onClick={() => setActiveMoreMenu(null)} />

                {(() => {
                  const activeMsg = messages.find(m => m.id === activeMoreMenu);
                  if (!activeMsg) return null;
                  const isMsgMine = activeMsg.sender === user?.id;

                  const actions = (
                    <>
                      {/* React */}
                      <button
                        onClick={() => { setActiveMoreMenu(null); setShowReactionPicker(activeMoreMenu); }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                        <span className="text-xl">😊</span>
                        <span className="text-sm font-bold text-slate-700">React</span>
                      </button>

                      {/* Reply */}
                      <button
                        onClick={() => { setReplyingTo(activeMsg); setActiveMoreMenu(null); }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm font-bold text-slate-700">Reply</span>
                      </button>

                      {/* Edit — own text messages only */}
                      {isMsgMine && (!activeMsg.message_type || activeMsg.message_type === 'text') && (
                        <button
                          onClick={() => { setEditingMessage(activeMsg); setEditContent(activeMsg.content); setActiveMoreMenu(null); }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-sm font-bold text-slate-700">Edit</span>
                        </button>
                      )}

                      {/* Pin */}
                      <button
                        onClick={() => { handlePinMessage(activeMsg); setActiveMoreMenu(null); }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                        <svg className={`w-5 h-5 ${activeMsg.is_pinned ? 'text-amber-500' : 'text-slate-400'}`} fill={activeMsg.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        <span className="text-sm font-bold text-slate-700">{activeMsg.is_pinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      {/* Report — others only */}
                      {!isMsgMine && (
                        <button
                          onClick={() => { handleReportMessage(activeMoreMenu); setActiveMoreMenu(null); }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-amber-50 transition-colors text-left">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-sm font-bold text-amber-600">Report</span>
                        </button>
                      )}

                      {/* Unsend — own only */}
                      {isMsgMine && (
                        <button
                          onClick={() => { handleDeleteMessage(activeMoreMenu); setActiveMoreMenu(null); }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 transition-colors text-left">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-sm font-bold text-red-500">Unsend</span>
                        </button>
                      )}
                    </>
                  );

                  return (
                    <>
                      {/* Mobile: bottom sheet */}
                      <div className="absolute bottom-0 inset-x-0 pointer-events-auto md:hidden animate-slide-up">
                        <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden">
                          <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                          </div>
                          {/* Message preview */}
                          <div className="px-4 py-2 border-b border-slate-100 mb-1">
                            <p className="text-xs text-slate-400 truncate">{activeMsg.content}</p>
                          </div>
                          <div className="pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
                            {actions}
                          </div>
                        </div>
                      </div>

                      {/* Desktop: centered pill */}
                      <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                        <div className="relative bg-white border border-slate-200 rounded-full shadow-2xl p-1.5 flex items-center gap-1 animate-scale-in pointer-events-auto">
                          {/* React */}
                          <button onClick={() => { setActiveMoreMenu(null); setShowReactionPicker(activeMoreMenu); }}
                            className="p-2.5 text-slate-500 hover:bg-amber-50 hover:text-amber-500 rounded-full transition-all" title="React">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          {/* Reply */}
                          <button onClick={() => { setReplyingTo(activeMsg); setActiveMoreMenu(null); }}
                            className="p-2.5 text-slate-500 hover:bg-blue-50 hover:text-blue-500 rounded-full transition-all" title="Reply">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {isMsgMine && (!activeMsg.message_type || activeMsg.message_type === 'text') && (
                            <button onClick={() => { setEditingMessage(activeMsg); setEditContent(activeMsg.content); setActiveMoreMenu(null); }}
                              className="p-2.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-all" title="Edit">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => { handlePinMessage(activeMsg); setActiveMoreMenu(null); }}
                            className={`p-2.5 rounded-full transition-all ${activeMsg.is_pinned ? 'text-amber-500 bg-amber-50' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`} title={activeMsg.is_pinned ? 'Unpin' : 'Pin'}>
                            <svg className="w-5 h-5" fill={activeMsg.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </button>
                          {!isMsgMine && (
                            <button onClick={() => { handleReportMessage(activeMoreMenu); setActiveMoreMenu(null); }}
                              className="p-2.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 rounded-full transition-all" title="Report">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </button>
                          )}
                          {isMsgMine && (
                            <button onClick={() => { handleDeleteMessage(activeMoreMenu); setActiveMoreMenu(null); }}
                              className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-all" title="Unsend">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-500 mb-5">
              <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-2">Your Inbox</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
              Select a conversation or start a new chat with your teachers and classmates.
            </p>
            <button
              onClick={() => setActiveTab('search')}
              className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* ── Members Panel (read-only, all group members) ── */}
      {showMembersPanel && selectedRoom?.is_group && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMembersPanel(false)} />
          <div className="relative w-full md:w-80 bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Group Members</h3>
                <p className="text-indigo-200 text-xs font-bold mt-0.5">{selectedRoom.participants_details?.length || 0} members</p>
              </div>
              <button onClick={() => setShowMembersPanel(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {selectedRoom.participants_details?.map(member => {
                const isCreator = member.id === selectedRoom.created_by;
                const isMe = member.id === user?.id;
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {member.profile?.profile_picture
                          ? <img src={member.profile.profile_picture} alt="" className="w-full h-full object-cover" />
                          : member.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {member.full_name}
                        {isMe && <span className="ml-1 text-[9px] text-slate-400">(you)</span>}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                        {isCreator && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Creator</span>}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${member.is_online ? 'text-green-500' : 'text-slate-300'}`}>
                          {member.is_online ? '● Online' : '○ Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Pinned Messages Panel ── */}
      {showPinnedPanel && selectedRoom && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowPinnedPanel(false)} />
          <div className="relative w-full md:w-80 bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">📌 Pinned Messages</h3>
                <p className="text-amber-100 text-xs font-bold mt-0.5">
                  {messages.filter(m => m.is_pinned).length} pinned
                </p>
              </div>
              <button onClick={() => setShowPinnedPanel(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.filter(m => m.is_pinned).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <span className="text-4xl mb-3">📌</span>
                  <p className="text-sm font-bold text-slate-500">No pinned messages</p>
                  <p className="text-xs text-slate-400 mt-1">Hover a message and click the pin icon to pin it</p>
                </div>
              ) : (
                messages.filter(m => m.is_pinned).map(msg => (
                  <div key={msg.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{msg.sender_name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => handlePinMessage(msg)}
                          className="p-1 text-amber-500 hover:text-red-500 transition-all" title="Unpin">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Group Settings Panel ── */}
      {showGroupSettings && selectedRoom?.is_group && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowGroupSettings(false)} />

          {/* Panel */}
          <div className="relative w-full md:w-96 bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-violet-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Group Settings</h3>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-0.5">{selectedRoom.name}</p>
              </div>
              <button onClick={() => setShowGroupSettings(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {['members', 'add', 'settings'].map(tab => (
                <button key={tab} onClick={() => setGroupSettingsTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${groupSettingsTab === tab ? 'text-blue-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab === 'members' ? 'Members' : tab === 'add' ? 'Add Members' : 'Settings'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* MEMBERS TAB */}
              {groupSettingsTab === 'members' && (
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    {selectedRoom.participants_details?.length || 0} Members
                  </p>
                  {selectedRoom.participants_details?.map(member => {
                    const isCreator = member.id === selectedRoom.created_by;
                    const isMe = member.id === user?.id;
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                          {member.profile?.profile_picture
                            ? <img src={member.profile.profile_picture} alt="" className="w-full h-full object-cover" />
                            : member.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {member.full_name}
                            {isMe && <span className="ml-1.5 text-[9px] text-slate-400">(you)</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                            {isCreator && (
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Creator</span>
                            )}
                          </div>
                        </div>
                        {/* Remove button — only for non-creator, non-self members */}
                        {!isCreator && !isMe && (
                          <button onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove member">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADD MEMBERS TAB */}
              {groupSettingsTab === 'add' && (
                <div className="p-4">
                  <div className="relative mb-4">
                    <input type="text" placeholder="Search users to add..."
                      value={addMemberSearch}
                      onChange={e => handleSearchAddMembers(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-300 transition-all" />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {isSearchingMembers ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : addMemberResults.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-8">
                      {addMemberSearch ? 'No users found' : 'Type a name to search'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {addMemberResults.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all">
                          <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{u.full_name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
                          </div>
                          <button onClick={() => handleAddMember(u.id)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                            title="Add to group">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {groupSettingsTab === 'settings' && (
                <div className="p-4 space-y-6">
                  {/* Rename */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Group Name</label>
                    <div className="flex gap-2">
                      <input type="text" value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameGroup()}
                        className="flex-1 px-3 py-2.5 bg-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-300 transition-all" />
                      <button onClick={handleRenameGroup} disabled={savingGroupName || !newGroupName.trim() || newGroupName === selectedRoom.name}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95">
                        {savingGroupName ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="border border-red-100 rounded-xl p-4 bg-red-50/50">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Danger Zone</p>
                    <button onClick={handleDeleteGroup}
                      className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Group
                    </button>
                    <p className="text-[10px] text-red-400 mt-2 text-center">This permanently deletes the group and all messages.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Group Creation Modal ── */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-700 text-white">
              <h3 className="text-xl font-black tracking-tight mb-1">Create Group Chat</h3>
              <p className="text-violet-100 text-xs font-bold uppercase tracking-widest opacity-80">Add friends to your conversation</p>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Group Name</label>
                <input type="text" required placeholder="e.g., Grade 10 - Science Project"
                  value={groupName} onChange={e => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-blue-300 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Friends</label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {friends.length === 0
                    ? <p className="text-xs text-slate-400 py-4 text-center">Add friends first to create groups</p>
                    : friends.map(friend => (
                      <label key={friend.id}
                        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border cursor-pointer transition-all min-w-0 ${selectedFriends.includes(friend.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="hidden"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => setSelectedFriends(prev =>
                            prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                          )} />
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selectedFriends.includes(friend.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {friend.first_name?.[0]}{friend.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{friend.full_name}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">{friend.role}</p>
                        </div>
                        {selectedFriends.includes(friend.id) && (
                          <svg className="w-5 h-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    ))
                  }
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!groupName.trim() || selectedFriends.length === 0}
                  className="flex-[1.5]"
                >
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default Messages;

