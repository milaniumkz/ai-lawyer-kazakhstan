import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({required this.selectedIndex, super.key});

  final int selectedIndex;

  static const _routes = [
    '/',
    '/cases',
    '/documents',
    '/deadlines',
    '/profile'
  ];

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) => context.go(_routes[index]),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined, key: ValueKey('nav-home')),
          selectedIcon: Icon(Icons.home, key: ValueKey('nav-home')),
          label: 'Главная',
        ),
        NavigationDestination(
          icon:
              Icon(Icons.business_center_outlined, key: ValueKey('nav-cases')),
          selectedIcon: Icon(Icons.business_center, key: ValueKey('nav-cases')),
          label: 'Дела',
        ),
        NavigationDestination(
          icon: Icon(Icons.folder_outlined, key: ValueKey('nav-documents')),
          selectedIcon: Icon(Icons.folder, key: ValueKey('nav-documents')),
          label: 'Документы',
        ),
        NavigationDestination(
          icon: Icon(Icons.calendar_month_outlined,
              key: ValueKey('nav-deadlines')),
          selectedIcon:
              Icon(Icons.calendar_month, key: ValueKey('nav-deadlines')),
          label: 'Сроки',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline, key: ValueKey('nav-profile')),
          selectedIcon: Icon(Icons.person, key: ValueKey('nav-profile')),
          label: 'Профиль',
        ),
      ],
    );
  }
}
