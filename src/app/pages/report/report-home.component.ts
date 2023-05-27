import { IProductReport } from './../../models/product-report.interface';
import { IReport } from './../../models/report.interface';
import { Component } from '@angular/core';
import { ICategoryReport } from '../../models/category-report.interface';
import { RouteHelperService } from '../../providers/route-helper.service';
import { ReportService } from '../../providers/report.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'report-home',
    templateUrl: 'report-home.component.html'
})
export class ReportHomeComponent {
    report: IReport;
    timelyReport: IReport;
    categoryReport: ICategoryReport;
    productReport: IProductReport;

    constructor(
        private reportService: ReportService,
        private translateService: TranslateService,
        private userService: UserService,
        public navCtrl: RouteHelperService,
        public analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadReportList', this.reload);
        this.navCtrl.subscribe('reloadReportList', this.reload);
        this.navCtrl.unsubscribe('reloadTimelyReportList', this.reload);
        this.navCtrl.subscribe('reloadTimelyReportList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('report-home');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        this.timelyReport = await this.reportService.getCustomReport(1, 'timely-report');
        this.report = await this.reportService.getCustomReport(1, 'customer-report');
        this.categoryReport = await this.reportService.getCustomReport(1, 'category-report');
        this.productReport = await this.reportService.getCustomReport(1, 'product-report');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectTimelyReport(): void {
        if (this.timelyReport) {
            this.navCtrl.push('/timely-report/detail', { id: 1 });
        } else {
            this.navCtrl.push('/timely-report/add');
        }
    }

    selectCustomerReport(): void {
        if (this.report) {
            this.navCtrl.push('/report/detail', { id: this.report.id });
        } else {
            this.navCtrl.push('/report/add');
        }
    }

    selectCategoryReport(): void {
        if (this.categoryReport) {
            this.navCtrl.push('/category-report/detail', { id: this.categoryReport.id });
        } else {
            this.navCtrl.push('/category-report/add');
        }
    }

    selectProductReport(): void {
        if (this.productReport) {
            this.navCtrl.push('/product-report/detail', { id: this.productReport.id });
        } else {
            this.navCtrl.push('/product-report/add');
        }
    }

    getDateType(report: any): string {
        if (report.dateType == 0) {
            return this.translateService.instant('report-category.by-week');
        }
        if (report.dateType == 1) {
            return this.translateService.instant('report-category.by-month');
        }
        if (report.dateType == 2) {
            return this.translateService.instant('report-category.by-year');
        }
        if (report.dateType == 3) {
            return this.translateService.instant('report-category.by-day');
        }
        if (report.dateType == 4) {
            return this.translateService.instant('report-category.custom');
        }
        if (report.dateType == 5) {
            return this.translateService.instant('report-category.by-quarter');
        }
        return '';
    }

    getFilter(report: IReport): string {
        let filter = '';
        if (report.genderType == 1) {
            filter = this.translateService.instant('contact-add.gender-male');
        } else if (report.genderType == 2) {
            filter = this.translateService.instant('contact-add.gender-female');
        }

        if (report.ageType == 1) {
            if (filter != '') {
                filter += '; '
            }
            filter += this.translateService.instant('report-output.year-from-to', {ageFrom: report.ageFrom, ageTo: report.ageTo});
        } else if (report.ageType == 2) {
            if (filter != '') {
                filter += '; '
            }
            filter += this.translateService.instant('report-output.age-from-to', {ageFrom: report.ageFrom, ageTo: report.ageTo});
        }

        if (report.contactListType != 0 || report.ignoreContact != 0) {
            if (filter != '') {
                filter += '; '
            }
            filter += this.translateService.instant('report-output.contact-limited');
        }
        return filter;
    }

    getCategoryFilter(report: ICategoryReport): string {
        let filter = '';

        if (report.categoryListType != 0 || report.ignoreCategory != 0) {
            if (filter != '') {
                filter += '; '
            }
            filter += this.translateService.instant('report-category.category-limited');
        }
        return filter;
    }

    getProductFilter(report: IProductReport): string {
        let filter = '';

        if (report.productListType != 0 || report.ignoreProduct != 0) {
            if (filter != '') {
                filter += '; '
            }
            filter += this.translateService.instant('report-output.product-limited');
        }
        return filter;
    }
}
