'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { getActivityLogs } from '@/actions/activity';
import UserAvatar from '../shared/UserAvatar';

type ActivityLog = {
  id: string;
  action: string;
  createdAt: Date;
  user: { name: string | null; email: string };
};

interface ActivityFeedProps {
  taskId: string;
}

export default function ActivityFeed({ taskId }: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getActivityLogs(taskId).then((data) => {
      setLogs(data.logs as ActivityLog[]);
      setLoading(false);
    });
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <UserAvatar name={activity.user.name} />
          <div className="flex-1 text-sm">
            <p>
              <span className="font-semibold">{activity.user.name}</span>{' '}
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
