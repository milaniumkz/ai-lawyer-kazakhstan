import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

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
            onChanged: (_) => _showAction(
                context, 'Согласие обязательно для RC-тестирования'),
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
            onPressed: () => _showAction(
                context, 'Ссылка восстановления будет отправлена в stub mode'),
            child: const Text('Восстановить доступ'),
          ),
          TextButton(
            onPressed: () => context.go('/register'),
            child: const Text('Зарегистрироваться'),
          ),
        ],
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  var consent = true;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Регистрация пользователя',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(decoration: InputDecoration(labelText: 'Ф.И.О.')),
          const SizedBox(height: 12),
          const TextField(
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: '+7 номер телефона'),
          ),
          const SizedBox(height: 12),
          const TextField(
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: 'E-mail'),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: consent,
            onChanged: (value) => setState(() => consent = value ?? false),
            title: const Text('Согласие с обработкой данных v1'),
          ),
          FilledButton.icon(
            onPressed: consent ? () => context.go('/otp') : null,
            icon: const Icon(Icons.person_add_alt_outlined),
            label: const Text('Создать аккаунт'),
          ),
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
            onPressed: () => context.go('/biometric'),
            icon: const Icon(Icons.verified_user_outlined),
            label: const Text('Подтвердить'),
          ),
          TextButton(
            onPressed: () =>
                _showAction(context, 'Код повторно отправлен: 111111'),
            child: const Text('Отправить код повторно'),
          ),
        ],
      ),
    );
  }
}

class BiometricScreen extends StatefulWidget {
  const BiometricScreen({super.key});

  @override
  State<BiometricScreen> createState() => _BiometricScreenState();
}

class _BiometricScreenState extends State<BiometricScreen> {
  var enabled = false;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Быстрый вход по биометрии',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.fingerprint, size: 96, color: AppColors.gold),
          const SizedBox(height: 16),
          Text(
            enabled
                ? 'Биометрия включена локально для тестирования'
                : 'Включите локальный secure flag для быстрого входа',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => setState(() => enabled = true),
            icon: const Icon(Icons.fingerprint),
            label: Text(enabled ? 'Включено' : 'Включить биометрию'),
          ),
          TextButton(
            onPressed: () => context.go('/profile'),
            child: const Text('Продолжить'),
          ),
        ],
      ),
    );
  }
}

void _showAction(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  var profileType = 'Физлицо';
  var biometricEnabled = false;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Профиль пользователя',
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ProfileTypeSelector(
            selected: profileType,
            onSelected: (value) => setState(() => profileType = value),
          ),
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
          const SizedBox(height: 10),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: biometricEnabled,
            onChanged: (value) => setState(() => biometricEnabled = value),
            title: const Text('Быстрый вход по биометрии'),
            subtitle: Text(biometricEnabled
                ? 'Локальный secure flag включен'
                : 'Можно включить после проверки устройства'),
          ),
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Подписка'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/subscription'),
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Настройки'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/settings'),
          ),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Помощь и поддержка'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/help'),
          ),
          const SizedBox(height: 16),
          const _SecurityNotice(),
        ],
      ),
    );
  }
}

class _ProfileTypeSelector extends StatelessWidget {
  const _ProfileTypeSelector(
      {required this.selected, required this.onSelected});

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const types = ['Физлицо', 'ИП', 'Юрлицо', 'Представитель'];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final type in types)
          ChoiceChip(
            label: Text(type),
            selected: selected == type,
            onSelected: (_) => onSelected(type),
          ),
      ],
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  var darkMode = false;
  var notifications = true;
  var piiMasking = true;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Настройки',
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      child: Column(
        children: [
          SwitchListTile(
            value: darkMode,
            onChanged: (value) => setState(() => darkMode = value),
            title: const Text('Темная тема'),
          ),
          SwitchListTile(
            value: notifications,
            onChanged: (value) => setState(() => notifications = value),
            title: const Text('Уведомления'),
          ),
          SwitchListTile(
            value: piiMasking,
            onChanged: (value) => setState(() => piiMasking = value),
            title: const Text('Скрывать ИИН/БИН в логах'),
          ),
          FilledButton.icon(
            onPressed: () => _showAction(context, 'Настройки сохранены'),
            icon: const Icon(Icons.save_outlined),
            label: const Text('Сохранить настройки'),
          ),
        ],
      ),
    );
  }
}

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  var requestCreated = false;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Помощь и поддержка',
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const ListTile(
            leading: Icon(Icons.support_agent_outlined),
            title: Text('Чат поддержки'),
            subtitle: Text('Ответ в local mode имитируется для тестирования'),
          ),
          const ListTile(
            leading: Icon(Icons.privacy_tip_outlined),
            title: Text('Безопасность данных'),
            subtitle: Text('PII маскируется, внешние провайдеры отключены'),
          ),
          FilledButton.icon(
            onPressed: () => setState(() => requestCreated = true),
            icon: const Icon(Icons.send_outlined),
            label: Text(
                requestCreated ? 'Обращение создано' : 'Написать в поддержку'),
          ),
        ],
      ),
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
  const AuthScaffold({
    required this.title,
    required this.child,
    this.bottomNavigationBar,
    super.key,
  });

  final String title;
  final Widget child;
  final Widget? bottomNavigationBar;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      bottomNavigationBar: bottomNavigationBar,
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
