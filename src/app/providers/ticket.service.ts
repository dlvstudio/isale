import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { ITicket } from '../models/ticket.interface';

@Injectable()
export class TicketService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService
        ) {
    }

    save(ticket: ITicket): Promise<number> {
        return new Promise((r,j) => {
            if (this.staffService.isStaff()) {
                ticket.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/ticket/save', ticket).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                ticket.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
