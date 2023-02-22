import { Component } from '@angular/core';
import { IMoneyAccount } from '../../models/money-account.interface';
import { MoneyAccount } from '../../models/money-account.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';
import { TranslateService } from '@ngx-translate/core';
import { MoneyAccountService } from '../../providers/money-account.service';
import { Platform } from '@ionic/angular';
import { Helper } from '../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { Trade } from '../../models/trade.model';
import { TradeService } from '../../providers/trade.service';

@Component({
    selector: 'money-account-add',
    templateUrl: 'money-account-add.component.html',
})
export class MoneyAccountAddComponent {
    params: any = null;
    account: IMoneyAccount = new MoneyAccount();
    storageDirectory = '';
    currency: any;
    isNew = true;
    saveDisabled = false;
    fromSearch = false;
    oldTotal = 0;

    constructor(
        public navCtrl: RouteHelperService,
        private userService: UserService,
        private file: File,
        private translateService: TranslateService,
        private moneyAccountService: MoneyAccountService,
        private tradeService: TradeService,
        private platform: Platform,
        private analyticsService: AnalyticsService,
    ) {
        this.platform.ready().then(() => {
            // make sure this is on a device, not an emulation (e.g. chrome tools device mode)
            if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
                return false;
            }

            if (this.platform.is('ios')) {
                this.storageDirectory = this.file.documentsDirectory;
            } else if (this.platform.is('android')) {
                this.storageDirectory = this.file.dataDirectory;
            } else {
                // exit otherwise, but you could add further types here e.g. Windows
                return false;
            }
        });
    }
    
    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('money-account-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currency = await this.userService.getCurrentCurrency();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        this.fromSearch = this.params && this.params.fromSearch;
        this.account = new MoneyAccount();
        let accountId = 0;
        if (data) {
            if (data.id) {
                accountId = data.id;
                this.isNew = false;
            }
        }
        const loading = await this.navCtrl.loading();
        if (accountId && accountId > 0) {
            this.moneyAccountService.get(accountId).then(async (account) => {
                await loading.dismiss();
                this.account = account;
                this.oldTotal = this.account ? this.account.total : 0;
            });
        } else {
            this.moneyAccountService.getDefault().then(async (acc: IMoneyAccount) => {
                await loading.dismiss();
                if (!acc) {
                    const account = new MoneyAccount();
                    account.isDefault = true;
                    this.account = account;
                    this.oldTotal = this.account ? this.account.total : 0;
                }
            });
        }
    }

    async save(): Promise<void> {
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        const newTotal = this.account.total;
        this.account.total = this.oldTotal;
        this.moneyAccountService.saveMoneyAccount(this.account).then(async (res) => {
            this.analyticsService.logEvent('money-account-add-save-success');
            await loading.dismiss();
            if (res) {
                const trade = new Trade();
                trade.value = newTotal - this.oldTotal;
                trade.moneyAccountId = this.account.id;
                trade.note = this.translateService.instant('money-account-add.title');
                this.tradeService.saveTrade(trade).then(() => {
                    this.saveDisabled = false;
                    this.exitPage();
                });
                return;
            }
            this.exitPage();
            this.saveDisabled = false;
        });
    }

    async dismiss() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadMoneyAccountList');
        this.navCtrl.publish('reloadHome');
        this.navCtrl.publish('reloadMoneyAccount', this.account);
        if (this.isNew && !this.fromSearch) {
            await this.navCtrl.push('MoneyAccountDetailComponent', { id: this.account.id });
        }
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }
}
