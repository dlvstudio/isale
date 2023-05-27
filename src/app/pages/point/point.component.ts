import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { UserService } from '../../providers/user.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { PlanService } from '../../providers/plan.service';
import { PointService } from '../../providers/point.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';
import { CurrencyPipe } from '@angular/common';

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

    itemTemplateForLevelConfig = {
        h2: {
            field: 'title'
        },
        pList: [
            {
                short: 'point'
            },
            {
                short: 'buy-count'
            }
        ]
    };

    searchFieldsForLevelConfig = ['title'];

    itemTemplateForConfig = {
        pList: [
            {
                short: 'exchange',
                valueFunc: (item) => this.currencyPipe.transform(item.exchange, this.currency, 'symbol', '1.0-2', this.translateService.currentLang) + ' = 1 ' + this.translateService.instant('point-add.point')
            },
            {
                field: 'forAllCustomer',
                valueFunc: (item) => (item.forAllCustomer ? this.translateService.instant('point-add.for-all-customer') : '')
            },
            {
                short: 'product',
                titleValue: true
            },
            {
                short: 'category',
                titleValue: true
            },
            {
                short: 'contact',
                valueFunc: (item) => item.contact.fullName
            }
        ],
        thumbnail: 'product.avatarUrl'
    };

    searchFieldsForConfig = ['product.title', 'category.title', 'contact.fullName'];

    constructor(public navCtrl: RouteHelperService,
        private staffService: StaffService,
        private currencyPipe: CurrencyPipe,
        public userService: UserService,
        private pointService: PointService,
        public translateService: TranslateService,
        private planService: PlanService,
        private analyticsService: AnalyticsService,
    ) {
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

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currentPlan = await this.planService.getCurrentPlan();
        this.currency = await this.userService.getAttr('current-currency');
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
        this.config = await this.pointService.getPointPaymentConfig();
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
            items = items.filter((item) => (item.contact && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.category && item.category.title.toLowerCase().indexOf(searchKey) !== -1));
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
