import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { StorageService } from './storage.service';

@Injectable()
export class StoreService {

    private store: any = null;

    constructor(private apiService: ApiService,
                private userService: UserService,
                private storageService: StorageService,
                private staffService: StaffService    ) {
    }

    getStores(): Promise<any[]> {
        const model: any = { table: 'store' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    countStores(): Promise<number> {
        const model: any = { table: 'store' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/countequal';
        return this.apiService.post(url, model);
    }

    getStore(id: number): Promise<any> {
        const model: any = { id, table: 'store' };
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

    deleteStore(store: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=store&id=' + store.id, null);
    }

    saveStore(store: any): Promise<number> {
        return new Promise((r, j) => {
            store.table = 'store';
            this.apiService.post(this.userService.apiUrl + '/data/save', store).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                store.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    async loginAsStore(store) {
        this.store = store;
        await this.storageService.set('store-' + this.userService.loggedUser.id, JSON.stringify(store));
    }

    async exitStore() {
        this.store = null;
        if (this.userService.loggedUser) {
            await this.storageService.remove('store-' + this.userService.loggedUser.id);
        }
    }

    async getCurrentStore() {
        if (this.store) {
            return this.store;
        }
        const storeStr = await this.storageService.get('store-' + this.userService.loggedUser.id);
        if (storeStr) {
            this.store = JSON.parse(storeStr);
        }
        return this.store;
    }
}
