import { Component, Input, ViewChild } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ProductAttributeSelectorComponent } from './product-attribute-selector.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'product-option-selector',
    templateUrl: 'product-option-selector.component.html'
})
export class ProductOptionSelectorComponent {
    @ViewChild('barcodeInput', { static: false }) barcodeInput: IonSearchbar;
    @Input() mainProduct: any;
    params: any;
    callback: any;
    products: any[] = [];
    selectedProducts: any[] = [];
    originalProducts: any[] = [];
    searchKey = '';
    tab = 'all';
    currency: string;

    constructor(public navCtrl: RouteHelperService,
                private modalCtrl: ModalController,
                private userService: UserService,
                public staffService: StaffService,
                public translateService: TranslateService,
                private productService: ProductService,
                private analyticsService: AnalyticsService) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-option-selector');
    }

    tabChanged() {
        this.barcodeFocus();
    }

    async barcodeChanged(): Promise<void> {
        if (!this.searchKey || this.searchKey.length < 5) {
            return;
        }
        this.analyticsService.logEvent('product-option-selector-barcode-entered');
        this.productService.searchByBarcode(this.searchKey).then((product) => {
            if (!product) {
                return;
            }
            this.analyticsService.logEvent('product-option-selector-barcode-entered-ok');
            let products: any[] = this.originalProducts;
            products = products.filter((item) => (item.id === product.id));
            if (products && products.length) {
                for (const item of products) {
                    this.increase(item);
                }
            }
            this.products = products;
        });
    }

    reloadProducts = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.mainProduct = this.params.mainProduct;
            this.callback = this.params.callback;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.productService.getAllProductsAreOption().then(async (products) => {
            const productsPopulated = JSON.parse(JSON.stringify(products));
            if (productsPopulated && productsPopulated.length) {
                for (const product of productsPopulated) {
                    product.total = 0;
                    product.quantity = product.count;
                    product.count = 0;
                }
            }
            this.originalProducts = productsPopulated;
            this.products = productsPopulated;
            if (this.products && this.products.length) {
                const selectedProducts = [];
                for (const product of this.products) {
                    const optionPrevious = this.mainProduct.options && this.mainProduct.options.length
                        ? this.mainProduct.options.find((option) => option.id == product.id)
                        : null;
                    if (!optionPrevious) {
                        continue;
                    }
                    product.total = optionPrevious.total;
                    product.count = optionPrevious.count;
                    selectedProducts.push(product);
                }
                this.selectedProducts = selectedProducts;
            }
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

    reCalc(product: any): void {
        const netTotal = product.count * product.price;
        product.total = netTotal;

        this.applyItemTotal();
    }

    applyItemTotal(): void {
        let netValue = 0;
        for (const item of this.selectedProducts) {
            netValue += item.total * 1;
        }
        this.mainProduct.total = (this.mainProduct.price + netValue) * this.mainProduct.count;
    }

    async increase(item) {
        const isExists = this.selectedProducts.find(product => product.id === item.id);
        if (!isExists) {
            this.selectedProducts.push(item);
        }
        item.count++;
        if (item.count >= 2) {
            this.analyticsService.logEvent('product-option-selector-increase-2');
        }
        this.reCalc(item);
        this.barcodeFocus();
    }

    async decrease(item) {
        if (item && item.count === 0) {
            this.barcodeFocus();
            return;
        }

        this.analyticsService.logEvent('product-option-selector-decrease');
        item.count--;
        if (item.count === 0) {
            const foundIndex = this.selectedProducts.findIndex(product => product.id === item.id);
            if (foundIndex >= 0) {
                this.selectedProducts.splice(foundIndex, 1);
            }
            if ((!this.selectedProducts || !this.selectedProducts.length)
                && (this.tab !== 'all')) {
                this.tab = 'all';
                this.tabChanged();
            }
        }
        this.reCalc(item);
        this.barcodeFocus();
    }

    ngOnInit(): void {
        this.reloadProducts();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('product-option-selector-search');
        let products: any[] = this.originalProducts;
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.products = products;
    }

    async clearSearch() {
        this.analyticsService.logEvent('product-option-selector-clear-search');
        this.searchKey = null;
        this.products = this.originalProducts;
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
                options: this.selectedProducts,
                attributes: this.mainProduct.attributes
            });
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss({
            options: this.selectedProducts,
            attributes: this.mainProduct.attributes
        });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async addAttributes() {
        const modal = await this.modalCtrl.create({
            component: ProductAttributeSelectorComponent,
            componentProps: { mainProduct: this.mainProduct }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        if (data) {
            this.mainProduct.attributes = data;
        }
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }
}
