/* eslint-disable @angular-eslint/no-output-on-prefix */
import { DateRangeComponent } from './date-range.component';
import { Component, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import * as moment from 'moment';
import { IonSelect, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StorageService } from '../../providers/storage.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'period-range',
    templateUrl: 'period-range.component.html'
})
export class PeriodRangeComponent {
    @ViewChild('dateFromPicker', { static: true }) dateFromPicker;
    @ViewChild('orderOtherStatusSelect', { static: false }) orderOtherStatusSelect: IonSelect;
    @ViewChild('dateToPicker', { static: true }) dateToPicker;
    @Input() page = '';
    @Input() modeLink = false;
    dateFrom = '';
    dateTo = '';
    orderStatus = -1;
    isLoading = false;
    currentMoment: moment.Moment = moment();
    currentNumber: string;
    previousNumber: string;
    nextNumber: string;
    segment = 'curr';
    currentType = 1; // month
    isReceivedTrade = -1;
    selectedStaff;
    storeSelected;
    orderOtherStatus = 4;
    @Output() onPeriodChanged = new EventEmitter<any>();

    constructor(
        private modalCtrl: ModalController,
        public navCtrl: RouteHelperService,
        public staffService: StaffService,
        private storageService: StorageService,
        private translateService: TranslateService) {
    }

    async ngOnInit(): Promise<void> {
        const currentTypeStr = await this.storageService.get('period-range-type-' + this.page);
        if (currentTypeStr) {
            this.currentType = +currentTypeStr;
        } else if (currentTypeStr === 0) {
            this.currentType = 0;
        }
        this.setCurrentMoment();
    }

    setCurrentMoment(): void {
        this.currentMoment = moment();
        this.doCalculate();
    }

    previousMoment(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(this.currentType));
        this.doCalculate();
    }

    nextMoment(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(this.currentType));
        this.doCalculate();
    }

    doCalculate(): void {
        const timeText = DateTimeService.dateTypeToStartOf(this.currentType);
        this.dateFrom = this.currentMoment.startOf(timeText).format('YYYY-MM-DD');
        this.dateTo = this.currentMoment.endOf(timeText).format('YYYY-MM-DD');
        this.onPeriodChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, orderStatus: this.orderStatus, isReceivedTrade: this.isReceivedTrade, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
        this.setToCurr();
    }

    setToCurr(): void {
        setTimeout(() => {
            this.segment = 'curr';
            const previousMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(this.currentType));
            const nextMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(this.currentType));
            if (this.currentType === 1) {
                this.currentNumber = this.currentMoment.format('MM') + '/' + this.currentMoment.format('YYYY');
                this.previousNumber = previousMoment.format('MM') + '/' + previousMoment.format('YYYY');
                this.nextNumber = nextMoment.format('MM') + '/' + nextMoment.format('YYYY');
            } else if (this.currentType === 0) {
                this.currentNumber = this.currentMoment.week() + '/' + this.currentMoment.format('YYYY');
                this.previousNumber = previousMoment.week() + '/' + previousMoment.format('YYYY');
                this.nextNumber = nextMoment.week() + '/' + nextMoment.format('YYYY');
            } else if (this.currentType === 5) {
                this.currentNumber = this.currentMoment.quarter() + '/' + this.currentMoment.format('YYYY');
                this.previousNumber = previousMoment.quarter() + '/' + previousMoment.format('YYYY');
                this.nextNumber = nextMoment.quarter() + '/' + nextMoment.format('YYYY');
            } else if (this.currentType === 4) {
                this.currentNumber = this.currentMoment.date() + '/' + this.currentMoment.format('MM');
                this.previousNumber = previousMoment.date() + '/' + previousMoment.format('MM');
                this.nextNumber = nextMoment.date() + '/' + nextMoment.format('MM');
            }
        }, 300);
    }

    getTimeType(): string {
        let timeType = this.translateService.instant('date-range.by-month');
        if (this.currentType === 0) {
            timeType = this.translateService.instant('date-range.by-week');
        } else if (this.currentType === 5) {
            timeType = this.translateService.instant('date-range.by-quarter');
        } else if (this.currentType === 3) {
            timeType = this.translateService.instant('date-range.custom');
        } else if (this.currentType === 4) {
            timeType = this.translateService.instant('date-range.by-day');
        }
        return timeType;
    }

    async selectDateRangeByOpenLink() {
        let timeType = 'month';
        if (this.currentType === 0) {
            timeType = 'week';
        } else if (this.currentType === 5) {
            timeType = 'quarter';
        } else if (this.currentType === 3) {
            timeType = 'custom';
        } else if (this.currentType === 4) {
            timeType = 'day';
        }
        const callback = async (data) => {
            if (data) {
                if (data.dateFrom !== '') {
                    this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
                } else {
                    this.dateFrom = '';
                }
                if (data.dateTo !== '') {
                    this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
                } else {
                    this.dateTo = '';
                }
                this.selectedStaff = data.selectedStaff;
                this.storeSelected = data.storeSelected;
                this.currentMoment = moment(this.dateFrom, DateTimeService.getDbFormat());
                if (data.timeType !== '') {
                    if (data.timeType === 'month') {
                        this.currentType = 1;
                    } else if (data.timeType === 'week') {
                        this.currentType = 0;
                    } else if (data.timeType === 'quarter') {
                        this.currentType = 5;
                    } else if (data.timeType === 'custom') {
                        this.currentType = 3;
                    } else if (data.timeType === 'day') {
                        this.currentType = 4;
                    }
                } else {
                    this.currentType = 3;
                }
                await this.storageService.set('period-range-type-' + this.page, this.currentType);
                this.onPeriodChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, orderStatus: this.orderStatus, isReceivedTrade: this.isReceivedTrade, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
            }
            this.setToCurr();
        }
        this.navCtrl.push('/order/select-filter', { callback, dateFromInput: this.dateFrom, dateToInput: this.dateTo, timeTypeInput: timeType, selectedStaff: this.selectedStaff, page: this.page, storeSelected: this.storeSelected })
    }

    async selectDateRange(): Promise<void> {
        if (this.modeLink) {
            await this.selectDateRangeByOpenLink();
            return;
        }
        let timeType = 'month';
        if (this.currentType === 0) {
            timeType = 'week';
        } else if (this.currentType === 5) {
            timeType = 'quarter';
        } else if (this.currentType === 3) {
            timeType = 'custom';
        } else if (this.currentType === 4) {
            timeType = 'day';
        }
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo, timeTypeInput: timeType, selectedStaff: this.selectedStaff, page: this.page, storeSelected: this.storeSelected }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom !== '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.selectedStaff = data.selectedStaff;
            this.storeSelected = data.storeSelected;
            this.currentMoment = moment(this.dateFrom, DateTimeService.getDbFormat());
            if (data.timeType !== '') {
                if (data.timeType === 'month') {
                    this.currentType = 1;
                } else if (data.timeType === 'week') {
                    this.currentType = 0;
                } else if (data.timeType === 'quarter') {
                    this.currentType = 5;
                } else if (data.timeType === 'custom') {
                    this.currentType = 3;
                } else if (data.timeType === 'day') {
                    this.currentType = 4;
                }
            } else {
                this.currentType = 3;
            }
            await this.storageService.set('period-range-type-' + this.page, this.currentType);
            this.onPeriodChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, orderStatus: this.orderStatus, isReceivedTrade: this.isReceivedTrade, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
        }
        this.setToCurr();
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    changeStatus() {
        this.onPeriodChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, orderStatus: this.orderStatus, isReceivedTrade: this.isReceivedTrade, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
    }

    async selectOtherStatus() {
        this.orderOtherStatusSelect.open();
    }

    changeOrderOtherStatus() {
        setTimeout(() => {
            this.orderStatus = this.orderOtherStatus;
        }, 500);
    }

    changeTradeType() {
        this.onPeriodChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, orderStatus: this.orderStatus, isReceivedTrade: this.isReceivedTrade, selectedStaff: this.selectedStaff, storeSelected: this.storeSelected });
    }
}
