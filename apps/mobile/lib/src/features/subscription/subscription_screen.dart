import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Подписка')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Лимиты и расходы',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Текущий план: Free'),
                    SizedBox(height: 8),
                    LinearProgressIndicator(value: 0),
                    SizedBox(height: 8),
                    Text('AI расходы считаются без персональных данных.'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: null,
              icon: const Icon(Icons.payment_outlined),
              label: const Text('Управление оплатой недоступно в stub mode'),
            ),
          ],
        ),
      ),
    );
  }
}
