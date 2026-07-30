import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Divider, IconButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { httpClient } from '../app/httpClient';

interface NotificationItem {
  id: number;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshUnreadCount = useCallback(() => {
    httpClient
      .get<{ count: number }>('/api/notifications/unread-count')
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
    httpClient
      .get<NotificationItem[]>('/api/notifications')
      .then((res) => setNotifications(res.data.slice(0, 10)))
      .catch(() => setNotifications([]));
  }

  async function handleSelect(notification: NotificationItem) {
    setAnchorEl(null);
    if (!notification.read) {
      try {
        await httpClient.post(`/api/notifications/${notification.id}/read`);
        refreshUnreadCount();
      } catch {
        // ignore — non-critical
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {notifications.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        )}
        {notifications.map((n, index) => [
          index > 0 && <Divider key={`divider-${n.id}`} />,
          <MenuItem key={n.id} onClick={() => handleSelect(n)} sx={{ whiteSpace: 'normal', maxWidth: 360 }}>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 700 }}>
                  {n.message}
                </Typography>
              }
            />
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
