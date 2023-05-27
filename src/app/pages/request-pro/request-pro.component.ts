import { Component } from '@angular/core';
import { ITicket } from '../../models/ticket.interface';
import { Ticket } from '../../models/ticket.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../providers/helper.service';
import { TicketService } from '../../providers/ticket.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StorageService } from '../../providers/storage.service';
import { DataService } from '../../providers/data.service';
import { UserService } from '../../providers/user.service';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { copyMessage } from '../../providers/helper';


@Component({
    selector: 'request-pro',
    templateUrl: 'request-pro.component.html',
})
export class RequestProComponent {
    ticket: ITicket = new Ticket();
    description: any;
    bankInfo: any;
    monthSelected = 3;
    total = 86000;
    totalUsd = 3.7;
    currency: string;
    saved: number;
    savedUsd: number;
    savedString: string;
    shopId: string;
    bankAccount: string;
    bankAccountNumber: string;
    paypalLink: string;
    transferContent: string;
    prices = {
        1: 86000,
        3: 248000,
        6: 486000,
        12: 938000,
    };

    savedPrices = {
        1: 0,
        3: 10000,
        6: 30000,
        12: 94000,
    };

    pricesByUsd = {
        1: 3.7,
        3: 10.66,
        6: 20.9,
        12: 40.35,
    };

    savedPricesByUsd = {
        1: 0,
        3: 0.44,
        6: 1.3,
        12: 4.05,
    };

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private ticketService: TicketService,
        private storageService: StorageService,
        private dataService: DataService,
        private userService: UserService,
        private platform: Platform,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('request-pro');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        this.ticket = new Ticket();
        let shopId = '';
        const shop = await this.dataService.getFirstObject('shop');
        if (!shop) {
            const lastLoginStr = await this.storageService.get('last-login');
            const lastLogin = lastLoginStr ? JSON.parse(lastLoginStr) : null;
            if (lastLogin) {
                shopId = lastLogin.userName;
            }
        } else {
            shopId = shop.id;
        }
        this.changeMonth();
        this.shopId = shopId;
        this.description = this.translateService.instant('request-pro.description', { shop: shopId });
        this.bankInfo = this.translateService.instant('request-pro.bank-info', { shop: shopId });
        this.bankAccount = this.translateService.instant('request-pro.bank-account-name-content');
        this.bankAccountNumber = this.translateService.instant('request-pro.bank-account-number-content');
        this.paypalLink = this.translateService.instant('request-pro.paypal-link');
        this.transferContent = this.translateService.instant('request-pro.transfer-content-content', { shop: shopId });
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.ticket.subject = 'Request Pro';
        this.ticket.content = 'Upgrade ' + this.monthSelected;
        this.ticketService.save(this.ticket).then(async () => {
            await this.analyticsService.logEvent('request-pro-save-success');
            await loading.dismiss();
            const message = this.translateService.instant('request-pro.done', { shop: this.shopId });
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                message: this.translateService.instant(message),
                buttons: ['OK']
            });
            await alert.present();
            this.exitPage();
        });
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async exitPage() {
        await this.navCtrl.popOnly();
    }

    async changeMonth() {
        this.total = this.prices[this.monthSelected];
        this.saved = this.savedPrices[this.monthSelected];
        this.totalUsd = this.pricesByUsd[this.monthSelected];
        this.savedUsd = this.savedPricesByUsd[this.monthSelected];
    }

    async copy(val) {
        if (this.isCordova()) {
            return this.share(val);
        }
        await copyMessage(val);
        const message = this.translateService.instant('request-pro.copied') + val;
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom'
        });
        await toast.present();
    }

    isCordova(): boolean {
        return this.platform.is('capacitor') || this.platform.is('cordova');
    }

    async share(mess) {
        await this.userService.shareText(mess);
    }
}
