import { ITradeCategory } from './../../models/trade-category.interface';
import { CategoryReport } from './../../models/category-report.model';
import { ICategoryReport } from './../../models/category-report.interface';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ModalController } from '@ionic/angular';
import { ReportService } from '../../providers/report.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'category-report-add',
    templateUrl: 'category-report-add.component.html',
})
export class CategoryReportAddComponent {
    params: any = null;
    report: ICategoryReport = new CategoryReport();
    selectedCategories: ITradeCategory[] = [];
    ignoredCategories: ITradeCategory[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private reportService: ReportService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category-report-add');
    }

    ngOnInit(): void {
        let reportId = 0;
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            reportId = this.params.id;
        }

        if (reportId && reportId > 0) {
            this.reportService.getCustomReport(reportId, 'category-report').then((report) => {
                this.report = report;
                if (report.categoryListCustom && report.categoryListCustom !== '') {
                    this.selectedCategories = JSON.parse(report.categoryListCustom);
                }
                if (report.ignoredCategories && report.ignoredCategories !== '') {
                    this.ignoredCategories = JSON.parse(report.ignoredCategories);
                }
            });
        }
    }

    save(): void {
        this.reportService.saveCustomReport(this.report, 'category-report').then(async (id) => {
            this.analyticsService.logEvent('category-report-add-save-success');
            this.report.id = id;
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        if (!this.params || !this.params.id) {
            await this.navCtrl.push('/category-report/detail', { id: this.report.id });
        }
        this.navCtrl.publish('reloadReportList');
        this.navCtrl.publish('reloadCategoryReport', this.report);
    }

    async showSearchCategory(isSelected: boolean = true) {
        const callback = async (data) => {
            const category = data;
            if (category) {
                if (isSelected) {
                    const idx = this.selectedCategories.findIndex(item => item.id === category.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selectedCategories.push(category);
                    this.report.categoryListCustom = JSON.stringify(this.selectedCategories);
                } else {
                    const idx = this.ignoredCategories.findIndex(item => item.id === category.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoredCategories.push(category);
                    this.report.ignoredCategories = JSON.stringify(this.ignoredCategories);
                }
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeIgnoredCategory(category: ITradeCategory) {
        const idx = this.ignoredCategories.findIndex(item => item.id === category.id);
        if (idx >= 0) {
            this.ignoredCategories.splice(idx, 1);
            this.report.ignoredCategories = JSON.stringify(this.ignoredCategories);
        }
    }

    removeSelectedCategory(category: ITradeCategory) {
        const idx = this.selectedCategories.findIndex(item => item.id === category.id);
        if (idx >= 0) {
            this.selectedCategories.splice(idx, 1);
            this.report.categoryListCustom = JSON.stringify(this.selectedCategories);
        }
    }
}
