import { Component, Input } from '@angular/core';
import { IOrder } from '../../models/order.interface';
import { Order } from '../../models/order.model';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';

import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'order-print',
    templateUrl: 'order-print.component.html',
})
export class OrderPrintComponent {
    @Input() order: IOrder = new Order();
    @Input() currency: string;
    @Input() shop: any;
    @Input() isMobile = false;
    @Input() totalProductsAmount = 0;
    @Input() totalProductsQuantity = 0;
    @Input() printOrderLikeInvoice = false;
    @Input() hideTax = false;
    @Input() orderInvoiceMaxEmptyRows = 10;
    @Input() hideDiscountColumn = true;
    @Input() showStaffPhone = false;
    @Input() showStaffNameUnderSign = false;
    @Input() hideProductCodePrint = true;
    @Input() orderPrintNote = '';

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
    ) {
    }

    toHtml(key, afterFix = ':') {
        return Helper.toHtml(this.translateService.instant(key), afterFix);
    }

    numberArrays(start, end) {
        return Helper.numberArrays(start, end);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(this.hideProductCodePrint ? '' : code, title);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }
}
