import { IProduct } from '../../models/product.interface';
import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

@Component({
    selector: 'product-type',
    templateUrl: 'product-type.component.html'
})
export class ProductTypeComponent {
    @Input() productId: number;
    @Input() productTypesSaved: any[];
    params: any;
    callback: any;
    productTypes: any[];
    originalProductTypes: any[];
    searchKey = '';
    currency: string;
    product;

    constructor(public navCtrl: RouteHelperService,
                private modalCtrl: ModalController,
                private userService: UserService,
                public staffService: StaffService,
                private productService: ProductService,
                private analyticsService: AnalyticsService,
                public translateService: TranslateService,
                private alertCtrl: AlertController
    ) {
        this.navCtrl.removeEventListener('reloadProductTypes', this.reloadProductTypes);
        this.navCtrl.addEventListener('reloadProductTypes', this.reloadProductTypes);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-type');
    }

    reloadProductTypes = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.callback = this.params.callback;
            this.productId = this.params.productId;
            this.productTypesSaved = this.params.productTypesSaved;
            this.product = this.params.product;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        if (this.productId === 0) {
            if (this.productTypesSaved && this.productTypesSaved.length) {
                this.originalProductTypes = JSON.parse(JSON.stringify(this.productTypesSaved));
                this.productTypes = JSON.parse(JSON.stringify(this.productTypesSaved));
            }
            await loading.dismiss();
            return;
        }
        this.product = this.product
            ? this.product
            : this.productId === 0
                ? null
                : await this.productService.get(this.productId, 0);
        this.productService.getProductTypes(this.productId).then(async (types) => {
            const typesOrdered = this.sortByOrderIndex(types);
            const typeValues = await this.productService.getProductTypeValues(this.productId);
            if (typeValues && typeValues.length) {
                const typeValuesOrdered = this.sortByOrderIndex(typeValues);
                for (const typeValue of typeValuesOrdered) {
                    const type = typesOrdered.find(t => t.id === typeValue.productTypeId);
                    if (!type) {
                        continue;
                    }
                    if (!type.values) {
                        type.values = [];
                    }
                    type.values.push(typeValue);
                }
            }

            this.originalProductTypes = JSON.parse(JSON.stringify(typesOrdered));
            this.productTypes = typesOrdered;

            await loading.dismiss();
        });
    }

    ngOnInit(): void {
        this.reloadProductTypes();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    sortByOrderIndex(items: any[]): any[] {
        if (items) {
            return _.orderBy(items, ['orderIndex'], ['asc']);
        }
        return null;
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-product-search');
        let products: IProduct[] = this.originalProductTypes
            ? JSON.parse(JSON.stringify(this.originalProductTypes))
            : [];
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.productTypes = products;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadProductTypes();
    }

    async dismiss() {
        let hasDifferentData = false;
        if (this.productId === 0) {
            const hasOld = this.productTypesSaved && this.productTypesSaved.length;
            const hasNew = this.productTypes && this.productTypes.length;
            if (hasOld && hasNew) {
                const old = JSON.stringify(this.productTypesSaved);
                const newOne = JSON.stringify(this.productTypes);
                hasDifferentData = old !== newOne;
            } else if (hasNew && !hasOld) {
                hasDifferentData = true;
            } else if (!hasNew && hasOld) {
                hasDifferentData = true;
            }
        }

        if (hasDifferentData) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('product-type.dismiss-with-data-warning'),
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: async () => {
                            if (this.callback) {
                                this.callback(this.productTypesSaved);
                                this.navCtrl.back();
                                return;
                            }
                            this.modalCtrl.dismiss(this.productTypesSaved);
                        }
                    },
                    {
                        text: this.translateService.instant('common.cancel'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            return;
        }
        if (this.callback) {
            this.callback(this.productTypesSaved);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.productTypesSaved);
    }

    save() {
        if (this.callback) {
            this.callback(this.productTypes);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.productTypes);
    }

    async removeProductType(type: any, index) {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-type.delete-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        if (this.productId === 0) {
                            this.productTypes.splice(index, 1);
                            return;
                        }
                        const loading = await this.navCtrl.loading();
                        this.productService.deleteProductType(type).then(async () => {
                            await loading.dismiss();
                            this.analyticsService.logEvent('product-type-delete-success');
                            this.navCtrl.publish('reloadProductTypes');
                            this.navCtrl.publish('reloadProduct', { id: this.productId });
                        }).catch(async (err) => {
                            console.error(err);
                            await loading.dismiss();
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async removeProductTypeValue(value: any, index) {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-type.delete-value-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        if (this.productId === 0) {
                            this.productTypes.splice(index, 1);
                            return;
                        }
                        const loading = await this.navCtrl.loading();
                        this.productService.deleteProductTypeValue(value).then(async () => {
                            await loading.dismiss();
                            this.analyticsService.logEvent('product-type-delete-value-success');
                            this.navCtrl.publish('reloadProductTypes');
                            this.navCtrl.publish('reloadProduct', { id: this.productId });
                        }).catch(async (err) => {
                            console.error(err);
                            await loading.dismiss();
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async selectProductType(type: any): Promise<void> {
        this.analyticsService.logEvent('product-type-open-update');
        const callback = () => {
            // do nothing as event published got listener
        };
        await this.navCtrl.push('/product/add-type', {
            callback,
            productId: this.productId,
            productTypeId: type.id,
            productTypeToEdit: type
        });
    }

    async selectProductTypeValue(value: any, typeId): Promise<void> {
        this.analyticsService.logEvent('product-type-open-value-update');
        const callback = () => {
            // do nothing as event published got listener
        };
        await this.navCtrl.push('/product/add-type-value', {
            callback,
            productId: this.productId,
            productTypeId: typeId,
            productAttributeId: value.id,
            productAttributeToEdit: value,
        });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async openProductTypeAdd(): Promise<void> {
        this.analyticsService.logEvent('product-type-open-add');
        const callback = (data) => {
            if (!data) {
                return;
            }
            if (this.productId === 0) {
                if (!this.productTypes) {
                    this.productTypes = [];
                }
                data.orderIndex = this.productTypes.length + 1;
                this.productTypes.push(data);
                if (!this.originalProductTypes) {
                    this.originalProductTypes = [];
                }
                this.originalProductTypes.push(data);
            }
        };
        await this.navCtrl.push('/product/add-type', {
            callback,
            productId: this.productId,
            productTypeId: 0,
            lastOrderIndex: this.productTypes ? this.productTypes.length : 0,
        });
    }

    async addTypeValue(type) {
        this.analyticsService.logEvent('product-type-open-value-add');
        const callback = (data) => {
            if (!data) {
                return;
            }
            if (this.productId === 0) {
                if (!type.values) {
                    type.values = [];
                }
                data.orderIndex = type.values.length + 1;
                type.values.push(data);
            }
        };
        await this.navCtrl.push('/product/add-type-value', {
            callback,
            productId: this.productId,
            productTypeId: type.id,
            lastOrderIndex: type.values ? type.values.length : 0,
            productAttributeId: 0
        });
    }

    async copy() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-type.copy-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.continueCopy();
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async continueCopy() {
        const callback = async (data) => {
            if (!data) {
                return;
            }
            const types = await this.productService.getProductTypes(data.id);
            const typeValues = await this.productService.getProductTypeValues(data.id);
            if (types && types.length) {
                for (const value of typeValues) {
                    let selectedType = types.find(t => t.id === value.productTypeId);
                    if (!selectedType) {
                        continue;
                    }
                    if (!selectedType.values) {
                        selectedType.values = [];
                    }
                    value.productId = this.productId;
                    value.id = 0;
                    selectedType.values.push(value);
                }
                if (this.productId > 0) {
                    const arrSave = [];
                    for (const type of types) {
                        type.id = 0;
                        type.productId = this.productId;
                        arrSave.push(this.productService.saveProductType(type));
                    }
                    await Promise.all(arrSave);

                    const arrTypesSave = [];
                    for (const type of types) {
                        if (!type || !type.values) {
                            continue;
                        }
                        for (const val of type.values) {
                            val.productId = this.productId;
                            val.productTypeId = type.id;
                            arrTypesSave.push(this.productService.saveProductTypeValue(val));
                        }
                    }
                    await Promise.all(arrTypesSave);

                    this.analyticsService.logEvent('product-type-copied-types-from-edit');
                    this.navCtrl.publish('reloadProductTypes');
                    this.navCtrl.publish('reloadProduct', { id: this.productId });
                } else {
                    for (const type of types) {
                        type.id = 0;
                        type.productId = 0;
                        if (!this.productTypes) {
                            this.productTypes = [];
                        }
                        if (!this.originalProductTypes) {
                            this.originalProductTypes = [];
                        }
                        this.originalProductTypes.push(type);
                        this.productTypes.push(type);
                        this.analyticsService.logEvent('product-type-copied-types-from-quick-add');
                    }
                }
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async up(type, i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        this.productTypes[i].orderIndex = i - 1;
        this.productTypes[i - 1].orderIndex = i;
        if (this.productId > 0) {
            arr.push(this.productService.saveProductType(this.productTypes[i]));
            arr.push(this.productService.saveProductType(this.productTypes[i - 1]));
        }
        for (let id = i + 1; id < this.productTypes.length; id++) {
            this.productTypes[id].orderIndex = id;
            if (this.productId > 0) {
                arr.push(this.productService.saveProductType(this.productTypes[id]));
            }
        }
        if (this.productId === 0) {
            this.productTypes = this.sortByOrderIndex(this.productTypes);
        } else {
            await Promise.all(arr);
            await this.reloadProductTypes();
        }
        await loading.dismiss();
    }

    async down(type, i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        this.productTypes[i].orderIndex = i + 1;
        this.productTypes[i + 1].orderIndex = i;
        if (this.productId > 0) {
            arr.push(this.productService.saveProductType(this.productTypes[i]));
            arr.push(this.productService.saveProductType(this.productTypes[i + 1]));
        }
        for (let id = i + 2; id < this.productTypes.length; id++) {
            this.productTypes[id].orderIndex = id;
            if (this.productId > 0) {
                arr.push(this.productService.saveProductType(this.productTypes[id]));
            }
        }
        if (this.productId === 0) {
            this.productTypes = this.sortByOrderIndex(this.productTypes);
        } else {
            await Promise.all(arr);
            await this.reloadProductTypes();
        }
        await loading.dismiss();
    }

    async upValue(value, typeId, i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        const type = this.productTypes[typeId];
        type.values[i].orderIndex = i - 1;
        type.values[i - 1].orderIndex = i;
        if (this.productId > 0) {
            arr.push(this.productService.saveProductTypeValue(type.values[i]));
            arr.push(this.productService.saveProductTypeValue(type.values[i - 1]));
        }
        for (let id = i + 1; id < type.values.length; id++) {
            type.values[id].orderIndex = id;
            if (this.productId > 0) {
                arr.push(this.productService.saveProductTypeValue(type.values[id]));
            }
        }
        if (this.productId > 0) {
            await Promise.all(arr);
            await this.reloadProductTypes();
        } else {
            type.values = this.sortByOrderIndex(type.values);
        }
        await loading.dismiss();
    }

    async downValue(value, typeId, i) {
        const loading = await this.navCtrl.loading();
        const arr = [];
        const type = this.productTypes[typeId];
        type.values[i].orderIndex = i + 1;
        type.values[i + 1].orderIndex = i;
        if (this.productId > 0) {
            arr.push(this.productService.saveProductTypeValue(type.values[i]));
            arr.push(this.productService.saveProductTypeValue(type.values[i + 1]));
        }
        for (let id = i + 2; id < type.values.length; id++) {
            type.values[id].orderIndex = id;
            if (this.productId > 0) {
                arr.push(this.productService.saveProductTypeValue(type.values[id]));
            }
        }
        if (this.productId > 0) {
            await Promise.all(arr);
            await this.reloadProductTypes();
        } else {
            type.values = this.sortByOrderIndex(type.values);
        }
        await loading.dismiss();
    }
}
