import { Component, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { PlanService } from '../../providers/plan.service';
import { PromotionService } from '../../providers/promotion.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';
import { CurrencyPipe } from '@angular/common';
import { ListOnlyComponent } from '../shared/list-only.component';

@Component({
    selector: 'promotion',
    templateUrl: './promotion.component.html',
})
export class PromotionComponent {
    @ViewChild(ListOnlyComponent, { static: true }) listConfigs: ListOnlyComponent;
    params: any = null;
    callback;
    dateFrom = '';
    dateTo = '';
    promotionConfigs: any[] = [];
    promotionHistories: any[] = [];
    originalPromotionHistories: any[] = [];
    originalPromotionConfigs: any[] = [];
    saveDisabled = false;
    segment = 'config';
    noSave: any = true;
    currentPlan;
    total = 0;
    searchKeyHistories = '';
    searchKeyConfigs = '';
    isOnTrial;
    currency: string;
    selectedStaff: IStaff = null;
    searchMode = false;
    orderItems;
    totalProductsAmount;
    totalProductsQuantity;

    changeActive = async (item, $event, objects, originalObjects) => {
        $event.stopPropagation();
        const oldItem = originalObjects.find(o => o.id === item.id);
        if (!oldItem || oldItem.isActive == item.isActive) {
            return;
        }

        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('promotion-add.active-changed-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                        item.isActive = !item.isActive;
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        oldItem.isActive = item.isActive;
                        await this.promotionService.saveConfig(item);
                    }
                },
            ]
        });
        await confirm.present();
    }

    itemTemplate = {
        h2: {
            field: 'name'
        },
        pList: [
            {
                short: 'code',
            },
            {
                short: 'start-date',
                valueFunc: (item) => this.dateFormat(item.startDate)
            },
            {
                short: 'end-date',
                valueFunc: (item) => this.dateFormat(item.endDate)
            },
            {
                bold: 'store',
                valueFunc: () => this.translateService.instant('promotion-add.apply-for')
            },
            {
                field: 'for-all-customer',
                valueFunc: (item) => (item.forAllCustomer ? this.translateService.instant('point-add.for-all-customer') : '')
            },
            {
                short: 'contact.full-name',
            },
            {
                short: 'product.title',
            },
            {
                short: 'category.title',
            },
            {
                short: 'store.name',
            },
            {
                bold: 'store',
                valueFunc: (item) => ((item.conditionTotalAmount || item.conditionTotalQuantity) ? this.translateService.instant('promotion-add.conditions') : '')
            },
            {
                short: 'condition-total-amount',
                valueFunc: (item) => this.currencyPipe.transform(item.conditionTotalAmount, this.currency, 'symbol', '1.0-2', this.translateService.currentLang)
            },
            {
                short: 'condition-total-quantity',
            },
            {
                bold: 'store',
                valueFunc: (item) => this.translateService.instant('promotion-add.payment')
            },
            {
                short: 'promotion-value',
                valueFunc: (item) => (item.isPercent ? item.promotionValue + '%' : this.currencyPipe.transform(item.promotionValue, this.currency, 'symbol', '1.0-2', this.translateService.currentLang))
            },
            {
                short: 'promotion-max-value',
                valueFunc: (item) => this.currencyPipe.transform(item.promotionMaxValue, this.currency, 'symbol', '1.0-2', this.translateService.currentLang)
            },
            {
                bold: 'store',
                valueFunc: (item) => ((item.promotionProduct || item.promotionCategory) && item.maxPromotionQuantity ? this.translateService.instant('promotion-add.promotion-products') : '')
            },
            {
                short: 'promotion-product.title'
            },
            {
                short: 'promotion-category.title'
            },
            {
                short: 'max-promotion-quantity'
            }
        ],
        toggleAction: {
            field: 'is-active',
            func: this.changeActive
        },
        thumbnail: 'product.avatarUrl'
    };

    searchFields = ['product.title', 'category.title', 'contact.fullName', 'name', 'code', 'store.name'];

    constructor(public navCtrl: RouteHelperService,
        private staffService: StaffService,
        public viewCtrl: ModalController,
        public userService: UserService,
        private promotionService: PromotionService,
        private dataService: DataService,
        private alertCtrl: AlertController,
        private actionSheetCtrl: ActionSheetController,
        public translateService: TranslateService,
        private planService: PlanService,
        private analyticsService: AnalyticsService,
        private currencyPipe: CurrencyPipe
    ) {
        this.navCtrl.unsubscribe('reloadPromotionList', this.reload);
        this.navCtrl.subscribe('reloadPromotionList', this.reload);
        this.selectedStaff = this.staffService.selectedStaff;
    }

    async presentActionSheet(promotion: any) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('promotion.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.delete(promotion);
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

    async delete(promotion: any): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('promotion.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.dataService.delete('promotion_history', promotion).then(async () => {
                            this.analyticsService.logEvent('promotion-delete-success');
                            let i = this.promotionHistories.findIndex(item => item.id === promotion.id);
                            if (i >= 0) {
                                this.promotionHistories.splice(i, 1);
                            }
                            i = this.originalPromotionHistories.findIndex(item => item.id === promotion.id);
                            if (i >= 0) {
                                this.originalPromotionHistories.splice(i, 1);
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

    async searchConfigs() {
        await this.listConfigs.callSearch(this.searchKeyConfigs);
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currentPlan = await this.planService.getCurrentPlan();
        this.currency = await this.userService.getAttr('current-currency');
        this.segment = 'config';
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.searchMode) {
            this.searchMode = this.params.searchMode;
        }
        if (this.params && this.params.orderItems) {
            this.orderItems = this.params.orderItems;
        }
        if (this.params && this.params.totalProductsAmount) {
            this.totalProductsAmount = this.params.totalProductsAmount;
        }
        if (this.params && this.params.totalProductsQuantity) {
            this.totalProductsQuantity = this.params.totalProductsQuantity;
        }
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
        await this.reload();
    }

    getAvaliablePromotionConfigs = async () => {
        let configs = [];
        if (this.searchMode) {
            const availConfigs = await this.promotionService.getAvailableConfigs();
            if (availConfigs && availConfigs.length && this.orderItems && this.orderItems.length) {
                for (const c of availConfigs) {
                    if (
                        (c.conditionTotalAmount && c.conditionTotalAmount > this.totalProductsAmount)
                        || (c.conditionTotalQuantity && c.conditionTotalQuantity > this.totalProductsQuantity)
                    ) {
                        continue;
                    }
                    if (
                        (c.category && this.orderItems.findIndex(oi => oi.categories && oi.categories.length && oi.categories.findIndex(cat => cat.categoryId === c.category.id) >= 0) < 0)
                    ) {
                        continue;
                    }
                    if (
                        (c.product && this.orderItems.findIndex(oi => oi.productId == c.product.id) < 0)
                    ) {
                        continue;
                    }
                    configs.push(c);
                }
            }
        } else {
            configs = await this.promotionService.getConfigs();
        }
        return configs;
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        if (!this.searchMode) {

            this.promotionHistories = await this.promotionService.getHistories(this.dateFrom, this.dateTo);
            this.originalPromotionHistories = JSON.parse(JSON.stringify(this.promotionHistories));
        }
        this.total = _.sumBy(this.promotionHistories, (item: any) => item.amount);
        await loading.dismiss();
    }

    async onPeriodChanged(data: any): Promise<void> {
        if (!data) {
            return
        }
        this.analyticsService.logEvent('promotion-period-changed');
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
        this.promotionHistories = await this.promotionService.getHistories(this.dateFrom, this.dateTo);
        this.originalPromotionHistories = JSON.parse(JSON.stringify(this.promotionHistories));
        this.total = _.sumBy(this.promotionHistories, (item: any) => item.amount);
        await loading.dismiss();
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    addConfig() {
        this.navCtrl.push('/promotion/add');
    }

    viewOrder(id: number): void {
        this.navCtrl.navigateForward('/order/detail', { id });
    }

    contactImageOrPlaceholder(contact: any): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0 ) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiDateLocalString(dateChanged);
    }

    async searchHistories(): Promise<void> {
        this.analyticsService.logEvent('promotion-search-histories');
        let items: any[] = JSON.parse(JSON.stringify(this.originalPromotionHistories));
        if (this.searchKeyHistories !== null && this.searchKeyHistories !== '') {
            const searchKey = this.searchKeyHistories.toLowerCase();
            items = items.filter((item) => (item.contact && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.category && item.category.title.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.promotionHistories = items;
        this.total = _.sumBy(this.promotionHistories, (item: any) => item.amount);
    }

    clearSearchHistories() {
        this.searchKeyHistories = null;
        this.reload();
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss();
    }
}
