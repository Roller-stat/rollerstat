import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { listPosts } from '../lib/api';
import { useLocale } from '../context/locale-context';
import { MobilePostSummary } from '../types/content';
import { PostCard } from './post-card';
import { captureError } from '../lib/telemetry';

type Props = {
  type: 'all' | 'news' | 'blog';
  title: string;
  subtitle?: string;
};

export function PostFeedScreen({ type, title, subtitle }: Props) {
  const router = useRouter();
  const { locale, ready } = useLocale();

  const [items, setItems] = useState<MobilePostSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      if (!ready) {
        return;
      }

      try {
        if (append) {
          setLoadingMore(true);
        } else if (nextPage === 1) {
          setLoading(true);
        }

        const payload = await listPosts({
          locale,
          type,
          page: nextPage,
          pageSize: type === 'all' ? 10 : 12,
        });

        setItems((current) => (append ? [...current, ...payload.items] : payload.items));
        setPage(payload.page);
        setTotalPages(payload.totalPages);
        setError(null);
      } catch (err) {
        captureError(err);
        setError('Unable to load content right now.');
        if (!append) {
          setItems([]);
          setPage(1);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [locale, ready, type],
  );

  useEffect(() => {
    load(1, false).catch(() => undefined);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, false).catch(() => undefined);
  }, [load]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) {
      return;
    }
    load(page + 1, true).catch(() => undefined);
  }, [load, loadingMore, page, totalPages]);

  const renderFooter = () => {
    if (page >= totalPages || items.length === 0) {
      return <View style={styles.footerSpace} />;
    }

    return (
      <Pressable style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore}>
        <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : 'Load more'}</Text>
      </Pressable>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.contentType}-${item.id}`}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No posts available.</Text>
        </View>
      }
      ListFooterComponent={renderFooter}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => {
            router.push({
              pathname: '/post/[type]/[slug]',
              params: {
                type: item.contentType,
                slug: item.slug,
                locale,
              },
            });
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 32,
    backgroundColor: '#f8fafc',
  },
  headerWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  error: {
    marginTop: 8,
    color: '#b91c1c',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
  loadMoreBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  loadMoreText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  footerSpace: {
    height: 18,
  },
});
