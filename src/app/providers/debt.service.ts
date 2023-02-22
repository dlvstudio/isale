import { IDebtToCategory } from './../models/debt-to-category.interface';
import { IDebt } from './../models/debt.interface';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class DebtService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService
        ) {
    }

    getDebts(dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, storeId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    getDebtsByType(debtType: number = 0, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, debtType};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    getDebtsByOrder(orderId: number = 0, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, orderId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    getDebtsByReceivedNote(receivedNoteId: number = 0, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, receivedNoteId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    getCategoriesToDebt(debtId: number): Promise<IDebtToCategory[]> {
        let url = this.userService.apiUrl + '/category/GetCategoriesToDebt?debtId=' + debtId;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url, null);
    }

    getAllCategoriesToDebt(): Promise<IDebtToCategory[]> {
        let url = this.userService.apiUrl + '/category/GetAllCategoriesToDebt';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url, null);
    }

    getDebtsByCategory(categoryId: number, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, categoryId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/GetDebtsByCategory', data);
    }

    syncDebtToCategory(debtToCategory: IDebtToCategory): Promise<number> {
        return new Promise((r, j) => {
            const offlineId = debtToCategory.id;
            const offlineTradeId = debtToCategory.debtId;
            const offlineCategoryId = debtToCategory.categoryId;
            debtToCategory.id = 0;
            debtToCategory.debtId = debtToCategory.debt && debtToCategory.debtId ? debtToCategory.debt.onlineId : 0;
            debtToCategory.categoryId = debtToCategory.tradeCategory && debtToCategory.categoryId
                ? debtToCategory.tradeCategory.onlineId
                : 0;
            const data = { categories: [debtToCategory], debtId: debtToCategory.debtId};
            this.apiService.post(this.userService.apiUrl + '/category/SaveCategoriesToDebt', data).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res as number[];
                if (!ret || !ret.length) {
                    r(0);
                    return;
                }
                debtToCategory.onlineId = ret[0];
                debtToCategory.id = offlineId;
                debtToCategory.debtId = offlineTradeId;
                debtToCategory.categoryId = offlineCategoryId;
                this.saveCategoriesToDebt([debtToCategory], debtToCategory.debtId).then((result) => {
                    if (!result) {
                        r(0);
                        return;
                    }
                    r(ret[0]);
                }).catch((err) => {
                    j(err);
                });
            }, (err) => {
                j(err);
            });
        });
    }

    saveCategoriesToDebt(categories: IDebtToCategory[], debtId: number): Promise<any> {
        const data: any = {categories, debtId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/SaveCategoriesToDebt', data);
    }

    deleteCategoriesToDebt(categories: IDebtToCategory[]): Promise<any> {
        const data: any = {categories};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/DeleteCategoriesToDebt', data);
    }

    getDebtsByContact(contactId: number, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, contactId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    getDebtsByProduct(productId: number, dateFrom: string = '', dateTo: string = ''): Promise<IDebt[]> {
        const data: any = {dateFrom, dateTo, productId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/debt/list', data);
    }

    get(id: number): Promise<IDebt> {
        let url = this.userService.apiUrl + '/debt?id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    deleteDebt(debt: IDebt): Promise<any> {
        let url = this.userService.apiUrl + '/debt/remove?id=' + debt.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    saveDebt(debt: IDebt): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/debt/savedebt', debt).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                debt.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }
}
