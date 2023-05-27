import { IDebtReport } from './../../../models/debt-report.interface';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ReportService } from '../../../providers/report.service';
import { TranslateService } from '@ngx-translate/core';
import { DateTimeService } from '../../../providers/datetime.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { Helper } from '../../../providers/helper.service';

@Component({
    selector: 'debt-report',
    templateUrl: 'debt-report.component.html'
})
export class DebtReportComponent {
    searchKey = '';
    youOwnedReport: IDebtReport;
    ownedYouReport: IDebtReport;
    borrowedYouReport: IDebtReport;
    youBorrowedReport: IDebtReport;

    constructor(
        private reportService: ReportService,
        private translateService: TranslateService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadDebtReportList', this.reload);
        this.navCtrl.subscribe('reloadDebtReportList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('debt-report');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        this.youBorrowedReport = await this.reportService.getCustomReport(1, 'debt-report-0');
        this.borrowedYouReport = await this.reportService.getCustomReport(1, 'debt-report-1');
        this.youOwnedReport = await this.reportService.getCustomReport(1, 'debt-report-2');
        this.ownedYouReport = await this.reportService.getCustomReport(1, 'debt-report-3')
    }

    openReportAdd(): void {
        this.navCtrl.push('/debt-report/add');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectYouBorrowedReport(): void {
        if (this.youBorrowedReport) {
            this.navCtrl.push('/debt-report/detail', { id: this.youBorrowedReport.id, debtType: 0 });
        } else {
            this.navCtrl.push('/debt-report/add', { debtType: 0 });
        }
    }

    selectBorrowedYouReport(): void {
        if (this.borrowedYouReport) {
            this.navCtrl.push('/debt-report/detail', { id: this.borrowedYouReport.id, debtType: 1 });
        } else {
            this.navCtrl.push('/debt-report/add', { debtType: 1 });
        }
    }

    selectYouOwnedReport(): void {
        if (this.youOwnedReport) {
            this.navCtrl.push('/debt-report/detail', { id: this.youOwnedReport.id, debtType: 2 });
        } else {
            this.navCtrl.push('/debt-report/add', { debtType: 2 });
        }
    }

    selectOwnedYouReport(): void {
        if (this.ownedYouReport) {
            this.navCtrl.push('/debt-report/detail', { id: this.ownedYouReport.id, debtType: 3 });
        } else {
            this.navCtrl.push('/debt-report/add', { debtType: 3 });
        }
    }

    getDateType(report: IDebtReport): string {
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

    getFilter(report: IDebtReport): string {
        let filter = '';
        if (report.reportType == 0) {
            if (report.genderType == 1) {
                filter = this.translateService.instant('contact-add.gender-male');
            } else if (report.genderType == 2) {
                filter = this.translateService.instant('contact-add.gender-female');
            }

            if (report.ageType == 1) {
                if (filter != '') {
                    filter += '; ';
                }
                filter += this.translateService.instant('report-output.year-from-to', { ageFrom: report.ageFrom, ageTo: report.ageTo });
            } else if (report.ageType == 2) {
                if (filter != '') {
                    filter += '; ';
                }
                filter += this.translateService.instant('report-output.age-from-to', { ageFrom: report.ageFrom, ageTo: report.ageTo });
            }
        }

        if (report.customListType != 0 || report.ignore != 0) {
            if (filter != '') {
                filter += '; ';
            }
            if (report.reportType == 0) {
                filter += this.translateService.instant('report-output.contact-limited');
            } else if (report.reportType == 1) {
                filter += this.translateService.instant('report-output.category-limited');
            } else if (report.reportType == 2) {
                filter += this.translateService.instant('report-output.product-limited');
            }
        }
        return filter;
    }
}
