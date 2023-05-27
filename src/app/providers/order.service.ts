import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { IOrder } from '../models/order.interface';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { TradeService } from './trade.service';
import { DebtService } from './debt.service';

@Injectable()
export class OrderService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private tradeService: TradeService,
        private debtService: DebtService,
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

    getOrders(staffId, dateFrom: string = '', dateTo: string = '', storeId = 0, status = null): Promise<IOrder[]> {
        const data: any = { dateFrom, dateTo, storeId, status };
        if (staffId) {
            data.staffId = staffId;
        } else if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/order/list', data);
    }

    getOnlineOrders(dateFrom: string = '', dateTo: string = '', status = null, filterByStaff = false): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=online_order';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (filterByStaff) {
            url += '&filterByStaff=' + filterByStaff;
        }
        if (dateFrom) {
            url += '&dateFrom=' + dateFrom;
        }
        if (dateTo) {
            url += '&dateTo=' + dateTo;
        }
        if (status !== null) {
            url += '&status=' + status;
        }
        return this.apiService.get(url);
    }

    getOrdersByContact(contactId: number, dateFrom: string = '', dateTo: string = ''): Promise<IOrder[]> {
        const data: any = { dateFrom, dateTo, contactId };
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/order/list', data);
    }

    getOrdersByStaff(staffId: number, dateFrom: string = '', dateTo: string = ''): Promise<IOrder[]> {
        const data = { dateFrom, dateTo, staffId };
        return this.apiService.post(this.userService.apiUrl + '/order/list', data);
    }

    get(id: number): Promise<IOrder> {
        let url = this.userService.apiUrl + '/order?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getByCode(code: string): Promise<IOrder> {
        let url = this.userService.apiUrl + '/order/getByCode?code=' + code;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getOnlineOrder(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=online_order&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    deleteOnlineOrder(order: any): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=online_order&id=' + order.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    async deleteOrder(order: IOrder): Promise<any> {
        let url = this.userService.apiUrl + '/order/remove?id=' + order.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        const arr = [];
        const trades = await this.tradeService.getTradesByOrder(order.id);
        for (const trade of trades) {
            arr.push(this.tradeService.deleteTrade(trade));
        }
        const debts = await this.debtService.getDebtsByOrder(order.id);
        for (const debt of debts) {
            arr.push(this.debtService.deleteDebt(debt));
        }
        arr.push(this.apiService.post(url, null));
        return Promise.all(arr);
    }

    saveOrder(order: IOrder): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/order/saveorder', order).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                order.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveOrderStatus(orderInput: IOrder): Promise<number> {
        const order = JSON.parse(JSON.stringify(orderInput));
        if (this.staffService.selectedStaff) {
            order.staffId = this.staffService.selectedStaff.id.toString();
        }
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/order/SaveStatus', order).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                order.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveOnlineOrder(order: any): Promise<number> {
        return new Promise((r, j) => {
            order['table'] = 'online_order';
            if (this.staffService.isStaff()) {
                order.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', order).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                order.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    getOrderCode(): string {
        return moment().format('YYMMDD-HHmmss');
    }
}
