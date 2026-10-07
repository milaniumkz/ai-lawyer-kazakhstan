import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../api/session_http.dart' as http;

import '../../api/api_contract.dart';
import '../../api/session_credentials.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/aizan_design.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.authApi});

  final AuthApiPort? authApi;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final AuthApiPort authApi;
  late final TextEditingController loginController;
  var isBusy = false;
  var status = 'Введите номер телефона';
  var language = 'RU';

  @override
  void initState() {
    super.initState();
    authApi = widget.authApi ?? HttpAuthApi();
    loginController = TextEditingController(text: '+7');
  }

  @override
  void dispose() {
    loginController.dispose();
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
        channel: 'phone',
        phone: loginController.text.trim(),
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

  Future<void> openPhoneLogin() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, MediaQuery.viewInsetsOf(sheetContext).bottom + 24),
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Вход по телефону',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              TextField(
                  controller: loginController,
                  keyboardType: TextInputType.phone,
                  autofocus: true,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  decoration:
                      const InputDecoration(labelText: '+7 номер телефона')),
              const SizedBox(height: 16),
              FilledButton(
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    requestOtp();
                  },
                  child: const Text('Получить SMS-код')),
            ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
              children: [
                Stack(children: [
                  const Padding(
                      padding: EdgeInsets.only(top: 18),
                      child: AizanArt(AizanArtwork.authBrand)),
                  Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton.outlined(
                                tooltip: 'Назад',
                                onPressed: () => context.go('/onboarding'),
                                icon: const Icon(Icons.chevron_left)),
                            SegmentedButton<String>(
                                segments: const [
                                  ButtonSegment(value: 'RU', label: Text('RU')),
                                  ButtonSegment(value: 'KZ', label: Text('KZ')),
                                  ButtonSegment(value: 'EN', label: Text('EN')),
                                ],
                                selected: {
                                  language
                                },
                                showSelectedIcon: false,
                                onSelectionChanged: (value) =>
                                    setState(() => language = value.first)),
                          ])),
                ]),
                const SizedBox(height: 17),
                Text(
                    switch (language) {
                      'KZ' =>
                        'Істерді, құжаттарды және мерзімдерді сақтау үшін кіріңіз немесе аккаунт жасаңыз',
                      'EN' =>
                        'Sign in or create an account to save cases, documents and deadlines',
                      _ =>
                        'Войдите или создайте аккаунт,\nчтобы сохранять дела, документы и сроки',
                    },
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: AppColors.muted, fontSize: 12, height: 1.5)),
                const SizedBox(height: 14),
                const Text('ПРАВО. ТЕХНОЛОГИИ. ДЛЯ ЛЮДЕЙ.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 7, letterSpacing: 3, color: AppColors.muted)),
                const SizedBox(height: 18),
                Row(children: [
                  Expanded(
                      child: AizanButton(
                          label: 'Вход',
                          onPressed: isBusy ? null : openPhoneLogin,
                          icon: Icons.login)),
                  Expanded(
                      child: TextButton(
                          onPressed: isBusy ? null : openPhoneLogin,
                          child: const Text('Регистрация'))),
                ]),
                const SizedBox(height: 16),
                _loginAction(Icons.phone_outlined, 'Войти по номеру телефона',
                    loginController.text, openPhoneLogin),
                const SizedBox(height: 10),
                _loginAction(
                    Icons.mail_outline,
                    'Войти по e-mail',
                    'Используйте вашу почту',
                    () => _showAction(context,
                        'Вход по e-mail пока недоступен. Используйте телефон.')),
                const SizedBox(height: 10),
                _loginAction(
                    Icons.fingerprint,
                    'Войти по Face ID / Touch ID',
                    'Быстро и безопасно',
                    () => _showAction(context,
                        'Биометрический вход пока не подключён. Используйте телефон.')),
                if (isBusy || status != 'Введите номер телефона') ...[
                  const SizedBox(height: 12),
                  Text(status,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.muted)),
                ],
                const SizedBox(height: 17),
                const _AuthDivider(),
                TextButton(
                    onPressed: isBusy ? null : openPhoneLogin,
                    child: const Text('Нет аккаунта? Зарегистрироваться  ›')),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _loginAction(
          IconData icon, String title, String subtitle, VoidCallback onTap) =>
      Card(
        margin: EdgeInsets.zero,
        child: ListTile(
          onTap: isBusy ? null : onTap,
          minVerticalPadding: 10,
          leading: Container(
              width: 39,
              height: 39,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.gold)),
              child: Icon(icon, color: AppColors.goldDark, size: 23)),
          title: Text(title, style: const TextStyle(fontSize: 13)),
          subtitle: Text(subtitle,
              style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          trailing: const Icon(Icons.chevron_right, color: AppColors.gold),
        ),
      );
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.authApi, this.profileApi});

  final AuthApiPort? authApi;
  final ProfileApiPort? profileApi;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  late final ProfileApiPort profileApi;
  late final TextEditingController lastNameController;
  late final TextEditingController firstNameController;
  late final TextEditingController middleNameController;
  late final TextEditingController cityController;
  late final TextEditingController iinController;
  var consent = true;
  var isBusy = false;
  var profileType = 'Физлицо';
  var status = 'Заполните анкету после SMS';

  @override
  void initState() {
    super.initState();
    profileApi = widget.profileApi ?? HttpProfileApi();
    final parts = AuthRuntime.displayName.split(' ');
    lastNameController =
        TextEditingController(text: parts.length > 1 ? parts.first : '');
    firstNameController =
        TextEditingController(text: parts.length > 1 ? parts[1] : '');
    middleNameController = TextEditingController(
        text: parts.length > 2 ? parts.sublist(2).join(' ') : '');
    cityController = TextEditingController();
    iinController = TextEditingController();
  }

  @override
  void dispose() {
    lastNameController.dispose();
    firstNameController.dispose();
    middleNameController.dispose();
    cityController.dispose();
    iinController.dispose();
    super.dispose();
  }

  Future<void> createAccount() async {
    if (isBusy || !consent) return;
    final fullName = [
      lastNameController.text.trim(),
      firstNameController.text.trim(),
      middleNameController.text.trim(),
    ].where((part) => part.isNotEmpty).join(' ');
    if (lastNameController.text.trim().isEmpty ||
        firstNameController.text.trim().isEmpty ||
        cityController.text.trim().isEmpty) {
      setState(() => status = 'Заполните фамилию, имя и город');
      return;
    }
    setState(() {
      isBusy = true;
      status = 'Сохраняю профиль через API...';
    });
    try {
      final id = await profileApi.createProfile(
        userId: AuthRuntime.userId,
        type: profileType,
        displayName: fullName,
        iinBin: iinController.text.trim(),
        address: cityController.text.trim(),
      );
      AuthRuntime.displayName = fullName;
      AuthRuntime.profileComplete = true;
      await SessionCredentials.save(
          userId: AuthRuntime.userId,
          accessToken: SessionCredentials.token,
          profileComplete: true,
          displayName: AuthRuntime.displayName);
      setState(() => status = 'Профиль сохранен: ${id.substring(0, 8)}');
      if (mounted) context.go('/');
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
          const _AuthEmblem(icon: Icons.balance_outlined),
          const SizedBox(height: 16),
          _AuthPanelCard(
            child: Column(
              children: [
                TextField(
                  controller: lastNameController,
                  decoration: const InputDecoration(
                    labelText: 'Фамилия',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: firstNameController,
                  decoration: const InputDecoration(
                    labelText: 'Имя',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: middleNameController,
                  decoration: const InputDecoration(
                    labelText: 'Отчество',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: cityController,
                  decoration: const InputDecoration(
                    labelText: 'Город',
                    prefixIcon: Icon(Icons.location_city_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: iinController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'ИИН/БИН, если нужно',
                    prefixIcon: Icon(Icons.pin_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileTypeSelector(
                  selected: profileType,
                  onSelected: (value) => setState(() => profileType = value),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: consent,
                  onChanged: (value) =>
                      setState(() => consent = value ?? false),
                  title: const Text('Согласие с обработкой данных v1'),
                ),
              ],
            ),
          ),
          Text(status),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: consent && !isBusy ? createAccount : null,
            icon: const Icon(Icons.auto_awesome),
            label: Text(isBusy ? 'Сохраняю' : 'Завершить регистрацию'),
          ),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Уже есть аккаунт? Войти'),
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
          const _AuthEmblem(icon: Icons.balance_outlined),
          const SizedBox(height: 16),
          Text(
            'Введите код из SMS',
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(color: AppColors.goldDark, fontFamily: 'Georgia'),
          ),
          const SizedBox(height: 12),
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
                await SessionCredentials.save(
                    userId: session.userId,
                    accessToken: session.accessToken,
                    profileComplete: !session.profileRequired,
                    displayName: AuthRuntime.displayName);
                AuthRuntime.userId = session.userId;
                AuthRuntime.profileComplete = !session.profileRequired;
                if (context.mounted) {
                  context.go(session.isNewUser || session.profileRequired
                      ? '/register'
                      : '/');
                }
              } catch (error) {
                if (context.mounted) {
                  _showAction(context, 'OTP API ошибка: $error');
                }
              }
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Подтвердить'),
          ),
          const SizedBox(height: 12),
          const _AuthDivider(),
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
  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Быстрый вход по биометрии',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _AuthEmblem(icon: Icons.face_outlined),
          const SizedBox(height: 28),
          Text(
            'Биометрический вход пока недоступен. Используйте телефон или e-mail.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          const _AuthDivider(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: null,
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Недоступно'),
          ),
          OutlinedButton(
            onPressed: () => context.go('/profile'),
            child: const Text('Позже'),
          ),
          const SizedBox(height: 16),
          const Text(
            'Продолжите обычный вход',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _AuthEmblem extends StatelessWidget {
  const _AuthEmblem({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 178,
        height: 178,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.gold),
          boxShadow: const [
            BoxShadow(
                color: Color(0x22D8A13A), blurRadius: 36, spreadRadius: 16),
          ],
        ),
        child: Center(
          child: Container(
            width: 104,
            height: 104,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFFFE49A), AppColors.gold],
              ),
            ),
            child: Icon(icon, size: 58, color: AppColors.graphite),
          ),
        ),
      ),
    );
  }
}

class _AuthDivider extends StatelessWidget {
  const _AuthDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(child: Divider(color: AppColors.gold)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: Text('◇', style: TextStyle(color: AppColors.gold)),
        ),
        Expanded(child: Divider(color: AppColors.gold)),
      ],
    );
  }
}

class _AuthPanelCard extends StatelessWidget {
  const _AuthPanelCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(26),
        side: const BorderSide(color: AppColors.gold),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: child,
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
  var isBusy = false;
  var status = 'Профиль еще не сохранен';

  @override
  void initState() {
    super.initState();
    profileApi = widget.profileApi ?? HttpProfileApi();
    nameController = TextEditingController(text: AuthRuntime.displayName);
    iinController = TextEditingController();
    addressController = TextEditingController();
  }

  double completionValue() {
    final fields = [
      nameController.text.trim(),
      iinController.text.trim(),
      addressController.text.trim(),
      AuthRuntime.userId,
    ];
    return fields.where((value) => value.isNotEmpty).length / fields.length;
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
      AuthRuntime.displayName = nameController.text.trim();
      AuthRuntime.profileComplete = true;
      await SessionCredentials.save(
          userId: AuthRuntime.userId,
          accessToken: SessionCredentials.token,
          profileComplete: true,
          displayName: AuthRuntime.displayName);
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
          _ProfileHero(name: nameController.text),
          const SizedBox(height: 16),
          _ProfileCompletionCard(progress: completionValue(), status: status),
          const SizedBox(height: 16),
          Text('Мои профили',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: AppColors.goldDark)),
          const SizedBox(height: 10),
          _ProfileTypeSelector(
            selected: profileType,
            onSelected: (value) => setState(() => profileType = value),
          ),
          const SizedBox(height: 16),
          Text('Данные и безопасность',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: AppColors.goldDark)),
          const SizedBox(height: 16),
          TextField(
            controller: nameController,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Ф.И.О. / название',
              prefixIcon: Icon(Icons.badge_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: iinController,
            onChanged: (_) => setState(() {}),
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'ИИН/БИН',
              prefixIcon: Icon(Icons.pin_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: addressController,
            onChanged: (_) => setState(() {}),
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
            value: false,
            onChanged: null,
            title: const Text('Быстрый вход по биометрии'),
            subtitle: const Text('Биометрический вход пока недоступен'),
          ),
          ListTile(
              leading: const Icon(Icons.calendar_month_outlined),
              title: const Text('Календарь и сроки'),
              onTap: () => context.go('/deadlines')),
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
    const types = [
      ('Физлицо', 'Активный профиль', 'Основной'),
      ('ИП', 'ИП MILANIUM', '›'),
      ('Юрлицо', 'Добавить организацию', '›'),
      ('Представитель', 'Представители и контакты', '›'),
    ];
    return Column(
      children: [
        for (final type in types)
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                  color: selected == type.$1
                      ? AppColors.gold
                      : Colors.transparent),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppColors.gold.withValues(alpha: 0.12),
                child: Text(type.$1 == 'Юрлицо' ? '+' : type.$1.substring(0, 1),
                    style: const TextStyle(color: AppColors.gold)),
              ),
              title: Text(type.$1 == 'Физлицо'
                  ? 'Физическое лицо'
                  : type.$1 == 'ИП'
                      ? 'Индивидуальный предприниматель'
                      : type.$1 == 'Юрлицо'
                          ? 'Юридическое лицо'
                          : 'Доверенные лица'),
              subtitle: Text(type.$2),
              trailing: Text(type.$3),
              onTap: () => onSelected(type.$1),
            ),
          ),
      ],
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final initials = (name.isEmpty ? 'АС' : name)
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((part) => part.characters.first)
        .join()
        .toUpperCase();
    return Column(
      children: [
        CircleAvatar(
          radius: 54,
          backgroundColor: AppColors.gold.withValues(alpha: 0.12),
          child: Text(initials,
              style: const TextStyle(color: AppColors.gold, fontSize: 34)),
        ),
        const SizedBox(height: 14),
        Text(name.isEmpty ? 'Профиль не заполнен' : name,
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          name.isEmpty
              ? 'Заполните данные из базы профиля'
              : 'Физическое лицо · данные из профиля',
          style: const TextStyle(color: Color(0xFF62D983)),
        ),
      ],
    );
  }
}

class _ProfileCompletionCard extends StatelessWidget {
  const _ProfileCompletionCard({required this.progress, required this.status});

  final double progress;
  final String status;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Заполненность профиля'),
                Text('${(progress * 100).round()}%'),
              ],
            ),
            const SizedBox(height: 10),
            LinearProgressIndicator(value: progress),
            const SizedBox(height: 8),
            Text(status),
          ],
        ),
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.accountApi});

  final AccountApiPort? accountApi;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final AccountApiPort accountApi;
  var darkMode = false;
  var notifications = true;
  var piiMasking = true;
  var isBusy = false;
  var status = 'Настройки не синхронизированы';

  @override
  void initState() {
    super.initState();
    accountApi = widget.accountApi ?? HttpAccountApi();
  }

  Future<void> exportAccount() async {
    if (isBusy) return;
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы экспортировать данные');
      return;
    }
    setState(() {
      isBusy = true;
      status = 'Готовлю экспорт через API...';
    });
    try {
      final exported = await accountApi.exportAccount(AuthRuntime.userId);
      setState(() => status =
          'Экспорт готов: ${exported.profileCount} профилей, ${exported.sessionCount} сессий');
    } catch (error) {
      setState(() => status = 'Экспорт API ошибка: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> confirmDeleteAccount() async {
    if (isBusy) return;
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Удалить аккаунт?'),
            content: const Text(
                'Сессии будут отозваны, профильные данные удалены. Действие требует повторной регистрации.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Отмена'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Удалить'),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    await deleteAccount();
  }

  Future<void> deleteAccount() async {
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы удалить аккаунт');
      return;
    }
    setState(() {
      isBusy = true;
      status = 'Удаляю аккаунт через API...';
    });
    try {
      await accountApi.deleteAccount(AuthRuntime.userId);
      await SessionCredentials.clear();
      AuthRuntime.userId = '';
      AuthRuntime.otpId = '';
      AuthRuntime.otpCodeHint = null;
      setState(() => status = 'Аккаунт удален, сессии отозваны');
    } catch (error) {
      setState(() => status = 'Удаление API ошибка: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Настройки',
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      child: Column(
        children: [
          _SettingsGroup(title: 'Основные', children: [
            ListTile(
                title: const Text('Язык приложения'),
                trailing: const Text('Русский ›'),
                onTap: () {}),
            SwitchListTile(
                value: darkMode,
                onChanged: (value) => setState(() => darkMode = value),
                title: const Text('Темная тема')),
            const ListTile(
                title: Text('Размер текста'), trailing: Text('Средний ›')),
          ]),
          _SettingsGroup(title: 'Голосовой помощник', children: [
            SwitchListTile(
                value: notifications,
                onChanged: (value) => setState(() => notifications = value),
                title: const Text('Голосовые ответы')),
            const SwitchListTile(
                value: false,
                onChanged: null,
                title: Text('Автовоспроизведение')),
            const ListTile(
                title: Text('Скорость речи'), trailing: Text('1.0x ›')),
          ]),
          _SettingsGroup(title: 'Конфиденциальность', children: [
            SwitchListTile(
                value: piiMasking,
                onChanged: (value) => setState(() => piiMasking = value),
                title: const Text('Обезличивать данные перед AI')),
            const SwitchListTile(
                value: false,
                onChanged: null,
                title: Text('Сохранять голосовые записи')),
            const SwitchListTile(
                value: false,
                onChanged: null,
                title: Text('Аналитика использования')),
          ]),
          Text(status),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: isBusy
                ? null
                : () {
                    setState(() => status = 'Настройки сохранены локально');
                    _showAction(context, 'Настройки сохранены');
                  },
            icon: const Icon(Icons.save_outlined),
            label: const Text('Сохранить настройки'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: isBusy ? null : exportAccount,
            icon: const Icon(Icons.download_outlined),
            label: const Text('Экспортировать данные'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: isBusy ? null : confirmDeleteAccount,
            icon: const Icon(Icons.delete_outline),
            label: const Text('Удалить аккаунт'),
          ),
        ],
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: AppColors.goldDark)),
          const SizedBox(height: 8),
          Card(child: Column(children: children)),
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
  var selectedTopic = 'Общие вопросы';

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Помощь и поддержка',
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const ListTile(
            leading: Icon(Icons.search_outlined),
            title: Text('Найдите ответ на вопрос'),
            subtitle: Text('Аккаунт, дела, документы, подписка'),
          ),
          _HelpQuickGrid(
            selected: selectedTopic,
            onSelect: (value) => setState(() => selectedTopic = value),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.support_agent_outlined,
                  color: AppColors.gold),
              title: const Text('Служба поддержки онлайн'),
              subtitle: Text('Тема: $selectedTopic'),
              trailing: const Text('Adapter',
                  style: TextStyle(color: AppColors.gold)),
              onTap: () => setState(() => requestCreated = true),
            ),
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

class _HelpQuickGrid extends StatelessWidget {
  const _HelpQuickGrid({required this.selected, required this.onSelect});

  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    const items = [
      ('1', 'Частые вопросы', 'Ответы на популярные темы'),
      ('2', 'Инструкции', 'Пошаговые руководства'),
      ('3', 'WhatsApp blocker', 'Внешний канал через adapter'),
      ('4', 'Сообщить о проблеме', 'Ошибка или предложение'),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.6,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: [
        for (final item in items)
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                  color: selected == item.$2
                      ? AppColors.gold
                      : Colors.transparent),
            ),
            child: InkWell(
              onTap: () => onSelect(item.$2),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.gold.withValues(alpha: 0.12),
                      child: Text(item.$1,
                          style: const TextStyle(color: AppColors.gold)),
                    ),
                    const SizedBox(height: 8),
                    Text(item.$2, maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text(item.$3,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ),
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

abstract class AccountApiPort {
  Future<AccountExportResult> exportAccount(String userId);
  Future<void> deleteAccount(String userId);
}

class AuthOtpResult {
  const AuthOtpResult({required this.otpId, this.testCode});

  final String otpId;
  final String? testCode;
}

class AuthSessionResult {
  const AuthSessionResult({
    required this.userId,
    this.isNewUser = false,
    this.profileRequired = true,
    this.accessToken = '',
  });

  final String userId;
  final bool isNewUser;
  final bool profileRequired;
  final String accessToken;
}

class AccountExportResult {
  const AccountExportResult({
    required this.profileCount,
    required this.sessionCount,
  });

  final int profileCount;
  final int sessionCount;
}

abstract final class AuthRuntime {
  static String otpId = '';
  static String? otpCodeHint;
  static String userId = '';
  static String displayName = '';
  static bool profileComplete = false;
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
    return AuthSessionResult(
      userId: user['id'] as String,
      accessToken: body['accessToken'] as String? ?? '',
      isNewUser: body['isNewUser'] as bool? ?? false,
      profileRequired: body['profileRequired'] as bool? ?? true,
    );
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
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-profile',
        'x-user-id': userId,
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

class HttpAccountApi implements AccountApiPort {
  HttpAccountApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<AccountExportResult> exportAccount(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.accountExport}'),
      headers: {'x-user-id': userId, 'x-correlation-id': 'mobile-account'},
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'account export failed'}');
    }
    return AccountExportResult(
      profileCount: (body['profiles'] as List<dynamic>? ?? const []).length,
      sessionCount: (body['sessions'] as List<dynamic>? ?? const []).length,
    );
  }

  @override
  Future<void> deleteAccount(String userId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.account}'),
      headers: {'x-user-id': userId, 'x-correlation-id': 'mobile-account'},
    );
    final body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'account delete failed'}');
    }
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
              'Ваш юридический AI-помощник',
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
