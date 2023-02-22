import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { IReceivedNoteItem } from '../../../models/received-note-item.interface';
import { AnalyticsService } from '../../../providers/analytics.service';
import { Helper } from '../../../providers/helper.service';
import { RouteHelperService } from '../../../providers/route-helper.service';

@Component({
    selector: 'received-note-product-edit',
    templateUrl: 'received-note-product-edit.component.html'
})
export class ReceivedNoteProductEditComponent {
    @Input() product: IReceivedNoteItem;
    @Input() currency: any;
    @Input() foreignCurrency: any;

    constructor(
        private viewCtrl: ModalController,
        private analyticsService: AnalyticsService,
        public translateService: TranslateService,
        private alertCtrl: AlertController,
        public navCtrl: RouteHelperService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('received-note-product-edit');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.reCalc();
    }

    reCalc(): void {
        const netTotal = this.product.quantity * this.product.costPrice;
        const discount = this.product.discountType === 0
            ? (this.product.discountPercent === 0
                ? this.product.discount * 1
                : netTotal * this.product.discountPercent / 100
            )
            : (netTotal * this.product.discount / 100);
        this.product.discount = discount;
        this.product.amount = netTotal - discount;
        if (this.product.unitPriceForeign && this.product.quantity) {
            this.product.amountForeign = this.product.quantity * this.product.unitPriceForeign;
        }
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    validate() {
        if (!this.product.quantity) {
            alert(this.translateService.instant('received-note.no-quantity-alert'));
            return false;
        }
        if (this.product.discount === null || this.product.discount === undefined) {
            alert(this.translateService.instant('received-note.no-discount-alert'));
            return false;
        }
        if (!this.product.productId && !this.product.productCode) {
            alert(this.translateService.instant('received-note.no-code-alert'));
            return false;
        }
        if (!this.product.productName) {
            alert(this.translateService.instant('received-note.no-name-alert'));
            return false;
        }
        if (!this.product.costPrice) {
            alert(this.translateService.instant('received-note.no-cost-price-alert'));
            return false;
        }
        if (!this.product.unitPrice) {
            alert(this.translateService.instant('received-note.no-price-alert'));
            return false;
        }
        return true;
    }

    ok(): void {
        if (!this.validate()) {
            return;
        }
        this.viewCtrl.dismiss(this.product);
    }

    increase() {
        this.product.quantity++;
        this.reCalc();
    }

    decrease() {
        this.product.quantity--;
        this.reCalc();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async openProductDiscountPercent() {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('received-note-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('received-note-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: this.product.discountPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('received-note-add.remove-percent'),
                    handler: () => {
                        this.product.discountPercent = 0;
                        this.product.discount = 0;
                        this.reCalc();
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async (inputs: any) => {
                        if (!inputs) {
                            return;
                        }
                        const percent = +inputs.discountPercent;
                        if (percent < 0 || percent > 100) {
                            alert(this.translateService.instant('received-note-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('received-note-add-change-discount-percent');
                        if (percent) {
                            this.product.discountPercent = percent;
                            // item.discount = (item.costPrice * item.quantity) * percent / 100;
                            this.reCalc();
                        }
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await discountDialog.present();
    }
}
