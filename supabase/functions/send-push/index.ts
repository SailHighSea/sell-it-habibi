// Supabase Edge Function (Deno): sends an Expo push notification when a row is added to `notifications`.
// Wire it up with a Database Webhook (Dashboard > Database > Webhooks): table `notifications`, event INSERT,
// type "Supabase Edge Functions", function `send-push`, and an HTTP header `x-webhook-secret: <PUSH_WEBHOOK_SECRET>`.
// Deploy: supabase functions deploy send-push --no-verify-jwt      (the webhook secret protects it instead of a user JWT)
// Secrets: supabase secrets set PUSH_WEBHOOK_SECRET=<random string>     (optional: EXPO_ACCESS_TOKEN)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Short bilingual lines: we don't store each person's language yet.
const TEXT: Record<string, string> = {
  message: 'New message · رسالة جديدة',
  offer: 'New offer · عرض جديد',
  meetup: 'Meet-up proposed · اقتراح لقاء',
  offer_accepted: 'Your offer was accepted · تم قبول عرضك',
  offer_declined: 'Your offer was declined · تم رفض عرضك',
};

type Notification = { id: string; user_id: string; kind: string; thread_id: string | null; actor_id: string | null; body: string | null };

Deno.serve(async (req) => {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('unauthorized', { status: 401 });

  let payload: { type?: string; record?: Notification };
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  if (payload.type !== 'INSERT' || !payload.record) return new Response('ignored');
  const n = payload.record;

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const [{ data: tokens }, { data: actor }] = await Promise.all([
    db.from('push_tokens').select('token').eq('user_id', n.user_id),
    n.actor_id ? db.from('profiles').select('display_name').eq('id', n.actor_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!tokens?.length) return new Response('no tokens');

  const messages = tokens.map(({ token }) => ({
    to: token,
    title: actor?.display_name ?? 'Sell It Habibi',
    body: n.body ?? TEXT[n.kind] ?? TEXT.message,
    data: { threadId: n.thread_id, notificationId: n.id },
    sound: 'default',
    channelId: 'default',
  }));

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(EXPO_PUSH_URL, { method: 'POST', headers, body: JSON.stringify(messages) });
  if (!res.ok) {
    console.error('expo push failed', res.status);
    return new Response('push failed', { status: 502 });
  }

  // Forget phones that no longer exist (app uninstalled, permission removed).
  const { data: tickets } = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
  const dead = (tickets ?? []).flatMap((t, i) => (t.status === 'error' && t.details?.error === 'DeviceNotRegistered' ? [messages[i].to] : []));
  if (dead.length) await db.from('push_tokens').delete().in('token', dead);

  return new Response('sent');
});
