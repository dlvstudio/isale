import { ITradeToCategory } from './../../models/trade-to-category.interface';
import { Trade } from './../../models/trade.model';
import { ITrade } from './../../models/trade.interface';
import { IContact } from './../../models/contact.interface';
import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TradeService } from '../../providers/trade.service';
import { ContactService } from '../../providers/contact.service';
import { UserService } from '../../providers/user.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'trade-detail',
    templateUrl: 'trade-detail.component.html',
})
export class TradeDetailComponent {
    params: any = null;
    contactSelected: IContact;
    trade: ITrade = new Trade();
    categories: ITradeToCategory[] = [];
    currency: string;
    tab = 'note';
    pictures: string[] = [];
    arr = [];

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private tradeService: TradeService,
        private contactService: ContactService,
        private currencyPipe: CurrencyPipe,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        const reloadHandle = (event) => {
            const trade = event.detail;
            if (this.trade && trade.id === this.trade.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadTrade', reloadHandle);
        this.navCtrl.subscribe('reloadTrade', reloadHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('trade-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        this.trade = new Trade();
        if (data && data.id && data.id > 0) {
            const id = data.id;
            const loading = await this.navCtrl.loading();
            this.tradeService.get(id).then(async (trade) => {
                await loading.dismiss();
                this.trade = trade;
                this.pictures = trade && trade.imageUrlsJson ? JSON.parse(trade.imageUrlsJson) : [];
                const arr = [];
                let row = [];
                for (const picture of this.pictures) {
                    row.push(picture);
                    if (row.length == 3) {
                        arr.push(row);
                        row = [];
                    }
                }
                if (row.length > 0) {
                    arr.push(row);
                }
                this.arr = arr;

                if (this.trade.note == '' && this.arr.length > 0) {
                    this.tab = 'photo';
                }

                this.tradeService.getCategoriesToTrade(id).then((categories: ITradeToCategory[]) => {
                    this.categories = categories;
                });
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.trade.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.trade.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.trade.contact.lastActive = DateTimeService.toDbString();
        this.trade.contact.lastAction = action;
        return this.contactService.saveContact(this.trade.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.trade.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return this.trade.contact.avatarUrl !== null && this.trade.contact.avatarUrl !== ''
            ? this.trade.contact.avatarUrl
            : 'assets/person-placeholder.jpg';
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/trade/add', { id: this.trade.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('trade.delete-trade'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteTrade();
                    }
                }, {
                    text: this.translateService.instant('trade-detail.share'),
                    handler: () => {
                        this.shareTrade();
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

    async deleteTrade(): Promise<void> {
        const trade = this.trade;
        if (this.trade.id) {
            if (trade && (trade.orderId || trade.debtId || trade.receivedNoteId || trade.transferNoteId)) {
                alert(this.translateService.instant('trade.trade-related-update-alert'));
                return;
            }
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('trade.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.tradeService.deleteTrade(this.trade).then(async () => {
                            this.analyticsService.logEvent('trade-detail-delete-success');
                            this.navCtrl.publish('reloadTradeList');
                            this.navCtrl.publish('reloadContact', this.trade.contact);
                            this.navCtrl.pop();
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

    moveToCategory(category: ITradeToCategory): void {
        this.navCtrl.push('/trade-category/detail', { id: category.categoryId });
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    shareTrade(): void {
        let money = this.trade.isReceived ? '+' : '-';
        money += ' ' + this.currencyPipe.transform(this.trade.value, this.currency, true, '1.0-2');
        const contact = this.trade.contactId !== 0 && this.trade.contact ? this.trade.contact.fullName : '';
        const product = this.trade.productId !== 0 && this.trade.product 
            ? Helper.productName(this.trade.product.code, this.trade.product.title) 
            : '';
        const arrBody = [money];
        if (contact) {
            arrBody.push(contact);
        }
        if (product) {
            arrBody.push(product);
        }
        if (this.trade.note) {
            arrBody.push(this.trade.note);
        }
        const body = arrBody.join(' - ');

        this.userService.shareScreenshot(body);
    }

    showImage(idx: number): void {
        const images = JSON.parse(JSON.stringify(this.pictures));
        this.navCtrl.push('/gallery', { images, id: idx });
    }
}