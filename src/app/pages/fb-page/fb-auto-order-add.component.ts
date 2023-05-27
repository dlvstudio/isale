import { Component, ViewChild } from '@angular/core';
import { AlertController, IonContent } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'fb-auto-order-add',
    templateUrl: 'fb-auto-order-add.component.html'
})
export class FbAutoOrderAddComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    config: any = {isActive: true};
    selectedPage;
    saveDisabled = false;
    example;
    templates = [
        '(số điện thoại) (mã sản phẩm)',
        '(mã sản phẩm)',
        '(mã sản phẩm) (số lượng)',
        '(số điện thoại) (mã sản phẩm) (số lượng)',
    ];
    templatesExample = [
        '0938111666 SP1234',
        'SP1234',
        'SP1234 12',
        '0938111666 SP1234 12',
    ];
    templatesEn = [
        '(phone) (product code)',
        '(product code)',
        '(product code) (quantity)',
        '(phone) (product code) (quantity)',
    ];

    constructor(
        private omniChannelService: OmniChannelService,
        public navCtrl: RouteHelperService,
        public userService: UserService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController
    ) {}

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-auto-order-add');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        const currentLanguage = await this.userService.getAttr('current-language');
        if (currentLanguage !== 'vn') {
            this.templates = this.templatesEn;
        }
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.id) {
            this.config = await this.omniChannelService.getAutoOrderConfig(data.id);
            if (this.config.pageId) {
                const selectedPages = await this.omniChannelService.getPagesByPageId(this.config.pageId);
                this.selectedPage = selectedPages && selectedPages.length ? selectedPages[0] : null;
            }
        }
        await loading.dismiss();
    }

    showSearchPages() {
        this.analyticsService.logEvent('fb-auto-order-add-search-page');
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

    changeTemplate() {
        const i = this.templates.indexOf(this.config.comment);
        if (i >= 0) {
            this.example = this.templatesExample[i];
        }
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
        this.omniChannelService.saveAutoOrderConfig(this.config).then(async () => {
            this.analyticsService.logEvent('save-auto-order-config-success');
            await loading.dismiss();
            this.exitPage();
        });
    }

    async delete(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-auto-order-alert'),
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
                            this.analyticsService.logEvent('auto-order-delete-success');
                            this.navCtrl.pop();
                            this.navCtrl.publish('reloadFbAutoOrderConfigs', null);
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadFbAutoOrderConfigs');
    }
}
