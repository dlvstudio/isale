import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { DateTimeService } from '../../providers/datetime.service';

@Component({
    selector: 'date-item',
    templateUrl: 'date-item.component.html'
})
export class DateItemComponent {
    @Input() pickerId: string;
    @Input() label: string;
    @Input() date: string;
    @Output() dateChange = new EventEmitter();
    minDate: any = (new Date()).getFullYear() - 100;
    maxDate: any = (new Date()).getFullYear() + 100;

    constructor(
    ){
    }

    showDatePopup(): void {
        this.date = moment().format(DateTimeService.getDateDbFormat());
        this.dateChange.emit(this.date);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
    }

    removeDate(): void {
        this.date = '';
        this.dateChange.emit(this.date);
    }

    dateChanged(): void {
        this.dateChange.emit(this.date);
    }
}
