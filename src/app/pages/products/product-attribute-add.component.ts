import { ModalController } from '@ionic/angular';
import { Component, Input } from '@angular/core';
import { Helper } from '../../providers/helper.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'product-attribute-add',
    templateUrl: 'product-attribute-add.component.html',
})
export class ProductAttributeAddComponent {
    @Input() productId: number = 0;
    @Input() productAttributeId: number = 0;
    @Input() productAttributeToEdit: any;
    productAttribute: any = {};
    isNew = true;
    saveDisabled = false;

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
        await this.analyticsService.setCurrentScreen('product-attribute-add');
    }

    async ngOnInit(): Promise<void> {
        if (!this.staffService.canAddUpdateProduct()) {
            this.navCtrl.pop();
            return;
        }
        this.productAttribute = {
            id: this.productAttributeToEdit ? this.productAttributeToEdit.id : 0,
            title: this.productAttributeToEdit ? this.productAttributeToEdit.title : null,
            productId: this.productAttributeToEdit ? this.productAttributeToEdit.productId : 0,
        };
        if (this.productAttributeId && this.productAttributeId > 0) {
            this.isNew = false;
        }

        if (this.productAttributeId && this.productAttributeId > 0) {
            const loading = await this.navCtrl.loading();
            this.productService.getProductAttribute(this.productAttributeId).then(async (product) => {
                await loading.dismiss();
                this.productAttribute = product;
            }).catch(async () => {
                await loading.dismiss();
            });
        }
    }

    save(): void {
        this.saveDisabled = true;
        if (this.productId === 0) {
            if (this.productAttributeToEdit) {
                // update the old one in list
                this.productAttributeToEdit.title = this.productAttribute.title;
            }
            // add new
            this.modalController.dismiss(this.productAttribute);
            return;
        }
        this.productAttribute.productId = this.productId;
        this.productService.saveProductAttribute(this.productAttribute).then(async () => {
            this.analyticsService.logEvent('product-attribute-add-save-success');
            this.exitPage();
        });
    }

    async exitPage() {
        this.navCtrl.publish('reloadProductAttributes');
        this.navCtrl.publish('reloadProductAttribute', this.productAttribute);
        if (this.productId > 0) {
            this.navCtrl.publish('reloadProduct', { id: this.productId });
        }
        this.modalController.dismiss(this.productAttribute);
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
}
