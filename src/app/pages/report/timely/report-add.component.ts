import { Component } from '@angular/core';
import { IReport } from '../../../models/report.interface';
import { IContact } from '../../../models/contact.interface';
import { Report } from '../../../models/report.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ModalController, AlertController } from '@ionic/angular';
import { ReportService } from '../../../providers/report.service';
import { ContactService } from '../../../providers/contact.service';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'timely-report-add',
    templateUrl: 'report-add.component.html',
})
export class TimelyReportAddComponent {
    params: any = null;
    report: IReport = new Report();
    selectedContacts: IContact[] = [];
    ignoredContacts: IContact[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private reportService: ReportService,
        private contactService: ContactService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('timely-report-add');
    }

    ngOnInit(): void {
        let reportId: number = 0;
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id) {
            reportId = this.params.id;
        }

        if (reportId && reportId > 0) {
            this.reportService.getCustomReport(reportId, 'timely-report').then((report) => {
                if (!report) {
                    return;
                }
                this.report = report;
                if (report.contactListCustom && report.contactListCustom !== '') {
                    this.selectedContacts = JSON.parse(report.contactListCustom);
                }
                if (report.ignoredContacts && report.ignoredContacts !== '') {
                    this.ignoredContacts = JSON.parse(report.ignoredContacts);
                }
            });
        }
    }

    save(): void {
        this.reportService.saveCustomReport(this.report, 'timely-report').then(async (id: number) => {
            this.analyticsService.logEvent('timely-report-add-save-success');
            this.report.id = id;
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        if (!this.params || !this.params.id) {
            await this.navCtrl.push('/timely-report/detail', { id: this.report.id })
        }
        this.navCtrl.publish('reloadTimelyReportList');
        this.navCtrl.publish('reloadTimelyReport', this.report);
    }

    async showSearchContact(isSelected: boolean = true) {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                if (isSelected) {
                    const idx = this.selectedContacts.findIndex(item => item.id === contact.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selectedContacts.push(contact);
                    this.report.contactListCustom = JSON.stringify(this.selectedContacts);
                } else {
                    const idx = this.ignoredContacts.findIndex(item => item.id === contact.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoredContacts.push(contact);
                    this.report.ignoredContacts = JSON.stringify(this.ignoredContacts);
                }
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    removeIgnoredContact(contact: IContact) {
        const idx = this.ignoredContacts.findIndex(item => item.id === contact.id);
        if (idx >= 0) {
            this.ignoredContacts.splice(idx, 1);
            this.report.ignoredContacts = JSON.stringify(this.ignoredContacts);
        }
    }

    removeSelectedContact(contact: IContact) {
        const idx = this.selectedContacts.findIndex(item => item.id === contact.id);
        if (idx >= 0) {
            this.selectedContacts.splice(idx, 1);
            this.report.contactListCustom = JSON.stringify(this.selectedContacts);
        }
    }
}
