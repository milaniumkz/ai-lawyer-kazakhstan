import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ai_lawyer_kz/src/api/draft_store.dart';
import 'package:ai_lawyer_kz/src/api/session_credentials.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test(
      'restores intake and server task after process state reset, isolates accounts',
      () async {
    FlutterSecureStorage.setMockInitialValues({});
    SessionCredentials.token = 'fixture';
    await DraftStore.restore('owner');
    MobileCaseRuntime.startDraft();
    MobileCaseRuntime.confirmedText = 'Unsent synthetic facts';
    MobileCaseRuntime.activeCaseId = 'case-fixture';
    await MobileCaseRuntime.persist();
    WorkflowRuntime.generationJobId = 'job-fixture';
    WorkflowRuntime.generatedBody = 'Edited synthetic draft';
    await WorkflowRuntime.persist();
    MobileCaseRuntime.confirmedText = '';
    WorkflowRuntime.generationJobId = '';
    await DraftStore.restore('owner');
    MobileCaseRuntime.restore();
    WorkflowRuntime.restore();
    expect(MobileCaseRuntime.confirmedText, 'Unsent synthetic facts');
    expect(MobileCaseRuntime.activeCaseId, 'case-fixture');
    expect(WorkflowRuntime.generationJobId, 'job-fixture');
    expect(WorkflowRuntime.generatedBody, 'Edited synthetic draft');
    await DraftStore.restore('other');
    expect(DraftStore.values, isEmpty);
    await DraftStore.restore('owner');
    await DraftStore.clear();
    await DraftStore.restore('owner');
    expect(DraftStore.values, isEmpty);
    SessionCredentials.token = '';
    MobileCaseRuntime.startDraft();
    WorkflowRuntime.generatedBody = '';
    WorkflowRuntime.generationJobId = '';
  });
}
