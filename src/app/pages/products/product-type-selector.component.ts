import { Component, Input, ViewChild } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'product-type-selector',
    templateUrl: 'product-type-selector.component.html'
})
export class ProductTypeSelectorComponent {
    @ViewChild('barcodeInput', { static: false }) barcodeInput: IonSearchbar;
    @Input() mainProduct: any;
    params: any;
    callback: any;
    types: any[] = [];
    originalTypes: any[] = [];
    searchKey = '';
    tab = 'all';
    currency: string;

    constructor(public navCtrl: RouteHelperService,
                private modalCtrl: ModalController,
                private userService: UserService,
                public translateService: TranslateService,
                public staffService: StaffService,
                private productService: ProductService,
                private analyticsService: AnalyticsService) {
        this.navCtrl.removeEventListener('reloadProductTypes', this.reloadTypes);
        this.navCtrl.addEventListener('reloadProductTypes', this.reloadTypes);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-type-selector');
    }

    tabChanged() {
        this.barcodeFocus();
    }

    reloadTypes = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.mainProduct = this.params.mainProduct;
            this.callback = this.params.callback;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.productService.getProductTypes(this.mainProduct.id).then(async (types) => {
            const typesOrdered = this.sortByOrderIndex(types);
            const typeValues = await this.productService.getProductTypeValues(this.mainProduct.id);

            if (typeValues && typeValues.length) {
                const typeValuesOrdered = this.sortByOrderIndex(typeValues);

                for (const typeValue of typeValuesOrdered) {
                    const type = typesOrdered.find(t => t.id === typeValue.productTypeId);
                    if (!type) {
                        continue;
                    }
                    const oldType = this.mainProduct.types
                        ? this.mainProduct.types.find(t => t.id === typeValue.productTypeId)
                        : null;
                    const oldValue = oldType
                        ? oldType.values.find(v => v.id === typeValue.id)
                        : null;
                    if (!type.values) {
                        type.values = [];
                    }
                    typeValue.total = 0;
                    // typeValue.quantity = 0;
                    typeValue.count = 0;
                    type.values.push(oldValue ? oldValue : typeValue);
                }
            }
            this.originalTypes = typesOrdered;
            this.types = typesOrdered;
            this.applyTotal();
            await loading.dismiss();
            this.barcodeFocus();
        });
    }

    barcodeFocus(): void {
        if (!this.navCtrl.isNotCordova()) {
            return;
        }
        if (this.tab !== 'all') {
            return;
        }
        setTimeout(() => {
            if (typeof this.barcodeInput !== 'undefined') {
                this.barcodeInput.setFocus();
            }
        }, 600);
    }

    async increase(item, type) {
        if (!type.multiChoice) {
            for (const val of type.values) {
                if (val.title !== item.title) {
                    val.count = 0;
                }
            }
        }
        item.count++;
        item.selected = true;
        item.total = item.price ? item.count * item.price : 0;
        if (item.count >= 2) {
            this.analyticsService.logEvent('product-option-selector-increase-2');
        }
        this.applyTotal();
        this.barcodeFocus();
    }

    async decrease(item, type) {
        if (item && item.count === 0) {
            this.barcodeFocus();
            return;
        }

        if (!type.multiChoice) {
            for (const val of type.values) {
                val.count = 0;
                val.total = 0;
            }
        }

        this.analyticsService.logEvent('product-option-selector-decrease');
        item.count--;
        item.total = item.price ? item.count * item.price : 0;
        if (item.count === 0) {
            item.selected = false;
        }
        this.applyTotal();
        this.barcodeFocus();
    }

    ngOnInit(): void {
        this.reloadTypes();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('product-option-selector-search');
        let products: any[] = this.originalTypes;
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.types = products;
    }

    async clearSearch() {
        this.analyticsService.logEvent('product-option-selector-clear-search');
        this.searchKey = null;
        this.types = this.originalTypes;
        this.barcodeFocus();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss();
    }

    async ok(): Promise<void> {
        this.analyticsService.logEvent('product-option-selector-ok');
        if (this.callback) {
            this.callback({
                types: this.types,
                price: this.mainProduct.changedPrice,
                initPrice: this.mainProduct.price,
            });
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss({
            types: this.types,
            price: this.mainProduct.changedPrice,
            initPrice: this.mainProduct.initPrice,
        });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    sortByOrderIndex(items: any[]): any[] {
        if (items) {
            return _.orderBy(items, ['orderIndex'], ['asc']);
        }
        return null;
    }

    changeSelected(value, type) {
        if (!type.multiChoice && value.count <= 0) {
            for (const val of type.values) {
                if (val.id === value.id) {
                    continue;
                }
                if (val.count > 0) {
                    val.count = 0;
                    val.total = 0;
                    val.selected = false;
                }
            }
        }

        if (value.count > 0) {
            value.count = 0;
            value.selected = false;
        } else {
            value.count = 1;
            value.selected = true;
            value.total = value.price ? value.count * value.price : 0;
        }
        this.applyTotal();
    }

    applyTotal() {
        let changedPrice = this.mainProduct.price;
        let addedAmount = 0;
        for (const type of this.types) {
            for (const val of type.values) {
                if (val.selected && val.price) {
                    if (!val.isAddedToPrice) {
                        changedPrice = val.price;
                    } else {
                        addedAmount += val.price * val.count;
                    }
                }
            }
        }
        changedPrice += addedAmount;
        this.mainProduct.changedPrice = changedPrice !== this.mainProduct.price ? changedPrice : 0;
    }

    clear() {
        if (!confirm(this.translateService.instant('type-selector.clear-alert'))) {
            return;
        }
        for (const type of this.types) {
            for (const val of type.values) {
                val.count = 0;
                val.total = 0;
                val.selected = false;
            }
        }
        this.applyTotal();
    }

    async viewTypes() {
        this.navCtrl.push('/product/type', { callback: () => { }, productId: this.mainProduct.id, product: this.mainProduct });
    }
}
