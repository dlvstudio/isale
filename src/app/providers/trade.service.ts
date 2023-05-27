import { ITradeToCategory } from './../models/trade-to-category.interface';
import { ITradeCategory } from './../models/trade-category.interface';
import { ITrade } from './../models/trade.interface';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class TradeService {

    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService
    ) {
    }

    getTrades(dateFrom: string = '', dateTo: string = '', isReceived = -1): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, isReceived };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradeCategories(): Promise<ITradeCategory[]> {
        let url = this.userService.apiUrl + '/category/list';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url, null);
    }

    getCategoriesToTrade(tradeId: number): Promise<ITradeToCategory[]> {
        let url = this.userService.apiUrl + '/category/GetCategoriesToTrade?tradeId=' + tradeId;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url, null);
    }

    getCategoriesOfProducts(productIds: number[]): Promise<ITradeToCategory[]> {
        const data: any = { ids: productIds };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/GetCategoriesOfProducts', data);
    }

    getAllCategoriesToTrade(): Promise<ITradeToCategory[]> {
        let url = this.userService.apiUrl + '/category/GetAllCategoriesToTrade';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url, null);
    }

    getTradesByCategory(categoryId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, categoryId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/GetTradesByCategory', data);
    }

    saveCategoriesToTrade(categories: ITradeToCategory[], tradeId: number): Promise<any> {
        const data: any = { categories, tradeId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/SaveCategoriesToTrade', data);
    }

    deleteCategoriesToTrade(categories: ITradeToCategory[]): Promise<any> {
        const data: any = { categories };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/DeleteCategoriesToTrade', data);
    }

    getTradesByContact(contactId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, contactId };
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByAccount(moneyAccountId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, moneyAccountId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByOrder(orderId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, orderId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByReceivedNote(receivedNoteId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, receivedNoteId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByTransferNote(transferNoteId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, transferNoteId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByStaff(staffId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data = { dateFrom, dateTo, staffId };
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByDebt(debtId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, debtId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    getTradesByProduct(productId: number, dateFrom: string = '', dateTo: string = ''): Promise<ITrade[]> {
        const data: any = { dateFrom, dateTo, productId };
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/trade/list', data);
    }

    get(id: number): Promise<ITrade> {
        let url = this.userService.apiUrl + '/trade?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getCategory(id: number): Promise<ITradeCategory> {
        let url = this.userService.apiUrl + '/category?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    deleteTrade(trade: ITrade): Promise<any> {
        let url = this.userService.apiUrl + '/trade/remove?id=' + trade.id + '&saveAccount=true';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteCategory(category: ITradeCategory): Promise<any> {
        let url = this.userService.apiUrl + '/category/remove?id=' + category.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    saveTrade(trade: ITrade): Promise<number> {
        if (trade) {
            trade.saveAccount = true;
        }
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/trade/savetrade', trade).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                trade.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveCategory(category: ITradeCategory): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/category/savecategory', category).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                category.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
