import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';

interface NotificationItem {
  id: number;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function RecentNotificationsCard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    httpClient
      .get<NotificationItem[]>('/api/notifications')
      .then((res) => setNotifications(res.data.slice(0, 5)))
      .catch(() => setNotifications([]));
  }, []);

  async function handleSelect(notification: NotificationItem) {
    if (!notification.read) {
      httpClient.post(`/api/notifications/${notification.id}/read`).catch(() => undefined);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Notifications
        </Typography>

        {notifications === null && (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        )}

        {notifications?.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            You're all caught up — no notifications yet.
          </Typography>
        )}

        {notifications && notifications.length > 0 && (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                {index > 0 && <Divider component="li" />}
                <ListItemButton onClick={() => handleSelect(notification)} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 700 }}>
                        {notification.message}
                      </Typography>
                    }
                    secondary={new Date(notification.createdAt).toLocaleString()}
                  />
                </ListItemButton>
              </div>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
