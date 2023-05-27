import { Injectable } from '@angular/core';


import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class ShiftService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService) {
    }

    getAll(): Promise<any[]> {
        const model: any = { table: 'shift' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    delete(shift): Promise<any> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=shift&id=' + shift.id + (staffId ? '&staffId=' + staffId : ''), null);
    }

    get(id: number): Promise<any> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.get(this.userService.apiUrl + '/data?table=shift&id=' + id + (staffId ? '&staffId=' + staffId : ''));
    }

    save(model: any): Promise<number> {
        return new Promise((r, j) => {
            model['table'] = 'shift';
            if (this.staffService.selectedStaff) {
                model['staffId'] = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', model).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                model['id'] = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
