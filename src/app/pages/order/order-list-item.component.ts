/* eslint-disable @angular-eslint/no-output-on-prefix */
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { IContact } from './../../models/contact.interface';
import { IOrder } from '../../models/order.interface';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'order-list-item',
    templateUrl: 'order-list-item.component.html'
})
export class OrderListItemComponent {
    @Input() currency: string;
    @Input() showContact = true;
    @Input() selectMode = false;
    @Input() isSelected = false;
    @Input() order: IOrder;
    @Input() isStaff = false;
    @Input() color = 'default';
    @Output() onPress = new EventEmitter();
    @Output() onClick = new EventEmitter();

    constructor(
        public translateService: TranslateService    ) {
    }

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0 ) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    press(): void {
        this.onPress.emit();
    }

    click(): void {
        if (this.selectMode) {
          return;
        }
        this.onClick.emit();
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }
}
