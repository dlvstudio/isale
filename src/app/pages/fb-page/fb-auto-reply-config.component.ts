import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { OmniChannelService } from '../../providers/omni-channel.service';

@Component({
    selector: 'fb-auto-reply-config',
    templateUrl: 'fb-auto-reply-config.component.html'
})
export class FbAutoReplyComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    originals: any[];
    configs: any[];
    searchKey: any = '';
    currency: string;

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadFbReplyConfigs', this.reload);
        this.navCtrl.subscribe('reloadFbReplyConfigs', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-auto-reply-config');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.omniChannelService.getReplyConfigs().then(async (configs) => {
            this.originals = JSON.parse(JSON.stringify(configs));
            this.configs = configs;
            await loading.dismiss()
        });
    }

    edit(id): void {
        this.navCtrl.push('/fbpage/auto-reply-add', { id });
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-auto-reply-search');
        let configs: any[] = JSON.parse(JSON.stringify(this.originals));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            configs = configs.filter((item) => (
                item.comment && Helper.stringSpecialContains(searchKey, item.comment)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
                || item.postId && Helper.stringSpecialContains(searchKey, item.postId)
                || item.pageName && Helper.stringSpecialContains(searchKey, item.pageName)
            ));
        }
        this.configs = configs;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    async updateActive(config) {
        await this.omniChannelService.saveReplyConfig(config);
    }
}
