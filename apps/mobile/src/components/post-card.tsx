import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MobilePostSummary } from '../types/content';

type Props = {
  post: MobilePostSummary;
  onPress: () => void;
};

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

export function PostCard({ post, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {post.coverImage ? <Image source={{ uri: post.coverImage }} style={styles.image} /> : null}

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.badge}>{post.contentType.toUpperCase()}</Text>
          <Text style={styles.metaText}>{formatDate(post.date)}</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.summary}>{post.summary}</Text>

        <Text style={styles.footer}>{post.author} • {post.readingTime} min read</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 190,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: 10,
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  summary: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    color: '#64748b',
    fontSize: 12,
  },
});
