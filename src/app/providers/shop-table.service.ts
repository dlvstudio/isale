import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { IOrder } from '../models/order.interface';

@Injectable()
export class ShopTableService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService) {
    }

    getTables(storeId: number): Promise<any[]> {
        const model: any = { table: 'table', storeId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getProcessingOrders(): Promise<IOrder[]> {
        const model: any = { table: 'order', status: 0 };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    deleteTable(table): Promise<any> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=table&id=' + table.id + (staffId ? '&staffId=' + staffId : ''), null);
    }

    getTable(id: number): Promise<any> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.get(this.userService.apiUrl + '/data?table=table&id=' + id + (staffId ? '&staffId=' + staffId : ''));
    }

    saveTable(model: any): Promise<number> {
        return new Promise((r, j) => {
            model['table'] = 'table';
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
