import { Helper } from '../../providers/helper.service';
import { IContact } from '../../models/contact.interface';
import { DateTimeService } from '../../providers/datetime.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'customer-price-item',
    templateUrl: 'customer-price-item.component.html'
})
export class CustomerPriceItemComponent {
    @Input() currency: string;
    @Input() showContact: boolean;
    @Input() showProduct: boolean;
    @Input() customerPrice: any;
    @Output() onPress = new EventEmitter();
    @Output() onClick = new EventEmitter();

    constructor(
        public translateService: TranslateService,
    ) {
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
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
}
