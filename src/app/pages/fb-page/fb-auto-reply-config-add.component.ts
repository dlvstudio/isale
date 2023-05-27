import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, IonContent } from '@ionic/angular';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { OmniChannelService } from '../../providers/omni-channel.service';

@Component({
    selector: 'fb-auto-reply-config-add',
    templateUrl: 'fb-auto-reply-config-add.component.html'
})
export class FbAutoReplyAddComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    config: any = {isActive: true, applyOnPostComment: true, applyOnLiveStream: false};
    selectedPage;
    saveDisabled = false;

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-auto-reply-config-add');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id) {
            this.config = await this.omniChannelService.getReplyConfig(data.id);
        }
        await loading.dismiss();
    }

    showSearchPages() {
        this.analyticsService.logEvent('fb-reply-config-add-search-page');
        const callback = async (data) => {
            const page = data;
            if (page) {
                this.selectedPage = page;
                this.config.pageId = page.pageId;
                this.config.pageName = page.name;
            }
        };
        this.navCtrl.push('/fbpage/search-page', { callback, searchMode: true });
    }

    removePage() {
        this.selectedPage = null;
        this.config.pageId = null;
    }

    strip(s: string, limit) {
        if (!s || s.length < limit) {
            return s;
        }
        return s.substring(0, limit - 1) + "...";
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.saveDisabled = true;
        this.omniChannelService.saveReplyConfig(this.config).then(async () => {
            this.analyticsService.logEvent('save-reply-config-success');
            await loading.dismiss();
            this.exitPage();
        });
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-reply-config-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.omniChannelService.deleteReplyConfig(this.config).then(async () => {
                            this.analyticsService.logEvent('reply-config-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadFbReplyConfigs', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadFbReplyConfigs');
    }
}
