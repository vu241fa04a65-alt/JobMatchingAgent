import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/SyncContext';

export default function TopNavbar({ onSearch }) {
  const { user } = useAuth();
  const { syncVersion } = useDataSync();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('jobmatch_token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch real-time notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, syncVersion]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('jobmatch_token');
      if (token) {
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setNotifications(prev => prev.map(n => ({ ...n, unread: false, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleMarkItemRead = async (id) => {
    try {
      const token = localStorage.getItem('jobmatch_token');
      if (token) {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const role = user?.role || 'STUDENT';

  const roleDisplayMap = {
    STUDENT: { label: 'Student Portal', sub: 'CSE • 2027' },
    T_AND_P: { label: 'T&P Officer', sub: 'Placement Cell' },
    HOD: { label: 'Head of Department', sub: 'Computer Science (Read Only)' }
  };

  const currentRoleInfo = roleDisplayMap[role] || { label: role, sub: '' };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="top-navbar">
      {/* Global Search Bar */}
      <div style={{ position: 'relative', width: '380px' }}>
        <Search size={17} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search for opportunities, skills, companies..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 16px 9px 38px',
            backgroundColor: '#F1F5F9',
            border: '1px solid transparent',
            borderRadius: '999px',
            fontSize: '0.84375rem',
            outline: 'none',
            color: '#0F172A',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell with Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            title="Notifications"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: showNotifications ? '#EEF2FF' : '#F1F5F9',
              border: showNotifications ? '1px solid #C7D2FE' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={18} color={showNotifications ? '#4F46E5' : '#475569'} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '1.5px solid #FFFFFF'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '340px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              padding: '16px',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h5 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Notifications</h5>
                  {unreadCount > 0 && (
                    <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.71875rem',
                      color: '#4F46E5',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkItemRead(n.id)}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: '12px', 
                        backgroundColor: n.unread ? '#F8FAFC' : 'transparent', 
                        border: n.unread ? '1px solid #EEF2FF' : '1px solid transparent',
                        borderLeft: n.unread ? '3.5px solid #4F46E5' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>{n.title}</div>
                      {n.unread && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4F46E5', marginTop: '4px' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>{n.desc}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '6px' }}>{n.time}</div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '4px 14px 4px 5px',
          borderRadius: '999px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.full_name || 'User'}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: role === 'STUDENT' ? '#EEF2FF' : role === 'T_AND_P' ? '#F5F3FF' : '#ECFDF5',
              color: role === 'STUDENT' ? '#4F46E5' : role === 'T_AND_P' ? '#7C3AED' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {getInitials(user?.full_name)}
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
              {user?.full_name || 'Subbu K'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              {currentRoleInfo.label} {currentRoleInfo.sub ? `• ${currentRoleInfo.sub}` : ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
