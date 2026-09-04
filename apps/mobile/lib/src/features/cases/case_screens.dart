import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class CasesListScreen extends StatefulWidget {
  const CasesListScreen({super.key});

  @override
  State<CasesListScreen> createState() => _CasesListScreenState();
}

class _CasesListScreenState extends State<CasesListScreen> {
  var selectedFilter = 'Все';
  final filters = const ['Все', 'В работе', 'Суд', 'Претензии'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои дела'),
        actions: [
          IconButton(
            tooltip: 'Поиск дела',
            onPressed: () => showSearch(
              context: context,
              delegate: _CaseSearchDelegate(),
            ),
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 1),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final filter in filters)
                  ChoiceChip(
                    label: Text(filter),
                    selected: selectedFilter == filter,
                    onSelected: (_) => setState(() => selectedFilter = filter),
                  ),
              ],
            ),
            const SizedBox(height: 18),
            for (final item in _caseItems)
              _CaseListTile(
                item: item,
                onTap: () => context.go('/case/details'),
              ),
          ],
        ),
      ),
    );
  }
}

class CaseDetailsScreen extends StatelessWidget {
  const CaseDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Карточка дела'),
        actions: [
          IconButton(
            tooltip: 'Поделиться',
            onPressed: () =>
                _showAction(context, 'Ссылка на дело подготовлена'),
            icon: const Icon(Icons.ios_share_outlined),
          ),
          PopupMenuButton<String>(
            onSelected: (value) => _showAction(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'Статус обновлен', child: Text('Обновить')),
              PopupMenuItem(
                  value: 'Дело отмечено важным', child: Text('Важное')),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 44,
                  child: Icon(Icons.balance_outlined, size: 42),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Взыскание долга',
                          style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 4),
                      const Text('Дело №2024-0015 · Гражданское право'),
                      const Text('● В работе'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            const _CaseMetrics(),
            const SizedBox(height: 18),
            Text('Прогресс дела',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 12),
            const _ProgressStrip(),
            const SizedBox(height: 12),
            const _DetailsGrid(),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go('/case/chat'),
              icon: const Icon(Icons.auto_awesome_outlined),
              label: const Text('Продолжить работу'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () => context.go('/documents'),
              icon: const Icon(Icons.folder_outlined),
              label: const Text('Открыть документы'),
            ),
          ],
        ),
      ),
    );
  }
}

class NewCaseScreen extends StatefulWidget {
  const NewCaseScreen({super.key});

  @override
  State<NewCaseScreen> createState() => _NewCaseScreenState();
}

class _CaseSearchDelegate extends SearchDelegate<String> {
  @override
  List<Widget>? buildActions(BuildContext context) => [
        IconButton(
          tooltip: 'Очистить',
          onPressed: () => query = '',
          icon: const Icon(Icons.close),
        ),
      ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
        tooltip: 'Назад',
        onPressed: () => close(context, ''),
        icon: const Icon(Icons.arrow_back),
      );

  @override
  Widget buildResults(BuildContext context) => buildSuggestions(context);

  @override
  Widget buildSuggestions(BuildContext context) {
    final items = _caseItems
        .where((item) => item.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
    return ListView(
      children: [
        for (final item in items)
          ListTile(
            title: Text(item.title),
            subtitle: Text(item.subtitle),
            onTap: () => close(context, item.title),
          ),
      ],
    );
  }
}

class _CaseListTile extends StatelessWidget {
  const _CaseListTile({required this.item, required this.onTap});

  final _CaseItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(child: Icon(item.icon)),
        title: Text(item.title),
        subtitle: Text('${item.subtitle}\n${item.status}'),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }
}

class _CaseMetrics extends StatelessWidget {
  const _CaseMetrics();

  @override
  Widget build(BuildContext context) {
    const metrics = [
      (Icons.menu_book_outlined, 'Категория', 'Гражданское право'),
      (Icons.gavel_outlined, 'Стадия', 'Досудебная подготовка'),
      (Icons.account_balance_outlined, 'Маршрут', 'Арбитражный суд'),
      (Icons.calendar_month_outlined, 'Срок', '15 мая 2024'),
      (Icons.donut_large_outlined, 'Готовность', '65%'),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final metric in metrics)
          SizedBox(
            width: 148,
            height: 156,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(metric.$1, color: AppColors.gold),
                    const SizedBox(height: 8),
                    Text(
                      metric.$2,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      metric.$3,
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _DetailsGrid extends StatelessWidget {
  const _DetailsGrid();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: const [
        _InfoCard(
            title: 'Участники дела',
            body: 'Истец: ООО «Альфа»\nОтветчик: ООО «Бета»'),
        _InfoCard(
            title: 'Сумма и требования',
            body: 'Основной долг 1 250 000 ₸\nИтого 1 375 000 ₸'),
        _InfoCard(title: 'Документы', body: 'Всего: 12\nТребуют внимания: 2'),
        _InfoCard(
            title: 'Ключевые даты',
            body: 'Претензия: 18 апр 2024\nПодача в суд: 22 мая 2024'),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 320,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(color: AppColors.goldDark)),
              const SizedBox(height: 8),
              Text(body),
            ],
          ),
        ),
      ),
    );
  }
}

void _showAction(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

class _CaseItem {
  const _CaseItem(this.title, this.subtitle, this.status, this.icon);

  final String title;
  final String subtitle;
  final String status;
  final IconData icon;
}

const _caseItems = [
  _CaseItem('Взыскание долга', 'Гражданское право · Дело №2024-0015',
      '● В работе', Icons.balance_outlined),
  _CaseItem('Алименты', 'Семейное право · Дело №2024-0012',
      '● Ожидает документов', Icons.family_restroom_outlined),
  _CaseItem('Претензия к подрядчику', 'Договорное право · Дело №2024-0008',
      '● Отправлено', Icons.description_outlined),
  _CaseItem('Раздел имущества', 'Семейное право · Дело №2024-0003',
      '● Срок близко', Icons.account_balance_outlined),
  _CaseItem('Защита прав потребителя', 'Защита прав · Дело №2024-0001',
      '● В работе', Icons.verified_user_outlined),
];

class _NewCaseScreenState extends State<NewCaseScreen> {
  late final TextEditingController transcriptController;
  var isRecording = false;
  var transcript =
      'Нужно взыскать долг по договору займа. Есть расписка и переписка.';

  @override
  void initState() {
    super.initState();
    transcriptController = TextEditingController(text: transcript);
  }

  @override
  void dispose() {
    transcriptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Новое дело',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: FilledButton(
              onPressed: () => setState(() {
                isRecording = !isRecording;
                transcript = isRecording
                    ? 'Идет запись голосового описания...'
                    : 'Нужно взыскать долг по договору займа. Есть расписка и переписка.';
                transcriptController.text = transcript;
              }),
              style: FilledButton.styleFrom(
                  shape: const CircleBorder(), fixedSize: const Size(148, 148)),
              child: Icon(isRecording ? Icons.stop : Icons.mic_none, size: 58),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            isRecording ? 'Запись активна' : 'Голос готов к обработке',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          TextField(
            controller: transcriptController,
            minLines: 5,
            maxLines: 8,
            decoration: InputDecoration(
              labelText: 'Проверьте описание проблемы',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.edit_note_outlined),
            ),
          ),
          const SizedBox(height: 16),
          const _ProgressStrip(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/case/category'),
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Подтвердить и создать дело'),
          ),
        ],
      ),
    );
  }
}

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  var category = 'Гражданское право';

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Определение категории спора',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final item in const [
                'Гражданское право',
                'Семейное право',
                'Защита прав потребителя',
                'Трудовой спор',
              ])
                ChoiceChip(
                  label: Text(item),
                  selected: category == item,
                  onSelected: (_) => setState(() => category = item),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.auto_awesome_outlined),
              title: Text('Категория: $category'),
              subtitle:
                  const Text('Риск: средний · требуется проверка документов'),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => context.go('/documents'),
            icon: const Icon(Icons.folder_open_outlined),
            label: const Text('Продолжить к документам'),
          ),
        ],
      ),
    );
  }
}

class CaseChatScreen extends StatefulWidget {
  const CaseChatScreen({super.key});

  @override
  State<CaseChatScreen> createState() => _CaseChatScreenState();
}

class _CaseChatScreenState extends State<CaseChatScreen> {
  final controller = TextEditingController();
  final messages = <({String text, bool assistant})>[
    (
      text:
          'AI может ошибаться. Нужны подтвержденные официальные источники РК.',
      assistant: true
    ),
    (text: 'Нужно взыскать долг по договору займа.', assistant: false),
  ];

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Чат по делу',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _CaseSummaryCard(),
          const SizedBox(height: 16),
          for (final message in messages)
            _MessageBubble(text: message.text, assistant: message.assistant),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            minLines: 2,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Сообщение',
              suffixIcon: IconButton(
                tooltip: 'Отправить',
                onPressed: () {
                  final text = controller.text.trim();
                  if (text.isEmpty) return;
                  setState(() {
                    messages.add((text: text, assistant: false));
                    messages.add((
                      text:
                          'Принято. Для ответа потребуется подтвержденная норма РК или ручная проверка юриста.',
                      assistant: true
                    ));
                    controller.clear();
                  });
                },
                icon: const Icon(Icons.send_outlined),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressStrip extends StatelessWidget {
  const _ProgressStrip();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Статус обработки',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const LinearProgressIndicator(value: 1),
            const SizedBox(height: 8),
            const Text('transcribing → classifying → validating → ready'),
          ],
        ),
      ),
    );
  }
}

class _CaseSummaryCard extends StatelessWidget {
  const _CaseSummaryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Взыскание долга',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Категория: гражданско-правовой спор'),
            const Text('Готовность: 17% подготовки, не вероятность выигрыша'),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.text, required this.assistant});

  final String text;
  final bool assistant;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: assistant ? Alignment.centerLeft : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Card(
          color: assistant ? Theme.of(context).cardTheme.color : AppColors.gold,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Text(text),
          ),
        ),
      ),
    );
  }
}

class _CaseScaffold extends StatelessWidget {
  const _CaseScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}
