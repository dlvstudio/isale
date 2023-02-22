/* eslint-disable @angular-eslint/no-output-on-prefix */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IContact } from '../../../models/contact.interface';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { RouteHelperService } from '../../../providers/route-helper.service';

@Component({
    selector: 'transfer-note-list-item',
    templateUrl: 'transfer-note-list-item.component.html'
})
export class TransferNoteListItemComponent {
    @Input() currency: string;
    @Input() showContact = true;
    @Input() note: any;
    @Input() isStaff = false;
    @Output() onPress = new EventEmitter();
    @Output() onClick = new EventEmitter();

    constructor(
        public translateService: TranslateService,
        public navCtrl: RouteHelperService,
    ) {

    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateTimeString(date);
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
