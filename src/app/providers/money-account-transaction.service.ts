import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Helper } from './helper.service';
import { DateTimeService } from './datetime.service';
import { IMoneyAccountTransaction } from '../models/money-account-transaction.interface';
import { MoneyAccountTransaction } from '../models/money-account-transaction.model';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class MoneyAccountTransactionService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService
        ) {
    }

    getAllMoneyAccountTransactions(): Promise<IMoneyAccountTransaction[]> {
        return null; //this.sql.getAllLeve1<IMoneyAccountTransaction>(Helper.moneyAccountTransactionTableName, new MoneyAccountTransaction());
    }

    getMoneyAccountTransactionByTrade(tradeId: number): Promise<IMoneyAccountTransaction> {
        let url = this.userService.apiUrl + '/account/getbytrade?tradeId=' + tradeId;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getMoneyAccountTransactionByOrder(orderId: number): Promise<IMoneyAccountTransaction> {
        return this.apiService.get(this.userService.apiUrl + '/account/getbyorder?orderId=' + orderId);
    }

    getMoneyAccountTransactionsByAccount(accountId: number, dateFrom: string = '', dateTo: string = ''): Promise<IMoneyAccountTransaction[]> {
        const data = {dateFrom, dateTo, accountId};
        return this.apiService.post(this.userService.apiUrl + '/account/GetItemsByAccount', data);
    }

    get(id: number): Promise<IMoneyAccountTransaction> {
        return this.apiService.get(this.userService.apiUrl + '/account/getitem?id=' + id);
    }

    deleteMoneyAccountTransaction(trade: IMoneyAccountTransaction): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/account/removeitem?id=' + trade.id, null);
    }
}
