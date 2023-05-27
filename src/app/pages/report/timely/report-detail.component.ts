import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { IReport } from '../../../models/report.interface';
import { Report } from '../../../models/report.model';
import { IReportOutput } from '../../../models/report-output.interface';
import { IContact } from '../../../models/contact.interface';
import { IChart } from '../../../models/chart.interface';
import { Chart } from '../../../models/chart.model';
import { ExcelSheet } from '../../../models/excel-sheet.model';
import { ExcelRow } from '../../../models/excel-row.model';
import { ExcelColumn } from '../../../models/excel-column.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { UserService } from '../../../providers/user.service';
import { ReportService } from '../../../providers/report.service';
import { ExcelService } from '../../../providers/excel.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { Helper } from '../../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'timely-report-detail',
    templateUrl: 'report-detail.component.html',
})
export class TimelyReportDetailComponent {
    @ViewChild('chart', {static: false}) chart: any;
    params: any = null;
    isCapturing = false;
    chartImg: any;
    report: IReport = new Report();
    timelyReports = [];
    totalDate = 0;
    totalValue = 0;
    dateType = '';
    dateFrom = '';
    dateTo = '';
    filter = '';
    currentMoment: moment.Moment = moment();
    currency: string;

    barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        bezierCurve: false,
        onAnimationComplete: this.done
    };

    done(): void {

    }

    barChartLabels: string[] = [''];
    barChartType = 'line';
    barChartLegend = true;

    barChartData: any[] = [{ data: [0] }];

    isInChartMode = false;
    isLoadingChart = false;

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
        this.navCtrl.unsubscribe('reloadTimelyReport', this.reload);
        this.navCtrl.subscribe('reloadTimelyReport', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('timely-report-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = () => {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.reportService.getCustomReport(id, 'timely-report').then((report) => {
                if (!report) {
                    return;
                }
                this.report = report;

                this.doCalculate();
            });
        } else if (this.params && this.params.templateReport) {
            this.report = this.params.templateReport;
            this.doCalculate();
        }
    }

    doCalculate(): void {
        this.isLoadingChart = true;
        this.reportService.calculateTimelyReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
            this.timelyReports = reportOutput.reports;
            this.totalDate = reportOutput.totalItem;
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

    contactImageOrPlaceholder(contact: IContact): string {
        return contact.avatarUrl !== null && contact.avatarUrl !== ''
            ? contact.avatarUrl
            : 'assets/person-placeholder.jpg';
    }

    edit(): void {
        this.navCtrl.push('/timely-report/add', { id: 1 });
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
                        this.reportService.deleteReport(this.report).then(async () => {
                            this.analyticsService.logEvent('report-detail-delete-success');
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
        for (const report of this.timelyReports) {
            barChartLabels.push(report.dateId);
            source.data.push(report.value);
        }
        this.barChartLabels = barChartLabels;
        this.barChartData = [source];
    }

    enableChart(): void {
        this.isInChartMode = !this.isInChartMode;
    }

    selectReport(report: any) {
        this.navCtrl.push('/trade/daily', {
            date: report.dateId
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
        const chart: IChart = new Chart();
        chart.dataType = 3;
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
        row.addColumn(new ExcelColumn(this.translateService.instant('export.date')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.money')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.unit')));
        sheet.addRow(row);
        for (const report of this.timelyReports) {
            row = new ExcelRow();
            row.addColumn(new ExcelColumn(report.dateId));
            row.addColumn(new ExcelColumn(report.value, 'number'));
            row.addColumn(new ExcelColumn(this.currency));
            sheet.addRow(row);
        }
        const fileName = 'daily-report-' + this.report.id + '-' + Helper.getCurrentDate() + '.xlsx';
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
