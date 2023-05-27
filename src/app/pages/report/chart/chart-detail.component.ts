import { DateRangeComponent } from './../../shared/date-range.component';
import { IReportOutput } from './../../../models/report-output.interface';
import { Chart } from './../../../models/chart.model';
import { IChart } from './../../../models/chart.interface';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { Platform, ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { UserService } from '../../../providers/user.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { ReportService } from '../../../providers/report.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'chart-detail',
    templateUrl: 'chart-detail.component.html',
})
export class ChartDetailComponent {
    params: any = null;
    chart: IChart = new Chart();
    segment = 'chart';
    data: IReportOutput[][] = [];
    currency: string;

    public barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true
    };

    barChartLabels: string[] = [];
    barChartType = 'bar';
    barChartLegend = true;

    barChartData: any[] = [];

    isChartReady = false;
    isDebtChart = false;

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private reportService: ReportService,
                private userService: UserService,
                private modalCtrl: ModalController,
                private analyticsService: AnalyticsService,
    ) {
        const reloadChartHandle = (event) => {
            const chart = event.detail;
            if (chart) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadChart', reloadChartHandle);
        this.navCtrl.subscribe('reloadChart', reloadChartHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('chart-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });

        this.isChartReady = false;
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data != null) {
            this.chart = data.chart;
            this.data = data.data;
            this.isDebtChart = data.isDebtChart;
            const source = { label: '', data: [] };
            const barChartLabels = [];
            for (const arr of this.data) {
                const output = arr[0];
                barChartLabels.push(output.dateType);
                source.data.push(output.totalValue);
            }
            this.barChartLabels = barChartLabels;
            this.barChartData = [source];
            this.isChartReady = true;
        }
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    async selectDateRangeForTrade(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.chart.dateFrom, dateToInput: this.chart.dateTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            this.isChartReady = false;
            if (data.dateFrom != '') {
                this.chart.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.chart.dateFrom = '';
            }
            if (data.dateTo != '') {
                this.chart.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.chart.dateTo = '';
            }
            if (!this.isDebtChart) {
                this.reportService.calculateChart(this.chart).then((data) => {
                    this.data = data;
                    const source = { data: [] };
                    const barChartLabels = [];
                    for (const arr of this.data) {
                        const output = arr[0];
                        barChartLabels.push(output.dateType);
                        source.data.push(output.totalValue);
                    }
                    this.barChartLabels = barChartLabels;
                    this.barChartData = [source];
                    this.isChartReady = true;
                });
            } else {
                this.reportService.calculateDebtChart(this.chart).then((data) => {
                    this.data = data;
                    const source = { data: [] };
                    const barChartLabels = [];
                    for (const arr of this.data) {
                        const output = arr[0];
                        barChartLabels.push(output.dateType);
                        source.data.push(output.totalValue);
                    }
                    this.barChartLabels = barChartLabels;
                    this.barChartData = [source];
                    this.isChartReady = true;
                });
            }
        }
    }
}
