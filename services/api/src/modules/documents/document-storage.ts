import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

// Separate case namespaces allow account deletion without affecting other users' files.
export function documentStorageRoot(caseId: string) {
  const namespace = createHash('sha256').update(caseId).digest('hex');
  return join(process.env.DOCUMENT_UPLOAD_DIR ?? join(process.cwd(), 'var', 'documents'), namespace);
}
export async function removeCaseStorage(caseId: string) {
  await rm(documentStorageRoot(caseId), { recursive: true, force: true });
}
