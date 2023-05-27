import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, Platform, ToastController } from '@ionic/angular';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StaffService } from '../../providers/staff.service';
import { copyMessage } from '../../providers/helper';
import { PromotionService } from '../../providers/promotion.service';

@Component({
    selector: 'promotion-detail',
    templateUrl: 'promotion-detail.component.html',
})
export class PromotionDetailComponent {
    @ViewChild('barcode', { static: false }) barcode: ElementRef;
    id: number;
    params: any = null;
    promotion: any;
    tab = 'info';
    currency: string;
    isShowBarcode = false;
    barcode64base: any;
    private bypassActiveChange = true;

    constructor(public navCtrl: RouteHelperService,
        private printer: Printer,
        public staffService: StaffService,
        public translateService: TranslateService,
        private promotionService: PromotionService,
        private actionSheetCtrl: ActionSheetController,
        public userService: UserService,
        private alertCtrl: AlertController,
        private platform: Platform,
        private toastController: ToastController,
        private analyticsService: AnalyticsService
    ) {
        const reloadPromotionHandle = (event) => {
            const promotion = event.detail;
            if (promotion && this.promotion && promotion.id === this.promotion.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadPromotion', reloadPromotionHandle);
        this.navCtrl.subscribe('reloadPromotion', reloadPromotionHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('contact-detail');
    }

    reload = async () => {
        this.bypassActiveChange = true;
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            this.params = data;
            const id = data.id;
            if (data.tab && data.tab != '') {
                this.tab = data.tab;
            }
            const promotion = await this.promotionService.getConfig(id);
            if (promotion.maxPromotionQuantity && (promotion.promotionCategory || promotion.promotionProduct
                )) {
                promotion.isGift = true;
            }
            if (promotion.promotionValue && promotion.promotionMaxValue
                ) {
                promotion.isDiscout = true;
            }

            this.promotion = promotion;
        }
        await loading.dismiss();
        this.bypassActiveChange = false;
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    edit(): void {
        this.navCtrl.push('/promotion/add', { id: this.promotion.id });
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('promotion.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.promotionService.deleteConfig(this.promotion).then(async () => {
                            this.analyticsService.logEvent('promotion-detail-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadPromotionList', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async presentActionSheet() {
        const buttons = [
           {
                text: this.translateService.instant('promotion.delete'),
                role: 'destructive',
                handler: () => {
                    this.delete();
                }
            }, {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ];
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    showBarcode() {
        this.isShowBarcode = !this.isShowBarcode;
    }

    printBarcode(): void {
        const html = `<div style='text-align: center;'><img src='${this.userService.apiUrl}/qrcode?text=${this.promotion.code}'/></div>`;

        if (this.navCtrl.isNotCordova()) {
            Helper.webPrint(html);
            return;
        }
        this.printer.print(html).then(() => { });
    }

    async copy(val) {
        if (this.isCordova()) {
            return this.share(val);
        }
        await copyMessage(val);
        const message = this.translateService.instant('request-pro.copied') + val;
        const toast = await this.toastController.create({
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

    async changeActive() {
        if (this.bypassActiveChange) {
            return;
        }
        await this.promotionService.saveConfig(this.promotion);
        await this.navCtrl.publish('reloadPromotionList');
        const toast = await this.toastController.create({
            message: this.translateService.instant('promotion-add.active-changed'),
            duration: 3000,
            position: 'bottom'
        });
        await toast.present();
    }
}
