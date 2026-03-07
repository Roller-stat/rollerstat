'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CommentItem {
  id: string;
  postId: string;
  postLocalizationId: string;
  userId: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    image?: string | null;
    email?: string | null;
  };
}

interface PostCommentsProps {
  postId: string;
  postLocalizationId?: string;
}

export function PostComments({ postId, postLocalizationId }: PostCommentsProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUserId = session?.user?.id || '';

  const visibleComments = useMemo(
    () => comments.filter((comment) => comment.status === 'visible'),
    [comments],
  );

  const fetchComments = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('postId', postId);
    if (postLocalizationId) {
      params.set('postLocalizationId', postLocalizationId);
    }
    const response = await fetch(`/api/comments?${params.toString()}`);
    const data = await response.json();
    setComments(Array.isArray(data.comments) ? data.comments : []);
  }, [postId, postLocalizationId]);

  useEffect(() => {
    fetchComments().catch(() => {
      setComments([]);
    });
  }, [fetchComments]);

  async function submitComment() {
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          postLocalizationId,
          body: newComment,
        }),
      });

      if (!response.ok) {
        return;
      }

      setNewComment('');
      await fetchComments();
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(commentId: string) {
    if (!editingBody.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: editingBody }),
      });

      if (!response.ok) {
        return;
      }

      setEditingId(null);
      setEditingBody('');
      await fetchComments();
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(commentId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return;
      }

      await fetchComments();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({visibleComments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'authenticated' ? (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Write your comment"
              className="min-h-24"
            />
            <Button onClick={submitComment} disabled={loading || !newComment.trim()}>
              Post Comment
            </Button>
          </div>
        ) : (
          <div className="rounded-md border p-4 bg-muted/40">
            <p className="text-sm mb-2">Sign in with Google to comment.</p>
            <Button variant="outline" onClick={() => signIn('google')}>Sign in with Google</Button>
          </div>
        )}

        <div className="space-y-3">
          {visibleComments.map((comment) => {
            const isOwner = currentUserId === comment.userId;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{comment.user.name}</span>
                    {' · '}
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingBody(comment.body);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                      placeholder="Edit your comment"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveEdit(comment.id)} disabled={loading || !editingBody.trim()}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingBody('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                )}
              </div>
            );
          })}

          {visibleComments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
