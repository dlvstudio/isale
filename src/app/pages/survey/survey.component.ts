import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TicketService } from '../../providers/ticket.service';
import { TranslateService } from '@ngx-translate/core';
import { ITicket } from '../../models/ticket.interface';
import { Ticket } from '../../models/ticket.model';

@Component({
    selector: 'survey',
    templateUrl: 'survey.component.html',
})
export class SurveyComponent {
    question1 = [
        {isChecked: false, value: 'survey.feature-manage-received-note'},
        {isChecked: false, value: 'survey.feature-import-product-excel'},
        {isChecked: false, value: 'survey.feature-manage-debt'},
        {isChecked: false, value: 'survey.feature-export-sales-report'},
        {isChecked: false, value: 'survey.feature-view-sales-chart'},
        {isChecked: false, value: 'survey.print-order-to-printer'},
        {isChecked: false, value: 'survey.feature-manage-staff'},
        {isChecked: false, value: 'survey.feature-manage-category'},
        {isChecked: false, value: 'survey.feature-manage-point'},
        {isChecked: false, value: 'survey.feature-manage-wallet'},
        {isChecked: false, value: 'survey.feature-manage-table'},
        {isChecked: false, value: 'survey.feature-manage-calendar'},
    ];

    question2 = [
        {isChecked: false, value: 'survey.missing-feature'},
        {isChecked: false, value: 'survey.some-error-happened'},
        {isChecked: false, value: 'survey.ui-ux-is-not-good'}
    ];

    question6 = [
        {isChecked: false, value: 'survey.on-the-phone'},
        {isChecked: false, value: 'survey.on-the-tablet'},
        {isChecked: false, value: 'survey.on-the-pc'},
        {isChecked: false, value: 'survey.on-the-pos'},
        {isChecked: false, value: 'survey.connect-bluetooth-printer'},
        {isChecked: false, value: 'survey.connect-wifi-printer'},
        {isChecked: false, value: 'survey.scan-barcode-from-mobile'},
        {isChecked: false, value: 'survey.scan-barcode-from-scan-reader'}
    ];

    featuresNeed: string;
    errorDescription: string;
    uiUxEnhance: string;
    saveDisabled = false;

    constructor(
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private ticketService: TicketService,
        private translate: TranslateService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('request-pro');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
    }

    async save(): Promise<void> {
        const loading = await this.navCtrl.loading();
        const content = {
            'feature': this.question1.filter(e => e.isChecked).map(e => e.value.replace('survey.', '').replace('feature-manage-', '').replace('feature-', '')),
            issues: this.question2.filter(e => e.isChecked).map(e => e.value),
            'need': this.featuresNeed,
            'error': this.errorDescription,
            'enhance': this.uiUxEnhance,
            devices: this.question6.filter(e => e.isChecked).map(e => e.value.replace('survey.', '').replace('on-the-', '')),
        };
        const ticket: ITicket = new Ticket();
        ticket.subject = 'Survey';
        ticket.content = JSON.stringify(content);
        this.ticketService.save(ticket).then(async () => {
            this.analyticsService.logEvent('survey-save-success');
            await loading.dismiss();
            const message = this.translate.instant('survey.done');
            alert(message);
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.home();
    }
}
