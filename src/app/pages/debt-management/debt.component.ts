import { IDebt } from './../../models/debt.interface';
import { DateRangeComponent } from './../shared/date-range.component';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { DebtService } from '../../providers/debt.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StorageService } from '../../providers/storage.service';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'debt',
    templateUrl: 'debt.component.html'
})
export class DebtComponent {
    params: any = null;
    originalDebts: IDebt[];
    debts: IDebt[];
    searchKey = '';
    noteFilter = 'frequency';
    total = 0;
    totalPaid = 0;
    dateFrom = '';
    dateTo = '';
    currency: string;
    debtType = '2';
    page = 'debts';
    showLeftOnly = false;
    store;
    checkStore;
    selectedStaff;
    stores: any[];

    constructor(
        private debtService: DebtService,
        public translateService: TranslateService,
        private userService: UserService,
        private modalCtrl: ModalController,
        private storeService: StoreService,
        public navCtrl: RouteHelperService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private storage: StorageService,
        private staffService: StaffService,
        private analyticsService: AnalyticsService,
    ) {
        const reloadDebtList = (event) => {
            const data = event.detail;
            this.reload();
            if (data) {
                this.debtType = data.type;
                this.filter();
            }
        }
        this.navCtrl.removeEventListener('reloadDebtList', reloadDebtList);
        this.navCtrl.addEventListener('reloadDebtList', reloadDebtList);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('debt');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.stores = await this.storeService.getStores();
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.selectedStaff = this.staffService.selectedStaff;
        const leftOnly = await this.storage.get('left-only');
        this.showLeftOnly = leftOnly && true;
        this.params = this.navCtrl.getParams(this.params);
        if (this.params.page) {
            this.page = this.params.page;
            if (this.page == 'debts') {
                this.debtType = '3';
            } else {
                this.debtType = '0';
            }
        }
        if (this.params.type) {
            this.debtType = this.params.type;
        }
        // this.dateFrom = '';
        // this.dateTo = '';
        if (this.params.dateFrom) {
            this.dateFrom = this.params.dateFrom;
        } else {
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
        }
        if (this.params.dateTo) {
            this.dateTo = this.params.dateTo;
        } else {
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
        }
        this.debtService.getDebts(this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then(async (debts) => {
            const arr = [];
            if (debts && debts.length) {
                for (const debt of debts) {
                    debt.store = !this.checkStore && debt.storeId && this.stores && this.stores.length
                        ? this.stores.find(s => s.id == debt.storeId)
                        : null;
                    arr.push(debt);
                }
            }
            this.originalDebts = JSON.parse(JSON.stringify(arr));
            this.debts = arr;
            this.total = _.sumBy(this.debts, (item: IDebt) => item.value);
            this.totalPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
            this.filter();
            await loading.dismiss();
        });
    }

    async changeLeftOnly() {
        if (this.showLeftOnly) {
            await this.storage.set('left-only', '1');
            return;
        }
        await this.storage.remove('left-only');
    }

    openDebtAdd(): void {
        this.navCtrl.navigateForward('/debt/add', { debtType: +this.debtType });
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('debt-search');
        let debts: IDebt[] = JSON.parse(JSON.stringify(this.originalDebts));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            debts = debts.filter((item) => {
                return (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.code && item.product.code.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.product && item.product.title && item.product.title.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.debts = debts;
        this.total = _.sumBy(this.debts, (item: IDebt) => item.value);
        this.totalPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let debts: IDebt[] = JSON.parse(JSON.stringify(this.originalDebts));
        debts = debts && debts.length ? debts.filter((item) => item.debtType === +this.debtType) : [];
        debts = this.sortByModifiedAt(debts);
        this.debts = debts;
        this.total = _.sumBy(this.debts, (item: IDebt) => item.value);
        this.totalPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
    }

    changeDeptType(): void {
        this.filter();
    }

    sortByModifiedAt(debts: IDebt[]): IDebt[] {
        if (debts) {
            return _.orderBy(debts, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    selectDebt(id: number): void {
        this.navCtrl.navigateForward('/debt/detail', { id: id });
    }

    async deleteDebt(debt: IDebt): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('debt.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.debtService.deleteDebt(debt).then(async () => {
                            this.analyticsService.logEvent('debt-delete-success');
                            let i = this.debts.findIndex(item => item.id == debt.id);
                            if (i >= 0) {
                                this.debts.splice(i, 1);
                                this.total = _.sumBy(this.debts, (item: IDebt) => item.value);
                                this.totalPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
                            }
                            i = this.originalDebts.findIndex(item => item.id == debt.id);
                            if (i >= 0) {
                                this.originalDebts.splice(i, 1);
                            }
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async presentActionSheet(debt: IDebt) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('debt.delete-debt'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteDebt(debt);
                    }
                }, {
                    text: this.translateService.instant('debt.edit-debt'),
                    handler: () => {
                        this.selectDebt(debt.id);
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

    async selectDateRangeForDebt(): Promise<void> {
        let modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo != '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.debtService.getDebts(this.dateFrom, this.dateTo, this.store ? this.store.id : 0).then((debts) => {
                const arr = [];
                if (debts && debts.length) {
                    for (const debt of debts) {
                        debt.store = !this.checkStore && debt.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id == debt.storeId)
                            : null;
                        arr.push(debt);
                    }
                }
                this.originalDebts = JSON.parse(JSON.stringify(arr));
                this.debts = arr;
                this.total = _.sumBy(this.debts, (item: IDebt) => item.value);
                this.totalPaid = _.sumBy(this.debts, (item: IDebt) => item.valuePaid);
                this.filter();
            });
        }
    }

    addReport(): void {
        this.navCtrl.navigateForward('/debt-report/add', null);
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
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
