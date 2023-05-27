import { IDebt } from './../models/debt.interface';
import { DebtService } from './debt.service';
import { Injectable } from '@angular/core';

import { INote } from './../models/note.interface';
import { IContact } from './../models/contact.interface';
import { ITrade } from './../models/trade.interface';

import { NoteService } from './note.service';
import { TradeService } from './trade.service';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class ContactService {

    constructor(
        private apiService: ApiService,
        private noteService: NoteService,
        private userService: UserService,
        private debtService: DebtService,
        private staffService: StaffService,
        private tradeService: TradeService
    ) {
    }

    getContacts(filterByStaff = 0): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=contact';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (filterByStaff) {
            url += '&filterByStaff=' + filterByStaff;
        }
        return this.apiService.get(url);
    }

    getSalesLines(filterByStaff = 0): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=sales_line';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (filterByStaff) {
            url += '&filterByStaff=' + filterByStaff;
        }
        return this.apiService.get(url);
    }

    getBusinessTypes(filterByStaff = 0): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=business_type';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        if (filterByStaff) {
            url += '&filterByStaff=' + filterByStaff;
        }
        return this.apiService.get(url);
    }

    get(id: number): Promise<IContact> {
        let url = this.userService.apiUrl + '/data?table=contact&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getSalesLine(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=sales_line&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getBusinessType(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=business_type&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    updatePoint(contactPoint: any): Promise<number> {
        return new Promise((r, j) => {
            contactPoint['table'] = 'contact_point';
            if (this.staffService.isStaff()) {
                contactPoint.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', contactPoint).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                contactPoint.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveContact(contact: IContact): Promise<number> {
        return new Promise((r, j) => {
            contact['table'] = 'contact';
            if (this.staffService.isStaff()) {
                contact.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', contact).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                contact.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveSalesLine(salesLine: any): Promise<number> {
        return new Promise((r, j) => {
            salesLine['table'] = 'sales_line';
            if (this.staffService.isStaff()) {
                salesLine.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', salesLine).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                salesLine.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveBusinessType(businessType: any): Promise<number> {
        return new Promise((r, j) => {
            businessType['table'] = 'business_type';
            if (this.staffService.isStaff()) {
                businessType.staffId = this.staffService.selectedStaff.id;
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', businessType).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                businessType.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    async searchContactByFbUserId(fbUserId: any): Promise<IContact> {
        const data: any = { fbUserId, table: 'contact' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr[0];
        }
        return null;
    }

    async searchContactByPhone(mobile: any): Promise<IContact> {
        const data: any = { mobile, table: 'contact' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr[0];
        }
        return null;
    }

    async getCustomerPriceByContactAndProduct(contactId: number, productId: number): Promise<any> {
        const data: any = { contactId, productId, table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr[0];
        }
        return null;
    }

    getCollaboratorPrices(): Promise<any[]> {
        const data: any = { isCollaboratorPrice: 1, table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCollaboratorDiscounts(): Promise<any[]> {
        const data: any = { isCollaboratorPrice: 1, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerPricesByStaff(collaboratorId: number): Promise<any[]> {
        const data: any = { collaboratorId, table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerPricesByContact(contactId: number): Promise<any[]> {
        const data: any = { contactId, table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerPricesByProduct(productId: number): Promise<any[]> {
        const data: any = { productId, table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerPrice(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=customer_price&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    saveCustomerPrice(customerPrice: any): Promise<number> {
        return new Promise((r, j) => {
            customerPrice.table = 'customer_price';
            if (this.staffService.isStaff()) {
                customerPrice.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', customerPrice).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                customerPrice.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    getAllPrices(): Promise<any[]> {
        const data: any = { table: 'customer_price' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getAllDiscounts(): Promise<any[]> {
        const data: any = { table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getProductDiscounts(): Promise<any[]> {
        const data: any = { contactId: 0, collaboratorId: 0, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerDiscountsByContact(contactId: number): Promise<any[]> {
        const data: any = { contactId, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerDiscountsByStaff(collaboratorId: number): Promise<any[]> {
        const data: any = { collaboratorId, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerDiscountsByProduct(productId: number): Promise<any[]> {
        const data: any = { productId, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerDiscountsByCategory(categoryId: number): Promise<any[]> {
        const data: any = { categoryId, table: 'customer_discount' };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getCustomerDiscount(id: number): Promise<any> {
        return this.apiService.get(this.userService.apiUrl + '/data?table=customer_discount&id=' + id);
    }

    saveCustomerDiscount(customerDiscount: any): Promise<number> {
        return new Promise((r, j) => {
            customerDiscount.table = 'customer_discount';
            if (this.staffService.isStaff()) {
                customerDiscount.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', customerDiscount).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                customerDiscount.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    deleteContact(contact: IContact): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=contact&id=' + contact.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteCustomerPrice(customerPrice: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=customer_price&id=' + customerPrice.id, null);
    }

    deleteCustomerDiscount(customerDiscount: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=customer_discount&id=' + customerDiscount.id, null);
    }

    deleteContactNotes(contactId: number): Promise<any> {
        return new Promise((res, rej) => {
            this.noteService.getNotesByContact(contactId).then((notes: INote[]) => {
                const ar: Promise<any>[] = [];
                if (notes && notes.length > 0) {
                    for (const note of notes) {
                        const p = this.noteService.deleteNote(note);
                        ar.push(p);
                    }
                }
                if (ar.length > 0) {
                    Promise.all(ar).then(() => {
                        res(true);
                    }).catch(() => {
                        rej(null);
                    });
                    return;
                }
                res(true);
            }).catch(() => {
                rej(null);
            });
        });
    }

    deleteContactTrades(contactId: number): Promise<any> {
        return new Promise((res, rej) => {
            this.tradeService.getTradesByContact(contactId).then((trades: ITrade[]) => {
                const ar: Promise<any>[] = [];
                if (trades && trades.length > 0) {
                    for (const trade of trades) {
                        const p = this.tradeService.deleteTrade(trade);
                        ar.push(p);
                    }
                }
                if (ar.length > 0) {
                    Promise.all(ar).then(() => {
                        res(true);
                    }).catch(() => {
                        rej(null);
                    });
                    return;
                }
                res(true);
            }).catch(() => {
                rej(null);
            });
        });
    }

    deleteContactDebts(contactId: number): Promise<any> {
        return new Promise((res, rej) => {
            this.debtService.getDebtsByContact(contactId).then((debts: IDebt[]) => {
                const ar: Promise<any>[] = [];
                if (debts && debts.length > 0) {
                    for (const debt of debts) {
                        const p = this.debtService.deleteDebt(debt);
                        ar.push(p);
                    }
                }
                if (ar.length > 0) {
                    Promise.all(ar).then(() => {
                        res(true);
                    }).catch(() => {
                        rej(null);
                    });
                    return;
                }
                res(true);
            }).catch(() => {
                rej(null);
            });
        });
    }
}
