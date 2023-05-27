import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ContactService } from '../../providers/contact.service';
import { StaffService } from '../../providers/staff.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'sales-line-add',
    templateUrl: 'sales-line-add.component.html',
})
export class SalesLineAddComponent {
    params: any = null;
    salesLine: any;
    storageDirectory = '';
    date: string;
    isNew = true;
    fromSearch = false;
    saveDisabled = false;

    constructor(public navCtrl: RouteHelperService,
                private contactService: ContactService,
                public staffService: StaffService,
                private analyticsService: AnalyticsService
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('sales-line-add');
    }

    async ngOnInit(): Promise<void> {
        this.salesLine  = {};
        this.params = this.navCtrl.getParams(this.params);
        this.fromSearch = this.params && this.params.fromSearch;
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.isNew = false;
            const loading = await this.navCtrl.loading();
            this.contactService.getSalesLine(id).then(async (salesLine) => {
                await loading.dismiss();
                this.salesLine = salesLine;
            });
        }
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.saveDisabled = true;
        this.contactService.saveSalesLine(this.salesLine).then(async () => {
            this.analyticsService.logEvent('save-sales-line-success');
            await loading.dismiss();
            this.exitPage();
        });
    }

    async dismiss() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
    }

    async exitPage() {
        if (!this.fromSearch) {
            await this.navCtrl.popOnly();
        } else {
            await this.navCtrl.pop();
        }
        this.navCtrl.publish('reloadSalesLineList');
        this.navCtrl.publish('reloadSalesLine', this.salesLine);
    }
}
