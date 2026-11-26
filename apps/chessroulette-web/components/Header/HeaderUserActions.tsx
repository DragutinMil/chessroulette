'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

// Vatrica, zvonce i profil kao u Web App headeru (Notifications.vue,
// MobileHeaderFixed.vue). Ovde su samo linkovi ka Web App-u: nema liste
// notifikacija ni streak modala. Svi podaci dolaze sa servera, nista se ne
// izmislja; dok ne stignu, ikonica se ne crta.
const WEB_APP = 'https://app.outpostchess.com';

// Isti filter kao isBellNotification u Web App-u: push-only podsetnici i
// challenge-i se ne broje u zvoncetu.
const BELL_EXCLUDED_TYPES = [
  'puzzle_ako_nisi_24h_usao',
  'puzzle_never_tried',
  'puzzle_ako_zadnja_24h_nisi_igrao',
  'challenge_after24h',
  'challenge_ako_zadnja_24h_nisi_igrao',
];

type Notification = { n_type?: string };

const isBellNotification = (n: Notification | null | undefined) =>
  !!n &&
  !!n.n_type &&
  !n.n_type.includes('challenge') &&
  !n.n_type.startsWith('obj_') &&
  !BELL_EXCLUDED_TYPES.includes(n.n_type);

type UserInfo = {
  user_uuid?: string;
  name_first?: string;
  name_last?: string;
  profile?: { file_url?: string };
};

const getJson = async (endpoint: string, token: string) => {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_WEB + endpoint, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const initials = (u: UserInfo) =>
  `${u.name_first?.trim().slice(0, 1) ?? ''}${
    u.name_last?.trim().slice(0, 1) ?? ''
  }`.toUpperCase() || 'G';

export const HeaderUserActions = () => {
  const [hasStreak, setHasStreak] = useState<boolean | null>(null);
  const [bellCount, setBellCount] = useState<number | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = Cookies.get('sessionToken');
    // Gost bez tokena: nema sta da se prikaze.
    if (!token) return;

    Promise.all([
      getJson('user_streak_play', token),
      getJson('user_streak_puzzle', token),
    ]).then(([play, puzzle]) => {
      if (!play && !puzzle) return;
      const days = (s: { consecutive_days?: string | number } | null) =>
        parseInt(String(s?.consecutive_days ?? '0'), 10) || 0;
      setHasStreak(days(play) > 0 || days(puzzle) > 0);
    });

    getJson('notifications', token).then((list) => {
      if (Array.isArray(list)) {
        setBellCount(list.filter(isBellNotification).length);
      }
    });

    getJson('current_user_info', token).then((u) => {
      if (u && typeof u === 'object' && !Array.isArray(u)) setUser(u);
    });
  }, []);

  return (
    <div className="flex items-center gap-5">
      {hasStreak !== null && (
        <a href={`${WEB_APP}/online-list`} title="Streak" className="flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              hasStreak
                ? '/header/streak-fire.webp'
                : '/header/streak-flame.svg'
            }
            alt="Streak"
            className="h-6 w-auto"
          />
        </a>
      )}

      {bellCount !== null && (
        <a
          href={`${WEB_APP}/notifications`}
          title="Notifications"
          className="relative flex"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/header/bell.svg"
            alt="Notifications"
            className="h-6 w-auto"
          />
          {bellCount > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DF488B] text-white text-[11px] font-extrabold flex items-center justify-center">
              {bellCount > 99 ? '99+' : bellCount}
            </span>
          )}
        </a>
      )}

      {user?.user_uuid && (
        <a
          href={`${WEB_APP}/publicprofile/${user.user_uuid}`}
          title="My profile"
          className="flex"
        >
          {user.profile?.file_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile.file_url}
              alt="My profile"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="h-9 w-9 rounded-full bg-[#64D771] text-[#001008] text-[14px] font-extrabold flex items-center justify-center">
              {initials(user)}
            </span>
          )}
        </a>
      )}
    </div>
  );
};
