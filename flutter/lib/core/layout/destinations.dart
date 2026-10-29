import 'package:flutter/material.dart';

class Destination {
  const Destination(this.label, this.icon, this.iconActive, this.path);

  final String label;
  final IconData icon;
  final IconData iconActive;
  final String path;
}

/// The five main tabs, in shell-branch order. Selling is a separate button, not a tab.
const destinations = [
  Destination('Home', Icons.home_outlined, Icons.home, '/'),
  Destination('Search', Icons.search, Icons.search, '/search'),
  Destination('Chats', Icons.chat_bubble_outline, Icons.chat_bubble, '/chats'),
  Destination(
    'Updates',
    Icons.notifications_outlined,
    Icons.notifications,
    '/updates',
  ),
  Destination('Me', Icons.person_outline, Icons.person, '/profile'),
];
