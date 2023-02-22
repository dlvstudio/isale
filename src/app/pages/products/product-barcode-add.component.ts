import { ModalController } from '@ionic/angular';
import { Component, Input, ViewChild } from '@angular/core';
import { Helper } from '../../providers/helper.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

@Component({
    selector: 'product-barcode-add',
    templateUrl: 'product-barcode-add.component.html',
})
export class ProductBarcodeAddComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput;
    @Input() productId = 0;
    @Input() productBarcodeId = 0;
    @Input() productBarcodeToEdit: any;
    @Input() units: any[] = null;
    productBarcode: any = {};
    isNew = true;
    saveDisabled = false;

    constructor(
        public navCtrl: RouteHelperService,
        private staffService: StaffService,
        private productService: ProductService,
        private analyticsService: AnalyticsService,
        private translateService: TranslateService,
        private modalController: ModalController,
        private barcodeScanner: BarcodeScanner,
    ) { }
    
    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-barcode-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        if (!this.staffService.canAddUpdateProduct()) {
            this.navCtrl.pop();
            return;
        }
        this.productBarcode = {
            id: this.productBarcodeToEdit ? this.productBarcodeToEdit.id : 0,
            barcode: this.productBarcodeToEdit ? this.productBarcodeToEdit.barcode : null,
            productId: this.productBarcodeToEdit ? this.productBarcodeToEdit.productId : 0,
            unit: this.productBarcodeToEdit ? this.productBarcodeToEdit.unit : null,
        };
        if (this.productBarcodeId && this.productBarcodeId > 0) {
            this.isNew = false;
        }

        if (this.productBarcodeId && this.productBarcodeId > 0) {
            const loading = await this.navCtrl.loading();
            this.productService.getProductBarcode(this.productBarcodeId).then(async (product) => {
                await loading.dismiss();
                this.productBarcode = product;
            }).catch(async () => {
                await loading.dismiss();
            });
        }
    }

    async save(): Promise<void> {
        this.saveDisabled = true;

        // check exist
        const existProduct = await this.productService.searchByBarcode(this.productBarcode.barcode);
        if (existProduct) {
            this.analyticsService.logEvent('product-quick-add-duplicated-barcode');
            const mess = this.translateService.instant('product-add.duplicate-barcode-alert',
                { barcode: this.productBarcode.barcode });
            alert(mess);
            this.saveDisabled = false;
            return;
        }

        if (this.productId === 0) {
            if (this.productBarcodeToEdit) {
                // update the old one in list
                this.productBarcodeToEdit.barcode = this.productBarcode.barcode;
                this.productBarcodeToEdit.unit = this.productBarcode.unit;
            }
            // add new
            this.modalController.dismiss(this.productBarcode);
            return;
        }
        this.productBarcode.productId = this.productId;
        this.productService.saveProductBarcode(this.productBarcode).then(async () => {
            this.analyticsService.logEvent('product-barcode-add-save-success');
            this.exitPage();
        });
    }

    async exitPage() {
        this.navCtrl.publish('reloadProductBarcodes');
        this.navCtrl.publish('reloadProductBarcode', this.productBarcode);
        if (this.productId > 0) {
            this.navCtrl.publish('reloadProduct', { id: this.productId });
        }
        this.modalController.dismiss(this.productBarcode);
    }

    dismiss() {
        this.modalController.dismiss();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('product-add-scanbarcode');
        if (this.navCtrl.isNotCordova()) {
            const r = Math.random().toString(36).substring(7);
            this.productBarcode.barcode = r;
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.productBarcode.barcode = barcodeData.text;
        });
    }

    autoGenBarcode(): void {
        const r = Math.random().toString(36).substring(7);
        this.productBarcode.barcode = r;
    }

    barcodeFocus(): void {
        setTimeout(() => {
            this.barcodeInput.setFocus();
        }, 500);
    }
}
