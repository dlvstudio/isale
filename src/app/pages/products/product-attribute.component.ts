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
import { ProductAttributeAddComponent } from './product-attribute-add.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'product-attribute',
    templateUrl: 'product-attribute.component.html'
})
export class ProductAttributeComponent {
    @Input() productId: number;
    @Input() productAttributesSaved: any[];
    params: any;
    callback: any;
    productAttributes: any[];
    originalProductAttributes: any[];
    searchKey = '';
    currency: string;

    constructor(public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private userService: UserService,
        public staffService: StaffService,
        private productService: ProductService,
        private analyticsService: AnalyticsService,
        private translateService: TranslateService,
        private alertCtrl: AlertController
    ) {
        this.navCtrl.removeEventListener('reloadProductAttributes', this.reloadProductAttributes);
        this.navCtrl.addEventListener('reloadProductAttributes', this.reloadProductAttributes);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-attribute');
    }

    reloadProductAttributes = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.callback = this.params.callback;
            this.productId = this.params.productId;
            this.productAttributesSaved = this.params.productAttributesSaved;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        if (this.productId === 0) {
            if (this.productAttributesSaved && this.productAttributesSaved.length) {
                this.originalProductAttributes = JSON.parse(JSON.stringify(this.productAttributesSaved));
                this.productAttributes = JSON.parse(JSON.stringify(this.productAttributesSaved));
            }
            await loading.dismiss();
            return;
        }
        this.productService.getProductAttributes(this.productId).then(async (products) => {
            await loading.dismiss();
            this.originalProductAttributes = JSON.parse(JSON.stringify(products));
            this.productAttributes = products;
        });
    }

    ngOnInit(): void {
        this.reloadProductAttributes();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-product-search');
        let products: IProduct[] = this.originalProductAttributes
            ? JSON.parse(JSON.stringify(this.originalProductAttributes))
            : [];
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => {
                return (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.productAttributes = products;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadProductAttributes();
    }

    async dismiss() {
        if (this.productId === 0 && this.productAttributes && this.productAttributes.length) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('product-attribute.dismiss-with-data-warning'),
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: async () => {
                            if (this.callback) {
                                this.callback(null);
                                this.navCtrl.back();
                                return;
                            }
                            this.modalCtrl.dismiss();
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
            this.callback(null);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss();
    }

    save() {
        if (this.callback) {
            this.callback(this.productAttributes);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.productAttributes);
    }

    async removeProductAttribute(product: any, index) {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-attribute.delete-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        if (this.productId === 0) {
                            this.productAttributes.splice(index, 1);
                            return;
                        }
                        const loading = await this.navCtrl.loading();
                        this.productService.deleteProductAttribute(product).then(async () => {
                            await loading.dismiss();
                            this.analyticsService.logEvent('product-attribute-delete-success');
                            this.navCtrl.publish('reloadProductAttributes');
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

    async selectProduct(product: any): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: ProductAttributeAddComponent,
            componentProps: {
                productId: this.productId,
                productAttributeId: product.id,
                productAttributeToEdit: product
            }
        });
        await modal.present();
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async openProductAttributeAdd(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: ProductAttributeAddComponent,
            componentProps: { productId: this.productId, productAttributeId: 0 }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (!data) {
            return;
        }
        if (this.productId === 0) {
            if (!this.productAttributes) {
                this.productAttributes = [];
            }
            this.productAttributes.push(data);
            if (!this.originalProductAttributes) {
                this.originalProductAttributes = [];
            }
            this.originalProductAttributes.push(data);
        }
    }

    async copy() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-attribute.copy-alert'),
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
            const attributes = await this.productService.getProductAttributes(data.id);
            if (attributes && attributes.length) {
                if (this.productId > 0) {
                    const arrSave = [];
                    for (const attribute of attributes) {
                        attribute.id = 0;
                        attribute.productId = this.productId;
                        arrSave.push(this.productService.saveProductAttribute(attribute));
                    }
                    await Promise.all(arrSave);
                    this.analyticsService.logEvent('product-attribute-copied-attributes-from-edit');
                    this.navCtrl.publish('reloadProductAttributes');
                    this.navCtrl.publish('reloadProduct', { id: this.productId });
                } else {
                    for (const attribute of attributes) {
                        attribute.id = 0;
                        attribute.productId = 0;
                        if (!this.productAttributes) {
                            this.productAttributes = [];
                        }
                        if (!this.originalProductAttributes) {
                            this.originalProductAttributes = [];
                        }
                        this.originalProductAttributes.push(attribute);
                        this.productAttributes.push(attribute);
                        this.analyticsService.logEvent('product-attribute-copied-attributes-from-quick-add');
                    }
                }
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }
}
