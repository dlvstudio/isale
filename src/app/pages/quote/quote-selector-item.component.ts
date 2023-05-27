/* eslint-disable @angular-eslint/no-output-on-prefix */
// tslint:disable:use-lifecycle-interface
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { StaffService } from '../../providers/staff.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'quote-selector-item',
    templateUrl: 'quote-selector-item.component.html'
})
export class QuoteSelectorItemComponent {
    @Output() onReCalc = new EventEmitter<any>();
    @Output() onIncrease = new EventEmitter<any>();
    @Output() onDecrease = new EventEmitter<any>();
    @Output() onChangeCount = new EventEmitter<any>();
    @Output() onShowOptions = new EventEmitter<any>();
    @Output() onShowTypes = new EventEmitter<any>();
    @Output() onExpand = new EventEmitter<any>();
    @Output() onAdd = new EventEmitter<any>();
    @Output() onApplyItemTotal = new EventEmitter<any>();
    @Output() onRemoveProduct = new EventEmitter<any>();
    @Input() isShopAdmin: any = false;
    @Input() product: any = null;
    @Input() currency: string;
    @Input() isSelected = false;

    constructor(public staffService: StaffService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController) {
    }

    async openProductDiscountPercent(item: any) {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('order-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('order-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: item.discountPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('order-add.remove-percent'),
                    handler: () => {
                        item.discountPercent = 0;
                        item.discount = 0;
                        this.onReCalc.emit(item);
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
                            alert(this.translateService.instant('order-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('order-add-change-discount-percent');
                        if (percent) {
                            item.discountPercent = percent;
                            item.discount = (item.price * item.count) * percent / 100;
                            this.onReCalc.emit(item);
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

    changeCount(item) {
        this.onChangeCount.emit(item);
    }

    toFixQuantity(count: any) {
        return Helper.toFixQuantity(count);
    }

    increase(item) {
        this.onIncrease.emit(item);
    }

    decrease(item) {
        this.onDecrease.emit(item);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    showOptions(product) {
        this.onShowOptions.emit(product);
    }

    getOptionPrices(product: any) {
        return product && Helper.getOptionPrices(product);
    }

    showTypes(product) {
        this.onShowTypes.emit(product);
    }

    showOthers(product) {
        product.showOthers = !product.showOthers;
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    getTypeOptions(types): any[] {
        return Helper.getTypeOptions(types);
    }

    expand(product: any) {
        this.onExpand.emit(product);
    }

    reCalc(product: any) {
        this.onReCalc.emit(product);
    }

    add(): void {
        this.onAdd.emit();
    }

    applyItemTotal(): void {
        this.onApplyItemTotal.emit();
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    hasOptionsOrAttributes(product) {
        return product && Helper.hasOptionsOrAttributes(product);
    }

    removeProduct(product) {
        this.onRemoveProduct.emit(product);
    }
}
