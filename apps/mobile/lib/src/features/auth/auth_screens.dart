import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.authApi});

  final AuthApiPort? authApi;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final AuthApiPort authApi;
  late final TextEditingController loginController;
  late final TextEditingController passwordController;
  bool usePhone = true;
  var isBusy = false;
  var status = 'Введите телефон или e-mail';

  @override
  void initState() {
    super.initState();
    authApi = widget.authApi ?? HttpAuthApi();
    loginController = TextEditingController(text: '+77010000001');
    passwordController = TextEditingController();
  }

  @override
  void dispose() {
    loginController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> requestOtp() async {
    if (isBusy) return;
    setState(() {
      isBusy = true;
      status = 'Запрашиваю OTP через API...';
    });
    try {
      final result = await authApi.register(
        channel: usePhone ? 'phone' : 'email',
        phone: usePhone ? loginController.text.trim() : null,
        email: usePhone ? null : loginController.text.trim(),
        password: passwordController.text,
      );
      AuthRuntime.otpId = result.otpId;
      AuthRuntime.otpCodeHint = result.testCode;
      if (mounted) context.go('/otp');
    } catch (error) {
      setState(() => status = 'Auth API ошибка: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

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
            controller: loginController,
            keyboardType:
                usePhone ? TextInputType.phone : TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: usePhone ? '+7 номер телефона' : 'E-mail',
              prefixIcon:
                  Icon(usePhone ? Icons.phone_outlined : Icons.mail_outline),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: passwordController,
            obscureText: true,
            decoration: const InputDecoration(
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
          Text(status),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: isBusy ? null : requestOtp,
            icon: const Icon(Icons.sms_outlined),
            label: Text(isBusy ? 'Отправляю' : 'Получить код'),
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
  const RegisterScreen({super.key, this.authApi});

  final AuthApiPort? authApi;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  late final AuthApiPort authApi;
  late final TextEditingController nameController;
  late final TextEditingController phoneController;
  late final TextEditingController emailController;
  var consent = true;
  var isBusy = false;
  var status = 'Заполните данные регистрации';

  @override
  void initState() {
    super.initState();
    authApi = widget.authApi ?? HttpAuthApi();
    nameController = TextEditingController(text: 'Тестовый пользователь');
    phoneController = TextEditingController(text: '+77010000002');
    emailController = TextEditingController(text: 'client@example.kz');
  }

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    super.dispose();
  }

  Future<void> createAccount() async {
    if (isBusy || !consent) return;
    setState(() {
      isBusy = true;
      status = 'Создаю аккаунт через API...';
    });
    try {
      final result = await authApi.register(
        channel: 'phone',
        phone: phoneController.text.trim(),
        email: emailController.text.trim(),
        password: 'mobile-pin',
      );
      AuthRuntime.displayName = nameController.text.trim();
      AuthRuntime.otpId = result.otpId;
      AuthRuntime.otpCodeHint = result.testCode;
      if (mounted) context.go('/otp');
    } catch (error) {
      setState(() => status = 'Регистрация API ошибка: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Регистрация пользователя',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Ф.И.О.')),
          const SizedBox(height: 12),
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: '+7 номер телефона'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'E-mail'),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: consent,
            onChanged: (value) => setState(() => consent = value ?? false),
            title: const Text('Согласие с обработкой данных v1'),
          ),
          Text(status),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: consent && !isBusy ? createAccount : null,
            icon: const Icon(Icons.person_add_alt_outlined),
            label: Text(isBusy ? 'Создаю' : 'Создать аккаунт'),
          ),
        ],
      ),
    );
  }
}

class OtpScreen extends StatelessWidget {
  const OtpScreen({super.key, this.authApi});

  final AuthApiPort? authApi;

  @override
  Widget build(BuildContext context) {
    final controller =
        TextEditingController(text: AuthRuntime.otpCodeHint ?? '');
    final api = authApi ?? HttpAuthApi();
    return AuthScaffold(
      title: 'Подтверждение SMS',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (AuthRuntime.otpCodeHint != null)
            Text('RC local SMS: ${AuthRuntime.otpCodeHint}'),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: 'Код из SMS',
              prefixIcon: Icon(Icons.password_outlined),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () async {
              try {
                final session = await api.verifyOtp(
                  otpId: AuthRuntime.otpId,
                  code: controller.text.trim(),
                );
                AuthRuntime.userId = session.userId;
                if (context.mounted) context.go('/biometric');
              } catch (error) {
                if (context.mounted) {
                  _showAction(context, 'OTP API ошибка: $error');
                }
              }
            },
            icon: const Icon(Icons.verified_user_outlined),
            label: const Text('Подтвердить'),
          ),
          TextButton(
            onPressed: () => _showAction(
                context,
                AuthRuntime.otpCodeHint == null
                    ? 'Сначала запросите OTP'
                    : 'Код повторно отправлен через API'),
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
  const ProfileScreen({super.key, this.profileApi});

  final ProfileApiPort? profileApi;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final ProfileApiPort profileApi;
  late final TextEditingController nameController;
  late final TextEditingController iinController;
  late final TextEditingController addressController;
  var profileType = 'Физлицо';
  var biometricEnabled = false;
  var isBusy = false;
  var status = 'Профиль еще не сохранен';

  @override
  void initState() {
    super.initState();
    profileApi = widget.profileApi ?? HttpProfileApi();
    nameController = TextEditingController(text: AuthRuntime.displayName);
    iinController = TextEditingController();
    addressController = TextEditingController(text: 'Алматы, Казахстан');
  }

  @override
  void dispose() {
    nameController.dispose();
    iinController.dispose();
    addressController.dispose();
    super.dispose();
  }

  Future<void> saveProfile() async {
    if (isBusy) return;
    setState(() {
      isBusy = true;
      status = 'Сохраняю профиль через API...';
    });
    try {
      final id = await profileApi.createProfile(
        userId: AuthRuntime.userId,
        type: profileType,
        displayName: nameController.text.trim(),
        iinBin: iinController.text.trim(),
        address: addressController.text.trim(),
      );
      setState(() => status = 'Профиль сохранен: ${id.substring(0, 8)}');
    } catch (error) {
      setState(() => status = 'Профиль API ошибка: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

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
          TextField(
            controller: nameController,
            decoration: const InputDecoration(
              labelText: 'Ф.И.О. / название',
              prefixIcon: Icon(Icons.badge_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: iinController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'ИИН/БИН',
              prefixIcon: Icon(Icons.pin_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: addressController,
            decoration: const InputDecoration(
              labelText: 'Адрес в РК',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
          ),
          const SizedBox(height: 16),
          Text(status),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: isBusy ? null : saveProfile,
            icon: const Icon(Icons.save_outlined),
            label: Text(isBusy ? 'Сохраняю' : 'Сохранить профиль'),
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

abstract class AuthApiPort {
  Future<AuthOtpResult> register({
    required String channel,
    String? phone,
    String? email,
    String? password,
  });

  Future<AuthSessionResult> verifyOtp({
    required String otpId,
    required String code,
  });
}

abstract class ProfileApiPort {
  Future<String> createProfile({
    required String userId,
    required String type,
    required String displayName,
    String? iinBin,
    String? address,
  });
}

class AuthOtpResult {
  const AuthOtpResult({required this.otpId, this.testCode});

  final String otpId;
  final String? testCode;
}

class AuthSessionResult {
  const AuthSessionResult({required this.userId});

  final String userId;
}

abstract final class AuthRuntime {
  static String otpId = '';
  static String? otpCodeHint;
  static String userId = '';
  static String displayName = 'Тестовый пользователь';
}

class HttpAuthApi implements AuthApiPort {
  HttpAuthApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<AuthOtpResult> register({
    required String channel,
    String? phone,
    String? email,
    String? password,
  }) async {
    final body = await _postJson(ApiContract.authRegister, {
      'channel': channel,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      if (email != null && email.isNotEmpty) 'email': email,
      if (password != null && password.isNotEmpty) 'password': password,
      'consentVersion': 'v1',
    });
    return AuthOtpResult(
      otpId: body['otpId'] as String,
      testCode: body['testCode'] as String?,
    );
  }

  @override
  Future<AuthSessionResult> verifyOtp({
    required String otpId,
    required String code,
  }) async {
    final body = await _postJson(ApiContract.authOtpVerify, {
      'otpId': otpId,
      'code': code,
    });
    final user = body['user'] as Map<String, dynamic>;
    return AuthSessionResult(userId: user['id'] as String);
  }

  Future<Map<String, dynamic>> _postJson(
      String path, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$path'),
      headers: const {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-auth',
      },
      body: jsonEncode(payload),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('${body['message'] ?? body['error'] ?? path}');
    }
    return body;
  }
}

class HttpProfileApi implements ProfileApiPort {
  HttpProfileApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<String> createProfile({
    required String userId,
    required String type,
    required String displayName,
    String? iinBin,
    String? address,
  }) async {
    if (userId.isEmpty) throw const FormatException('Сначала подтвердите OTP');
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.profiles}'),
      headers: const {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-profile',
      },
      body: jsonEncode({
        'userId': userId,
        'type': _profileTypeFor(type),
        'displayName': displayName,
        if (iinBin != null && iinBin.length == 12) 'iinBin': iinBin,
        if (address != null && address.isNotEmpty) 'address': address,
      }),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? ApiContract.profiles}');
    }
    return body['id'] as String;
  }
}

String _profileTypeFor(String value) {
  return switch (value) {
    'ИП' => 'individual_entrepreneur',
    'Юрлицо' => 'legal_entity',
    'Представитель' => 'representative',
    _ => 'person',
  };
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
