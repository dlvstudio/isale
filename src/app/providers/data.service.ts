import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class DataService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService) {
    }

    getFirstObject(table: string): Promise<any> {
        return new Promise((r, j) => {
            this.getObjects(table).then((rets) => {
                if (rets && rets.length) {
                    r(rets[rets.length - 1]);
                    return;
                }
                r(null);
            }, (err) => { j(err); }).catch((err) => { j(err); });
        });
    }

    async uploadPicture(file: any): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        return this.apiService.uploadWithPost(this.userService.apiUrl + '/picture/Upload', file, lang, 0, 0);
    }

    async uploadPictureBase64(base64: string): Promise<any> {
        const body = { base64 };
        return this.apiService.post(this.userService.apiUrl + '/picture/UploadBase64', body);
    }

    getOwnerObjects(table: string): Promise<any[]> {
        const url = this.userService.apiUrl + '/data/list?table=' + table;
        return this.apiService.get(url);
    }

    getObjects(table, filterByStaff = 0): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=' + table;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (filterByStaff) {
            url += '&filterByStaff=' + filterByStaff;
        }
        return this.apiService.get(url);
    }

    get(table: string, id: number): Promise<any> {
        return this.apiService.get(this.userService.apiUrl + '/data?table=' + table + '&id=' + id);
    }

    save(table: string, model: any): Promise<number> {
        return new Promise((r, j) => {
            if (this.staffService.selectedStaff && (table === 'calendar' || table === 'order')) {
                model['staffId'] = this.staffService.selectedStaff.id.toString();
            }
            model['table'] = table;
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

    delete(table: string, model: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=' + table + '&id=' + model.id, null);
    }
}
