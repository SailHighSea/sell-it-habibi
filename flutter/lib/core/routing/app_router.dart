import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/ui/home_screen.dart';
import '../../features/settings/appearance_screen.dart';
import '../../features/settings/profile_screen.dart';
import '../layout/adaptive_shell.dart';
import '../widgets/placeholder_page.dart';

GoRouter buildRouter() => GoRouter(
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => AdaptiveShell(navigationShell: shell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => HomeScreen(
                onOpenSearch: () => context.go('/search'),
                onOpenProfile: () => context.go('/profile'),
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/search',
              builder: (_, _) => const PlaceholderPage(
                title: 'Search',
                icon: Icons.search,
                phase: 'phase F3',
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/chats',
              builder: (_, _) => const PlaceholderPage(
                title: 'Chats',
                icon: Icons.chat_bubble_outline,
                phase: 'phase F5',
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/updates',
              builder: (_, _) => const PlaceholderPage(
                title: 'Updates',
                icon: Icons.notifications_outlined,
                phase: 'phase F5',
              ),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/sell',
      builder: (_, _) => Scaffold(
        appBar: AppBar(title: const Text('Sell')),
        body: const PlaceholderPage(
          title: 'Sell something',
          icon: Icons.add_circle_outline,
          phase: 'phase F4',
        ),
      ),
    ),
    GoRoute(
      path: '/settings/appearance',
      builder: (_, _) => const AppearanceScreen(),
    ),
  ],
);
