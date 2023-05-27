import { Component, ElementRef, ViewChild } from '@angular/core';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StaffService } from '../../providers/staff.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { callFBAPI, copyMessage } from '../../providers/helper';
import { UserService } from '../../providers/user.service';

declare let FB;

@Component({
    selector: 'fb-page-detail',
    templateUrl: 'fb-page-detail.component.html',
})
export class FbPageDetailComponent {
    @ViewChild('barcode', { static: false }) barcode: ElementRef;
    id: number;
    tab = 'info';
    params: any = null;
    page: any = {};

    constructor(public navCtrl: RouteHelperService,
        public staffService: StaffService,
        public translateService: TranslateService,
        private omniChannelService: OmniChannelService,
        private alertCtrl: AlertController,
        private platform: Platform,
        private toastController: ToastController,
        private userService: UserService,
        private analyticsService: AnalyticsService
    ) {
        const reloadHandle = (event) => {
            const contact = event.detail;
            if (contact && this.page && contact.id === this.page.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadFbPage', reloadHandle);
        this.navCtrl.subscribe('reloadFbPage', reloadHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-page-detail');
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id && data.id > 0) {
            this.params = data;
            const id = data.id;
            if (data.tab && data.tab != '') {
                this.tab = data.tab;
            }
            this.page = await this.omniChannelService.get(id);
        }
        await loading.dismiss();
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.reload();
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.loginFacebook();
                    }
                },
            ]
        });
        await confirm.present();
    }

    loginFacebook() {
        FB.login(async (response) => {
            if (response.status === 'connected') {   // Logged into your webpage and Facebook.
                await this.readPages();
            } else {                                 // Not logged into your webpage or we are unable to tell.
                alert(this.translateService.instant('fb-page.delete-fail-alert'));
            }

        }, { scope: 'public_profile,pages_show_list,pages_manage_metadata,pages_messaging,pages_manage_engagement,user_videos' });
    }

    async readPages() {
        const loading = await this.navCtrl.loading();
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            await loading.dismiss();
            return;
        }
        for (const pageItem of response.data) {
            if (pageItem.id !== this.page.pageId) {
                continue;
            }
            await this.unSubscribeApp(pageItem.access_token);
        }
        await loading.dismiss();
        await this.reload();
    }

    async unSubscribeApp(accessToken) {
        const response = await callFBAPI(
            '/' + this.page.pageId + "/subscribed_apps",
            "DELETE", {
                access_token: accessToken
            });
        if (response && !response.error) {
            await this.omniChannelService.deletePage(this.page).then(async () => {
                this.analyticsService.logEvent('fb-page-detail-delete-success');
                this.navCtrl.pop();
                this.navCtrl.publish('reloadFbPageList', null);
            });
        } else {
            alert(this.translateService.instant('fb-page.delete-fail-alert'));
        }
    }

    isCordova(): boolean {
        return this.platform.is('capacitor') || this.platform.is('cordova');
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

    async share(mess) {
        await this.userService.shareText(mess);
    }
}
