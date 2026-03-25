import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  createComment,
  deleteComment,
  getComments,
  getPostDetail,
  getReactions,
  toggleReaction,
  updateComment,
} from '../../../src/lib/api';
import { ReactionBar } from '../../../src/components/reaction-bar';
import { useLocale } from '../../../src/context/locale-context';
import { useAuth } from '../../../src/context/auth-context';
import { APP_LOCALES } from '../../../src/lib/constants';
import { AppLocale, MobileComment, MobilePostDetail, ReactionCounts, ReactionType } from '../../../src/types/content';
import { captureError } from '../../../src/lib/telemetry';

const EMPTY_COUNTS: ReactionCounts = {
  like: 0,
  applaud: 0,
  love: 0,
  dislike: 0,
};

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

function toLocaleValue(value: string | string[] | undefined, fallback: AppLocale): AppLocale {
  if (typeof value === 'string' && APP_LOCALES.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  return fallback;
}

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ type?: string; slug?: string; locale?: string }>();
  const { locale: currentLocale } = useLocale();
  const { token, user } = useAuth();

  const type = params.type === 'blog' ? 'blog' : 'news';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const locale = toLocaleValue(params.locale, currentLocale);

  const [post, setPost] = useState<MobilePostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionDisabled, setReactionDisabled] = useState(false);

  const [comments, setComments] = useState<MobileComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);

  const currentUserId = user?.id || '';

  const visibleComments = useMemo(
    () => comments.filter((item) => item.status === 'visible'),
    [comments],
  );

  const loadReactions = useCallback(async (nextPost: MobilePostDetail) => {
    try {
      const payload = await getReactions({
        postId: nextPost.postId,
        postLocalizationId: nextPost.id,
        token,
      });
      setCounts({
        ...EMPTY_COUNTS,
        ...(payload.counts || {}),
      });
      setSelectedReactionType(payload.selectedReactionType || null);
      setReactionDisabled(Boolean(payload.disabled));
    } catch (err) {
      captureError(err);
      setCounts(EMPTY_COUNTS);
      setSelectedReactionType(null);
      setReactionDisabled(false);
    }
  }, [token]);

  const loadComments = useCallback(
    async (nextPost: MobilePostDetail, targetPage = 1, append = false) => {
      try {
        const payload = await getComments({
          postId: nextPost.postId,
          postLocalizationId: nextPost.id,
          page: targetPage,
          pageSize: 20,
        });

        const nextComments = Array.isArray(payload.comments) ? payload.comments : [];
        setComments((current) => (append ? [...current, ...nextComments] : nextComments));
        setCommentPage(payload.page || targetPage);
        setCommentTotalPages(payload.totalPages || 1);
        setCommentTotal(payload.total || nextComments.length);
      } catch (err) {
        captureError(err);
        if (!append) {
          setComments([]);
          setCommentPage(1);
          setCommentTotalPages(1);
          setCommentTotal(0);
        }
      }
    },
    [],
  );

  const loadPost = useCallback(async () => {
    if (!slug) {
      setError('Missing post slug.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const payload = await getPostDetail({
        locale,
        type,
        slug,
      });
      setPost(payload);
      setError(null);

      await Promise.all([
        loadReactions(payload),
        loadComments(payload, 1, false),
      ]);
    } catch (err) {
      captureError(err);
      setPost(null);
      setError('Unable to load this article right now.');
    } finally {
      setLoading(false);
    }
  }, [loadComments, loadReactions, locale, slug, type]);

  useEffect(() => {
    loadPost().catch(() => undefined);
  }, [loadPost]);

  async function onToggleReaction(reactionType: ReactionType) {
    if (!post) {
      return;
    }

    try {
      setReactionLoading(true);
      const payload = await toggleReaction({
        postId: post.postId,
        postLocalizationId: post.id,
        reactionType,
        token,
      });
      setCounts({
        ...EMPTY_COUNTS,
        ...(payload.counts || {}),
      });
      setSelectedReactionType(payload.selectedReactionType || null);
    } catch (err) {
      captureError(err);
    } finally {
      setReactionLoading(false);
    }
  }

  async function onSubmitComment() {
    if (!post) {
      return;
    }
    if (!token) {
      Alert.alert('Sign in required', 'Use Settings to sign in with Google before commenting.');
      return;
    }
    if (!newComment.trim()) {
      return;
    }

    try {
      setCommentLoading(true);
      await createComment({
        token,
        postId: post.postId,
        postLocalizationId: post.id,
        body: newComment.trim(),
      });
      setNewComment('');
      await loadComments(post, 1, false);
    } catch (err) {
      captureError(err);
      Alert.alert('Unable to post comment', 'Please try again.');
    } finally {
      setCommentLoading(false);
    }
  }

  async function onSaveEdit(commentId: string) {
    if (!token || !editingBody.trim() || !post) {
      return;
    }

    try {
      setCommentLoading(true);
      await updateComment({
        token,
        commentId,
        body: editingBody.trim(),
      });
      setEditingId(null);
      setEditingBody('');
      await loadComments(post, 1, false);
    } catch (err) {
      captureError(err);
      Alert.alert('Unable to update comment', 'Please try again.');
    } finally {
      setCommentLoading(false);
    }
  }

  async function onDeleteComment(commentId: string) {
    if (!token || !post) {
      return;
    }

    Alert.alert('Delete comment?', 'This will mark your comment as deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setCommentLoading(true);
            await deleteComment({ token, commentId });
            await loadComments(post, 1, false);
          } catch (err) {
            captureError(err);
            Alert.alert('Unable to delete comment', 'Please try again.');
          } finally {
            setCommentLoading(false);
          }
        },
      },
    ]);
  }

  async function onLoadMoreComments() {
    if (!post || commentPage >= commentTotalPages) {
      return;
    }

    await loadComments(post, commentPage + 1, true);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Post not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerWrap}>
        <Text style={styles.typeBadge}>{post.contentType.toUpperCase()}</Text>
        <Text style={styles.dateText}>{formatDate(post.date)}</Text>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.summary}>{post.summary}</Text>
      <Text style={styles.byline}>{post.author} • {post.readingTime} min read</Text>

      {post.coverImage ? <Image source={{ uri: post.coverImage }} style={styles.image} /> : null}

      <Text style={styles.body}>{post.body}</Text>

      {post.interactionsEnabled ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reactions</Text>
          <ReactionBar
            counts={counts}
            selectedReactionType={selectedReactionType}
            disabled={reactionDisabled || reactionLoading}
            onPress={onToggleReaction}
          />
        </View>
      ) : null}

      {post.interactionsEnabled ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments ({commentTotal})</Text>

          {token ? (
            <View style={styles.commentComposer}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                editable={!commentLoading}
                multiline
                placeholder="Write your comment"
                style={styles.commentInput}
              />
              <Pressable
                style={[styles.primaryBtn, (!newComment.trim() || commentLoading) ? styles.disabledBtn : null]}
                disabled={!newComment.trim() || commentLoading}
                onPress={onSubmitComment}
              >
                <Text style={styles.primaryBtnText}>{commentLoading ? 'Posting...' : 'Post Comment'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.signInHint}>
              <Text style={styles.signInHintText}>Sign in with Google from Settings to post comments.</Text>
            </View>
          )}

          <View style={styles.commentList}>
            {visibleComments.map((comment) => {
              const isOwner = currentUserId === comment.userId;
              const isEditing = editingId === comment.id;

              return (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentMetaRow}>
                    <Text style={styles.commentMeta}>
                      {comment.user.name} • {formatDate(comment.createdAt)}
                    </Text>

                    {isOwner && !isEditing ? (
                      <View style={styles.commentActions}>
                        <Pressable
                          onPress={() => {
                            setEditingId(comment.id);
                            setEditingBody(comment.body);
                          }}
                        >
                          <Text style={styles.commentActionText}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => onDeleteComment(comment.id)}>
                          <Text style={[styles.commentActionText, styles.commentDeleteText]}>Delete</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>

                  {isEditing ? (
                    <View style={styles.editWrap}>
                      <TextInput
                        value={editingBody}
                        onChangeText={setEditingBody}
                        multiline
                        style={styles.editInput}
                      />
                      <View style={styles.editActions}>
                        <Pressable
                          style={[styles.primaryBtnSmall, (!editingBody.trim() || commentLoading) ? styles.disabledBtn : null]}
                          disabled={!editingBody.trim() || commentLoading}
                          onPress={() => onSaveEdit(comment.id)}
                        >
                          <Text style={styles.primaryBtnText}>Save</Text>
                        </Pressable>
                        <Pressable
                          style={styles.outlineBtnSmall}
                          onPress={() => {
                            setEditingId(null);
                            setEditingBody('');
                          }}
                        >
                          <Text style={styles.outlineBtnText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.commentBody}>{comment.body}</Text>
                  )}
                </View>
              );
            })}

            {visibleComments.length === 0 ? (
              <Text style={styles.emptyComments}>No comments yet.</Text>
            ) : null}

            {commentPage < commentTotalPages ? (
              <Pressable style={styles.outlineBtn} onPress={onLoadMoreComments}>
                <Text style={styles.outlineBtnText}>Load more comments</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#111827',
    color: '#fff',
    fontSize: 10,
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    color: '#64748b',
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  summary: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
  },
  byline: {
    color: '#64748b',
    fontSize: 13,
  },
  image: {
    width: '100%',
    height: 220,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  body: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 26,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
  },
  section: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentComposer: {
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    minHeight: 90,
    padding: 10,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnSmall: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  signInHint: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  signInHintText: {
    color: '#334155',
  },
  commentList: {
    gap: 10,
  },
  commentItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  commentActionText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  commentDeleteText: {
    color: '#b91c1c',
  },
  commentBody: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
  },
  editWrap: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 70,
    padding: 10,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnSmall: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  emptyComments: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
