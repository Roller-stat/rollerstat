'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PostReactionsProps {
  postId: string;
  postLocalizationId?: string;
}

const REACTION_OPTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'applaud', emoji: '👏' },
  { type: 'love', emoji: '❤️' },
  { type: 'dislike', emoji: '👎' },
] as const;

type ReactionType = (typeof REACTION_OPTIONS)[number]['type'];

type ReactionCounts = Record<ReactionType, number>;

const EMPTY_COUNTS: ReactionCounts = {
  like: 0,
  applaud: 0,
  love: 0,
  dislike: 0,
};

export function PostReactions({ postId, postLocalizationId }: PostReactionsProps) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(null);
  const [loadingReactionType, setLoadingReactionType] = useState<ReactionType | null>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const params = new URLSearchParams();
      params.set('postId', postId);
      if (postLocalizationId) {
        params.set('postLocalizationId', postLocalizationId);
      }
      const response = await fetch(`/api/reactions?${params.toString()}`);
      const data = await response.json();

      if (!active) return;
      setCounts({
        ...EMPTY_COUNTS,
        ...(data.counts || {}),
      });
      setSelectedReactionType((data.selectedReactionType as ReactionType | null) || null);
      setDisabled(Boolean(data.disabled));
    }

    load().catch(() => {
      setCounts(EMPTY_COUNTS);
      setSelectedReactionType(null);
    });

    return () => {
      active = false;
    };
  }, [postId, postLocalizationId]);

  async function toggleReaction(reactionType: ReactionType) {
    try {
      setLoadingReactionType(reactionType);
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, postLocalizationId, reactionType }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setCounts({
        ...EMPTY_COUNTS,
        ...(data.counts || {}),
      });
      setSelectedReactionType((data.selectedReactionType as ReactionType | null) || null);
    } finally {
      setLoadingReactionType(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTION_OPTIONS.map((option) => {
        const isActive = selectedReactionType === option.type;
        const count = counts[option.type] || 0;

        return (
          <Button
            key={option.type}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleReaction(option.type)}
            disabled={disabled || loadingReactionType !== null}
            aria-label={option.type}
            className="min-w-12 px-2"
          >
            <span className="text-base leading-none">{option.emoji}</span>
            {count > 0 && <span className="ml-1 text-xs">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
