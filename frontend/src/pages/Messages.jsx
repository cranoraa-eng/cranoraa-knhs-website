import { useState, useEffect, useRef, useMemo } from 'react';
import api, { WS_ROOT } from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Messages = () => {
  const user = getUser();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef       = useRef(null);
  const socketRef            = useRef(null);
  const typingTimeoutRef     = useRef(null);
  const selectedRoomRef      = useRef(null); // always current selectedRoom for WS closures

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]           = useState('chats');
  const [rooms, setRooms]                   = useState([]);
  const [selectedRoom, setSelectedRoom]     = useState(null);
  const [messages, setMessages]             = useState([]);
  const [newMessage, setNewMessage]         = useState('');
  const [loading, setLoading]               = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');

  // Friendship
  const [friends, setFriends]               = useState([]);
  const [requests, setRequests]             = useState([]);
  const [allFriendships, setAllFriendships] = useState([]);
  const [searchResults, setSearchResults]   = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isSearching, setIsSearching]       = useState(false);

  // Group creation
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName]           = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Edit / delete
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent]       = useState('');

  // Typing
  const [isTyping, setIsTyping]             = useState(false);
  const [peerTyping, setPeerTyping]         = useState(false);
  const [peerTypingName, setPeerTypingName] = useState('');

  // Group settings panel state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupSettingsTab, setGroupSettingsTab] = useState('members');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '✨'];
  const [addMemberSearch, setAddMemberSearch]     = useState('');
  const [addMemberResults, setAddMemberResults]   = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [newGroupName, setNewGroupName]           = useState('');
  const [savingGroupName, setSavingGroupName]     = useState(false);

  // Members panel (read-only, for all group members)
  const [showMembersPanel, setShowMembersPanel]   = useState(false);

  // Pinned messages panel
  const [showPinnedPanel, setShowPinnedPanel]     = useState(false);

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
  useEffect(() => { scrollToBottom(); }, [messages, peerTyping]);

  // Keep selectedRoomRef in sync so WS closures always see current room
  useEffect(() => { selectedRoomRef.current = selectedRoom; }, [selectedRoom]);

  useEffect(() => {
    fetchRooms();
    fetchFriends();
    fetchFriendships();

    // Fallback polling (less frequent now that we have real-time)
    const interval = setInterval(() => {
      fetchRooms();
      fetchFriendships();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Always connect to WS, use '0' if no room selected to get personal notifications
    const roomId = selectedRoom?.id || '0';
    connectWebSocket(roomId);
    
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      // Clear unread badge immediately when room is opened
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, unread_count: 0 } : r));
    }
    
    return () => { socketRef.current?.close(); };
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
    try { const r = await api.get('/friendships/my_friends/'); setFriends(r.data); }
    catch { console.error('Failed to load friends'); }
  };

  const fetchFriendships = async () => {
    try {
      const r = await api.get('/friendships/');
      setAllFriendships(r.data);
      setRequests(r.data.filter(f => f.status === 'pending' && f.to_user === user.id));
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
      if (lastMsg && lastMsg.sender !== user.id) {
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
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;
    const content = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    
    const msgPayload = {
      type: 'message',
      message: content,
    };
    if (replyingTo) {
      msgPayload.parent_id = replyingTo.id;
    }

    safeSend(msgPayload);
    setReplyingTo(null);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && selectedRoom) {
      setIsTyping(true);
      safeSend({ type: 'typing', is_typing: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      safeSend({ type: 'typing', is_typing: false });
    }, 2000);
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
      title: 'Delete message?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/chat/messages/${msgId}/`);
    } catch { toast.error('Failed to delete message'); }
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
    } catch { toast.error('Failed to start chat'); }
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
      el.classList.add('ring-4', 'ring-violet-400/50', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-4', 'ring-violet-400/50', 'ring-offset-2'), 2000);
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
    if (f.from_user === user.id) return 'sent';
    if (f.to_user === user.id) return 'received';
    return null;
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const filteredRooms = useMemo(() => {
    let list = [...rooms];
    if (searchQuery.trim()) {
      list = list.filter(r => {
        const name = r.is_group ? r.name : r.participants_details.find(p => p.id !== user.id)?.full_name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    // Sort: Pinned first, then by last message timestamp (updated_at)
    return list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }, [rooms, searchQuery, user.id]);

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
  const connectWebSocket = (roomId) => {
    if (socketRef.current) {
      socketRef.current.onclose = null; // Remove old onclose handler to prevent loops
      socketRef.current.close();
    }

    const token    = localStorage.getItem('access_token');
    const ws       = new WebSocket(`${WS_ROOT}/ws/chat/${roomId}/?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS connected to room', roomId);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'typing') {
        if (data.sender_id !== user.id) {
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
          m.id <= data.message_id && m.sender === user.id
            ? { ...m, is_read: true, is_delivered: true } : m
        ));
        return;
      }
      if (data.type === 'message') {
        const msg = data; // the whole serialized message
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender !== user.id) {
          safeSend({ type: 'read', message_id: msg.id });
        }
        // Update room state live (for sorting and preview)
        setRooms(prev => prev.map(r =>
          r.id === data.room_id
            ? {
                ...r,
                last_message: msg,
                updated_at: msg.timestamp,
                unread_count: (msg.sender !== user.id && selectedRoomRef.current?.id !== data.room_id)
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
        return;
      }

      if (data.type === 'message_deleted') {
        setMessages(prev => prev.filter(m => m.id !== data.message_id));
      }

      if (data.type === 'message_edited') {
        setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, content: data.content, is_edited: true } : m));
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
            updated_at: data.timestamp, // Move to top live
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
             toast(`New chat: ${updated.is_group ? updated.name : updated.participants_details.find(p => p.id !== user.id)?.full_name}`, { icon: '💬' });
             return [updated, ...prev];
           });
        } else {
           setRooms(prev => prev.map(r => r.id === updated.id ? { ...updated, unread_count: r.unread_count } : r));
           setSelectedRoom(prev => prev?.id === updated.id ? updated : prev);
        }
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

      if (data.type === 'user_online' || data.type === 'peer_presence') {
        const isOnline = data.type === 'user_online' ? true : data.is_online;
        const updateOnlineStatus = (list) => list.map(u => u.id === data.user_id ? { ...u, is_online: isOnline } : u);
        
        setFriends(updateOnlineStatus);
        setRooms(prev => prev.map(r => ({
          ...r,
          participants_details: updateOnlineStatus(r.participants_details || [])
        })));
        if (selectedRoom) {
          setSelectedRoom(prev => prev ? {
            ...prev,
            participants_details: updateOnlineStatus(prev.participants_details || [])
          } : null);
        }
      }

      if (data.type === 'group_deleted') {
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
      }
    };
  };

  const FriendActionButton = ({ targetUser }) => {
    const status = getFriendshipStatus(targetUser.id);
    if (status === 'friends') return (
      <button onClick={() => startPrivateChat(targetUser.id)}
        className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95" title="Message">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.001 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>
    );
    if (status === 'sent') return (
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        Sent
      </div>
    );
    if (status === 'received') return (
      <button onClick={() => setActiveTab('requests')}
        className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-600 hover:text-white transition-all animate-pulse">
        Accept?
      </button>
    );
    return (
      <button onClick={() => sendFriendRequest(targetUser.id)}
        className="p-2 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-600 hover:text-white transition-all shadow-sm active:scale-95" title="Add Friend">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
      </button>
    );
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">

      {/* ── Sidebar (Room List) ── */}
      <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-100 flex-col bg-slate-50/30 min-w-0`}>

        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Messages</h2>
            <button onClick={() => setShowGroupModal(true)}
              className="p-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-600 hover:text-white transition-all shadow-sm active:scale-95" title="New Group Chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {['chats', 'friends', 'requests', 'search'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                {tab}
                {tab === 'requests' && requests.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[8px] animate-pulse">{requests.length}</span>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-violet-500/5 transition-all outline-none" />
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">

          {/* CHATS */}
          {activeTab === 'chats' && (
            filteredRooms.length === 0
              ? <div className="p-8 text-center"><p className="text-sm text-slate-400 font-medium">No conversations found</p></div>
              : filteredRooms.map(room => {
                  const otherUser   = !room.is_group ? room.participants_details.find(p => p.id !== user.id) : null;
                  const displayName = room.is_group ? room.name : otherUser?.full_name;
                  const initials    = displayName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                  const isSelected  = selectedRoom?.id === room.id;
                  const memberCount = room.participants_details?.length || 0;

                  return (
                    <button key={room.id} onClick={() => setSelectedRoom(room)}
                      className={`w-full p-3 md:p-4 flex items-center gap-3 transition-all border-b border-slate-50 ${isSelected ? 'bg-violet-50/80 border-l-4 border-l-violet-500' : 'hover:bg-white'}`}>

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {room.is_group ? (
                          /* Group — stacked people icon on indigo */
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        ) : (
                          /* Private — initials on violet-fuchsia */
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {initials}
                          </div>
                        )}
                        {/* Pin indicator */}
                        {room.is_pinned && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-10">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </div>
                        )}
                        {/* Online dot for private chats */}
                        {!room.is_group && otherUser?.is_online && (
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white ${room.is_pinned ? 'mr-0' : ''}`} />
                        )}
                        {/* Member count badge for groups */}
                        {room.is_group && (
                          <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] font-black rounded-full px-1.5 py-0.5 border-2 border-white leading-none">
                            {memberCount}
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className={`text-sm truncate uppercase tracking-tight ${room.unread_count > 0 ? 'font-black text-slate-900' : 'font-black text-slate-800'}`}>{displayName}</h4>
                            {room.is_group && (
                              <span className="shrink-0 text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Group</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {room.last_message && (
                              <span className={`text-[10px] font-bold ${room.unread_count > 0 ? 'text-violet-500' : 'text-slate-400'}`}>
                                {new Date(room.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {/* Unread badge */}
                            {room.unread_count > 0 && (
                              <span className="bg-violet-600 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-sm shadow-violet-300">
                                {room.unread_count > 99 ? '99+' : `+${room.unread_count}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs truncate font-medium max-w-full ${room.unread_count > 0 ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>
                          {room.last_message
                            ? (room.is_group
                                ? `${room.last_message.sender_name?.split(' ')[0] || 'Someone'}: ${room.last_message.content}`
                                : room.last_message.content)
                            : (room.is_group ? `${memberCount} members` : 'No messages yet')}
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
                  <div key={friend.id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 border-b border-slate-50 hover:bg-white transition-all group min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                        {friend.first_name?.[0]}{friend.last_name?.[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${friend.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{friend.full_name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate">{friend.role} • {friend.is_online ? 'Online' : 'Offline'}</p>
                    </div>
                    <button onClick={() => startPrivateChat(friend.id)}
                      className="p-2 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-600 hover:text-white transition-all opacity-0 md:group-hover:opacity-100 md:opacity-0 active:scale-95 shrink-0">
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
                  <div key={req.id} className="p-3 md:p-4 border-b border-slate-50 bg-violet-50/30 min-w-0">
                    <div className="flex items-center gap-3 mb-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-violet-200 flex items-center justify-center text-violet-700 font-bold shadow-sm shrink-0">
                        {req.from_user_details.first_name?.[0]}{req.from_user_details.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{req.from_user_details.full_name}</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black truncate">{req.from_user_details.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(req.id)}
                        className="flex-1 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200">Accept</button>
                      <button className="flex-1 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">Ignore</button>
                    </div>
                  </div>
                ))
          )}

          {/* SEARCH */}
          {activeTab === 'search' && (
            isSearching
              ? <div className="flex items-center justify-center p-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              : searchResults.length === 0
                ? <div className="p-8 text-center"><p className="text-sm text-slate-400 font-medium">{userSearchQuery ? 'No users found' : 'Search for teachers or classmates'}</p></div>
                : (
                  <div className="divide-y divide-slate-50">
                    {organizedSearchResults.admins.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrators</h5>
                        </div>
                        {organizedSearchResults.admins.map(u => (
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} />
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
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} />
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
                          <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-white transition-all">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{u.full_name}</h4>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{u.is_online ? 'Online' : 'Offline'}</p>
                            </div>
                            <FriendActionButton targetUser={u} />
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
      <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white min-w-0 overflow-x-hidden`}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-2 md:p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 gap-1 md:gap-2 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-violet-600 transition-all shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 ${selectedRoom.is_group ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'}`}>
                  {selectedRoom.is_group ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    (selectedRoom.participants_details.find(p => p.id !== user.id)?.full_name)
                      ?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                      {selectedRoom.is_group
                        ? selectedRoom.name
                        : selectedRoom.participants_details.find(p => p.id !== user.id)?.full_name}
                    </h3>
                    {selectedRoom.is_group && (
                      <span className="hidden sm:inline-block text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">Group</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedRoom.is_group ? (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {selectedRoom.participants_details?.length || 0} members
                      </span>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedRoom.participants_details?.find(p => p.id !== user.id)?.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {selectedRoom.participants_details?.find(p => p.id !== user.id)?.is_online ? 'Active now' : 'Offline'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                {/* Pinned messages button */}
                <button
                  onClick={() => setShowPinnedPanel(v => !v)}
                  className={`p-1.5 md:p-2 rounded-xl transition-all ${showPinnedPanel ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                  title="Pinned messages">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                </button>

                {/* Pin / unpin this conversation */}
                <button
                  onClick={() => handlePinRoom(selectedRoom)}
                  className={`p-1.5 md:p-2 rounded-xl transition-all ${selectedRoom.is_pinned ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'}`}
                  title={selectedRoom.is_pinned ? (selectedRoom.is_group ? 'Unpin Group' : 'Unpin Account') : (selectedRoom.is_group ? 'Pin Group' : 'Pin Account')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {selectedRoom.is_group ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14v4m0 0l-2-2m2 2l2-2" className={selectedRoom.is_pinned ? 'opacity-100' : 'opacity-0'} />
                      </>
                    )}
                  </svg>
                </button>

                {/* Members info — all group members can see */}
                {selectedRoom.is_group && (
                  <button
                    onClick={() => setShowMembersPanel(v => !v)}
                    className={`p-1.5 md:p-2 rounded-xl transition-all ${showMembersPanel ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                    title="View members">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}

                {/* Group settings — only for creator */}
                {selectedRoom.is_group && selectedRoom.created_by === user.id && (
                  <button
                    onClick={openGroupSettings}
                    className="p-1.5 md:p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                    title="Group settings">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteConversation(selectedRoom.id)}
                  className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete conversation">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-1 scrollbar-thin scrollbar-thumb-slate-100 bg-slate-50/30">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine    = msg.sender === user.id;
                  const showAvatar = i === 0 || messages[i - 1].sender !== msg.sender;
                  const isEditing  = editingMessage?.id === msg.id;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2 group overflow-hidden md:overflow-visible`}>
                      {/* Avatar for other person */}
                      {!isMine && (
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${showAvatar ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'opacity-0'}`}>
                          {msg.sender_name?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="max-w-[85%] md:max-w-[70%] flex flex-col min-w-0">
                        {/* Sender name for group chats */}
                        {!isMine && showAvatar && selectedRoom.is_group && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-0.5">{msg.sender_name}</span>
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
                              className="px-3 py-2 rounded-xl border border-violet-300 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setEditingMessage(null); setEditContent(''); }}
                                className="px-3 py-1 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                                Cancel
                              </button>
                              <button onClick={() => handleEditMessage(msg.id)}
                                className="px-3 py-1 text-xs font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all">
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Reply info if this message is a reply */}
                            {msg.parent_message_details && (
                              <button 
                                onClick={() => scrollToMessage(msg.parent_message_details.id)}
                                className={`mb-1 flex flex-col group/reply transition-all active:scale-95 ${isMine ? 'items-end' : 'items-start'}`}>
                                <div className="px-3 py-1 bg-slate-100 rounded-t-xl text-[10px] text-slate-500 border-l-2 border-slate-300 max-w-full truncate group-hover/reply:bg-slate-200">
                                  <span className="font-bold">Replying to {msg.parent_message_details.sender_name}:</span> {msg.parent_message_details.content}
                                </div>
                              </button>
                            )}

                            {/* Hover actions — Messenger style */}
                            <div className={`absolute top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center gap-1 ${isMine ? '-left-32' : '-right-32'}`}>
                              {/* React Button */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-amber-500 hover:border-amber-300 shadow-sm transition-all"
                                  title="React">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                {showReactionPicker === msg.id && (
                                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 flex gap-1 z-[100] animate-in fade-in slide-in-from-bottom-2">
                                    {COMMON_EMOJIS.map(emoji => (
                                      <button key={emoji} onClick={() => handleReactToMessage(msg.id, emoji)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-all text-lg active:scale-125">
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Reply Button */}
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-all"
                                title="Reply">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>

                              {/* Pin button — everyone */}
                              <button
                                onClick={() => handlePinMessage(msg)}
                                className={`p-1.5 bg-white border rounded-lg shadow-sm transition-all ${msg.is_pinned ? 'text-amber-500 border-amber-300 hover:bg-amber-50' : 'text-slate-400 border-slate-200 hover:text-amber-500 hover:border-amber-300'}`}
                                title={msg.is_pinned ? 'Unpin' : 'Pin'}>
                                <svg className="w-3.5 h-3.5" fill={msg.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                </svg>
                              </button>
                              
                              {/* Edit + Delete — own messages only */}
                              {isMine && (
                                <>
                                  <button
                                    onClick={() => { setEditingMessage(msg); setEditContent(msg.content); }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-violet-600 hover:border-violet-300 shadow-sm transition-all"
                                    title="Edit">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-300 shadow-sm transition-all"
                                    title="Delete">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Bubble */}
                            <div id={`msg-${msg.id}`} className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm relative transition-all duration-500 break-all md:break-words whitespace-pre-wrap max-w-full ${
                              isMine
                                ? 'bg-violet-600 text-white rounded-br-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                            } ${msg.is_pinned ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                              {msg.is_pinned && (
                                <span className="block text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">📌 Pinned</span>
                              )}
                              {msg.content}
                              {msg.is_edited && (
                                <span className="ml-1.5 text-[10px] opacity-60 italic">edited</span>
                              )}

                              {/* Reactions display */}
                              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className={`absolute -bottom-2 ${isMine ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm z-10`}>
                                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    <span key={emoji} className="text-[10px] cursor-default flex items-center gap-0.5" title={users.map(u => u.user_name).join(', ')}>
                                      {emoji} <span className="text-[8px] font-black text-slate-400">{users.length}</span>
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
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              <span title={msg.is_read ? 'Read' : msg.is_delivered ? 'Delivered' : 'Sent'}>
                                {msg.is_read ? (
                                  <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 16 11" fill="currentColor">
                                    <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z"/>
                                    <path d="M14.571.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-.5-.583a.75.75 0 1 1 1.138-.976l.007.008 5.855-6.484a.75.75 0 0 1 1.06-.025z"/>
                                  </svg>
                                ) : msg.is_delivered ? (
                                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 11" fill="currentColor">
                                    <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z"/>
                                    <path d="M14.571.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-.5-.583a.75.75 0 1 1 1.138-.976l.007.008 5.855-6.484a.75.75 0 0 1 1.06-.025z"/>
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-slate-400" viewBox="0 0 12 11" fill="currentColor">
                                    <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.5a.75.75 0 1 1 1.138-.976L4.5 7.06l5.965-6.382a.75.75 0 0 1 1.06-.025z"/>
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {peerTyping && (
              <div className="px-6 pb-1 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">{peerTypingName || 'Someone'} is typing</span>
                  <span className="flex gap-0.5 items-end ml-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-2 md:p-4 bg-white border-t border-slate-100 overflow-hidden">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-slate-50 border-l-4 border-violet-500 p-2 rounded-r-xl animate-in slide-in-from-bottom-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Replying to {replyingTo.sender_name}</p>
                    <p className="text-xs text-slate-500 truncate">{replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-violet-500/5 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-violet-500 mb-6">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.001 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Your Inbox</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
              Select a conversation from the sidebar or start a new chat with your teachers and classmates.
            </p>
          </div>
        )}
      </div>

      {/* ── Members Panel (read-only, all group members) ── */}
      {showMembersPanel && selectedRoom?.is_group && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMembersPanel(false)} />
          <div className="relative w-full md:w-80 bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-between">
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
                const isMe = member.id === user.id;
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {member.full_name}
                        {isMe && <span className="ml-1 text-[9px] text-slate-400">(you)</span>}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                        {isCreator && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Creator</span>}
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
                <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mt-0.5">{selectedRoom.name}</p>
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
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${groupSettingsTab === tab ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
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
                    const isMe = member.id === user.id;
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {member.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {member.full_name}
                            {isMe && <span className="ml-1.5 text-[9px] text-slate-400">(you)</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                            {isCreator && (
                              <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Creator</span>
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
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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
                            className="p-1.5 text-violet-600 bg-violet-50 hover:bg-violet-600 hover:text-white rounded-lg transition-all"
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
                        className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50 active:scale-95">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-violet-300 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Friends</label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {friends.length === 0
                    ? <p className="text-xs text-slate-400 py-4 text-center">Add friends first to create groups</p>
                    : friends.map(friend => (
                        <label key={friend.id}
                          className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border cursor-pointer transition-all min-w-0 ${selectedFriends.includes(friend.id) ? 'bg-violet-50 border-violet-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <input type="checkbox" className="hidden"
                            checked={selectedFriends.includes(friend.id)}
                            onChange={() => setSelectedFriends(prev =>
                              prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                            )} />
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selectedFriends.includes(friend.id) ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {friend.first_name?.[0]}{friend.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">{friend.full_name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">{friend.role}</p>
                          </div>
                          {selectedFriends.includes(friend.id) && (
                            <svg className="w-5 h-5 text-violet-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))
                  }
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowGroupModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
                  Cancel
                </button>
                <button type="submit" disabled={!groupName.trim() || selectedFriends.length === 0}
                  className="flex-[1.5] py-3 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Messages;
