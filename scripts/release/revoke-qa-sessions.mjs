import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Revoke only explicitly selected synthetic intake-test accounts after an
// interrupted check. Never selects customers by display name or arbitrary SQL.
const ids=(process.argv[2] || '').split(',').filter(Boolean);
if(!ids.length || ids.length>5 || ids.some(id=>!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new Error('Explicit QA UUID list required');
const require=createRequire(import.meta.url);
const {DatabaseService}=require(fileURLToPath(new URL('../../services/api/dist/common/database/database.service.js',import.meta.url)));
const db=new DatabaseService();
try {
  const result=await db.query("UPDATE sessions SET revoked_at=now() WHERE revoked_at IS NULL AND user_id IN (SELECT id FROM users WHERE id=ANY($1::uuid[]) AND email LIKE 'intake-qa-%@example.invalid')",[ids]);
  console.log(JSON.stringify({syntheticIntakeSessionsRevoked:result.rowCount}));
} finally {await db.onModuleDestroy();}
