import { ModalController } from '@ionic/angular';
import { Component, Input } from '@angular/core';
import { Helper } from '../../providers/helper.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'product-type-add',
    templateUrl: 'product-type-add.component.html',
})
export class ProductTypeAddComponent {
    @Input() productId: number = 0;
    @Input() productTypeId: number = 0;
    @Input() productTypeToEdit: any;
    lastOrderIndex = 0;
    productType: any = {};
    isNew = true;
    saveDisabled = false;
    params;
    callback;

    constructor(
        public navCtrl: RouteHelperService,
        private staffService: StaffService,
        private productService: ProductService,
        private analyticsService: AnalyticsService,
        private modalController: ModalController,
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
        await this.analyticsService.setCurrentScreen('product-type-add');
    }

    async ngOnInit(): Promise<void> {
        if (!this.staffService.canAddUpdateProduct()) {
            this.navCtrl.pop();
            return;
        }
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.productTypeToEdit) {
            this.productTypeToEdit = this.params.productTypeToEdit;
        }
        if (this.params && this.params.productTypeId) {
            this.productTypeId = this.params.productTypeId;
        }
        if (this.params && this.params.productId) {
            this.productId = this.params.productId;
        }
        if (this.params && this.params.lastOrderIndex) {
            this.lastOrderIndex = this.params.lastOrderIndex;
        }
        this.productType = {
            id: this.productTypeToEdit ? this.productTypeToEdit.id : 0,
            title: this.productTypeToEdit ? this.productTypeToEdit.title : null,
            productId: this.productTypeToEdit ? this.productTypeToEdit.productId : 0,
        };
        if (this.productTypeId && this.productTypeId > 0) {
            this.isNew = false;
        }

        if (this.productTypeId && this.productTypeId > 0) {
            const loading = await this.navCtrl.loading();
            this.productService.getProductType(this.productTypeId).then(async (product) => {
                await loading.dismiss();
                this.productType = product;
            }).catch(async () => {
                await loading.dismiss();
            });
        }
    }

    async save(): Promise<void> {
        this.saveDisabled = true;
        if (this.productId === 0) {
            if (this.productTypeToEdit) {
                // update the old one in list
                this.productTypeToEdit.title = this.productType.title;
                this.productTypeToEdit.multiChoice = this.productType.multiChoice;
            }
        } else {
            this.productType.productId = this.productId;
            if (this.productTypeId === 0) {
                this.productType.orderIndex = this.lastOrderIndex + 1;
            }
            await this.productService.saveProductType(this.productType).then(async () => {
                this.analyticsService.logEvent('product-type-add-save-success');
                this.navCtrl.publish('reloadProductTypes');
                this.navCtrl.publish('reloadProductType', this.productType);
                if (this.productId > 0) {
                    this.navCtrl.publish('reloadProduct', { id: this.productId });
                }
            });
        }
        if (this.callback) {
            this.callback(this.productType);
            await this.navCtrl.back();
            return;
        }
        this.modalController.dismiss(this.productType);
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.modalController.dismiss();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }
}
