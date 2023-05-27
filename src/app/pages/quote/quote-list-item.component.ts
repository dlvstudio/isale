/* eslint-disable @angular-eslint/no-output-on-prefix */
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { IContact } from './../../models/contact.interface';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'quote-list-item',
    templateUrl: 'quote-list-item.component.html'
})
export class QuoteListItemComponent {
    @Input() currency: string;
    @Input() showContact = true;
    @Input() selectMode = false;
    @Input() isSelected = false;
    @Input() quote: any;
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
        const arr = [];
        for (const type of product.types) {
            const typeArr = [];
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price) {
                    typeArr.push(val.title);
                }
            }
            if (typeArr && typeArr.length) {
                const vals = typeArr.join(', ');
                arr.push(type.title + ': ' + vals);
            }
        }
        return arr.join('; ');
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }
}
