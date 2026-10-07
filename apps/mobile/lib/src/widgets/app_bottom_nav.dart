import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'aizan_design.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({required this.selectedIndex, super.key});
  // Keep the original route indices for existing callers. Documents moved to
  // the fourth tab; the central camera action opens document intake.
  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    final active = selectedIndex == 2
        ? 3
        : selectedIndex == 3
            ? -1
            : selectedIndex;
    return DecoratedBox(
      decoration: const BoxDecoration(
          color: Color(0xEE170B02),
          border: Border(top: BorderSide(color: Color(0xFFD6AC58)))),
      child: SafeArea(
        top: false,
        child: Center(
          heightFactor: 1,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SizedBox(
              height:
                  MediaQuery.textScalerOf(context).scale(10) > 10 ? 120 : 92,
              child: Row(children: [
                _destination(context, 0, active, '/', 'Главная',
                    Icons.home_outlined, 'nav-home'),
                _destination(context, 1, active, '/cases', 'Мои дела',
                    Icons.folder_outlined, 'nav-cases'),
                Expanded(
                    child: Semantics(
                        button: true,
                        label: 'Камера',
                        child: InkWell(
                          key: const ValueKey('nav-camera'),
                          onTap: () =>
                              context.go('/documents/add?source=camera'),
                          child: Column(children: [
                            Transform.translate(
                                offset: const Offset(0, -13),
                                child: Container(
                                  width: 57,
                                  height: 57,
                                  decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: AizanDesign.goldGradient,
                                      border: Border.all(
                                          color: const Color(0xFFFFE29A)),
                                      boxShadow: const [
                                        BoxShadow(
                                            color: Color(0x66F9B137),
                                            blurRadius: 12)
                                      ]),
                                  child: const Icon(Icons.camera_alt,
                                      color: Color(0xFF130A02), size: 29),
                                )),
                            const Text('Камера',
                                style: TextStyle(
                                    fontSize: 10, color: Colors.white)),
                          ]),
                        ))),
                _destination(context, 3, active, '/documents', 'Документы',
                    Icons.description_outlined, 'nav-documents'),
                _destination(context, 4, active, '/profile', 'Профиль',
                    Icons.person_outline, 'nav-profile'),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _destination(BuildContext context, int index, int active, String route,
      String label, IconData icon, String key) {
    final selected = index == active;
    final color = selected ? AizanDesign.gold : Colors.white;
    return Expanded(
        child: Semantics(
            selected: selected,
            button: true,
            label: label,
            child: InkWell(
              key: ValueKey(key),
              onTap: () => context.go(route),
              child: Padding(
                  padding: const EdgeInsets.only(top: 15),
                  child: Column(children: [
                    Icon(icon, color: color, size: 27),
                    const SizedBox(height: 6),
                    Text(label,
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 10, color: color)),
                    const SizedBox(height: 7),
                    if (selected)
                      Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                              shape: BoxShape.circle, color: AizanDesign.gold)),
                  ])),
            )));
  }
}
