import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class TransferNoteService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService
    ) {
    }

    getNotes(dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<any[]> {
        const data: any = {dateFrom, dateTo, storeId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/TransferNote/list', data);
    }

    getTransferNotesByStaff(staffId: number, dateFrom: string = '', dateTo: string = ''): Promise<any[]> {
        const data: any = {dateFrom, dateTo, staffId};
        return this.apiService.post(this.userService.apiUrl + '/TransferNote/list', data);
    }

    get(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/TransferNote?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    async delete(note: any): Promise<any> {
        const arr = [];
        arr.push(this.apiService.post(this.userService.apiUrl + '/TransferNote/remove?id=' + note.id, null));
        return Promise.all(arr);
    }

    save(note: any): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/TransferNote/save', note).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                note.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
