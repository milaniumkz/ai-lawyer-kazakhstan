import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
import '../auth/auth_screens.dart';
import '../../theme/app_theme.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key, this.billingApi});

  final BillingApiPort? billingApi;

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  late final BillingApiPort billingApi;
  var status = 'Лимиты не загружены';
  var plan = 'Free';
  var percent = 0;
  var ttsDisabled = false;

  @override
  void initState() {
    super.initState();
    billingApi = widget.billingApi ?? HttpBillingApi();
    loadSubscription();
  }

  Future<void> loadSubscription() async {
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы загрузить лимиты из API');
      return;
    }
    try {
      final current = await billingApi.current(AuthRuntime.userId);
      setState(() {
        plan = current.plan;
        percent = current.percent;
        ttsDisabled = current.ttsDisabled;
        status = 'Лимиты загружены из API';
      });
    } catch (error) {
      setState(() => status = 'Подписка API ошибка: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Подписка')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Подписка',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            _CurrentPlanCard(plan: plan),
            const SizedBox(height: 18),
            Text('Использование в августе',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 10),
            const _UsageCard('Консультации', '34 из 100', 0.34),
            const _UsageCard('Документы', '12 из 30', 0.40),
            const _UsageCard('Голосовые минуты', '68 из 180', 0.38),
            const SizedBox(height: 18),
            Text('Выберите план',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 10),
            const _PlanCard('Базовый', '0 ₸', '5 консультаций · 2 документа'),
            const _PlanCard('Профессиональный', '7 990 ₸ / мес',
                '100 консультаций · 30 документов · доступ к эксперту',
                selected: true),
            const _PlanCard('Годовой', '79 900 ₸ / год',
                'Все функции Professional · приоритетная поддержка'),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Текущий план: $plan'),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: percent / 100),
                    const SizedBox(height: 8),
                    Text(
                        'AI расходы: $percent% · TTS ${ttsDisabled ? 'выключен' : 'доступен'}'),
                    const SizedBox(height: 8),
                    const Text('AI расходы считаются без персональных данных.'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(status),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: loadSubscription,
              icon: const Icon(Icons.sync_outlined),
              label: const Text('Обновить лимиты'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => showDialog<void>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Оплата недоступна'),
                  content: const Text(
                      'Payment provider не подключен. Для production нужен официальный платежный провайдер и ключи.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Понятно'),
                    ),
                  ],
                ),
              ),
              icon: const Icon(Icons.payment_outlined),
              label: const Text('Управление оплатой недоступно в stub mode'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CurrentPlanCard extends StatelessWidget {
  const _CurrentPlanCard({required this.plan});

  final String plan;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.gold)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Текущий план'),
                  Text(plan == 'Free' ? 'Профессиональный' : plan,
                      style: Theme.of(context).textTheme.headlineSmall),
                  const Text('действует до 15 сентября 2026'),
                ],
              ),
            ),
            const Chip(label: Text('Активен')),
          ],
        ),
      ),
    );
  }
}

class _UsageCard extends StatelessWidget {
  const _UsageCard(this.title, this.value, this.progress);

  final String title;
  final String value;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [Text(title), Text(value)],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: progress),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard(this.title, this.price, this.description,
      {this.selected = false});

  final String title;
  final String price;
  final String description;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: selected ? AppColors.gold : Colors.transparent),
      ),
      child: ListTile(
        title: Text(title),
        subtitle: Text(description),
        trailing: Text(price),
      ),
    );
  }
}

class BillingStatus {
  const BillingStatus({
    required this.plan,
    required this.percent,
    required this.ttsDisabled,
  });

  final String plan;
  final int percent;
  final bool ttsDisabled;
}

abstract class BillingApiPort {
  Future<BillingStatus> current(String userId);
}

class HttpBillingApi implements BillingApiPort {
  HttpBillingApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<BillingStatus> current(String userId) async {
    final response = await http.get(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.subscriptionsCurrent}'),
      headers: {'x-user-id': userId, 'x-correlation-id': 'mobile-billing'},
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'subscription failed'}');
    }
    return BillingStatus(
      plan: body['plan'] as String? ?? 'Free',
      percent: body['percent'] as int? ?? 0,
      ttsDisabled: body['ttsDisabled'] as bool? ?? false,
    );
  }
}
