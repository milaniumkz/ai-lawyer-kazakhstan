import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import '../../api/session_http.dart' as http;

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
  List<SubscriptionPlanItem> plans = const [];
  List<PaymentHistoryItem> payments = const [];

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
      final nextPlans = await billingApi.plans(AuthRuntime.userId);
      final nextPayments = await billingApi.paymentHistory(AuthRuntime.userId);
      setState(() {
        plan = current.plan;
        percent = current.percent;
        ttsDisabled = current.ttsDisabled;
        plans = nextPlans;
        payments = nextPayments;
        status = 'Лимиты и история загружены из API';
      });
    } catch (error) {
      setState(() => status = 'Подписка API ошибка: $error');
    }
  }

  Future<void> startPayment(String targetPlan) async {
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы открыть оплату');
      return;
    }
    try {
      final result =
          await billingApi.createPaymentIntent(AuthRuntime.userId, targetPlan);
      if (!mounted) return;
      setState(() {
        status =
            '${result.blocker}: ${result.amountKzt} ₸. Подключите payment provider env.';
      });
    } catch (error) {
      setState(() => status = 'Оплата API ошибка: $error');
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
            _UsageCard('AI бюджет', '$percent%', percent / 100),
            _UsageCard('TTS', ttsDisabled ? 'выключен' : 'доступен',
                ttsDisabled ? 1 : 0),
            _UsageCard('История платежей', '${payments.length} записей',
                payments.isEmpty ? 0 : 1),
            const SizedBox(height: 18),
            Text('Выберите план',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 10),
            ...(plans.isNotEmpty
                    ? plans
                    : const [
                        SubscriptionPlanItem(
                            plan: 'free',
                            title: 'Базовый',
                            priceKzt: 0,
                            documentLimit: 2,
                            voiceMinutes: 15,
                            expertReview: false),
                        SubscriptionPlanItem(
                            plan: 'standard',
                            title: 'Профессиональный',
                            priceKzt: 7990,
                            documentLimit: 30,
                            voiceMinutes: 180,
                            expertReview: true),
                        SubscriptionPlanItem(
                            plan: 'expert',
                            title: 'Эксперт',
                            priceKzt: 24900,
                            documentLimit: 100,
                            voiceMinutes: 600,
                            expertReview: true),
                      ])
                .map((item) => _PlanCard(
                      item.title,
                      item.priceKzt == 0 ? '0 ₸' : '${item.priceKzt} ₸ / мес',
                      '${item.documentLimit} документов · ${item.voiceMinutes} минут · ${item.expertReview ? 'эксперт' : 'self-service'}',
                      selected: item.plan == 'standard',
                      onTap: () => startPayment(item.plan),
                    )),
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
                    const SizedBox(height: 8),
                    Text(payments.isEmpty
                        ? 'История платежей пуста'
                        : payments
                            .map((item) =>
                                '${item.plan}: ${item.amountKzt} ₸ (${item.status})')
                            .join(' · ')),
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
                  Text(plan, style: Theme.of(context).textTheme.headlineSmall),
                  const Text('данные загружаются из Billing API'),
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
      {this.selected = false, this.onTap});

  final String title;
  final String price;
  final String description;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: selected ? AppColors.gold : Colors.transparent),
      ),
      child: ListTile(
        onTap: onTap,
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

class SubscriptionPlanItem {
  const SubscriptionPlanItem({
    required this.plan,
    required this.title,
    required this.priceKzt,
    required this.documentLimit,
    required this.voiceMinutes,
    required this.expertReview,
  });

  final String plan;
  final String title;
  final int priceKzt;
  final int documentLimit;
  final int voiceMinutes;
  final bool expertReview;
}

class PaymentHistoryItem {
  const PaymentHistoryItem({
    required this.plan,
    required this.amountKzt,
    required this.status,
  });

  final String plan;
  final num amountKzt;
  final String status;
}

class PaymentIntentResult {
  const PaymentIntentResult({
    required this.blocker,
    required this.amountKzt,
  });

  final String blocker;
  final num amountKzt;
}

abstract class BillingApiPort {
  Future<BillingStatus> current(String userId);
  Future<List<SubscriptionPlanItem>> plans(String userId);
  Future<List<PaymentHistoryItem>> paymentHistory(String userId);
  Future<PaymentIntentResult> createPaymentIntent(String userId, String plan);
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

  @override
  Future<List<SubscriptionPlanItem>> plans(String userId) async {
    final response = await http.get(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.subscriptionsPlans}'),
      headers: {
        'x-user-id': userId,
        'x-correlation-id': 'mobile-billing-plans',
      },
    );
    final body = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const HttpException('subscription plans failed');
    }
    return (body as List<dynamic>).map((item) {
      final row = item as Map<String, dynamic>;
      return SubscriptionPlanItem(
        plan: row['plan'] as String,
        title: row['title'] as String,
        priceKzt: row['priceKzt'] as int,
        documentLimit: row['documentLimit'] as int,
        voiceMinutes: row['voiceMinutes'] as int,
        expertReview: row['expertReview'] as bool,
      );
    }).toList();
  }

  @override
  Future<List<PaymentHistoryItem>> paymentHistory(String userId) async {
    final response = await http.get(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.subscriptionsPaymentHistory}'),
      headers: {
        'x-user-id': userId,
        'x-correlation-id': 'mobile-billing-payments'
      },
    );
    final body = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const HttpException('payment history failed');
    }
    return (body as List<dynamic>).map((item) {
      final row = item as Map<String, dynamic>;
      return PaymentHistoryItem(
        plan: row['plan'] as String,
        amountKzt: row['amountKzt'] as num,
        status: row['status'] as String,
      );
    }).toList();
  }

  @override
  Future<PaymentIntentResult> createPaymentIntent(
      String userId, String plan) async {
    final response = await http.post(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.subscriptionsPaymentIntent}'),
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
        'x-correlation-id': 'mobile-billing-payment-intent',
      },
      body: jsonEncode({'plan': plan}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'payment failed'}');
    }
    return PaymentIntentResult(
      blocker: body['blocker'] as String,
      amountKzt: body['amountKzt'] as num,
    );
  }
}
