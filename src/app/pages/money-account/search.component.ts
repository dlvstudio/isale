import { Component } from '@angular/core';
import { IMoneyAccount } from '../../models/money-account.interface';
import { ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { MoneyAccountService } from '../../providers/money-account.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'search',
    templateUrl: 'search.component.html'
})
export class MoneyAccountSearchComponent {
    importantFilter = 'recent';
    products: IMoneyAccount[];
    originalProducts: IMoneyAccount[];
    searchKey = '';
    currency: string;
    callback;
    params;

    constructor(public navCtrl: RouteHelperService,
                public viewCtrl: ModalController,
                public translateService: TranslateService,
                private userService: UserService,
                private contactService: MoneyAccountService,
                private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.removeEventListener('reloadMoneyAccountList', this.reload);
        this.navCtrl.addEventListener('reloadMoneyAccountList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account-search');
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        this.currency = await this.userService.getCurrentCurrency();
        this.contactService.getMoneyAccounts().then(async (products) => {
            await loading.dismiss();
            this.originalProducts = JSON.parse(JSON.stringify(products));
            this.products = products;
        });
    }

    ngOnInit(): void {
        this.reload();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('search-money-account-search');
        let contacts: IMoneyAccount[] = JSON.parse(JSON.stringify(this.originalProducts));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            contacts = contacts.filter((item) => {
                return (item.accountName && item.accountName.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.products = contacts;
    }

    clearSearch() {
        this.searchKey = null;
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

    async selectContact(contact: IMoneyAccount): Promise<void> {
        if (this.callback) {
            this.callback(contact);
            await this.navCtrl.back();
            return;
        }
        this.viewCtrl.dismiss(contact);
    }

    openContactAdd(): void {
        this.navCtrl.navigateForward('/money-account/add', { fromSearch: true });
    }
}
