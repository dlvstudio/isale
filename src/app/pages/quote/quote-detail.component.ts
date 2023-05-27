import { TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { ActionSheetController, AlertController, ToastController, Platform } from '@ionic/angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { IContact } from './../../models/contact.interface';
import { UserService } from '../../providers/user.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { ContactService } from '../../providers/contact.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StorageService } from '../../providers/storage.service';
import { copyMessage } from '../../providers/helper';
import { QuoteService } from '../../providers/quote.service';

@Component({
    selector: 'quote-detail',
    templateUrl: 'quote-detail.component.html',
})
export class QuoteDetailComponent {
    params: any = null;
    contactSelected: IContact;
    quote: any = {};
    currency: string;
    isDisabled = false;
    hideTax = false;
    totalProductsAmount = 0;
    totalProductsQuantity = 0;
    lang = 'vn';
    showDes = false;
    showImage = true;

    constructor(
        public navCtrl: RouteHelperService,
        private file: File,
        public translateService: TranslateService,
        private quoteService: QuoteService,
        private contactService: ContactService,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private excelService: ExcelService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private toastCtrl: ToastController,
        private storage: StorageService,
        private platform: Platform,
    ) {
        this.navCtrl.removeEventListener('reloadQuote', this.onLoadQuote);
        this.navCtrl.addEventListener('reloadQuote', this.onLoadQuote);
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 'p' || event.key === 'P') {
            this.printQuote();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    onLoadQuote = (event) => {
        const quote: any = event.detail;
        if (this.quote && quote.id === this.quote.id) {
            this.reload();
        }
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('quote-detail');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.quote = {};
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.quoteService.get(id).then(async (quote) => {
                await loading.dismiss();
                this.quote = quote;
                this.quote.items = quote && quote.itemsJson ? JSON.parse(quote.itemsJson) : [];
                this.totalProductsAmount = this.quote.items && this.quote.items.length
                    ? _.sumBy(this.quote.items, (item: any) => item.total)
                    : 0;
                this.totalProductsQuantity = this.quote.items && this.quote.items.length
                    ? _.sumBy(this.quote.items, (item: any) => item.count)
                    : 0;
                const showImageStr = await this.storage.get('quote-show-Image');
                this.showImage = showImageStr && showImageStr === '1';

                const showDesStr = await this.storage.get('quote-show-Des');
                this.showDes = showDesStr && showDesStr === '1';
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    async createOrder() {
        await this.analyticsService.setCurrentScreen('quote-detail-create-order');
        this.navCtrl.push('/order/add', { quote: this.quote });
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.quote.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.quote.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.quote.contact.lastActive = DateTimeService.toDbString();
        this.quote.contact.lastAction = action;
        return this.contactService.saveContact(this.quote.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.quote.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.quote.contact.avatarUrl);
    }

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date && date.indexOf(':00Z') < 0) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.navigateForward('/quote/add', { id: this.quote.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('quote.delete-quote'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteQuote();
                    }
                }, {
                    text: this.translateService.instant('quote-detail.share'),
                    handler: () => {
                        this.shareQuote();
                    }
                }, {
                    text: this.translateService.instant('quote.copy'),
                    handler: () => {
                        this.copyQuote();
                    }
                }, {
                    text: this.translateService.instant('quote-detail.print'),
                    handler: () => {
                        this.printQuote();
                    }
                }, {
                    text: this.translateService.instant('quote-detail.export'),
                    handler: () => {
                        this.exportQuote();
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

    async deleteQuote(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('quote.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        this.quoteService.delete(this.quote).then(async () => {
                            this.analyticsService.logEvent('quote-detail-delete-success');
                            this.navCtrl.publish('reloadQuoteList');
                            this.navCtrl.publish('reloadContact', this.quote.contact);
                            this.navCtrl.back();
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

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    shareQuote(): void {
        this.navCtrl.push('/quote/detail-print', { quote: this.quote, mode: 'share' });
    }

    copyQuote(): void {
        this.navCtrl.push('/quote/add', { quote: this.quote, mode: 'copy' });
    }

    async printQuote(): Promise<void> {
        this.navCtrl.push('/quote/detail-print', { quote: this.quote, mode: 'print', showDes: this.showDes, showImage: this.showImage });
    }

    async quoteShowField(field) {
        await this.storage.set('quote-show-' + field, (this['show' + field] ? '1' : '0'));
    }

    exportQuote(): void {
        const data = [];
        data.push([this.translateService.instant('quote-detail.title')]);
        data.push([this.translateService.instant('quote-add.name'), this.quote.name]);
        if (this.quote.contactId !== 0 && this.quote.contact && this.quote.contact.fullName) {
            data.push([this.translateService.instant('contact-add.full-name'), this.quote.contact.fullName]);
        }
        if (this.quote.contactId !== 0 && this.quote.contact && this.quote.contact.mobile) {
            data.push([this.translateService.instant('contact-add.phone'), this.quote.contact.mobile]);
        }
        if (this.quote.contactId === 0 && this.quote.contactName) {
            data.push([this.translateService.instant('contact-add.full-name'), this.quote.contactName]);
        }
        if (this.quote.contactId === 0 && this.quote.contactPhone) {
            data.push([this.translateService.instant('contact-add.phone'), this.quote.contactPhone]);
        }
        data.push([' ']);
        data.push([
            this.translateService.instant('quote-add.product-code'),
            this.translateService.instant('quote-add.product-name'),
            this.translateService.instant('quote-add.product-count'),
            this.translateService.instant('quote-add.product-unit'),
            this.translateService.instant('quote-add.product-price'),
            this.translateService.instant('quote-add.product-discount') + ' (' + this.currency + ')',
            this.translateService.instant('quote-add.product-total') + ' (' + this.currency + ')'
        ]);

        for (const item of this.quote.items) {
            data.push([
                item.productCode,
                item.productName,
                item.count,
                item.unit,
                item.price,
                item.discount,
                item.total
            ]);
        }
        data.push([' ']);
        data.push([this.translateService.instant('quote-add.net-value') + ' (' + this.currency + ')', this.quote.netValue]);
        data.push([this.translateService.instant('quote-add.shipping-fee') + ' (' + this.currency + ')', this.quote.shippingFee]);
        data.push([this.translateService.instant('quote-add.tax') + ' (' + this.currency + ')', this.quote.tax]);
        data.push([this.translateService.instant('quote-add.total') + ' (' + this.currency + ')', this.quote.total]);
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'quote-detail-' + this.quote.id + '-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile(null, content);
        });
    }

    addDebt(): void {
        this.navCtrl.navigateForward('/debt/add', { quote: this.quote.id });
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    async presentToast(message) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'top'
        });
        await toast.present();
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    getOptionPrices(item: any) {
        return Helper.getOptionPrices(item);
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
