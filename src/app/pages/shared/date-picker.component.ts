import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { DateTimeService } from './../../providers/datetime.service';

@Component({
    selector: 'date-picker',
    templateUrl: 'date-picker.component.html'
})
export class DatePickerComponent {
    @Input() min: any = null;
    @Input() max: any = null;
    @Input() pickerId: any = null;
    @Input() date = '';
    @Input() type = 'date';
    @Output() dateChange = new EventEmitter<string>();

    constructor(
    ) {
    }

    ionViewWillEnter() {
        this.date = this.date && this.date.length > 10
            ? (this.type === 'datetime-local'
                ? moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateTimeDbFormat())
                : moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateDbFormat()))
            : this.date;
        if (!this.min) {
            this.min = '1900-01-01';
        }
        if (!this.max) {
            this.max = '2100-01-01';
        }
    }

    ngOnInit(): void {
        this.date = this.date && this.date.length > 10
            ? (this.type === 'datetime-local'
                ? moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateTimeDbFormat())
                : moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateDbFormat()))
            : this.date;
        if (!this.min) {
            this.min = '1900-01-01';
        }
        if (!this.max) {
            this.max = '2100-01-01';
        }
    }

    change() {
        this.date = this.date && this.date.length > 10
            ? (this.type === 'datetime-local'
                ? moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateTimeDbFormat())
                : moment(this.date.split(':00Z').join('')).format(DateTimeService.getDateDbFormat()))
            : this.date;
        this.dateChange.emit(this.date);
    }
}
