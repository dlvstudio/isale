import { Component, OnInit } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { Platform } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'help-print-ios',
    templateUrl: 'help-print-ios.component.html',
})
export class HelpPrintIosComponent implements OnInit {
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
        await this.analyticsService.setCurrentScreen('help-print-ios');
    }

    sendTicket(): void {
        this.navCtrl.push('/ticket/add', null);
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }
}
