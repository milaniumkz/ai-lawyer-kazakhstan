import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool usePhone = true;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Вход и регистрация',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Телефон')),
              ButtonSegment(value: false, label: Text('E-mail')),
            ],
            selected: {usePhone},
            onSelectionChanged: (value) =>
                setState(() => usePhone = value.first),
          ),
          const SizedBox(height: 16),
          TextField(
            keyboardType:
                usePhone ? TextInputType.phone : TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: usePhone ? '+7 номер телефона' : 'E-mail',
              prefixIcon:
                  Icon(usePhone ? Icons.phone_outlined : Icons.mail_outline),
            ),
          ),
          const SizedBox(height: 12),
          const TextField(
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Пароль или PIN',
              prefixIcon: Icon(Icons.lock_outline),
            ),
          ),
          const SizedBox(height: 12),
          CheckboxListTile(
            value: true,
            onChanged: (_) {},
            contentPadding: EdgeInsets.zero,
            title: const Text('Согласие с политикой обработки данных v1'),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/otp'),
            icon: const Icon(Icons.sms_outlined),
            label: const Text('Получить код'),
          ),
          TextButton(
              onPressed: () {}, child: const Text('Восстановить доступ')),
        ],
      ),
    );
  }
}

class OtpScreen extends StatelessWidget {
  const OtpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Подтверждение SMS',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: 'Код из SMS',
              prefixIcon: Icon(Icons.password_outlined),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => context.go('/profile'),
            icon: const Icon(Icons.verified_user_outlined),
            label: const Text('Подтвердить'),
          ),
          TextButton(
              onPressed: () {}, child: const Text('Отправить код повторно')),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Профиль пользователя',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _ProfileTypeSelector(),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Ф.И.О. / название',
              prefixIcon: Icon(Icons.badge_outlined),
            ),
          ),
          const SizedBox(height: 12),
          const TextField(
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'ИИН/БИН',
              prefixIcon: Icon(Icons.pin_outlined),
            ),
          ),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Адрес в РК',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.save_outlined),
            label: const Text('Сохранить профиль'),
          ),
          const SizedBox(height: 16),
          const _SecurityNotice(),
        ],
      ),
    );
  }
}

class _ProfileTypeSelector extends StatelessWidget {
  const _ProfileTypeSelector();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: const [
        ChoiceChip(label: Text('Физлицо'), selected: true),
        ChoiceChip(label: Text('ИП'), selected: false),
        ChoiceChip(label: Text('Юрлицо'), selected: false),
        ChoiceChip(label: Text('Представитель'), selected: false),
      ],
    );
  }
}

class _SecurityNotice extends StatelessWidget {
  const _SecurityNotice();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.privacy_tip_outlined, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'AI может ошибаться. Юридически значимые действия требуют проверки и подтверждения.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({required this.title, required this.child, super.key});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              title,
              style: theme.textTheme.headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 8),
            Text(
              'Локальный stub mode до подключения официальных провайдеров.',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}
