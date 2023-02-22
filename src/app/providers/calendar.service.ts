import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class CalendarService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService) {
    }

    getCalendars(storeId): Promise<any[]> {
        const model: any = { table: 'calendar', storeId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    deleteCalendar(calendar): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=calendar&id=' + calendar.id, null);
    }

    getCalendar(id: number): Promise<any> {
        return this.apiService.get(this.userService.apiUrl + '/data?table=calendar&id=' + id);
    }

    saveCalendar(model: any): Promise<number> {
        return new Promise((r, j) => {
            model.table = 'calendar';
            if (this.staffService.selectedStaff) {
                model.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', model).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                model.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
