# Manual E2E Matrix

## Auth + Admin

1. Login with admin credentials.
2. Open `/admin/posts`, `/admin/comments`, `/admin/newsletter`.
3. Confirm no unauthorized/API errors.

## Publish + Newsletter Trigger

1. Create a new post with `Send now` campaign enabled.
2. Publish the post.
3. Confirm success toast for post and campaign.
4. Open `/admin/newsletter` and confirm campaign in history.

## Scheduled Campaign

1. Open `/admin/newsletter`.
2. Compose campaign with `scheduleAt`.
3. Confirm campaign status appears as scheduled/queued.

## Subscribers

1. Subscribe from public homepage.
2. Confirm subscriber appears in `/admin/newsletter`.
3. Search by email and verify filtering.

## Comments + Reactions

1. Comment with signed-in user.
2. Verify comment appears in admin comments list.
3. Toggle each reaction type and verify counts.
