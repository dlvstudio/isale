import { ITicket } from './ticket.interface';

export class Ticket implements ITicket{
    id: number = 0;
    subject: string = '';
    email: string = '';
    content: string = '';
    categoryId: number = 0;
    staffId: number = 0;
}