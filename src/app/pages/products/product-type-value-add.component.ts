import { ModalController } from '@ionic/angular';
import { Component, Input } from '@angular/core';
import { Helper } from '../../providers/helper.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'product-type-value-add',
    templateUrl: 'product-type-value-add.component.html',
})
export class ProductTypeValueAddComponent {
    @Input() productId: number = 0;
    @Input() productTypeId: number = 0;
    @Input() productAttributeId: number = 0;
    @Input() productAttributeToEdit: any;
    lastOrderIndex = 0;
    productTypeValue: any = {};
    isNew = true;
    saveDisabled = false;
    params;
    currency: any;
    callback;

    constructor(
        public navCtrl: RouteHelperService,
        private staffService: StaffService,
        private productService: ProductService,
        private userService: UserService,
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
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.productAttributeToEdit) {
            this.productAttributeToEdit = this.params.productAttributeToEdit;
        }
        if (this.params && this.params.productAttributeId) {
            this.productAttributeId = this.params.productAttributeId;
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

        this.productTypeValue = {
            id: this.productAttributeToEdit ? this.productAttributeToEdit.id : 0,
            title: this.productAttributeToEdit ? this.productAttributeToEdit.title : null,
            productId: this.productAttributeToEdit ? this.productAttributeToEdit.productId : 0,
            productTypeId: this.productAttributeToEdit ? this.productAttributeToEdit.productTypeId : 0,
            price: this.productAttributeToEdit ? this.productAttributeToEdit.price : 0,
            isAddedToPrice: this.productAttributeToEdit ? this.productAttributeToEdit.isAddedToPrice : false,
            selectOnly: this.productAttributeToEdit ? this.productAttributeToEdit.selectOnly : true,
        };
        if (this.productAttributeId && this.productAttributeId > 0) {
            this.isNew = false;
        }

        if (this.productAttributeId && this.productAttributeId > 0) {
            const loading = await this.navCtrl.loading();
            this.productService.getProductTypeValue(this.productAttributeId).then(async (product) => {
                await loading.dismiss();
                this.productTypeValue = product;
            }).catch(async () => {
                await loading.dismiss();
            });
        }
    }

    async save(): Promise<void> {
        this.saveDisabled = true;
        if (this.productId === 0) {
            if (this.productAttributeToEdit) {
                // update the old one in list
                this.productAttributeToEdit.title = this.productTypeValue.title;
                this.productAttributeToEdit.price = this.productTypeValue.price;
                this.productAttributeToEdit.isAddedToPrice = this.productTypeValue.isAddedToPrice;
                this.productAttributeToEdit.selectOnly = this.productTypeValue.selectOnly;
            }
        } else {
            this.productTypeValue.productId = this.productId;
            this.productTypeValue.productTypeId = this.productTypeId;
            if (this.productAttributeId === 0) {
                this.productTypeValue.orderIndex = this.lastOrderIndex + 1;
            }
            await this.productService.saveProductTypeValue(this.productTypeValue).then(async () => {
                this.analyticsService.logEvent('product-type-add-save-success');
                this.navCtrl.publish('reloadProductTypes');
                this.navCtrl.publish('reloadProductType', this.productTypeValue);
                if (this.productId > 0) {
                    this.navCtrl.publish('reloadProduct', { id: this.productId });
                }
            });
        }

        if (this.callback) {
            this.callback(this.productTypeValue);
            await this.navCtrl.back();
            return;
        }
        this.modalController.dismiss(this.productTypeValue);
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
