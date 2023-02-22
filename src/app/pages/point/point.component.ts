import { Component } from '@angular/core';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { PlanService } from '../../providers/plan.service';
import { TranslateService } from '@ngx-translate/core';
import { PointService } from '../../providers/point.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ActionSheetController, AlertController } from '@ionic/angular';
import * as _ from 'lodash';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'point',
    templateUrl: './point.component.html',
})
export class PointComponent {
    params: any = null;
    dateFrom = '';
    config: any = { id: 0, allowPointPayment: false }
    dateTo = '';
    pointConfigs: any[] = [];
    levelConfigs: any[] = [];
    pointHistories: any[] = [];
    originalPointHistories: any[] = [];
    saveDisabled = false;
    segment = 'histories';
    noSave: any = true;
    currentPlan;
    total = 0;
    searchKeyHistories = '';
    isOnTrial;
    currency: string;
    selectedStaff: IStaff = null;

    constructor(public navCtrl: RouteHelperService,
        private staffService: StaffService,
        public userService: UserService,
        private pointService: PointService,
        private dataService: DataService,
        private alertCtrl: AlertController,
        private actionSheetCtrl: ActionSheetController,
        public translateService: TranslateService,
        private planService: PlanService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadPointList', this.reload);
        this.navCtrl.subscribe('reloadPointList', this.reload);
        this.selectedStaff = this.staffService.selectedStaff;
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('point');
    }

    changeSegment() {
        if (this.segment === 'config') {
            setTimeout(() => {
                this.noSave = false;
            }, 2000);
            return;
        }
        this.noSave = true;
    }

    async presentActionSheet(point: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('point.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.delete(point);
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

    async presentActionSheetLevel(level: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('point.delete-level'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteLevel(level);
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

    async delete(point: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('point.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.dataService.delete('point_history', point).then(async () => {
                            this.analyticsService.logEvent('point-delete-success');
                            let i = this.pointHistories.findIndex(item => item.id === point.id);
                            if (i >= 0) {
                                this.pointHistories.splice(i, 1);
                            }
                            i = this.originalPointHistories.findIndex(item => item.id === point.id);
                            if (i >= 0) {
                                this.originalPointHistories.splice(i, 1);
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

    async deleteLevel(level: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('point.delete-level-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.dataService.delete('level_config', level).then(async () => {
                            this.analyticsService.logEvent('level-delete-success');
                            let i = this.levelConfigs.findIndex(item => item.id === level.id);
                            if (i >= 0) {
                                this.levelConfigs.splice(i, 1);
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

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currentPlan = await this.planService.getCurrentPlan();
        this.currency = await this.userService.getCurrentCurrency();
        this.segment = 'histories';
        await this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.dateFrom) {
            this.dateFrom = this.params.dateFrom;
        } else {
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
        }
        if (this.params && this.params.dateTo) {
            this.dateTo = this.params.dateTo;
        } else {
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
        }
        this.pointHistories = await this.pointService.getHistories(this.dateFrom, this.dateTo);
        this.originalPointHistories = JSON.parse(JSON.stringify(this.pointHistories));
        this.pointConfigs = await this.pointService.getConfigs();
        this.config = await this.pointService.getPointPaymentConfig();
        this.levelConfigs = await this.pointService.getLevelConfigs();
        this.total = _.sumBy(this.pointHistories, (item: any) => item.amount);
        await loading.dismiss();
    }

    async onPeriodChanged(data: any): Promise<void> {
        if (!data) {
            return
        }
        this.analyticsService.logEvent('point-period-changed');
        const loading = await this.navCtrl.loading();
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

        if (!this.params) {
            this.params = {};
        }
        this.params.dateFrom = this.dateFrom;
        this.params.dateTo = this.dateTo;
        this.pointHistories = await this.pointService.getHistories(this.dateFrom, this.dateTo);
        this.originalPointHistories = JSON.parse(JSON.stringify(this.pointHistories));
        this.total = _.sumBy(this.pointHistories, (item: any) => item.amount);
        await loading.dismiss();
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    addConfig() {
        this.navCtrl.push('/point/add');
    }

    addLevelConfig() {
        this.navCtrl.push('/point/add-level');
    }

    selectConfig(id: number): void {
        this.navCtrl.navigateForward('/point/add', { id });
    }

    selectLevelConfig(id: number): void {
        this.navCtrl.navigateForward('/point/add-level', { id });
    }

    viewOrder(id: number): void {
        this.navCtrl.navigateForward('/order/detail', { id });
    }

    contactImageOrPlaceholder(contact: any): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    async searchHistories(): Promise<void> {
        this.analyticsService.logEvent('contact-search');
        let items: any[] = JSON.parse(JSON.stringify(this.originalPointHistories));
        if (this.searchKeyHistories !== null && this.searchKeyHistories !== '') {
            const searchKey = this.searchKeyHistories.toLowerCase();
            items = items.filter((item) => {
                return (item.contact && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.category && item.category.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.pointHistories = items;
        this.total = _.sumBy(this.pointHistories, (item: any) => item.amount);
    }

    clearSearchHistories() {
        this.searchKeyHistories = null;
        this.reload();
    }

    async savePointPayment(): Promise<void> {
        if (!this.validatePointPayment()) {
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        this.pointService.savePointPaymentConfig(this.config).then(async () => {
            this.analyticsService.logEvent('config-save-successfully');
            alert(this.translateService.instant('point-add.save-point-payment-successfully'))
            this.saveDisabled = false;
            await loading.dismiss();
        }).catch(async () => {
            this.saveDisabled = false;
            await loading.dismiss();
        });
    }

    validatePointPayment(): boolean {
        if (this.config.allowPayment && !this.config.paymentExchange) {
            alert(this.translateService.instant('point-add.no-payment-exchange-alert'));
            return false;
        }
        return true;
    }
}
