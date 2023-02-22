import { Component, OnInit } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { Platform } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'help',
    templateUrl: 'help.component.html',
})
export class HelpComponent implements OnInit {
    isMobile = false;

    constructor(
        private platform: Platform,
        public navCtrl: RouteHelperService,
        public userService: UserService,
        private analyticsService: AnalyticsService
    ) {
    }

    async ngOnInit() {
        this.isMobile = this.platform.width() < 720;
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('help');
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    async openWeb() {
        this.analyticsService.logEvent('open-web-on-home');
        this.navCtrl.openExternalUrl('https://isale.online/app');
    }

    openAppIos() {
        this.analyticsService.logEvent('open-app-on-home-ios');
        this.navCtrl.openExternalUrl('https://apps.apple.com/us/app/isale-management/id1485080690');
    }

    async openAppAndroid() {
        this.analyticsService.logEvent('open-app-on-home');
        this.navCtrl.openExternalUrl('https://play.google.com/store/apps/details?id=com.dlv.isale');
    }

    callPhone(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('help-call-hotline');
        Helper.callPhone(mobile);
    }

    sendEmail(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('help-mail');
        Helper.sendEmail(mobile);
    }

    goPrintPage() {
        const page = this.platform.is('android') ? 'print-android' : 'print-ios';
        this.navCtrl.push('/help/' + page);
    }
}
