import { ActionSheetController, AlertController } from '@ionic/angular';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { StaffService } from '../../providers/staff.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { UserService } from '../../providers/user.service';
import { CalendarService } from '../../providers/calendar.service';
import { Helper } from '../../providers/helper.service';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'calendar',
    templateUrl: 'calendar.component.html'
})
export class CalendarComponent {
    originalCalendars: any[];
    calendars: any[];
    days: any[];
    calendarsGroupDate: any = {};
    searchKey = '';
    currency: string;
    store;
    checkStore;
    selectedStaff;

    constructor(
        private calendarService: CalendarService,
        private translateService: TranslateService,
        public staffService: StaffService,
        private storeService: StoreService,
        public navCtrl: RouteHelperService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private userService: UserService,
    ) {
        this.navCtrl.unsubscribe('reloadCalendarList', this.reload);
        this.navCtrl.subscribe('reloadCalendarList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('calendar');
    }

    ngOnInit(): void {
        this.reload();
    }

    dateFormat(day) {
        return moment(day, DateTimeService.getDateDbFormat()).format(DateTimeService.getUiDateFormat());
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.store = await this.storeService.getCurrentStore();
        let calendars = await this.calendarService.getCalendars(this.store ? this.store.id : 0);
        calendars = this.sortByDayAndHour(calendars);
        await loading.dismiss();
        this.originalCalendars = JSON.parse(JSON.stringify(calendars));
        this.calendars = calendars;
        this.calendarsGroupDate = {};
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
        for (const calendar of calendars) {
            const day = calendar.dayOnly;
            if (!this.calendarsGroupDate[day]) {
                this.calendarsGroupDate[day] = [];
            }
            this.calendarsGroupDate[day].push(calendar);
        }
        this.days = Object.keys(this.calendarsGroupDate);
    }

    openCalendarAdd(): void {
        this.navCtrl.push('/calendar/add', null);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('calendar-search');
        let calendars: any[] = JSON.parse(JSON.stringify(this.originalCalendars));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            calendars = calendars.filter((item) => (
                    item.fullname && item.fullname.toLowerCase().indexOf(searchKey) !== -1
                    || item.email && item.email.toLowerCase().indexOf(searchKey) !== -1
                    || item.phone && item.phone.toLowerCase().indexOf(searchKey) !== -1
                ));
        }
        calendars = this.sortByDayAndHour(calendars);
        this.calendarsGroupDate = {};
        for (const calendar of calendars) {
            const day = calendar.dayOnly;
            if (!this.calendarsGroupDate[day]) {
                this.calendarsGroupDate[day] = [];
            }
            this.calendarsGroupDate[day].push(calendar);
        }
        this.days = Object.keys(this.calendarsGroupDate);
        this.calendars = calendars;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    sortByDayAndHour(calendarsInput: any[]): any[] {
        if (calendarsInput) {
            for (const calendar of calendarsInput) {
                calendar.dayOnly = DateTimeService.toUiLocalDateString(calendar.day);
            }
            const ret =  _.orderBy(calendarsInput, ['day', 'hour'], ['asc', 'asc']);
            return ret;
        }
        return null;
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectCalendar(id: number): void {
        this.navCtrl.push('/calendar/detail', { id });
    }

    async deleteCalendar(calendar: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('calendar.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.calendarService.deleteCalendar(calendar).then(async () => {
                            this.analyticsService.logEvent('calendar-delete-success');
                            let i = this.calendars.findIndex(item => item.id == calendar.id);
                            if (i >= 0) {
                                this.calendars.splice(i, 1);
                            }
                            i = this.originalCalendars.findIndex(item => item.id == calendar.id);
                            if (i >= 0) {
                                this.originalCalendars.splice(i, 1);
                            }
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async presentActionSheet(calendar: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('calendar.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteCalendar(calendar);
                    }
                }, {
                    text: this.translateService.instant('calendar.view-detail'),
                    handler: () => {
                        this.selectCalendar(calendar.id);
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    callPhone(mobile: string): void {
        if (!mobile) {
            return;
        }
        Helper.callPhone(mobile);
    }

    sendEmail(mobile: string): void {
        if (!mobile) {
            return;
        }
        Helper.sendEmail(mobile);
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', {shop: this.store.name}),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.storeService.exitStore();
                        await this.reload();
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }
}
