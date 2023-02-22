import { Injectable } from '@angular/core';
import { IMoneyAccount } from '../models/money-account.interface';
import { IMoneyAccountTransaction } from '../models/money-account-transaction.interface';
import { UserService } from './user.service';
import { ApiService } from './api.service';

@Injectable()
export class MoneyAccountService {

    constructor(
        private apiService: ApiService,
        private userService: UserService
    ) {
    }

    getMoneyAccounts(): Promise<IMoneyAccount[]> {
        return this.apiService.post(this.userService.apiUrl + '/account/Accounts', null);
    }

    get(id: number): Promise<IMoneyAccount> {
        return this.apiService.get(this.userService.apiUrl + '/account?id=' + id);
    }

    getDefault(): Promise<IMoneyAccount> {
        return this.apiService.get(this.userService.apiUrl + '/account/getdefault');
    }

    deleteMoneyAccount(product: IMoneyAccount): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/account/remove?id=' + product.id, null);
    }

    saveMoneyAccount(product: IMoneyAccount): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/account/saveaccount', product).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                product.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
