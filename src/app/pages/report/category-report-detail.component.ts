import { ExcelColumn } from './../../models/excel-column.model';
import { ExcelRow } from './../../models/excel-row.model';
import { ExcelSheet } from './../../models/excel-sheet.model';
import { IChart } from './../../models/chart.interface';
import { Chart } from './../../models/chart.model';
import { IReportOutput } from './../../models/report-output.interface';
import { CategoryReport } from './../../models/category-report.model';
import { ICategoryReport } from './../../models/category-report.interface';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ActionSheetController, AlertController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { ReportService } from '../../providers/report.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'category-report-detail',
    templateUrl: 'category-report-detail.component.html',
})
export class CategoryReportDetailComponent {
    report: ICategoryReport = new CategoryReport();
    @ViewChild('chart', { static: true }) chart: any;
    params: any = null;
    isCapturing = false;
    chartImg: any;
    categoryReports = [];
    totalCategory = 0;
    totalValue = 0;
    dateType = '';
    dateFrom = '';
    dateTo = '';
    filter = '';
    currentMoment: moment.Moment = moment();
    currency: string;
    isLoadingChart = false;

    public barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        bezierCurve: false,
        onAnimationComplete: this.done
    };

    done(): void {

    }

    barChartLabels: string[] = [''];
    barChartType = 'bar';
    barChartLegend = true;

    barChartData: any[] = [{ data: [0] }];

    isInChartMode = false;

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private file: File,
                private userService: UserService,
                private reportService: ReportService,
                private actionSheetCtrl: ActionSheetController,
                private alertCtrl: AlertController,
                private excelService: ExcelService,
                private analyticsService: AnalyticsService,
    ) {
        const reloadCategoryReportHandle = (event) => {
            const report = event.detail;
            if (this.report && report.id === this.report.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadCategoryReport', reloadCategoryReportHandle);
        this.navCtrl.subscribe('reloadCategoryReport', reloadCategoryReportHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category-report-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.reportService.getCustomReport(id, 'category-report').then((report) => {
                this.report = report;

                this.doCalculate();
            });
        }
    }

    doCalculate(): void {
        this.isLoadingChart = true;
        this.reportService.calculateCategoryReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
            this.categoryReports = reportOutput.reports;
            this.totalCategory = reportOutput.totalItem;
            this.totalValue = reportOutput.totalValue;
            this.dateType = reportOutput.dateType;
            this.dateFrom = reportOutput.dateFrom;
            this.dateTo = reportOutput.dateTo;
            this.filter = reportOutput.filter;

            this.showChart();
            this.isInChartMode = true;
            this.isLoadingChart = false;
        });
    }

    edit(): void {
        this.navCtrl.push('/category-report/add', { id: this.report.id });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('report-detail.delete-report'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteReport();
                    }
                }, {
                    text: this.translateService.instant('report-detail.share'),
                    role: 'destructive',
                    handler: () => {
                        this.shareReport();
                    }
                }, {
                    text: this.translateService.instant('export.export-to-excel'),
                    handler: () => {
                        this.exportExcel();
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    async deleteReport(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('report-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.reportService.deleteCategoryReport(this.report).then(async () => {
                            this.analyticsService.logEvent('category-report-detail-delete-success');
                            this.navCtrl.publish('reloadReportList');
                            this.navCtrl.pop();
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    showChart(): void {
        const source = { label: '', data: [] };
        const barChartLabels = [];
        for (const report of this.categoryReports) {
            barChartLabels.push(report.category.title);
            source.data.push(report.value);
        }
        this.barChartLabels = barChartLabels;
        this.barChartData = [source];
    }

    enableChart(): void {
        this.isInChartMode = !this.isInChartMode;
    }

    selectReport(report: any) {
        this.navCtrl.push('/trade-category/detail', {
            id: report.categoryId
            , dateFrom: DateTimeService.toDbString(this.dateFrom, DateTimeService.getUiDateFormat())
            , dateTo: DateTimeService.toDbString(this.dateTo, DateTimeService.getUiDateFormat())
        });
    }

    previousMoment(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(this.report.dateType));
        this.doCalculate();
    }

    nextMoment(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(this.report.dateType));
        this.doCalculate();
    }

    viewTrend(): void {
        const chart: IChart = new Chart;
        chart.dataType = 1;
        chart.dateType = this.report.dateType;
        if (chart.dateType != 3 && chart.dateType != 4) {
            chart.dateFrom = moment().startOf('year').format(DateTimeService.getDbFormat());
        }
        chart.dateTo = moment().endOf('day').format(DateTimeService.getDbFormat());
        chart.dataSources = JSON.stringify([this.report]);
        this.reportService.calculateChart(chart).then((data) => {
            this.navCtrl.push('/chart/detail', { chart, data });
        });
    }

    shareReport(): void {
        this.isCapturing = true;
        this.chartImg = this.chart.nativeElement.toDataURL();
        this.userService.shareScreenshot().then(() => {
            this.isCapturing = false;
        }).catch(() => {
            this.isCapturing = false;
        });
    }

    exportExcel(): void {
        const sheet: ExcelSheet = new ExcelSheet();
        let row: ExcelRow = new ExcelRow();
        row.addColumn(new ExcelColumn(this.translateService.instant('export.category')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.money')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.unit')));
        sheet.addRow(row);
        for (const report of this.categoryReports) {
            row = new ExcelRow();
            row.addColumn(new ExcelColumn(report.category.title));
            row.addColumn(new ExcelColumn(report.value, 'number'));
            row.addColumn(new ExcelColumn(this.currency));
            sheet.addRow(row);
        }
        const fileName = 'category-report-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile(null, content);
        });
    }
}
