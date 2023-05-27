import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { UserService } from './user.service';

@Injectable()
export class FamilyService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        ) {
    }

    getMember(id: number): Promise<any> {
        const url = this.userService.apiUrl + '/family/member' + (id ? '?id=' + id : '');
        return this.apiService.get(url);
    }

    getMembers(): Promise<any[]> {
        const url = this.userService.apiUrl + '/family/members';
        return this.apiService.get(url);
    }

    getFamily(): Promise<any> {
        return this.apiService.get(this.userService.apiUrl + '/family/family');
    }

    saveFamily(family: any, member: any): Promise<number> {
        return new Promise((r, j) => {
            const model = {family, member};
            this.apiService.post(this.userService.apiUrl + '/family/saveFamily', model).then(res => {
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

    saveFamilyInfo(family: any): Promise<number> {
        return new Promise((r, j) => {
            const model = family;
            this.apiService.post(this.userService.apiUrl + '/family/saveFamilyInfo', model).then(res => {
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

    saveMember(member: any): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/family/saveMember', member).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                member['id'] = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
