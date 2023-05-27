import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { IOrderItem } from '../../models/order-item.interface';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';

@Component({
    selector: 'order-product-edit',
    templateUrl: 'order-product-edit.component.html'
})
export class OrderProductEditComponent {
    @Input() product: IOrderItem;
    @Input() currency: any;


    constructor(
        private viewCtrl: ModalController,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        public translateService: TranslateService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-product-edit');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.reCalc();
    }

    reCalc(): void {
        const netTotal = this.product.count * this.product.price;
        const discount = this.product.discountType === 0 ? this.product.discount * 1 : (netTotal * this.product.discount / 100);
        this.product.total = netTotal - discount;
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    ok(): void {
        this.viewCtrl.dismiss(this.product);
    }

    increase() {
        this.product.count++;
        this.reCalc();
    }

    decrease() {
        if (this.product && this.product.count === 0) {
            return;
        }
        this.product.count--;
        this.reCalc();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }
}
