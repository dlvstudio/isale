import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StorageService } from '../../providers/storage.service';

@Component({
    selector: 'support',
    templateUrl: 'support.component.html'
})
export class SupportComponent {
    @Input() neverHide = false;
    isHide = false;

    constructor(public navCtrl: RouteHelperService,
                private analyticsService: AnalyticsService,
                private storage: StorageService,
                private translate: TranslateService
                ) {
    }

    async ngOnInit(): Promise<void> {
        const hideObj = await this.storage.get('hide-support');
        if (hideObj) {
            this.isHide = true;
        } else {
            this.isHide = false;
        }
    }

    callPhone(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('support-call-hotline');
        Helper.callPhone(mobile);
    }

    sendEmail(mobile: string): void {
        if (!mobile) {
            return;
        }
        this.analyticsService.logEvent('support-email');
        Helper.sendEmail(mobile);
    }

    sendTicket(): void {
        this.navCtrl.push('/ticket/add', null);
    }

    async hideSupport() {
        this.analyticsService.logEvent('support-hide');
        this.isHide = true;
        alert(this.translate.instant('support.alert'));
        await this.storage.set('hide-support', '1');
    }
}
