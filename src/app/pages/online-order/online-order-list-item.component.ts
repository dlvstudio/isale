import { IContact } from '../../models/contact.interface';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IOrder } from '../../models/order.interface';
import { DateTimeService } from '../../providers/datetime.service';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'online-order-list-item',
    templateUrl: 'online-order-list-item.component.html'
})
export class OnlineOrderListItemComponent {
    @Input() currency: string;
    @Input() showContact = true;
    @Input() order: IOrder;
    @Input() isStaff = false;
    @Output() onPress = new EventEmitter();
    @Output() onClick = new EventEmitter();

    constructor(
        public translateService: TranslateService    ) {
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
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
        this.onClick.emit();
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }
}
