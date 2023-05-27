import { registerLocaleData } from '@angular/common';
import { Component } from '@angular/core';
import localeVi from '@angular/common/locales/vi';
import { Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { codePush, InstallMode } from 'capacitor-codepush';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import 'hammerjs';
import {
    ActionPerformed,
    PushNotificationSchema,
    PushNotifications,
    Token,
} from '@capacitor/push-notifications';
import { StaffService } from './providers/staff.service';
import { DataService } from './providers/data.service';
import { UserService } from './providers/user.service';
import { IStaff } from './models/staff.interface';
import { IUser } from './models/user.interface';
import { DateTimeService } from './providers/datetime.service';
import { RouteHelperService } from './providers/route-helper.service';
import { AnalyticsService } from './providers/analytics.service';
import { FcmTokenService } from './providers/fcmtoken.service';
import { PlanService } from './providers/plan.service';

import { syncStatus } from './providers/helper';
import { SyncStatus } from 'capacitor-codepush/dist/esm/syncStatus';
import { NavigationEnd, Router } from '@angular/router';
import { OmniChannelService } from './providers/omni-channel.service';
registerLocaleData(localeVi, 'vn');

declare let AppRate;

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent {
    pages = [{
        icon: 'home-sharp',
        title: 'Trang chủ',
        page: 'home'
    }];
    contactTitle = '';
    y;
    h;
    offsetY;
    gotAds = false;
    currentUrl;

    constructor(
        private platform: Platform,
        private statusBar: StatusBar,
        private translateService: TranslateService,
        public staffService: StaffService,
        private toastCtrl: ToastController,
        private dataService: DataService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private userService: UserService,
        private firebase: FirebaseX,
        private planService: PlanService,
        private router: Router,
        private omniChannelService: OmniChannelService,
        private fcmTokenService: FcmTokenService,
    ) {
        this.initializeApp();
    }

    private genMenu(staff: IStaff): any[] {
        const pages: any[] = [];
        pages.push(
            { title: this.translateService.instant('home.title'), page: 'home', icon: 'home', show: true },
            {
                title: this.translateService.instant('order.title'), page: 'order', icon: 'basket',
                show: staff == null || staff.hasFullAccess || staff.canCreateOrder || staff.canUpdateDeleteOrder
            },
            {
                title: this.translateService.instant('product.title'), page: 'product', icon: 'cart',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('received-note.title'), page: 'received-note', icon: 'clipboard',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('debt.title'), page: 'debt', icon: 'money-check', fa: true, subPage: 'debts',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('trade.title'), page: 'trade', icon: 'cash',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('table.title'), page: 'table', icon: 'grid',
                show: staff == null || staff.hasFullAccess || staff.canCreateOrder || staff.canUpdateDeleteOrder
            },
            {
                title: this.translateService.instant('calendar.title'), page: 'calendar', icon: 'calendar',
                show: staff == null || staff.hasFullAccess || staff.canCreateOrder || staff.canUpdateDeleteOrder
            },
            {
                title: this.translateService.instant('contact.title'), page: 'contact', icon: 'address-card',
                show: staff == null || staff.hasFullAccess, fa: true
            },
            {
                title: this.translateService.instant('money-account.title'), page: 'money-account', icon: 'card',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('excel-report-home.title'), page: 'excel-report', icon: 'trending-up', fa: false,
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('note.title'), page: 'note', icon: 'document',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('loans.title'), page: 'debt', icon: 'university', fa: true, subPage: 'loans',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('report.title-all'), page: 'report', icon: 'bar-chart',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('debt-report.title'), page: 'debt-report', icon: 'bar-chart',
                show: staff == null || staff.hasFullAccess
            },
            {
                title: this.translateService.instant('trade-category.title'), page: 'category', icon: 'folder',
                show: staff == null || staff.hasFullAccess
            },
        );
        pages.push(
            { title: this.translateService.instant('staff.title'), page: 'staff', icon: 'people-arrows', show: staff == null, fa: true },
        );
        pages.push(
            { title: this.translateService.instant('config.title'), page: '/config', icon: 'settings', show: staff == null },
            { title: this.translateService.instant('help.title'), page: '/help', icon: 'help', show: true },
            { title: this.translateService.instant('survey.title'), page: '/survey', icon: 'list-ul', show: true, fa: true },
        );
        pages.push(
            { title: this.translateService.instant('action.change-password'), page: '/change-password', icon: 'key', show: true }
        );
        pages.push(
            { title: this.translateService.instant('action.logout'), page: '/logout', icon: 'log-out', show: true }
        );
        return pages.filter(p => p.show).map((p) => p);
    }

    selectStaffs() {
        this.staffService.hasChooseStaff = false;
        this.setRoot('home');
        this.navCtrl.publish('reloadHome');
    }

    reload = async () => {
        if (this.userService.loggedUser != null) {
            this.pages = this.genMenu(this.staffService.selectedStaff);
            this.setRoot('home');
        } else {
            const token = await this.userService.getRefreshToken().catch(() => {
                this.pages = [
                    { title: this.translateService.instant('action.login'), page: 'login', icon: 'key' },
                ];
                this.setRoot('login');
            });
            if (token) {
                // auto login
                const user = token.userName;
                const pass = token.pass;
                const res = await this.tryLogin(user, pass, true).catch(() => {
                    this.pages = [
                        { title: this.translateService.instant('action.login'), page: 'login', icon: 'key' },
                    ];
                    this.setRoot('login');
                });
                if (res) {
                    this.pages = this.genMenu(this.staffService.selectedStaff);
                    if (this.currentUrl === '/' || this.currentUrl === '/login') {
                        this.setRoot('home');
                    }
                    this.presentToast();
                    await this.getShopConfig();
                    this.setupAdMob();
                    return;
                }
                this.pages = [
                    { title: this.translateService.instant('action.login'), page: 'login', icon: 'key' },
                ];
                this.setRoot('login');
                this.setupAdMob();
                return;
            }
            this.pages = [
                { title: this.translateService.instant('action.login'), page: 'login', icon: 'key' },
            ];
            this.setRoot('login');
        }
        this.setupAdMob();
    }

    private async getShopConfig(): Promise<void> {
        const shopConfig = await this.dataService.getFirstObject('shop_config');
        if (!shopConfig) {
            return;
        }
        const language = shopConfig.language ? shopConfig.language : 'vn';
        const currency = shopConfig.currency ? shopConfig.currency : 'VND';
        const dateFormat = shopConfig.dateFormat ? shopConfig.dateFormat : 'DD/MM/YYYY';
        const timeFormat = shopConfig.timeFormat ? shopConfig.timeFormat : 'HH:mm';
        const outStock = shopConfig.outStockNotSell ? shopConfig.outStockNotSell : false;
        const printOrderLikeInvoice = shopConfig.printOrderLikeInvoice ? shopConfig.printOrderLikeInvoice : false;
        const hideTax = shopConfig.hideTax ? shopConfig.hideTax : false;
        const hideTablesFunction = shopConfig.hideTablesFunction ? shopConfig.hideTablesFunction : false;
        const hideCalendarFunction = shopConfig.hideCalendarFunction ? shopConfig.hideCalendarFunction : false;
        const hideMaterials = shopConfig.hideMaterials ? shopConfig.hideMaterials : false;
        const orderInvoiceMaxEmptyRows = shopConfig.orderInvoiceMaxEmptyRows ? shopConfig.orderInvoiceMaxEmptyRows : 10;
        const hideDiscountColumn = shopConfig.hideDiscountColumn ? true : false;
        const showStaffNameUnderSign = shopConfig.showStaffNameUnderSign ? true : false;
        await this.userService.setAttr('current-currency', currency);
        await this.userService.setAttr('current-language', language);
        await this.userService.setCurrentLanguage(language);
        await this.userService.setAttr('date-format', dateFormat);
        await this.userService.setAttr('time-format', timeFormat);
        await this.userService.setAttr('out-stock', outStock);
        await this.userService.setAttr('print-order-like-invoice', printOrderLikeInvoice);
        await this.userService.setAttr('hide-tax', hideTax);
        await this.userService.setAttr('hide-tables-function', hideTablesFunction);
        await this.userService.setAttr('hide-calendar-function', hideCalendarFunction);
        await this.userService.setAttr('hide-materials', hideMaterials);
        await this.userService.setAttr('order-invoice-max-empty-rows', orderInvoiceMaxEmptyRows);
        await this.userService.setAttr('hide-discount-column', hideDiscountColumn);
        await this.userService.setAttr('show-staff-name-under-sign', showStaffNameUnderSign);
    }

    private tryLogin(username: string, password: string, isRemember: boolean): Promise<boolean> {
        return new Promise((r) => {
            this.userService.getUserByNameAndPassword(username.trim(), password, isRemember)
                .then((ret: any) => {
                    if (ret) {
                        const user = ret as IUser;
                        user.isRemember = isRemember;
                        this.userService.setLoggedUser(user, false);
                        if (!this.navCtrl.isNotCordova()) {
                            this.firebase.getToken().then(async (token) => {
                                await this.fcmTokenService.saveToken(token);
                            }, (err) => {
                                console.error(err);
                            });
                        }
                        r(true);
                    } else {
                        r(false);
                    }
                }, () => {
                    r(false);
                }).catch(() => {
                    r(false);
                });
        });
    }

    async presentToast() {
        const toast = await this.toastCtrl.create({
            message: 'Đang tải... (Loading...)', // message,
            duration: 3000,
            position: 'top'
        });
        await toast.present();
    }

    initializeApp() {
        this.platform.ready().then(async () => {
            this.router.events.subscribe((event: any) => {
                if (event instanceof NavigationEnd) {
                    this.currentUrl = event.url;
                }
            });

            // Okay, so the platform is ready and our plugins are available.
            this.statusBar.hide();
            this.presentToast();
            await this.initDatabase();
            this.registerSystemEvent();
            await this.initializeAdmob();
            await this.reload();
            this.checkCodePush();
            this.setupRating();
            this.updateFcmToken();
            if (this.platform.is('ios')) {
                this.fixKeyboard();
            }
            this.checkFbNotifies();
            this.checkFbMessageEvents();
        });
    }

    checkFbMessageEvents() {
        const presentMessage = async (event) => {
            const message = event.detail;
            if (!message) {
                return;
            }
            this.omniChannelService.setRecentNotification(true);
            this.navCtrl.publish('recentNoti', true);
            const toast = await this.toastCtrl.create({
                header: this.translateService.instant('fb-page.message-from') + ': ' + message.pageName,
                message: message.message,
                cssClass: 'custom-toast',
                color: "danger",
                position: 'top',
                duration: 2000
            });
            await toast.present();
        };
        this.navCtrl.unsubscribe('fbmessage', presentMessage);
        this.navCtrl.subscribe('fbmessage', presentMessage);
    }

    checkFbNotifies() {
        if (!this.navCtrl.isNotCordova()) {
            return;
        }
        setTimeout(async () => {
            if (this.userService.loggedUser == null) {
                this.checkFbNotifies();
                return;
            }
            const messsages = await this.omniChannelService.getNotifications();
            if (messsages && messsages.length) {
                for (const messsage of messsages) {
                    messsage.notified = true;
                    this.navCtrl.publish('fbmessage', messsage);
                    if (messsage.fromUser) {
                        await this.omniChannelService.addFbMessageNoti(messsage);
                    }
                    await this.omniChannelService.saveMessage(messsage);
                }
            }
            const comments = await this.omniChannelService.getCommentNotifications();
            if (comments && comments.length) {
                for (const comment of comments) {
                    comment.notified = true;
                    this.navCtrl.publish('fbcomment', comment);
                    if (comment.fromUser) {
                        await this.omniChannelService.addFbMessageNoti(comment, true);
                    }
                    await this.omniChannelService.saveComment(comment);
                }
            }
            this.checkFbNotifies();
        }, 5000);
    }

    async initializeAdmob(): Promise<void> {
        const { status } = await AdMob.trackingAuthorizationStatus();

        if (status === 'notDetermined') {
            /**
             * If you want to explain TrackingAuthorization before showing the iOS dialog,
             * you can show the modal here.
             * ex)
             * const modal = await this.modalCtrl.create({
             *   component: RequestTrackingPage,
             * });
             * await modal.present();
             * await modal.onDidDismiss();  // Wait for close modal
             **/
        }

        await AdMob.initialize({
            requestTrackingAuthorization: true,
        });
    }

    tapCoordinates = (e) => {
        this.y = e.touches[0].clientY;
        this.h = window.innerHeight;
        this.offsetY = (this.h - this.y);
    };

    keyboardShowHandler = (e) => {
        const kH = e.keyboardHeight;
        const bodyMove = document.querySelector('ion-app') as HTMLElement;
        const bodyMoveStyle = bodyMove.style;
        bodyMoveStyle.marginBottom = kH + 'px';
    };

    keyboardHideHandler = () => {
        const removeStyles = document.querySelector('ion-app') as HTMLElement;
        removeStyles.removeAttribute('style');
    };

    fixKeyboard = () => {
        if (!this.platform.is('ios')) {
            return;
        }
        this.removeFixKeyboard(true);
        window.addEventListener('native.keyboardshow', this.keyboardShowHandler);
        window.addEventListener('native.keyboardhide', this.keyboardHideHandler);
        window.addEventListener('touchstart', this.tapCoordinates);
    }

    removeFixKeyboard = (force = false) => {
        if (this.gotAds && !force) {
            return;
        }
        window.removeEventListener('native.keyboardshow', this.keyboardShowHandler);
        window.removeEventListener('native.keyboardhide', this.keyboardHideHandler);
        window.removeEventListener('touchstart', this.tapCoordinates);
    }

    updateFcmToken() {
        if (this.navCtrl.isNotCordova()) {
            return;
        }

        PushNotifications.requestPermissions().then(result => {
            if (result.receive === 'granted') {
                // Register with Apple / Google to receive push via APNS/FCM
                PushNotifications.register();
            } else {
                // Show some error
            }
        });

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration',
            async (token: Token) => {
                await this.fcmTokenService.saveToken(token.value);
            }
        );

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError',
            (error: any) => {
                this.analyticsService.logError('push-noti-err', { content: error })
            }
        );

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived',
            (notification: PushNotificationSchema) => {
                const data = notification.data;
                if (!data.tap) {
                    return;
                }
                // tslint:disable-next-line:triple-equals
                if (data.page && data.id && data.id != '0') {
                    this.navCtrl.push('/' + data.page + '/detail', { id: data.id });
                    return;
                }
                if (data.page) {
                    if (data.page === 'request-pro') {
                        this.navCtrl.push('/' + data.page);
                        return;
                    }
                    if (data.page === 'reload') {
                        this.reload();
                        return;
                    }
                    if (data.page === 'request-rate') {
                        if (typeof AppRate === 'undefined') {
                            return;
                        }
                        this.analyticsService.logEvent('app-rate');
                        AppRate.promptForRating(true);
                        return;
                    }
                    if (data.page === 'request-update') {
                        if (navigator && navigator['app']) {
                            if (confirm(this.translateService.instant('home.request-update'))) {
                                navigator['app'].exitApp();
                            }
                            return;
                        }
                        alert(this.translateService.instant('home.request-update-alert'));
                        return;
                    }
                    if (data.page === 'request-version') {
                        if (confirm(this.translateService.instant('home.request-version'))) {
                            if (this.platform.is('ios')) {
                                this.openAppIos();
                                return;
                            }
                            if (this.platform.is('android')) {
                                this.openAppAndroid();
                            }
                        }
                        return;
                    }
                    this.navCtrl.navigateRoot('/' + data.page);
                    return;
                }
                if (data.url) {
                    this.navCtrl.openExternalUrl(data.url);
                    return;
                }
            }
        );

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed',
            (notification: ActionPerformed) => {
            }
        );
    }

    setupRating() {
        if (typeof AppRate === 'undefined') {
            return;
        }
        AppRate.setPreferences({
            displayAppName: 'ISale',
            usesUntilPrompt: 5,
            promptAgainForEachNewVersion: false,
            inAppReview: true,
            storeAppURL: {
                ios: '1485080690',
                android: 'market://details?id=com.dlv.isale',
            },
            customLocale: {
                title: this.translateService.instant('rating.title'),
                message: this.translateService.instant('rating.message'),
                cancelButtonLabel: this.translateService.instant('rating.cancelButtonLabel'),
                laterButtonLabel: this.translateService.instant('rating.laterButtonLabel'),
                rateButtonLabel: this.translateService.instant('rating.rateButtonLabel'),
                yesButtonLabel: this.translateService.instant('rating.yesButtonLabel'),
                noButtonLabel: this.translateService.instant('rating.noButtonLabel'),
                appRatePromptTitle: this.translateService.instant('rating.appRatePromptTitle'),
                feedbackPromptTitle: this.translateService.instant('rating.feedbackPromptTitle'),
            }
        });
    }

    async checkCodePush() {
        if (!this.platform.is('capacitor') || this.platform.is('electron')) {
            return;
        }
        const downloadProgress = async () => { };

        codePush.sync(
            {
                updateDialog: {
                    updateTitle: this.translateService.instant('common.update-available'),
                    optionalUpdateMessage: this.translateService.instant('common.update-alert'),
                    mandatoryUpdateMessage: this.translateService.instant('common.update-alert'),
                    mandatoryContinueButtonLabel: this.translateService.instant('common.agree'),
                    optionalInstallButtonLabel: this.translateService.instant('common.agree'),
                    optionalIgnoreButtonLabel: this.translateService.instant('common.cancel')
                },
                installMode: InstallMode.IMMEDIATE,
                onSyncStatusChanged: async (status) => {
                    await this.showPushCodeStatus(status);
                },
            }, downloadProgress)
            .then(async status => {
                await this.showPushCodeStatus(status);
            });
    }

    async showPushCodeStatus(status: SyncStatus) {
        const message = syncStatus(status);
        const translated = this.translateService.instant('common.update-message.' + message);
        if (message && !translated.includes('common.update-message')) {
            const toast = await this.toastCtrl.create({
                message: translated,
                position: 'top',
                duration: 2000
            });
            await toast.present();
        }
    }

    registerSystemEvent(): void {
        const resetDateformat = (event) => {
            const dateFormat = event.detail;
            DateTimeService.resetDateFormat(dateFormat);
        };
        this.navCtrl.removeEventListener('reset-dateformat', resetDateformat);
        this.navCtrl.addEventListener('reset-dateformat', resetDateformat);

        const resetTimeformat = (event) => {
            const timeFormat = event.detail;
            DateTimeService.resetTimeFormat(timeFormat);
        };
        this.navCtrl.removeEventListener('reset-timeformat', resetTimeformat);
        this.navCtrl.addEventListener('reset-timeformat', resetTimeformat);

        this.navCtrl.removeEventListener('loggedUser', this.reload);
        this.navCtrl.addEventListener('loggedUser', this.reload);
    }

    async initDatabase() {
        this.translateService.setDefaultLang('en');
        const currentLang = await this.userService.getAttr('current-language');
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        this.translateService.use(currentLang);

        this.translateService.onLangChange.subscribe(() => {
            if (this.userService.loggedUser != null) {
                this.reload();
            }
        });

        const dateFormat = await this.userService.getAttr('date-format');
        DateTimeService.resetDateFormat(dateFormat);

        const timeFormat = await this.userService.getAttr('time-format');
        DateTimeService.resetTimeFormat(timeFormat);
    }

    isRootPage(page: any): boolean {
        if (page === 'contact') {
            return true;
        }
        if (page === 'note') {
            return true;
        }
        if (page === 'trade') {
            return true;
        }
        if (page === 'category') {
            return true;
        }
        if (page === 'product') {
            return true;
        }
        if (page === 'order') {
            return true;
        }
        if (page === 'debt') {
            return true;
        }
        if (page === 'report') {
            return true;
        }
        if (page === 'debt-report') {
            return true;
        }
        if (page === 'barcode') {
            return true;
        }
        if (page === 'backup') {
            return true;
        }
        if (page === 'config') {
            return true;
        }
        if (page === 'share') {
            return true;
        }
        if (page === 'logout') {
            return true;
        }
        if (page === 'money-account') {
            return true;
        }
        if (page === 'home') {
            return true;
        }
        return false;
    }

    async setupAdMob(): Promise<void> {
        if (!this.platform.is('ios') && !this.platform.is('android')) {
            return;
        }
        const currentPlan = this.userService.loggedUser != null
            ? (await this.planService.getCurrentPlan())
            : null;
        if (currentPlan && currentPlan.isTrial == 0) {
            this.removeFixKeyboard();
            return;
        }
        const adId = this.platform.is('android')
            ? 'ca-app-pub-3816250844423228/7016627595'
            : 'ca-app-pub-3816250844423228/3910435940';
        const options: BannerAdOptions = {
            adId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0
        };
        this.navCtrl.setHasAds(true);
        AdMob.showBanner(options).then((res) => {
            this.gotAds = true;
            this.fixKeyboard();
        }, (err) => {
            this.gotAds = true;
            this.fixKeyboard();
            console.error(err);
        }).catch((err) => {
            this.gotAds = true;
            this.fixKeyboard();
            console.error(err);
        });
        AdMob.addListener(BannerAdPluginEvents.Opened, () => {
            this.analyticsService.logEvent('admob-banner-open');
        });
    }

    setRoot(page) {
        this.navCtrl.navigateRoot(page);
    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        if (page.page === 'logout') {
            this.navCtrl.navigateForward('logout');
        } else if (page.page === 'debt') {
            this.navCtrl.navigateRoot(page.page, { page: page.subPage });
            this.navCtrl.publish('reloadDebtList');
        } else {
            this.navCtrl.navigateRoot(page.page);
        }
    }

    async openAppAndroid() {
        this.analyticsService.logEvent('open-app-on-request');
        this.navCtrl.openExternalUrl('https://play.google.com/store/apps/details?id=com.dlv.isale');
    }

    openAppIos() {
        this.analyticsService.logEvent('open-app-on-request');
        this.navCtrl.openExternalUrl('https://apps.apple.com/us/app/isale-management/id1485080690');
    }
}
