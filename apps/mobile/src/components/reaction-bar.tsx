import { Pressable, StyleSheet, Text, View } from 'react-native';
import { REACTION_OPTIONS } from '../lib/constants';
import { ReactionCounts, ReactionType } from '../types/content';

type Props = {
  counts: ReactionCounts;
  selectedReactionType: ReactionType | null;
  disabled?: boolean;
  onPress: (reactionType: ReactionType) => void;
};

export function ReactionBar({ counts, selectedReactionType, disabled = false, onPress }: Props) {
  return (
    <View style={styles.row}>
      {REACTION_OPTIONS.map((option) => {
        const isActive = selectedReactionType === option.type;
        const count = counts[option.type] || 0;

        return (
          <Pressable
            key={option.type}
            onPress={() => onPress(option.type)}
            disabled={disabled}
            style={[styles.btn, isActive ? styles.btnActive : null, disabled ? styles.btnDisabled : null]}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.count, isActive ? styles.countActive : null]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  btnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 16,
  },
  count: {
    fontSize: 12,
    color: '#111827',
  },
  countActive: {
    color: '#fff',
  },
});
