/* eslint-disable @angular-eslint/no-output-on-prefix */
import { Helper } from './../../providers/helper.service';
import { ITrade } from './../../models/trade.interface';
import { IContact } from './../../models/contact.interface';
import { DateTimeService } from './../../providers/datetime.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'trade-item',
    templateUrl: 'trade-item.component.html'
})
export class TradeItemComponent {
    @Input() currency: string;
    @Input() showContact: boolean;
    @Input() isStaff = false;
    @Input() showProduct = true;
    @Input() trade: ITrade;
    @Output() onPress = new EventEmitter();
    @Output() onClick = new EventEmitter();

    constructor(
        public translateService: TranslateService    ) {
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
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
