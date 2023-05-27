import { DateTimeService } from './../../providers/datetime.service';
import { Component, Input, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ModalController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'date-range',
    templateUrl: 'date-range.component.html'
})
export class DateRangeComponent {
    @Input() dateFromInput: any = null;
    @Input() dateToInput: any = null;
    @Input() timeTypeInput: any = null;
    @Input() selectedStaff: any = null;
    @Input() storeSelected: any = null;
    @Input() page = '';
    dateFrom = '';
    dateTo = '';
    currentMoment: moment.Moment = moment();
    timeType = 'month';
    callback;
    params;

    constructor(
        public viewCtrl: ModalController,
        public staffService: StaffService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
    ) {
    }

    ngOnInit(): void {
        this.timeType = 'custom';
        this.currentMoment = moment();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.dateFromInput = this.params.dateFromInput;
            this.dateToInput = this.params.dateToInput;
            this.timeTypeInput = this.params.timeTypeInput;
            this.selectedStaff = this.params.selectedStaff;
            this.storeSelected = this.params.storeSelected;
            this.page = this.params.page;
            this.callback = this.params.callback;
        }
        if (this.dateFromInput && this.dateFromInput != '') {
            this.dateFrom = moment(this.dateFromInput, DateTimeService.getDbFormat()).format('YYYY-MM-DD');
            this.currentMoment = moment(this.dateFrom, DateTimeService.getDbFormat());
        }
        if (this.dateToInput && this.dateToInput != '') {
            this.dateTo = moment(this.dateToInput, DateTimeService.getDbFormat()).format('YYYY-MM-DD');
            this.currentMoment = moment(this.dateFrom, DateTimeService.getDbFormat());
        }
        if (this.timeTypeInput && this.timeTypeInput != '') {
            this.timeType = this.timeTypeInput;
        }
    }

    getMonth(): string {
        return this.currentMoment.format('MM/YYYY');
    }

    getWeek(): string {
        return this.currentMoment.week() + '/' + this.currentMoment.format('YYYY');
    }

    getQuarter(): string {
        return this.currentMoment.quarter() + '/' + this.currentMoment.format('YYYY');
    }

    getDay(): string {
        return this.currentMoment.date() + '/' + this.currentMoment.format('MM');
    }

    setCurrentMoment(): void {
        this.currentMoment = moment();
        this.doCalculate();
    }

    previousMoment(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(1));
        this.doCalculate();
    }

    nextMoment(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(1));
        this.doCalculate();
    }

    setCurrentWeek(): void {
        this.currentMoment = moment();
        this.doCalculateWeek();
    }

    previousWeek(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(0));
        this.doCalculateWeek();
    }

    nextWeek(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(0));
        this.doCalculateWeek();
    }

    setCurrentQuarter(): void {
        this.currentMoment = moment();
        this.doCalculateQuarter();
    }

    previousQuarter(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(5));
        this.doCalculateQuarter();
    }

    nextQuarter(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(5));
        this.doCalculateQuarter();
    }

    setCurrentDay(): void {
        this.currentMoment = moment();
        this.doCalculateDay();
    }

    previousDay(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(3));
        this.doCalculateDay();
    }

    nextDay(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(3));
        this.doCalculateDay();
    }

    doCalculate(): void {
        this.dateFrom = this.currentMoment.startOf('month').format('YYYY-MM-DD');
        this.dateTo = this.currentMoment.endOf('month').format('YYYY-MM-DD');
    }

    doCalculateWeek(): void {
        this.dateFrom = this.currentMoment.startOf('week').format('YYYY-MM-DD');
        this.dateTo = this.currentMoment.endOf('week').format('YYYY-MM-DD');
    }

    doCalculateQuarter(): void {
        this.dateFrom = this.currentMoment.startOf('quarter').format('YYYY-MM-DD');
        this.dateTo = this.currentMoment.endOf('quarter').format('YYYY-MM-DD');
    }

    doCalculateDay(): void {
        this.dateFrom = this.currentMoment.startOf('day').format('YYYY-MM-DD');
        this.dateTo = this.currentMoment.endOf('day').format('YYYY-MM-DD');
    }

    dismiss() {
        if (this.callback) {
            this.callback(null);
            this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }

    ok() {
        if (!this.currentMoment) {
            this.currentMoment = moment();
        }
        if (this.timeType != 'custom') {
            if (this.timeType == 'month') {
                this.doCalculate();
            } else if (this.timeType == 'week') {
                this.doCalculateWeek();
            } else if (this.timeType == 'quarter') {
                this.doCalculateQuarter();
            } else if (this.timeType == 'day') {
                this.doCalculateDay();
            }
        }
        if (this.callback) {
            this.callback({ dateFrom: this.dateFrom, dateTo: this.dateTo, timeType: this.timeType, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
            this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss({ dateFrom: this.dateFrom, dateTo: this.dateTo, timeType: this.timeType, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
    }

    remove(): void {
        this.dateFrom = '';
        this.dateTo = '';
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    showDateFromPopup(): void {
        this.dateFrom = moment().startOf('day').format('YYYY-MM-DD');
    }

    removeDateFrom(): void {
        this.dateFrom = '';
    }

    showDateToPopup(): void {
        this.dateTo = moment().startOf('day').format('YYYY-MM-DD');
    }

    removeDateTo(): void {
        this.dateTo = '';
    }

    async showSearchStaff() {
        this.analyticsService.logEvent('date-range-search-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.selectedStaff = staff;
            }
        };
        this.navCtrl.push('/staff', { callback, searchMode: true });
    }

    removeStaff(): void {
        this.selectedStaff = null;
    }

    async showSearchStore() {
        const callback = (data) => {
            const store = data;
            if (store) {
                this.storeSelected = store;
            }
        };
        this.navCtrl.push('/store', { callback, searchMode: true });
    }

    removeStore(): void {
        this.storeSelected = null;
    }
}
