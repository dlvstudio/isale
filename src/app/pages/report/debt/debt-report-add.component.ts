import { IProduct } from './../../../models/product.interface';
import { ITradeCategory } from './../../../models/trade-category.interface';
import { IContact } from './../../../models/contact.interface';
import { DebtReport } from './../../../models/debt-report.model';
import { IDebtReport } from './../../../models/debt-report.interface';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ModalController } from '@ionic/angular';
import { ReportService } from '../../../providers/report.service';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'debt-report-add',
    templateUrl: 'debt-report-add.component.html',
})
export class DebtReportAddComponent {
    params: any = null;
    report: IDebtReport = new DebtReport();
    selecteds: any[] = [];
    ignoreds: any[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private reportService: ReportService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('debt-report-add');
    }

    ngOnInit(): void {
        let reportId = 0;
        let debtType = 0;
        this.params = this.params ? this.params : this.navCtrl.getParams();
        if (this.params && this.params.id) {
            reportId = this.params.id;
        } else if (this.params && this.params.debtType) {
            debtType = this.params.debtType;
        }
        if (reportId && reportId > 0) {
            this.reportService.getCustomReport(reportId, 'debt-report-' + this.params.debtType).then((report) => {
                this.report = report;
                if (report.customList && report.customList !== '') {
                    this.selecteds = JSON.parse(report.customList);
                }
                if (report.ignoredList && report.ignoredList !== '') {
                    this.ignoreds = JSON.parse(report.ignoredList);
                }
            });
        } else if (debtType && debtType > 0) {
            this.report.debtType = debtType;
        }
    }

    save(): void {
        this.reportService.saveCustomReport(this.report, 'debt-report-' + this.params.debtType).then(async (id: number) => {
            this.analyticsService.logEvent('debt-report-add-save-success');
            this.report.id = id;
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        if (!this.params || !this.params.id) {
            await this.navCtrl.push('/debt-report/detail', { id: this.report.id, debtType: this.params.debtType })
        }
        this.navCtrl.publish('reloadDebtReportList');
        this.navCtrl.publish('reloadDebtReport', this.report);
    }

    changeReportType(): void {

        this.selecteds = [];
        this.report.customList = JSON.stringify(this.selecteds);

        this.ignoreds = [];
        this.report.ignoredList = JSON.stringify(this.ignoreds);

        this.report.customListType = 0;
        this.report.ignore = 0;
    }

    async showSearchContact(isSelected: boolean = true) {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                if (isSelected) {
                    const idx = this.selecteds.findIndex(item => item.id === contact.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selecteds.push(contact);
                    this.report.customList = JSON.stringify(this.selecteds);
                } else {
                    const idx = this.ignoreds.findIndex(item => item.id === contact.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoreds.push(contact);
                    this.report.ignoredList = JSON.stringify(this.ignoreds);
                }
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    removeIgnoredContact(contact: IContact) {
        const idx = this.ignoreds.findIndex(item => item.id === contact.id);
        if (idx >= 0) {
            this.ignoreds.splice(idx, 1);
            this.report.ignoredList = JSON.stringify(this.ignoreds);
        }
    }

    removeSelectedContact(contact: IContact) {
        const idx = this.selecteds.findIndex(item => item.id === contact.id);
        if (idx >= 0) {
            this.selecteds.splice(idx, 1);
            this.report.customList = JSON.stringify(this.selecteds);
        }
    }

    async showSearchCategory(isSelected: boolean = true) {
        const callback = async (data) => {
            const category = data;
            if (category) {
                if (isSelected) {
                    const idx = this.selecteds.findIndex(item => item.id === category.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selecteds.push(category);
                    this.report.customList = JSON.stringify(this.selecteds);
                } else {
                    const idx = this.ignoreds.findIndex(item => item.id === category.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoreds.push(category);
                    this.report.ignoredList = JSON.stringify(this.ignoreds);
                }
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeIgnoredCategory(category: ITradeCategory) {
        const idx = this.ignoreds.findIndex(item => item.id === category.id);
        if (idx >= 0) {
            this.ignoreds.splice(idx, 1);
            this.report.ignoredList = JSON.stringify(this.ignoreds);
        }
    }

    removeSelectedCategory(category: ITradeCategory) {
        const idx = this.selecteds.findIndex(item => item.id === category.id);
        if (idx >= 0) {
            this.selecteds.splice(idx, 1);
            this.report.customList = JSON.stringify(this.selecteds);
        }
    }

    async showSearchProduct(isSelected: boolean = true) {
        const callback = (data) => {
            const product = data;
            if (product) {
                if (isSelected) {
                    const idx = this.selecteds.findIndex(item => item.id === product.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selecteds.push(product);
                    this.report.customList = JSON.stringify(this.selecteds);
                } else {
                    const idx = this.ignoreds.findIndex(item => item.id === product.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoreds.push(product);
                    this.report.ignoredList = JSON.stringify(this.ignoreds);
                }
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    removeIgnoredProduct(product: IProduct) {
        const idx = this.ignoreds.findIndex(item => item.id === product.id);
        if (idx >= 0) {
            this.ignoreds.splice(idx, 1);
            this.report.ignoredList = JSON.stringify(this.ignoreds);
        }
    }

    removeSelectedProduct(product: IProduct) {
        const idx = this.selecteds.findIndex(item => item.id === product.id);
        if (idx >= 0) {
            this.selecteds.splice(idx, 1);
            this.report.customList = JSON.stringify(this.selecteds);
        }
    }
}
