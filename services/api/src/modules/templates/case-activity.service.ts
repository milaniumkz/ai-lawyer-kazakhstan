import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../common/database/database.service';
import { CasesService } from '../cases/cases.service';
import { TemplatesService } from './templates.service';
export interface UserTask {id:string; ownerUserId:string; caseId?:string; title:string; dueDate:string; status:'pending'|'completed'; basis:'user_defined'; createdAt:string}
export interface DispatchRecord {id:string; documentId:string; ownerUserId:string; method:'email'|'whatsapp'|'sms'|'post'; contact:string; message:string; status:'draft'|'manual_sent_unverified'; createdAt:string; confirmedAt?:string}
@Injectable()
export class CaseActivityService {
  private readonly tasks=new Map<string,UserTask>();
  private readonly dispatches=new Map<string,DispatchRecord>();
  private get persistent() {return Boolean(process.env.DATABASE_URL);}
  constructor(private readonly db:DatabaseService,private readonly cases:CasesService,private readonly templates:TemplatesService) {}
  private readonly tickets=new Map<string,{id:string;ownerUserId:string;topic:string;text:string;status:string;createdAt:string}>();
  async createTicket(input:{topic:string;text:string},userId:string) {
    if(typeof input.topic!=='string'||!input.topic.trim()||input.topic.length>100||typeof input.text!=='string'||input.text.trim().length<8||input.text.length>20000) throw new BadRequestException('SUPPORT_TEXT_INVALID');
    const ticket={id:randomUUID(),ownerUserId:userId,topic:input.topic.trim(),text:input.text.trim(),status:'open',createdAt:new Date().toISOString()};
    if(this.persistent) await this.db.query('INSERT INTO support_tickets (id,owner_user_id,payload) VALUES ($1,$2,$3::jsonb)',[ticket.id,userId,JSON.stringify(ticket)]);
    else this.tickets.set(ticket.id,ticket);
    return ticket;
  }
  async replyTicket(id:string,input:{reply:string;status:'open'|'resolved'}) {
    if(typeof input.reply!=='string'||!input.reply.trim()||input.reply.length>20000||!['open','resolved'].includes(input.status)) throw new BadRequestException('SUPPORT_REPLY_INVALID');
    if(this.persistent) {const result=await this.db.query<{payload:unknown}>("UPDATE support_tickets SET payload=payload || jsonb_build_object('reply',$2::text,'status',$3::text,'repliedAt',now()) WHERE id=$1 RETURNING payload",[id,input.reply.trim(),input.status]); if(!result.rows[0]) throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND');return result.rows[0].payload;}
    const ticket=this.tickets.get(id);if(!ticket) throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND');Object.assign(ticket,{reply:input.reply.trim(),status:input.status,repliedAt:new Date().toISOString()});return ticket;
  }
  async overview() {
    if(!this.persistent) return {caseCount:null,documentReviewCount:null,openTicketCount:[...this.tickets.values()].filter(ticket=>ticket.status==='open').length,aiCostKzt:null};
    const result=await this.db.query<{case_count:number;document_review_count:number;open_ticket_count:number;ai_cost_kzt:number}>(`SELECT (SELECT count(*)::int FROM legal_cases) case_count,(SELECT count(*)::int FROM files WHERE status='ocr_review_required') document_review_count,(SELECT count(*)::int FROM support_tickets WHERE payload->>'status'='open') open_ticket_count,(SELECT coalesce(sum(estimated_cost_kzt),0) FROM ai_usage_events WHERE created_at>=date_trunc('month',now()))::float ai_cost_kzt`);
    const row=result.rows[0];return {caseCount:row.case_count,documentReviewCount:row.document_review_count,openTicketCount:row.open_ticket_count,aiCostKzt:row.ai_cost_kzt};
  }
  async listTickets(userId?:string) {
    if(this.persistent) return (await this.db.query<{payload:unknown}>(userId?'SELECT payload FROM support_tickets WHERE owner_user_id=$1 ORDER BY created_at DESC':'SELECT payload FROM support_tickets ORDER BY created_at DESC LIMIT 100',userId?[userId]:[])).rows.map(row=>row.payload);
    return [...this.tickets.values()].filter(ticket=>!userId||ticket.ownerUserId===userId).reverse();
  }
  async listTasks(userId:string) {
    if(this.persistent) return (await this.db.query<{payload:UserTask}>('SELECT payload FROM user_tasks WHERE owner_user_id=$1 ORDER BY payload->>\'dueDate\',created_at',[userId])).rows.map(row=>row.payload);
    return [...this.tasks.values()].filter(task=>task.ownerUserId===userId).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  }
  async createTask(input:{title:string; dueDate:string; caseId?:string},userId:string) {
    if(typeof input.title!=='string' || !input.title.trim() || input.title.length>200) throw new BadRequestException('TASK_TITLE_INVALID');
    if(typeof input.dueDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) || !Number.isFinite(Date.parse(input.dueDate)) || new Date(input.dueDate).toISOString().slice(0,10)!==input.dueDate) throw new BadRequestException('TASK_DATE_INVALID');
    if(input.caseId) await this.cases.getCase(input.caseId,userId);
    const task:UserTask={id:randomUUID(),ownerUserId:userId,caseId:input.caseId,title:input.title.trim(),dueDate:input.dueDate,status:'pending',basis:'user_defined',createdAt:new Date().toISOString()};
    if(this.persistent) await this.db.query('INSERT INTO user_tasks (id,owner_user_id,case_id,payload) VALUES ($1,$2,$3,$4::jsonb)',[task.id,userId,input.caseId??null,JSON.stringify(task)]);
    else this.tasks.set(task.id,task);
    return task;
  }
  async updateTask(id:string,status:'pending'|'completed',userId:string) {
    if(!['pending','completed'].includes(status)) throw new BadRequestException('TASK_STATUS_INVALID');
    if(this.persistent) {const result=await this.db.query<{payload:UserTask}>("UPDATE user_tasks SET payload=payload || jsonb_build_object('status',$3::text) WHERE id=$1 AND owner_user_id=$2 RETURNING payload",[id,userId,status]); if(!result.rows[0]) throw new NotFoundException('TASK_NOT_FOUND'); return result.rows[0].payload;}
    const task=this.tasks.get(id); if(!task || task.ownerUserId!==userId) throw new NotFoundException('TASK_NOT_FOUND'); task.status=status; return task;
  }
  async deleteTask(id:string,userId:string) {
    if(this.persistent) {const result=await this.db.query('DELETE FROM user_tasks WHERE id=$1 AND owner_user_id=$2 RETURNING id',[id,userId]);if(!result.rows.length) throw new NotFoundException('TASK_NOT_FOUND');}
    else {const task=this.tasks.get(id);if(!task || task.ownerUserId!==userId) throw new NotFoundException('TASK_NOT_FOUND');this.tasks.delete(id);}
    return {deleted:true};
  }
  async listDispatches(documentId:string,userId:string) {
    await this.templates.getGenerated(documentId,userId);
    if(this.persistent) return (await this.db.query<{payload:DispatchRecord}>('SELECT payload FROM document_dispatches WHERE document_id=$1 AND owner_user_id=$2 ORDER BY created_at DESC',[documentId,userId])).rows.map(row=>row.payload);
    return [...this.dispatches.values()].filter(item=>item.documentId===documentId && item.ownerUserId===userId).reverse();
  }
  async createDispatch(documentId:string,input:{method:DispatchRecord['method']; contact:string; message?:string; status?:DispatchRecord['status']; confirmed?:boolean},userId:string) {
    await this.templates.getGenerated(documentId,userId);
    if(!['email','whatsapp','sms','post'].includes(input.method)) throw new BadRequestException('DISPATCH_METHOD_INVALID');
    const contact=typeof input.contact==='string' ? input.contact.trim() : '';
    if(contact.length>300 || (input.method==='email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : input.method==='post' ? contact.length<5 : !/^\+?\d{7,15}$/.test(contact.replace(/[ ()-]/g,'')))) throw new BadRequestException('RECIPIENT_INVALID');
    const status=input.status ?? 'draft';
    if(!['draft','manual_sent_unverified'].includes(status) || (status==='manual_sent_unverified' && input.confirmed!==true)) throw new BadRequestException('MANUAL_SEND_CONFIRMATION_REQUIRED');
    if(input.message!==undefined && (typeof input.message!=='string' || input.message.length>20000)) throw new BadRequestException('DISPATCH_MESSAGE_INVALID');
    const record:DispatchRecord={id:randomUUID(),documentId,ownerUserId:userId,method:input.method,contact,message:input.message??'',status,createdAt:new Date().toISOString(),...(status==='manual_sent_unverified'?{confirmedAt:new Date().toISOString()}:{})};
    if(this.persistent) await this.db.query('INSERT INTO document_dispatches (id,document_id,owner_user_id,payload) VALUES ($1,$2,$3,$4::jsonb)',[record.id,documentId,userId,JSON.stringify(record)]);
    else this.dispatches.set(record.id,record);
    return record;
  }
}
