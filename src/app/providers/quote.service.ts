import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class QuoteService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService
    ) {
    }

    getNewOrderData(): Promise<any> {
        const model: any = { };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/order/neworderdata', model);
    }

    getQuotes(staffId): Promise<any[]> {
        const model: any = { table: 'quote' };
        if (staffId) {
            model.staffId = staffId;
        } else if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    get(id: number): Promise<any> {
        const model: any = { id, table: 'quote' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return new Promise((r, j) => {
            this.apiService.post(url, model).then((rets) => {
                if (rets && rets.length) {
                    r(rets[rets.length - 1]);
                }
                r(null);
            }, (err) => { j(err); }).catch((err) => { j(err); });
        });
    }

    delete(quote: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=quote&id=' + quote.id, null);
    }

    save(quote: any): Promise<number> {
        return new Promise((r, j) => {
            quote.table = 'quote';
            this.apiService.post(this.userService.apiUrl + '/data/save', quote).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                quote.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
