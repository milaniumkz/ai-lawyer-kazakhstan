import { assertAdminRole } from '../../common/admin-rbac';
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { assertUserId } from '../../common/user-context';
import { CaseActivityService, DispatchRecord } from './case-activity.service';
@Controller()
export class CaseActivityController {
  constructor(private readonly activity:CaseActivityService) {}
  @Post('support/tickets')
  createTicket(@Body() body:{topic:string;text:string},@Headers('x-user-id') userId='') {return this.activity.createTicket(body,assertUserId(userId));}
  @Get('support/tickets')
  listTickets(@Headers('x-user-id') userId='') {return this.activity.listTickets(assertUserId(userId));}
  @Get('admin/support/tickets')
  adminTickets(@Headers('x-user-role') role='') {assertAdminRole(role);return this.activity.listTickets();}
  @Patch('admin/support/tickets/:ticketId')
  replyTicket(@Param('ticketId') id:string,@Body() body:{reply:string;status:'open'|'resolved'},@Headers('x-user-role') role='') {assertAdminRole(role);return this.activity.replyTicket(id,body);}
  @Get('admin/overview')
  overview(@Headers('x-user-role') role='') {assertAdminRole(role);return this.activity.overview();}
  @Get('tasks')
  listTasks(@Headers('x-user-id') userId='') {return this.activity.listTasks(assertUserId(userId));}
  @Post('tasks')
  createTask(@Body() body:{title:string;dueDate:string;caseId?:string},@Headers('x-user-id') userId='') {return this.activity.createTask(body,assertUserId(userId));}
  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') id:string,@Body() body:{status:'pending'|'completed'},@Headers('x-user-id') userId='') {return this.activity.updateTask(id,body.status,assertUserId(userId));}
  @Delete('tasks/:taskId')
  deleteTask(@Param('taskId') id:string,@Headers('x-user-id') userId='') {return this.activity.deleteTask(id,assertUserId(userId));}
  @Get('generated-documents/:documentId/dispatches')
  listDispatches(@Param('documentId') id:string,@Headers('x-user-id') userId='') {return this.activity.listDispatches(id,assertUserId(userId));}
  @Post('generated-documents/:documentId/dispatches')
  createDispatch(@Param('documentId') id:string,@Body() body:{method:DispatchRecord['method'];contact:string;message?:string;status?:DispatchRecord['status'];confirmed?:boolean},@Headers('x-user-id') userId='') {return this.activity.createDispatch(id,body,assertUserId(userId));}
}
