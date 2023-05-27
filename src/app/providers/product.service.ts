import { IDebt } from './../models/debt.interface';
import { DebtService } from './debt.service';
import { ITrade } from './../models/trade.interface';
import { TradeService } from './trade.service';
import { IProduct } from './../models/product.interface';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { IProductNoteItem } from '../models/product-note.interface';
import { StoreService } from './store.service';

@Injectable()
export class ProductService {

    constructor(private apiService: ApiService,
        private storeService: StoreService,
        private debtService: DebtService,
        private tradeService: TradeService,
        private staffService: StaffService,
        private userService: UserService
    ) {
    }

    getProducts(storeId, categoryId, isMaterial = false): Promise<IProduct[]> {
        let url = this.userService.apiUrl + '/product/list';
        const arr = [];
        if (this.staffService.selectedStaff) {
            arr.push('staffId=' + this.staffService.selectedStaff.id.toString());
        }
        if (this.storeService.getCurrentStore()) {
            arr.push('storeId=' + storeId);
        }
        if (categoryId) {
            arr.push('categoryId=' + categoryId);
        }
        if (isMaterial) {
            arr.push('isMaterial=true');
        }
        if (arr.length) {
            const params = arr.join('&');
            url += '?' + params;
        }
        return this.apiService.get(url);
    }

    getProductsExpiry(storeId, categoryId, isMaterial = false): Promise<IProduct[]> {
        let url = this.userService.apiUrl + '/product/ListExpiries';
        const arr = [];
        if (this.staffService.selectedStaff) {
            arr.push('staffId=' + this.staffService.selectedStaff.id.toString());
        }
        if (this.storeService.getCurrentStore()) {
            arr.push('storeId=' + storeId);
        }
        if (categoryId) {
            arr.push('categoryId=' + categoryId);
        }
        if (isMaterial) {
            arr.push('isMaterial=true');
        }
        if (arr.length) {
            const params = arr.join('&');
            url += '?' + params;
        }
        return this.apiService.get(url);
    }

    getProductsQuantity(storeId, categoryId, isMaterial = false): Promise<IProduct[]> {
        let url = this.userService.apiUrl + '/product/ListQuantities';
        const arr = [];
        if (this.staffService.selectedStaff) {
            arr.push('staffId=' + this.staffService.selectedStaff.id.toString());
        }
        if (categoryId) {
            arr.push('categoryId=' + categoryId);
        }
        if (this.storeService.getCurrentStore()) {
            arr.push('storeId=' + storeId);
        }
        if (isMaterial) {
            arr.push('isMaterial=true');
        }
        if (arr.length) {
            const params = arr.join('&');
            url += '?' + params;
        }
        return this.apiService.get(url);
    }

    getProductAttributes(productId): Promise<any[]> {
        const model: any = { productId, table: 'product_option' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getProductBarcodes(productId): Promise<any[]> {
        const model: any = { productId, table: 'product_barcode' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getProductTypes(productId): Promise<any[]> {
        const model: any = { productId, table: 'product_type' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getProductTypeValues(productId): Promise<any[]> {
        const model: any = { productId, table: 'product_attribute' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    get(id: number, storeId: number = 0): Promise<IProduct> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.get(
            this.userService.apiUrl + '/product?id='
            + id + '&storeId='
            + storeId + (staffId ? '&staffId=' + staffId : ''));
    }

    getProductAttribute(id: number): Promise<any> {
        const model: any = { id, table: 'product_option' };
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

    getProductBarcode(id: number): Promise<any> {
        const model: any = { id, table: 'product_barcode' };
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

    getProductType(id: number): Promise<any> {
        const model: any = { id, table: 'product_type' };
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

    getProductTypeValue(id: number): Promise<any> {
        const model: any = { id, table: 'product_attribute' };
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

    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    getProductsByCode(code): Promise<any> {
        const model: any = { code, table: 'product' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getProductsByCodes(codes: string[]): Promise<any[]> {
        const model: any = { code: codes, table: 'product' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/ListMultiEquals';
        return this.apiService.post(url, model);
    }

    getProductsByMessage(message: string): Promise<any[]> {
        let strTrim = message;
        strTrim = strTrim.split(',').join('');
        strTrim = strTrim.split(':').join('');
        strTrim = strTrim.split('.').join('');
        strTrim = strTrim.split('!').join('');
        const arr = strTrim.split(' ').filter(c => c && c.length >= 5);
        if (arr && arr.length) {
            return this.getProductsByCodes(arr);
        }
        return null;
    }

    getProductsByCategory(categoryId: number,): Promise<IProduct[]> {
        const data: any = { categoryId };
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/category/GetProductsByCategory', data);
    }

    getProductsByTitle(title): Promise<any> {
        const model: any = { title, table: 'product' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getAllProductsAreOption(): Promise<any> {
        const model: any = { isOption: 1, table: 'product' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    searchByBarcode(barcode: string): Promise<IProduct> {
        let url = this.userService.apiUrl + '/product/barcode?barcode=' + barcode;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    deleteProduct(product: IProduct): Promise<any> {
        let url = this.userService.apiUrl + '/product/remove?id=' + product.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteProductAttribute(product: any): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=product_option&id=' + product.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteProductBarcode(product: any): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=product_barcode&id=' + product.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteProductType(type: any): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=product_type&id=' + type.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteProductTypeValue(value: any): Promise<any> {
        let url = this.userService.apiUrl + '/data/remove?table=product_attribute&id=' + value.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    deleteProductNote(product: IProductNoteItem): Promise<any> {
        let url = this.userService.apiUrl + '/product/RemoveProductNote?id=' + product.id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(url, null);
    }

    saveProduct(product: IProduct): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/product/SaveProduct', product).then(res => {
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

    saveProductAttribute(productAttribute: any): Promise<number> {
        if (this.staffService.selectedStaff) {
            productAttribute.staffId = this.staffService.selectedStaff.id;
        }
        return new Promise((r, j) => {
            productAttribute.table = 'product_option';
            this.apiService.post(this.userService.apiUrl + '/data/save', productAttribute).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                productAttribute.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveProductBarcode(productBarcode: any): Promise<number> {
        if (this.staffService.selectedStaff) {
            productBarcode.staffId = this.staffService.selectedStaff.id;
        }
        return new Promise((r, j) => {
            productBarcode.table = 'product_barcode';
            this.apiService.post(this.userService.apiUrl + '/data/save', productBarcode).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                productBarcode.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveProductType(productType: any): Promise<number> {
        if (this.staffService.selectedStaff) {
            productType.staffId = this.staffService.selectedStaff.id;
        }
        return new Promise((r, j) => {
            productType.table = 'product_type';
            this.apiService.post(this.userService.apiUrl + '/data/save', productType).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                productType.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveProductTypeValue(productType: any): Promise<number> {
        if (this.staffService.selectedStaff) {
            productType.staffId = this.staffService.selectedStaff.id;
        }
        return new Promise((r, j) => {
            productType.table = 'product_attribute';
            this.apiService.post(this.userService.apiUrl + '/data/save', productType).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                productType.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveProductNote(product: IProductNoteItem): Promise<number> {
        if (this.staffService.selectedStaff) {
            product.staffId = this.staffService.selectedStaff.id;
        }
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/product/SaveProductNote', product).then(res => {
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

    getNotes(dateFrom: string = '', dateTo: string = ''): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    getNotesByProduct(productId: number, filteredStaffId: number, dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo, productId, storeId, staffId: filteredStaffId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    getNotesByOrder(orderId: number, dateFrom: string = '', dateTo: string = ''): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo, orderId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    getNotesByTrade(tradeId: number, dateFrom: string = '', dateTo: string = ''): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo, tradeId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    getNotesByReceivedNote(receivedNoteId: number, dateFrom: string = '', dateTo: string = ''): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo, receivedNoteId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    getNotesByTransferNote(transferNoteId: number, dateFrom: string = '', dateTo: string = ''): Promise<IProductNoteItem[]> {
        const data: any = { dateFrom, dateTo, transferNoteId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/product/ListNote', data);
    }

    removeProductDebts(productId: number): Promise<any> {
        return new Promise((res, rej) => {
            this.debtService.getDebtsByProduct(productId).then((debts: IDebt[]) => {
                const ar: Promise<any>[] = [];
                if (debts && debts.length > 0) {
                    for (const debt of debts) {
                        debt.productId = 0;
                        const p = this.debtService.saveDebt(debt);
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

    removeProductTrades(productId: number): Promise<any> {
        return new Promise((res, rej) => {
            this.tradeService.getTradesByProduct(productId).then((trades: ITrade[]) => {
                const ar: Promise<any>[] = [];
                if (trades && trades.length > 0) {
                    for (const trade of trades) {
                        trade.productId = 0;
                        const p = this.tradeService.saveTrade(trade);
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
