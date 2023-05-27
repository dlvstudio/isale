import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { AnalyticsService } from '../../providers/analytics.service';
import { CalendarService } from '../../providers/calendar.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'calendar-detail',
    templateUrl: 'calendar-detail.component.html',
})
export class CalendarDetailComponent {
    calendar: any;
    params: any = null;
    currency: string;

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private userService: UserService,
        private calendarService: CalendarService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        const reloadCalendarHandle = (event) => {
            const calendar = event.detail;
            if (this.calendar && calendar.id === this.calendar.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadCalendar', reloadCalendarHandle);
        this.navCtrl.subscribe('reloadCalendar', reloadCalendarHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('calendar-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.calendar = await this.calendarService.getCalendar(id);
        }
        await loading.dismiss();
    }

    edit(): void {
        this.navCtrl.push('/calendar/add', { id: this.calendar.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('calendar.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteCalendar();
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

    async deleteCalendar(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('calendar.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.calendarService.deleteCalendar(this.calendar).then(async () => {
                            this.analyticsService.logEvent('calendar-detail-delete-success');
                            this.navCtrl.publish('reloadCalendarList', null);
                            this.navCtrl.pop();
                        });
                    }
                },
            ]
        });
        confirm.present();
    }

    selectCalendar(id: number): void {
        this.navCtrl.push('/calendar/detail', { id });
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
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
}
