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
import { ProductBarcodeAddComponent } from './product-barcode-add.component';

@Component({
    selector: 'product-barcode',
    templateUrl: 'product-barcode.component.html'
})
export class ProductBarcodeComponent {
    @Input() productId: number;
    @Input() units: any[] = null;
    @Input() productBarcodesSaved: any[];
    params: any;
    callback: any;
    productBarcodes: any[];
    originalProductBarcodes: any[];
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
        this.navCtrl.removeEventListener('reloadProductBarcodes', this.reloadProductBarcodes);
        this.navCtrl.addEventListener('reloadProductBarcodes', this.reloadProductBarcodes);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-barcode');
    }

    reloadProductBarcodes = async () => {
        this.params = this.navCtrl.getParams(this.params);
        if (this.params) {
            this.callback = this.params.callback;
            this.productId = this.params.productId;
            this.productBarcodesSaved = this.params.productBarcodesSaved;
            this.units = this.params.units;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        if (this.productId === 0) {
            if (this.productBarcodesSaved && this.productBarcodesSaved.length) {
                this.originalProductBarcodes = JSON.parse(JSON.stringify(this.productBarcodesSaved));
                this.productBarcodes = JSON.parse(JSON.stringify(this.productBarcodesSaved));
            }
            await loading.dismiss();
            return;
        }
        this.productService.getProductBarcodes(this.productId).then(async (products) => {
            await loading.dismiss();
            this.originalProductBarcodes = JSON.parse(JSON.stringify(products));
            this.productBarcodes = products;
        });
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reloadProductBarcodes();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-product-barcode-search');
        let products: IProduct[] = this.originalProductBarcodes
            ? JSON.parse(JSON.stringify(this.originalProductBarcodes))
            : [];
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => {
                return (item.barcode && item.barcode.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.productBarcodes = products;
    }

    clearSearch() {
        this.searchKey = null;
        this.reloadProductBarcodes();
    }

    async dismiss() {
        let hasDifferentData = false;
        if (this.productId === 0) {
            const hasOld = this.productBarcodesSaved && this.productBarcodesSaved.length;
            const hasNew = this.productBarcodes && this.productBarcodes.length;
            if (hasOld && hasNew) {
                const old = JSON.stringify(this.productBarcodesSaved);
                const newOne = JSON.stringify(this.productBarcodes);
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
                message: this.translateService.instant('product-barcode.dismiss-with-data-warning'),
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
            this.callback(this.productBarcodesSaved);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.productBarcodesSaved);
    }

    save() {
        if (this.callback) {
            this.callback(this.productBarcodes);
            this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.productBarcodes);
    }

    async removeProductBarcode(product: any, index) {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-barcode.delete-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        if (this.productId === 0) {
                            this.productBarcodes.splice(index, 1);
                            return;
                        }
                        const loading = await this.navCtrl.loading();
                        this.productService.deleteProductBarcode(product).then(async () => {
                            await loading.dismiss();
                            this.analyticsService.logEvent('product-barcode-delete-success');
                            this.navCtrl.publish('reloadProductBarcodes');
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
            component: ProductBarcodeAddComponent,
            componentProps: {
                productId: this.productId,
                productBarcodeId: product.id,
                productBarcodeToEdit: product,
                units: this.units,
            }
        });
        await modal.present();
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    async openProductBarcodeAdd(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: ProductBarcodeAddComponent,
            componentProps: { productId: this.productId, productBarcodeId: 0, units: this.units, }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (!data) {
            return;
        }
        if (this.productId === 0) {
            if (!this.productBarcodes) {
                this.productBarcodes = [];
            }
            this.productBarcodes.push(data);
            if (!this.originalProductBarcodes) {
                this.originalProductBarcodes = [];
            }
            this.originalProductBarcodes.push(data);
        }
    }
}
