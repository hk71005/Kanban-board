'use client';

import { useEffect, useState, useTransition } from 'react';
import { RefreshCw, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { BoardRole } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { BoardWithDetails } from '@/types';
import {
  getPendingInvites,
  inviteMember,
  removeMember,
  resendInvite,
  revokeInvite,
  updateMemberRole,
} from '@/actions/member';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UserAvatar from '@/components/shared/UserAvatar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import MemberAvatars from '@/components/layout/MemberAvatars';

interface MemberManagementDialogProps {
  board: BoardWithDetails;
  currentUserId: string;
}

type PendingInvite = {
  id: string;
  email: string;
  role: BoardRole;
  createdAt: Date | string;
  expiresAt: Date | string;
};

export default function MemberManagementDialog({ board, currentUserId }: MemberManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const router = useRouter();

  const isOwner = board.user.id === currentUserId;

  const fetchInvites = async () => {
    if (!isOwner) return;
    try {
      const data = await getPendingInvites(board.id);
      setPendingInvites(data);
    } catch {
      // Silently fail — invites section stays empty
    }
  };

  useEffect(() => {
    if (open && isOwner) {
      fetchInvites();
    }
    if (!open) {
      setPendingInvites([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteEmail('');
    startTransition(() => {
      inviteMember(board.id, { email }).then((data) => {
        if (data.error) toast.error(data.error);
        else {
          toast.success(data.success ?? 'Invite sent!');
          router.refresh();
          fetchInvites();
        }
      });
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(() => {
      removeMember(board.id, userId).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success(data.success ?? 'Member removed'); router.refresh(); }
      });
    });
  };

  const handleRoleChange = (userId: string, role: BoardRole) => {
    startTransition(() => {
      updateMemberRole(board.id, userId, role).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success(data.success ?? 'Role updated'); router.refresh(); }
      });
    });
  };

  const handleRevoke = (inviteId: string) => {
    startTransition(() => {
      revokeInvite(inviteId, board.id).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success(data.success ?? 'Invite revoked'); fetchInvites(); }
      });
    });
  };

  const handleResend = (inviteId: string) => {
    startTransition(() => {
      resendInvite(inviteId, board.id).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success(data.success ?? 'Invite resent'); fetchInvites(); }
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2" aria-label="Manage members">
          <MemberAvatars members={board.members} />
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium hidden sm:inline">Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Board Members</DialogTitle>
          <p className="text-sm text-muted-foreground pt-0.5">
            Invite collaborators who need to edit tasks. To give a client read-only access, use Share instead.
          </p>
        </DialogHeader>
        <div className="pt-2 space-y-1">
          {/* Board owner row */}
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3">
              <UserAvatar name={board.user.name} />
              <p className="text-sm font-medium">{board.user.name || 'Owner'}</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
              Owner
            </span>
          </div>

          {/* Member rows — owner is already shown above, exclude them here */}
          {board.members.filter((m) => m.user.id !== board.user.id).map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 py-2 border-t border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={member.user.name} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isOwner ? (
                  <Select
                    value={member.role ?? 'EDITOR'}
                    onValueChange={(v) => handleRoleChange(member.user.id, v as BoardRole)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-7 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {member.role ?? 'Editor'}
                  </span>
                )}
                {isOwner && (
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isPending}
                        aria-label={`Remove ${member.user.name || member.user.email}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    }
                    title="Remove member?"
                    description={`Remove ${member.user.name || member.user.email} from this board? They will lose access immediately.`}
                    confirmText="Remove"
                    onConfirm={() => handleRemove(member.user.id)}
                  />
                )}
              </div>
            </div>
          ))}

          {/* No members yet (excluding owner who is shown above) */}
          {board.members.filter((m) => m.user.id !== board.user.id).length === 0 && (
            <p className="text-sm text-muted-foreground py-2 border-t border-border">
              No other members yet.
            </p>
          )}

          {/* Pending invites — owner only */}
          {isOwner && pendingInvites.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Pending Invites
              </p>
              <div className="space-y-1">
                {pendingInvites.map((invite) => {
                  const expiresAt = new Date(invite.expiresAt);
                  const expired = expiresAt < new Date();
                  const expiryText = formatDistanceToNow(expiresAt, { addSuffix: true });

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-2 py-2 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {invite.role === 'VIEWER' ? 'Viewer' : 'Editor'}
                          {' · '}
                          <span className={expired ? 'text-destructive' : ''}>
                            {expired ? `Expired ${expiryText}` : `Expires ${expiryText}`}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          disabled={isPending}
                          onClick={() => handleResend(invite.id)}
                          aria-label={`Resend invite to ${invite.email}`}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => handleRevoke(invite.id)}
                          aria-label={`Revoke invite for ${invite.email}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invite section — owner only */}
          {isOwner && (
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-sm font-medium">Invite by email</p>
              <div className="flex gap-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  type="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={isPending}
                />
                <Button
                  onClick={handleInvite}
                  disabled={isPending || !inviteEmail.trim()}
                >
                  Invite
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
