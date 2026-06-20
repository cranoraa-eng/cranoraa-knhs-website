import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api, { WS_ROOT } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getAccessToken } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { playSound } from '../utils/sounds';

const SendIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SearchIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const PlusIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const CheckIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="20 6 9 17 4 12"/></svg>;
const CheckCheckIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 7l-8 8-4-4"/><polyline points="22 7 14 17 11 14"/></svg>;
const UsersIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const MoreIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const PinIcon = (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 17v5"/><path d="M9 11l-4 4h14l-4-4"/><path d="M15 3.5L9.5 9 15 11l-2.5 2.5"/></svg>;
const TrashIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
const PaperclipIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>;
const DownloadIcon = (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getRoomDisplayName(room, userId) {
  if (room.name) return room.name;
  if (!room.is_group && room.participants_details) {
    const other = room.participants_details.find(p => p.id !== userId);
    return other ? `${other.first_name || other.username}` : 'Chat';
  }
  if (room.participants_details) {
    return room.participants_details.map(p => p.first_name || p.username).join(', ');
  }
  return 'Chat';
}

function getRoomAvatar(room, userId) {
  if (room.is_group) return null;
  const other = (room.participants_details || []).find(p => p.id !== userId);
  return other?.profile?.profile_picture || null;
}

function getRoomSubtitle(room, userId) {
  if (room.last_action_type === 'message' && room.last_action_sender_name) {
    const content = room.last_action_content || '';
    return `${room.last_action_sender_name}: ${content.slice(0, 50)}${content.length > 50 ? '…' : ''}`;
  }
  if (room.last_action_type === 'unsend') return 'Message unsent';
  if (room.last_action_type === 'edit') return `${room.last_action_sender_name || 'Someone'} edited a message`;
  return '';
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

export default function Messages() {
  const { user } = useAuth();
  const userId = user?.id;

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showRoomMenu, setShowRoomMenu] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const fileInputRef = useRef(null);
  const wsConnectedRef = useRef(false);

  const BASE_DELAY = 2000;
  const MAX_DELAY = 30000;

  const connectWebSocket = useCallback((roomId) => {
    if (!userId || !roomId) return;
    const token = getAccessToken();
    if (!token) return;
    if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_ROOT}/ws/chat/${roomId}/`);
    socketRef.current = ws;
    wsConnectedRef.current = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'auth_success') {
          wsConnectedRef.current = true;
          reconnectAttemptsRef.current = 0;
          return;
        }

        if (data.type === 'auth_failed') {
          ws.close();
          return;
        }

        if (data.type === 'message') {
          setMessages(prev => {
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, data];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          return;
        }

        if (data.type === 'typing') {
          setTypingUsers(prev => {
            const next = { ...prev };
            if (data.is_typing) {
              next[data.sender_id] = data.sender_name;
            } else {
              delete next[data.sender_id];
            }
            return next;
          });
          return;
        }

        if (data.type === 'read') {
          setMessages(prev => prev.map(m =>
            m.id <= data.message_id ? { ...m, is_read: true } : m
          ));
          return;
        }

        if (data.type === 'delivered') {
          setMessages(prev => prev.map(m =>
            m.id === data.message_id ? { ...m, is_delivered: true } : m
          ));
          return;
        }

        if (data.type === 'message_deleted') {
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
          return;
        }

        if (data.type === 'message_edited') {
          setMessages(prev => prev.map(m =>
            m.id === data.message_id ? { ...m, content: data.content, is_edited: true } : m
          ));
          return;
        }

        if (data.type === 'message_reaction') {
          setMessages(prev => prev.map(m =>
            m.id === data.message_id ? { ...m, reactions: data.reactions } : m
          ));
          return;
        }

        if (data.type === 'peer_online') {
          setOnlineUsers(prev => new Set([...prev, data.user_id]));
          return;
        }

        if (data.type === 'peer_presence') {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (data.is_online) next.add(data.user_id);
            else next.delete(data.user_id);
            return next;
          });
          return;
        }

        if (data.type === 'room_update') {
          if (data.event === 'group_deleted') {
            setRooms(prev => prev.filter(r => r.id !== data.room_id));
            if (selectedRoom?.id === data.room_id) setSelectedRoom(null);
          } else if (data.room) {
            setRooms(prev => {
              const idx = prev.findIndex(r => r.id === data.room.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = data.room;
                return next;
              }
              return [data.room, ...prev];
            });
          }
          return;
        }

        if (data.type === 'new_message_notify') {
          return;
        }

        if (data.type === 'forced_logout') {
          toast.error(data.message || 'Your account has been suspended.');
          return;
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    ws.onclose = (e) => {
      wsConnectedRef.current = false;
      socketRef.current = null;
      if (e.code !== 1000 && e.code !== 1001 && userId) {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempts), MAX_DELAY);
        reconnectAttemptsRef.current = attempts + 1;
        reconnectTimerRef.current = setTimeout(() => connectWebSocket(roomId), delay);
      }
    };

    ws.onerror = () => {};
  }, [userId]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      socketRef.current.close(1000, 'Room changed');
      socketRef.current = null;
    }
    wsConnectedRef.current = false;
    setTypingUsers({});
  }, []);

  const sendWS = useCallback((payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const r = await api.get('/chat/rooms/');
      setRooms(r.data.results || r.data);
    } catch (err) {
      console.error('Failed to load rooms', err);
    }
  }, []);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    try {
      const r = await api.get(`/chat/messages/?room_id=${roomId}`);
      setMessages(r.data.results || r.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const r = await api.get('/friendships/my_friends/');
      setFriends(r.data);
    } catch (err) {
      console.error('Failed to load friends', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadRooms(), loadFriends()]);
      setLoading(false);
    };
    init();
    return () => disconnectWebSocket();
  }, [loadRooms, loadFriends, disconnectWebSocket]);

  useEffect(() => {
    if (selectedRoom) {
      disconnectWebSocket();
      setMessages([]);
      loadMessages(selectedRoom.id).then(() => {
        connectWebSocket(selectedRoom.id);
      });
    }
  }, [selectedRoom?.id, connectWebSocket, disconnectWebSocket, loadMessages]);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    setShowRoomMenu(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setReplyTo(null);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setReplyTo(null);

    const payload = { type: 'message', message: content };
    if (replyTo) payload.parent_id = replyTo.id;

    if (!sendWS(payload)) {
      toast.error('Connection lost. Reconnecting...');
      setNewMessage(content);
      connectWebSocket(selectedRoom.id);
    }
    setSending(false);
  }, [newMessage, selectedRoom, sending, sendWS, replyTo, connectWebSocket]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > 3000) {
      lastTypingSentRef.current = now;
      sendWS({ type: 'typing', is_typing: true });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendWS({ type: 'typing', is_typing: false });
    }, 3000);
  }, [sendWS]);

  const handleReaction = useCallback((messageId, emoji) => {
    sendWS({ type: 'reaction', message_id: messageId, emoji });
    setShowEmojiPicker(null);
  }, [sendWS]);

  const handleMarkRead = useCallback(() => {
    if (!selectedRoom || !messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender !== userId) {
      sendWS({ type: 'read', message_id: lastMsg.id });
    }
  }, [selectedRoom, messages, userId, sendWS]);

  useEffect(() => {
    if (selectedRoom) handleMarkRead();
  }, [messages, selectedRoom, handleMarkRead]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const r = await api.get(`/chat/messages/search/?q=${encodeURIComponent(searchQuery)}${selectedRoom ? `&room_id=${selectedRoom.id}` : ''}`);
      setSearchResults(r.data);
    } catch (err) {
      toast.error('Search failed');
    }
  }, [searchQuery, selectedRoom]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleCreatePrivateChat = useCallback(async (friendId) => {
    try {
      const r = await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: friendId });
      const room = r.data;
      await loadRooms();
      setSelectedRoom(room);
      setShowNewChatModal(false);
    } catch (err) {
      toast.error('Failed to create chat');
    }
  }, [loadRooms]);

  const handleCreateGroupChat = useCallback(async (name, participantIds) => {
    try {
      const r = await api.post('/chat/rooms/', { name, is_group: true, participants: participantIds });
      await loadRooms();
      setSelectedRoom(r.data);
      setShowNewChatModal(false);
    } catch (err) {
      toast.error('Failed to create group');
    }
  }, [loadRooms]);

  const handlePinRoom = useCallback(async (roomId) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (room?.is_pinned) {
        await api.post(`/chat/rooms/${roomId}/unpin/`);
      } else {
        await api.post(`/chat/rooms/${roomId}/pin/`);
      }
      await loadRooms();
      setShowRoomMenu(null);
    } catch (err) {
      toast.error('Failed to update pin');
    }
  }, [rooms, loadRooms]);

  const handleDeleteConversation = useCallback(async (roomId) => {
    const result = await Swal.fire({
      title: 'Delete conversation?',
      text: 'This will remove all messages for you.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9F7AEA',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/chat/rooms/${roomId}/delete_conversation/`);
        await loadRooms();
        if (selectedRoom?.id === roomId) setSelectedRoom(null);
        toast.success('Conversation deleted');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
    setShowRoomMenu(null);
  }, [selectedRoom, loadRooms]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    const result = await Swal.fire({
      title: 'Delete message?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9F7AEA',
      confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/chat/messages/${messageId}/`);
      } catch (err) {
        toast.error('Failed to delete message');
      }
    }
  }, []);

  const handleEditMessage = useCallback(async (messageId) => {
    const { value } = await Swal.fire({
      title: 'Edit message',
      input: 'text',
      inputValue: messages.find(m => m.id === messageId)?.content || '',
      showCancelButton: true,
      confirmButtonColor: '#9F7AEA',
    });
    if (value !== undefined && value.trim()) {
      try {
        await api.patch(`/chat/messages/${messageId}/edit/`, { content: value.trim() });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: value.trim(), is_edited: true } : m));
      } catch (err) {
        toast.error('Failed to edit');
      }
    }
  }, [messages]);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_id', selectedRoom.id);
      if (replyTo) formData.append('parent_id', replyTo.id);
      const r = await api.post('/chat/messages/send_media/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, r.data]);
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      toast.error('Upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedRoom, replyTo]);

  const filteredRooms = useMemo(() => {
    let list = [...rooms];
    if (showPinned) list = list.filter(r => r.is_pinned);
    if (searchQuery && !isSearching) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => getRoomDisplayName(r, userId).toLowerCase().includes(q));
    }
    const pinned = list.filter(r => r.is_pinned);
    const unpinned = list.filter(r => !r.is_pinned);
    return [...pinned, ...unpinned];
  }, [rooms, showPinned, searchQuery, isSearching, userId]);

  const otherParticipant = useMemo(() => {
    if (!selectedRoom || selectedRoom.is_group) return null;
    return (selectedRoom.participants_details || []).find(p => p.id !== userId);
  }, [selectedRoom, userId]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* ── Sidebar: Room List ── */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50 ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800">Messages</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`p-2 rounded-lg transition-colors ${showPinned ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:bg-slate-100'}`}
              title="Pinned chats"
            >
              <PinIcon size={16} />
            </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              title="New chat"
            >
              <PlusIcon size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              </div>
              <p className="text-sm font-medium text-slate-500">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1">Start a new chat to begin messaging</p>
            </div>
          ) : (
            filteredRooms.map(room => {
              const displayName = getRoomDisplayName(room, userId);
              const avatar = getRoomAvatar(room, userId);
              const subtitle = getRoomSubtitle(room, userId);
              const isActive = selectedRoom?.id === room.id;
              const hasUnread = room.unread_count > 0;

              return (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors relative ${
                    isActive ? 'bg-violet-50 border-r-2 border-violet-600' : 'hover:bg-white'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : room.is_group ? (
                      <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center">
                        <UsersIcon size={20} className="text-violet-600" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(displayName)}`}>
                        {getInitials(displayName)}
                      </div>
                    )}
                    {!room.is_group && otherParticipant && onlineUsers.has(otherParticipant.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {displayName}
                      </span>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                        {formatTime(room.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${hasUnread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                        {subtitle || 'No messages yet'}
                      </span>
                      {hasUnread && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {room.unread_count > 99 ? '99+' : room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main: Chat Area ── */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-500"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
              <p className="text-sm text-slate-500 mt-1">Choose from existing chats or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
              <button
                onClick={() => setSelectedRoom(null)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>

              {getRoomAvatar(selectedRoom, userId) ? (
                <img src={getRoomAvatar(selectedRoom, userId)} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : selectedRoom.is_group ? (
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                  <UsersIcon size={18} className="text-violet-600" />
                </div>
              ) : otherParticipant ? (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(getRoomDisplayName(selectedRoom, userId))}`}>
                  {getInitials(getRoomDisplayName(selectedRoom, userId))}
                </div>
              ) : null}

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate">
                  {getRoomDisplayName(selectedRoom, userId)}
                </h3>
                {selectedRoom.is_group ? (
                  <p className="text-xs text-slate-500">
                    {(selectedRoom.participants_details || []).length} members
                    {otherParticipant && onlineUsers.has(otherParticipant.id) && ' · Online'}
                  </p>
                ) : otherParticipant ? (
                  <p className="text-xs text-slate-500">
                    {onlineUsers.has(otherParticipant.id) ? 'Online' : 'Offline'}
                  </p>
                ) : null}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowRoomMenu(showRoomMenu === selectedRoom.id ? null : selectedRoom.id)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <MoreIcon size={18} />
                </button>
                {showRoomMenu === selectedRoom.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                    <button
                      onClick={() => handlePinRoom(selectedRoom.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <PinIcon size={14} />
                      {selectedRoom.is_pinned ? 'Unpin chat' : 'Pin chat'}
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(selectedRoom.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon size={14} />
                      Delete conversation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" onClick={() => setShowRoomMenu(null)}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender === userId;
                  const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.sender !== msg.sender);
                  const isLast = i === messages.length - 1 || messages[i + 1]?.sender !== msg.sender;
                  const showTime = isLast;

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${!isLast ? 'mb-0.5' : 'mb-2'}`}>
                      {!isOwn && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(msg.sender_name)}`}>
                              {getInitials(msg.sender_name)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && !isOwn && (
                          <span className="text-[11px] font-semibold text-slate-500 mb-0.5 ml-1">{msg.sender_name}</span>
                        )}

                        {msg.parent_message_details && (
                          <div className={`text-[11px] px-2.5 py-1 mb-0.5 rounded-t-lg border-l-2 ${isOwn ? 'bg-violet-50 border-violet-400 text-violet-700' : 'bg-slate-50 border-slate-300 text-slate-600'}`}>
                            <span className="font-semibold">{msg.parent_message_details.sender_name}</span>: {msg.parent_message_details.content?.slice(0, 60)}
                          </div>
                        )}

                        <div className="relative group">
                          {msg.message_type === 'image' && msg.attachment_url ? (
                            <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block">
                              <img src={msg.attachment_url} alt={msg.attachment_filename} className="max-w-[280px] max-h-[200px] rounded-xl object-cover" />
                              {msg.content && <p className="text-sm mt-1 px-1">{msg.content}</p>}
                            </a>
                          ) : msg.message_type === 'file' && msg.attachment_url ? (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isOwn ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200'}`}
                            >
                              <PaperclipIcon size={16} className={isOwn ? 'text-violet-500' : 'text-slate-500'} />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{msg.attachment_filename || 'File'}</p>
                                <p className="text-[10px] text-slate-400">{formatFileSize(msg.file_size_bytes)}</p>
                              </div>
                              <DownloadIcon size={14} className="text-slate-400 flex-shrink-0" />
                            </a>
                          ) : (
                            <div className={`px-3 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-violet-600 text-white rounded-br-md'
                                : 'bg-slate-100 text-slate-800 rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                          )}

                          {/* Actions menu */}
                          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-lg px-1 py-0.5`}>
                            <button
                              onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                              className="p-1 hover:bg-slate-100 rounded text-xs"
                              title="React"
                            >
                              😊
                            </button>
                            {!isOwn && (
                              <button
                                onClick={() => setReplyTo(msg)}
                                className="p-1 hover:bg-slate-100 rounded text-xs"
                                title="Reply"
                              >
                                ↩
                              </button>
                            )}
                            {isOwn && (
                              <>
                                <button
                                  onClick={() => handleEditMessage(msg.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-xs"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="p-1 hover:bg-red-50 rounded text-xs text-red-500"
                                  title="Delete"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>

                          {/* Emoji picker */}
                          {showEmojiPicker === msg.id && (
                            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1 flex items-center gap-1 z-20`}>
                              {EMOJI_LIST.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5 ml-1">
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded-full text-xs hover:bg-slate-50"
                              >
                                <span>{emoji}</span>
                                <span className="text-slate-500">{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {showTime && (
                          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
                            {isOwn && (
                              msg.is_read ? (
                                <CheckCheckIcon size={12} className="text-violet-500" />
                              ) : msg.is_delivered ? (
                                <CheckCheckIcon size={12} className="text-slate-400" />
                              ) : (
                                <CheckIcon size={12} className="text-slate-400" />
                              )
                            )}
                            {msg.is_edited && <span className="text-[10px] text-slate-400">(edited)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400">
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-t border-violet-200">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-violet-600">Replying to {replyTo.sender_name}</p>
                  <p className="text-xs text-slate-600 truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-violet-400 hover:text-violet-600">
                  <XIcon size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  <PaperclipIcon size={18} />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent max-h-32"
                    style={{ minHeight: '42px' }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SendIcon size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      {showNewChatModal && (
        <NewChatModal
          friends={friends}
          userId={userId}
          onSelectPrivate={handleCreatePrivateChat}
          onCreateGroup={handleCreateGroupChat}
          onClose={() => setShowNewChatModal(false)}
        />
      )}
    </div>
  );
}

function NewChatModal({ friends, userId, onSelectPrivate, onCreateGroup, onClose }) {
  const [tab, setTab] = useState('friends');
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    onCreateGroup(groupName.trim(), selectedIds);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-800">New Conversation</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XIcon size={18} /></button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2.5 text-sm font-semibold ${tab === 'friends' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}
          >
            Friends
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-2.5 text-sm font-semibold ${tab === 'group' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}
          >
            New Group
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {tab === 'friends' ? (
            friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No friends yet</p>
                <p className="text-xs text-slate-400 mt-1">Add friends to start chatting</p>
              </div>
            ) : (
              friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => onSelectPrivate(friend.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  {friend.profile?.profile_picture ? (
                    <img src={friend.profile.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(friend.first_name || friend.username)}`}>
                      {getInitials(friend.first_name || friend.username)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{friend.first_name || friend.username}</p>
                    <p className="text-xs text-slate-500">{friend.role}</p>
                  </div>
                </button>
              ))
            )
          ) : (
            <div className="p-4">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {friends.map(friend => (
                <label
                  key={friend.id}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(friend.id)}
                    onChange={() => toggleSelect(friend.id)}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  {friend.profile?.profile_picture ? (
                    <img src={friend.profile.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${getAvatarColor(friend.first_name || friend.username)}`}>
                      {getInitials(friend.first_name || friend.username)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{friend.first_name || friend.username}</span>
                </label>
              ))}
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedIds.length === 0}
                className="w-full mt-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Create Group ({selectedIds.length} selected)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
