import type { ReactNode } from 'react';
import { Avatar, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';

interface StatCardProps {
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  label: string;
  value: number | string;
  caption?: string;
  onClick?: () => void;
}

export function StatCard({ icon, color, label, value, caption, onClick }: StatCardProps) {
  const body = (
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>{icon}</Avatar>
        <Stack spacing={0}>
          <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Stack>
      </Stack>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {caption}
        </Typography>
      )}
    </CardContent>
  );

  if (!onClick) {
    return <Card sx={{ height: '100%' }}>{body}</Card>;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        {body}
      </CardActionArea>
    </Card>
  );
}
