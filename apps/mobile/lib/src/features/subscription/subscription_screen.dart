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
              'Лимиты и расходы',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
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
