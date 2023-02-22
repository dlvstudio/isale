import { Helper } from './helper.service';
import { IProduct } from './../models/product.interface';
import { IProductReport } from './../models/product-report.interface';
import { IChart } from './../models/chart.interface';
import { ITradeToCategory } from './../models/trade-to-category.interface';
import { ITradeCategory } from './../models/trade-category.interface';
import { TradeService } from './trade.service';
import { ITrade } from './../models/trade.interface';
import { IDebtToCategory } from './../models/debt-to-category.interface';
import { DebtService } from './debt.service';
import { IDebt } from './../models/debt.interface';
import { IDebtReport } from './../models/debt-report.interface';
import { IContact } from './../models/contact.interface';
import { ReportOutput } from './../models/report-output.model';
import { IReportOutput } from './../models/report-output.interface';
import { ICategoryReport } from './../models/category-report.interface';
import { IReport } from './../models/report.interface';
import { DateTimeService } from './datetime.service';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { StorageService } from './storage.service';
import { TranslateService } from '@ngx-translate/core';
import { IProductNoteItem } from '../models/product-note.interface';
import { ProductService } from './product.service';

@Injectable()
export class ReportService {

    constructor(
        private storate: StorageService,
        private tradeService: TradeService,
        private debtService: DebtService,
        private productService: ProductService,
        private translateService: TranslateService
    ) {
    }

    getCustomReport(id: number, reportType: string): Promise<any> {
        return new Promise((r, j) => {
            this.storate.get(reportType).then((json) => {
                if (!json) {
                    r(null);
                    return;
                }
                const report = JSON.parse(json);
                report.id = 1;
                r(report);
            }).catch((e) => {
                console.error(e);
                j(e);
            });
        });
    }

    deleteReport(report: IReport): Promise<any> {
        return null; //this.sql.deleteObject(Helper.reportTableName, report);
    }

    deleteDebtReport(report: IDebtReport): Promise<any> {
        return null; //this.sql.deleteObject(Helper.debtReportTableName, report);
    }

    deleteCategoryReport(report: ICategoryReport): Promise<any> {
        return null; //this.sql.deleteObject(Helper.categoryReportTableName, report);
    }

    deleteProductReport(report: IProductReport): Promise<any> {
        return null; //this.sql.deleteObject(Helper.productReportTableName, report);
    }

    saveCustomReport(report: any, reportType: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (report.id <= 0) {
                report.createdAt = DateTimeService.toDbString();
                report.modifiedAt = report.createdAt;
            } else {
                report.modifiedAt = DateTimeService.toDbString();
            }
            const json = JSON.stringify(report);
            this.storate.set(reportType, json).then((data) => {
                resolve(1);
            }).catch((err) => {
                console.error('saveCustomReport OK', err);
                resolve(0);
            });
        });
    }

    calculateReport(report: IReport, momentInput: moment.Moment = null, tradesInput: ITrade[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selectedContacts: IContact[] = [];
            let ignoredContacts: IContact[] = [];

            if (report.contactListType === 1) {
                selectedContacts = JSON.parse(report.contactListCustom);
            }
            if (report.ignoreContact === 1) {
                ignoredContacts = JSON.parse(report.ignoredContacts);
            }

            if (tradesInput && tradesInput != null) {
                const reportOutput = this.calculateReportTotal(report, tradesInput, selectedContacts, ignoredContacts, m);
                res(reportOutput);
            } else {
                this.tradeService.getTrades().then((trades: ITrade[]) => {
                    const reportOutput = this.calculateReportTotal(report, trades, selectedContacts, ignoredContacts, m);
                    res(reportOutput);
                }).catch(() => {
                    j(null);
                });
            }
        });
    }

    calculateTimelyReport(report: IReport, momentInput: moment.Moment = null, tradesInput: ITrade[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selectedContacts: IContact[] = [];
            let ignoredContacts: IContact[] = [];

            if (report.contactListType === 1) {
                selectedContacts = JSON.parse(report.contactListCustom);
            }
            if (report.ignoreContact === 1) {
                ignoredContacts = JSON.parse(report.ignoredContacts);
            }

            if (tradesInput && tradesInput != null) {
                const reportOutput = this.calculateTimelyReportTotal(report, tradesInput, selectedContacts, ignoredContacts, m);
                res(reportOutput);
            } else {
                this.tradeService.getTrades().then((trades: ITrade[]) => {
                    const reportOutput = this.calculateTimelyReportTotal(report, trades, selectedContacts, ignoredContacts, m);
                    res(reportOutput);
                }).catch(() => {
                    j(null);
                });
            }
        });
    }

    calculateDebtReport(report: IDebtReport, momentInput: moment.Moment = null, debtsInput: IDebt[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selecteds: any[] = [];
            let ignoreds: any[] = [];

            if (report.customListType === 1) {
                selecteds = JSON.parse(report.customList);
            }
            if (report.ignore === 1) {
                ignoreds = JSON.parse(report.ignoredList);
            }

            if (debtsInput && debtsInput != null) {
                const reportOutput = this.calculateDebtReportTotal(report, debtsInput, selecteds, ignoreds, m);
                res(reportOutput);
            } else {
                this.debtService.getDebtsByType(report.debtType).then((debts: IDebt[]) => {
                    const reportOutput = this.calculateDebtReportTotal(report, debts, selecteds, ignoreds, m);
                    res(reportOutput);
                }).catch(() => {
                    j(null);
                });
            }
        });
    }

    calculateProductReport(report: IProductReport, momentInput: moment.Moment = null, tradesInput: IProductNoteItem[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selectedProducts: IProduct[] = [];
            let ignoredProducts: IProduct[] = [];

            if (report.productListType === 1) {
                selectedProducts = JSON.parse(report.productListCustom);
            }
            if (report.ignoreProduct === 1) {
                ignoredProducts = JSON.parse(report.ignoredProducts);
            }

            if (tradesInput && tradesInput != null) {
                const reportOutput = this.calculateProductReportTotal(report, tradesInput, selectedProducts, ignoredProducts, m);
                res(reportOutput);
            } else {
                this.productService.getNotes().then((trades: IProductNoteItem[]) => {
                    const reportOutput = this.calculateProductReportTotal(report, trades, selectedProducts, ignoredProducts, m);
                    res(reportOutput);
                }).catch(() => {
                    j(null);
                });
            }
        });
    }

    private calculateReportTotal(report: IReport, trades: ITrade[], selectedContacts: IContact[], ignoredContacts: IContact[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.genderType == 1) {
            reportOutput.filter = this.translateService.instant('contact-add.gender-male');
        } else if (report.genderType == 2) {
            reportOutput.filter = this.translateService.instant('contact-add.gender-female');
        }

        if (report.ageType == 1) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.year-from-to', { from: report.ageFrom, to: report.ageTo });
        } else if (report.ageType == 2) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.age-from-to', { from: report.ageFrom, to: report.ageTo });
        }

        if (report.contactListType != 0 || report.ignoreContact != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.contact-limited');
        }

        const contactReports = [];
        for (const trade of trades) {
            if (trade.contactId == 0) {
                continue;
            }
            if (report.contactListType === 1) {
                const idx = selectedContacts.findIndex(item => item.id === trade.contactId);
                if (idx < 0) {
                    continue;
                }
            }
            if (report.ignoreContact === 1) {
                const idx = ignoredContacts.findIndex(item => item.id === trade.contactId);
                if (idx >= 0) {
                    continue;
                }
            }
            if (report.genderType === 1 && trade.contact.gender !== 'male') {
                continue;
            }
            if (report.genderType === 2 && trade.contact.gender !== 'female') {
                continue;
            }
            if (report.ageType === 1) {
                if (!trade.contact.dateOfBirth || trade.contact.dateOfBirth == '') {
                    continue;
                }
                const year = DateTimeService.getAgeYear(trade.contact.dateOfBirth);
                if (report.ageFrom != 0) {
                    if (year < report.ageFrom) {
                        continue;
                    }
                }

                if (report.ageTo != 0) {
                    if (year > report.ageTo) {
                        continue;
                    }
                }
            }

            if (report.ageType === 2) {
                if (!trade.contact.dateOfBirth || trade.contact.dateOfBirth == '') {
                    continue;
                }
                const age = DateTimeService.getAge(trade.contact.dateOfBirth);
                if (report.ageFrom != 0) {
                    if (age < report.ageFrom) {
                        continue;
                    }
                }

                if (report.ageTo != 0) {
                    if (age > report.ageTo) {
                        continue;
                    }
                }
            }

            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, trade.createdAt, m)) {
                continue;
            }

            const val = trade.value * (trade.isReceived ? 1 : -1);

            const idx = contactReports.findIndex(item => item.contactId == trade.contactId);

            if (idx >= 0) {
                const report = contactReports[idx];
                report.value += val;
                reportOutput.totalValue += val;
            } else {
                const report = { contactId: trade.contactId, contact: trade.contact, value: 0 };
                report.value = val;
                contactReports.push(report);
                reportOutput.totalValue += val;
                reportOutput.totalItem++;
            }
        }
        reportOutput.reports = contactReports;
        return reportOutput;
    }

    private calculateTimelyReportTotal(report: IReport, trades: ITrade[], selectedContacts: IContact[], ignoredContacts: IContact[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.genderType == 1) {
            reportOutput.filter = this.translateService.instant('contact-add.gender-male');
        } else if (report.genderType == 2) {
            reportOutput.filter = this.translateService.instant('contact-add.gender-female');
        }

        if (report.ageType == 1) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.year-from-to', { from: report.ageFrom, to: report.ageTo });
        } else if (report.ageType == 2) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.age-from-to', { from: report.ageFrom, to: report.ageTo });
        }

        if (report.contactListType != 0 || report.ignoreContact != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.contact-limited');
        }

        const timelyReports = [];
        let mStart = moment(reportOutput.dateFrom, DateTimeService.getUiDateFormat());
        const mEnd = moment(reportOutput.dateTo, DateTimeService.getUiDateFormat());
        while (mEnd >= mStart) {
            const report = { dateId: mStart.format(DateTimeService.getUiDateFormat()), value: 0 };
            timelyReports.push(report);
            reportOutput.totalItem++;
            mStart = mStart.add(1, DateTimeService.dateTypeToDuration(3));
        }
        for (const trade of trades) {
            if (trade.contactId != 0 && trade.contact) {
                if (report.contactListType === 1) {
                    const idx = selectedContacts.findIndex(item => item.id === trade.contactId);
                    if (idx < 0) {
                        continue;
                    }
                }
                if (report.ignoreContact === 1) {
                    const idx = ignoredContacts.findIndex(item => item.id === trade.contactId);
                    if (idx >= 0) {
                        continue;
                    }
                }
                if (report.genderType === 1 && trade.contact.gender !== 'male') {
                    continue;
                }
                if (report.genderType === 2 && trade.contact.gender !== 'female') {
                    continue;
                }
                if (report.ageType === 1) {
                    if (!trade.contact.dateOfBirth || trade.contact.dateOfBirth == '') {
                        continue;
                    }
                    const year = DateTimeService.getAgeYear(trade.contact.dateOfBirth);
                    if (report.ageFrom != 0) {
                        if (year < report.ageFrom) {
                            continue;
                        }
                    }

                    if (report.ageTo != 0) {
                        if (year > report.ageTo) {
                            continue;
                        }
                    }
                }

                if (report.ageType === 2) {
                    if (!trade.contact.dateOfBirth || trade.contact.dateOfBirth == '') {
                        continue;
                    }
                    const age = DateTimeService.getAge(trade.contact.dateOfBirth);
                    if (report.ageFrom != 0) {
                        if (age < report.ageFrom) {
                            continue;
                        }
                    }

                    if (report.ageTo != 0) {
                        if (age > report.ageTo) {
                            continue;
                        }
                    }
                }
            } else if (report.contactListType === 1
                || report.ignoreContact === 1
                || report.genderType === 1
                || report.genderType === 2
                || report.ageType === 1
                || report.ageType === 2
            ) {
                continue;
            }


            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, trade.createdAt, m)) {
                continue;
            }

            const val = trade.value * (trade.isReceived ? 1 : -1);
            const dateId = moment(trade.createdAt, DateTimeService.getDbFormat()).startOf('days').format(DateTimeService.getUiDateFormat());

            const idx = timelyReports.findIndex(item => item.dateId == dateId);

            if (idx >= 0) {
                const report = timelyReports[idx];
                report.value += val;
                reportOutput.totalValue += val;
            }
        }
        reportOutput.reports = timelyReports;
        return reportOutput;
    }

    private calculateDebtReportTotal(report: IDebtReport, debts: IDebt[], selecteds: any[], ignoreds: any[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.reportType === 0) {
            if (report.genderType == 1) {
                reportOutput.filter = this.translateService.instant('contact-add.gender-male');
            } else if (report.genderType == 2) {
                reportOutput.filter = this.translateService.instant('contact-add.gender-female');
            }

            if (report.ageType == 1) {
                if (reportOutput.filter != '') {
                    reportOutput.filter += '; ';
                }
                reportOutput.filter += this.translateService.instant('report-output.year-from-to', { from: report.ageFrom, to: report.ageTo });
            } else if (report.ageType == 2) {
                if (reportOutput.filter != '') {
                    reportOutput.filter += '; ';
                }
                reportOutput.filter += this.translateService.instant('report-output.age-from-to', { from: report.ageFrom, to: report.ageTo });
            }
        }


        if (report.customListType != 0 || report.ignore != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            if (report.reportType == 0) {
                reportOutput.filter += this.translateService.instant('report-output.contact-limited');
            } else if (report.reportType == 1) {
                reportOutput.filter += this.translateService.instant('report-output.category-limited');
            } else if (report.reportType == 2) {
                reportOutput.filter += this.translateService.instant('report-output.product-limited');
            }
        }

        const itemReports = [];
        for (const debt of debts) {
            if (debt.isPaid) {
                continue;
            }
            if (report.reportType == 0 && debt.contactId == 0) {
                continue;
            }
            if (report.reportType == 2 && debt.productId == 0) {
                continue;
            }
            const id2Compare = report.reportType == 0
                ? debt.contactId
                : report.reportType == 2
                    ? debt.productId
                    : 0;
            if (report.customListType === 1) {

                const idx = selecteds.findIndex(item => item.id === id2Compare);
                if (idx < 0) {
                    continue;
                }
            }
            if (report.ignore === 1) {
                const idx = ignoreds.findIndex(item => item.id === id2Compare);
                if (idx >= 0) {
                    continue;
                }
            }

            if (report.reportType == 0) {
                if (report.genderType === 1 && debt.contact.gender !== 'male') {
                    continue;
                }
                if (report.genderType === 2 && debt.contact.gender !== 'female') {
                    continue;
                }
                if (report.ageType === 1) {
                    if (!debt.contact.dateOfBirth || debt.contact.dateOfBirth == '') {
                        continue;
                    }
                    const year = DateTimeService.getAgeYear(debt.contact.dateOfBirth);
                    if (report.ageFrom != 0) {
                        if (year < report.ageFrom) {
                            continue;
                        }
                    }

                    if (report.ageTo != 0) {
                        if (year > report.ageTo) {
                            continue;
                        }
                    }
                }

                if (report.ageType === 2) {
                    if (!debt.contact.dateOfBirth || debt.contact.dateOfBirth == '') {
                        continue;
                    }
                    const age = DateTimeService.getAge(debt.contact.dateOfBirth);
                    if (report.ageFrom != 0) {
                        if (age < report.ageFrom) {
                            continue;
                        }
                    }

                    if (report.ageTo != 0) {
                        if (age > report.ageTo) {
                            continue;
                        }
                    }
                }
            }

            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, debt.createdAt, m)) {
                continue;
            }

            const val = debt.value;

            const idx = itemReports.findIndex(item => item.itemId == id2Compare);

            if (idx >= 0) {
                const itemReport = itemReports[idx];
                itemReport.value += val;
                reportOutput.totalValue += val;
            } else {
                const item = report.reportType == 0
                    ? debt.contact
                    : report.reportType == 2
                        ? debt.product
                        : null;
                const itemReport = { itemId: id2Compare, item, value: 0 };
                itemReport.value = val;
                itemReports.push(itemReport);
                reportOutput.totalValue += val;
                reportOutput.totalItem++;
            }
        }
        reportOutput.reports = itemReports;
        return reportOutput;
    }

    private calculateProductReportTotal(report: IProductReport, trades: IProductNoteItem[], selectedProducts: IProduct[], ignoredProducts: IProduct[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.productListType != 0 || report.ignoreProduct != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.product-limited');
        }

        const productReports = [];
        for (const trade of trades) {
            if (trade.productId == 0) {
                continue;
            }
            if (report.productListType === 1) {
                const idx = selectedProducts.findIndex(item => item.id === trade.productId);
                if (idx < 0) {
                    continue;
                }
            }
            if (report.ignoreProduct === 1) {
                const idx = ignoredProducts.findIndex(item => item.id === trade.productId);
                if (idx >= 0) {
                    continue;
                }
            }

            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, trade.createdAt, m)) {
                continue;
            }

            const val = trade.amount * (trade.orderId ? 1 : -1);
            const quantity = trade.quantity;

            const idx = productReports.findIndex(item => item.productId == trade.productId);

            if (idx >= 0) {
                const report = productReports[idx];
                report.value += val;
                report.quantity += quantity;
                reportOutput.totalValue += val;
            } else {
                const report = { productId: trade.productId, product: trade.product, value: 0, quantity: 0 };
                report.value = val;
                report.quantity = quantity;
                productReports.push(report);
                reportOutput.totalValue += val;
                reportOutput.totalItem++;
            }
        }
        reportOutput.reports = productReports;
        return reportOutput;
    }

    calculateCategoryReport(report: ICategoryReport, momentInput: moment.Moment = null, tradesToCategoryInput: ITradeToCategory[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selectedCategories: ITradeCategory[] = [];
            let ignoredCategories: ITradeCategory[] = [];

            if (report.categoryListType === 1) {
                selectedCategories = JSON.parse(report.categoryListCustom);
            }
            if (report.ignoreCategory === 1) {
                ignoredCategories = JSON.parse(report.ignoredCategories);
            }

            if (tradesToCategoryInput && tradesToCategoryInput != null) {
                const reportOutput = this.calculateCategoryReportTotal(report, tradesToCategoryInput, selectedCategories, ignoredCategories, m);
                res(reportOutput);
            } else {
                this.tradeService.getAllCategoriesToTrade().then((tradeToCategories: ITradeToCategory[]) => {
                    const reportOutput = this.calculateCategoryReportTotal(report, tradeToCategories, selectedCategories, ignoredCategories, m);
                    res(reportOutput);
                })
                    .catch(() => {
                        j(null);
                    });
            }
        });
    }

    calculateDebtCategoryReport(report: IDebtReport, momentInput: moment.Moment = null, debtsToCategoryInput: IDebtToCategory[] = null): Promise<IReportOutput> {
        let m: moment.Moment;
        if (momentInput != null) {
            m = momentInput;
        } else {
            m = moment();
        }
        return new Promise<IReportOutput>((res, j) => {
            let selectedCategories: ITradeCategory[] = [];
            let ignoredCategories: ITradeCategory[] = [];

            if (report.customListType === 1) {
                selectedCategories = JSON.parse(report.customList);
            }
            if (report.ignore === 1) {
                ignoredCategories = JSON.parse(report.ignoredList);
            }

            if (debtsToCategoryInput && debtsToCategoryInput != null) {
                const reportOutput = this.calculateDebtCategoryReportTotal(report, debtsToCategoryInput, selectedCategories, ignoredCategories, m);
                res(reportOutput);
            } else {
                this.debtService.getAllCategoriesToDebt().then((debtToCategories: IDebtToCategory[]) => {
                    const reportOutput = this.calculateDebtCategoryReportTotal(report, debtToCategories, selectedCategories, ignoredCategories, m);
                    res(reportOutput);
                })
                    .catch(() => {
                        j(null);
                    });
            }
        });
    }

    private calculateCategoryReportTotal(report: ICategoryReport, tradeToCategories: ITradeToCategory[], selectedCategories: ITradeCategory[], ignoredCategories: ITradeCategory[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.categoryListType != 0 || report.ignoreCategory != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.category-limited');
        }
        const categoryReports = [];
        for (const tradeToCategory of tradeToCategories) {

            if (report.categoryListType === 1) {
                const idx = selectedCategories.findIndex(item => item.id === tradeToCategory.categoryId);
                if (idx < 0) {
                    continue;
                }
            }
            if (report.ignoreCategory === 1) {
                const idx = ignoredCategories.findIndex(item => item.id === tradeToCategory.categoryId);
                if (idx >= 0) {
                    continue;
                }
            }

            const trade = tradeToCategory.trade;
            if (!trade) {
                continue;
            }

            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, trade.createdAt, m)) {
                continue;
            }

            const val = trade.value * (trade.isReceived ? 1 : -1);

            const idx = categoryReports.findIndex(item => item.categoryId == tradeToCategory.categoryId);

            if (idx >= 0) {
                const report = categoryReports[idx];
                report.value += val;
                reportOutput.totalValue += val;
            } else {
                const report = { categoryId: tradeToCategory.categoryId, category: tradeToCategory.tradeCategory, value: 0 };
                report.value = val;
                categoryReports.push(report);
                reportOutput.totalValue += val;
                reportOutput.totalItem++;
            }
        }
        reportOutput.reports = categoryReports;
        return reportOutput;
    }

    private calculateDebtCategoryReportTotal(report: IDebtReport, debtToCategories: IDebtToCategory[], selectedCategories: ITradeCategory[], ignoredCategories: ITradeCategory[], m: moment.Moment): IReportOutput {
        const reportOutput: IReportOutput = new ReportOutput();
        this.calculateDateRange(report.dateType, report.dateFrom, report.dateTo, reportOutput, m);

        if (report.customListType != 0 || report.ignore != 0) {
            if (reportOutput.filter != '') {
                reportOutput.filter += '; ';
            }
            reportOutput.filter += this.translateService.instant('report-output.category-limited');
        }
        const categoryReports = [];
        for (const debtToCategory of debtToCategories) {
            if (report.customListType === 1) {
                const idx = selectedCategories.findIndex(item => item.id === debtToCategory.categoryId);
                if (idx < 0) {
                    continue;
                }
            }
            if (report.ignore === 1) {
                const idx = ignoredCategories.findIndex(item => item.id === debtToCategory.categoryId);
                if (idx >= 0) {
                    continue;
                }
            }

            const debt = debtToCategory.debt;
            if (!debt || debt.isPaid) {
                continue;
            }

            if (!this.isPassDateReport(report.dateType, report.dateFrom, report.dateTo, debt.createdAt, m)) {
                continue;
            }

            const val = debt.value;

            const idx = categoryReports.findIndex(item => item.itemId == debtToCategory.categoryId);

            if (idx >= 0) {
                const itemReport = categoryReports[idx];
                itemReport.value += val;
                reportOutput.totalValue += val;
            } else {
                const itemReport = { itemId: debtToCategory.categoryId, item: debtToCategory.tradeCategory, value: 0 };
                itemReport.value = val;
                categoryReports.push(itemReport);
                reportOutput.totalValue += val;
                reportOutput.totalItem++;
            }
        }
        reportOutput.reports = categoryReports;
        return reportOutput;
    }

    private calculateDateRange(dateType: number, dateFrom: string, dateTo: string, reportOutput: IReportOutput, m: moment.Moment): void {
        if (dateType == 0) {
            reportOutput.dateType = this.translateService.instant('report-output.week') + ' ' + m.week();
            reportOutput.week = m.week();
            reportOutput.year = m.year();
            reportOutput.dateFrom = m.startOf('week').format(DateTimeService.getUiDateFormat());
            reportOutput.dateTo = m.endOf('week').format(DateTimeService.getUiDateFormat());
        } else if (dateType == 1) {
            reportOutput.dateType = this.translateService.instant('report-output.month') + ' ' + (m.month() + 1);
            reportOutput.month = m.month() + 1;
            reportOutput.year = m.year();
            reportOutput.dateFrom = m.startOf('month').format(DateTimeService.getUiDateFormat());
            reportOutput.dateTo = m.endOf('month').format(DateTimeService.getUiDateFormat());
        } else if (dateType == 2) {
            reportOutput.dateType = this.translateService.instant('report-output.year') + ' ' + m.year();
            reportOutput.year = m.year();
            reportOutput.dateFrom = m.startOf('year').format(DateTimeService.getUiDateFormat());
            reportOutput.dateTo = m.endOf('year').format(DateTimeService.getUiDateFormat());
        } else if (dateType == 3) {
            reportOutput.dateType = this.translateService.instant('report-output.day') + ' ';
            reportOutput.date = m.startOf('day').format(DateTimeService.getUiDateFormat());
            reportOutput.dateFrom = m.startOf('day').format(DateTimeService.getUiDateFormat());
            reportOutput.dateTo = m.endOf('day').format(DateTimeService.getUiDateFormat());
        } else if (dateType == 4) {
            reportOutput.dateType = this.translateService.instant('report-output.custom') + ' ';
            reportOutput.date = m.startOf('day').format(DateTimeService.getUiDateFormat());
            reportOutput.dateFrom = DateTimeService.toUiDateString(dateFrom);
            reportOutput.dateTo = DateTimeService.toUiDateString(dateTo);
        } else if (dateType == 5) {
            reportOutput.dateType = this.translateService.instant('report-output.quarter') + ' ' + m.quarter();
            reportOutput.quarter = m.quarter();
            reportOutput.year = m.year();
            reportOutput.dateFrom = m.startOf('quarter').format(DateTimeService.getUiDateFormat());
            reportOutput.dateTo = m.endOf('quarter').format(DateTimeService.getUiDateFormat());
        }
    }

    private isPassDateReport(dateType: number, dateFrom: string, dateTo: string, createdAt: string, m: moment.Moment): boolean {
        if (dateType == 0
            || dateType == 1
            || dateType == 2
            || dateType == 3
            || dateType == 5
        ) {
            const start = moment(m).startOf(DateTimeService.dateTypeToStartOf(dateType));
            const end = moment(m).endOf(DateTimeService.dateTypeToStartOf(dateType));
            const d = moment(createdAt, DateTimeService.getDbFormat()).startOf('day');
            if (d < start || d > end) {
                return false;
            }
        }

        if (dateType == 4) {
            const d = moment(createdAt, DateTimeService.getDbFormat()).startOf('day');
            if (dateFrom && dateFrom != '') {
                const startDate = moment(dateFrom, DateTimeService.getDbFormat());
                if (d < startDate) {
                    return false;
                }
            }

            if (dateTo && dateTo != '') {
                const endDate = moment(dateTo, DateTimeService.getDbFormat());
                if (d > endDate) {
                    return false;
                }
            }
        }

        return true;
    }

    calculateChart(chart: IChart): Promise<IReportOutput[][]> {
        if (chart.dataType == 0) {
            const reports: IReport[] = JSON.parse(chart.dataSources);
            return this.calculateChartOnReport(chart, reports);
        }
        if (chart.dataType == 1) {
            const reports: ICategoryReport[] = JSON.parse(chart.dataSources);
            return this.calculateChartOnCategory(chart, reports);
        }
        if (chart.dataType == 3) {
            const reports: IReport[] = JSON.parse(chart.dataSources);
            return this.calculateChartOnTimelyReport(chart, reports);
        }
        const reports: IProductReport[] = JSON.parse(chart.dataSources);
        return this.calculateChartOnProduct(chart, reports);
    }

    calculateDebtChart(chart: IChart): Promise<IReportOutput[][]> {
        if (chart.dataType == 0 || chart.dataType == 2) {
            const reports: IDebtReport[] = JSON.parse(chart.dataSources);
            return this.calculateChartOnDebtReport(chart, reports);
        }
        const reports: IDebtReport[] = JSON.parse(chart.dataSources);
        return this.calculateDebtChartOnCategory(chart, reports);
    }

    private calculateChartOnDebtReport(chart: IChart, reports: IDebtReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.debtService.getDebtsByType(reports[0].debtType).then((debts: IDebt[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.endOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selecteds: any[] = [];
                        let ignoreds: any[] = [];

                        if (report.customListType === 1) {
                            selecteds = JSON.parse(report.customList);
                        }
                        if (report.ignore === 1) {
                            ignoreds = JSON.parse(report.ignoredList);
                        }
                        const reportOutput = this.calculateDebtReportTotal(report, debts, selecteds, ignoreds, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }

    private calculateChartOnReport(chart: IChart, reports: IReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.tradeService.getTrades().then((trades: ITrade[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.endOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selectedContacts: IContact[] = [];
                        let ignoredContacts: IContact[] = [];

                        if (report.contactListType === 1) {
                            selectedContacts = JSON.parse(report.contactListCustom);
                        }
                        if (report.ignoreContact === 1) {
                            ignoredContacts = JSON.parse(report.ignoredContacts);
                        }
                        const reportOutput = this.calculateReportTotal(report, trades, selectedContacts, ignoredContacts, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }

    private calculateChartOnTimelyReport(chart: IChart, reports: IReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.tradeService.getTrades().then((trades: ITrade[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.endOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selectedContacts: IContact[] = [];
                        let ignoredContacts: IContact[] = [];

                        if (report.contactListType === 1) {
                            selectedContacts = JSON.parse(report.contactListCustom);
                        }
                        if (report.ignoreContact === 1) {
                            ignoredContacts = JSON.parse(report.ignoredContacts);
                        }
                        const reportOutput = this.calculateTimelyReportTotal(report, trades, selectedContacts, ignoredContacts, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }

    private calculateChartOnProduct(chart: IChart, reports: IProductReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.productService.getNotes().then((trades: IProductNoteItem[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.endOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selectedProducts: IProduct[] = [];
                        let ignoredProducts: IProduct[] = [];

                        if (report.productListType === 1) {
                            selectedProducts = JSON.parse(report.productListCustom);
                        }
                        if (report.ignoreProduct === 1) {
                            ignoredProducts = JSON.parse(report.ignoredProducts);
                        }
                        const reportOutput = this.calculateProductReportTotal(report, trades, selectedProducts, ignoredProducts, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }

    private calculateChartOnCategory(chart: IChart, reports: ICategoryReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.tradeService.getAllCategoriesToTrade().then((tradesToCategory: ITradeToCategory[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selectedCategories: ITradeCategory[] = [];
                        let ignoredCategories: ITradeCategory[] = [];

                        if (report.categoryListType === 1) {
                            selectedCategories = JSON.parse(report.categoryListCustom);
                        }
                        if (report.ignoreCategory === 1) {
                            ignoredCategories = JSON.parse(report.ignoredCategories);
                        }
                        const reportOutput = this.calculateCategoryReportTotal(report, tradesToCategory, selectedCategories, ignoredCategories, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }

    private calculateDebtChartOnCategory(chart: IChart, reports: IDebtReport[]): Promise<IReportOutput[][]> {
        return new Promise<IReportOutput[][]>((res, j) => {
            this.debtService.getAllCategoriesToDebt().then((debtsToCategory: IDebtToCategory[]) => {
                const arr: IReportOutput[][] = [];
                let mEnd: moment.Moment = moment(chart.dateTo, DateTimeService.getDbFormat());
                let mStart: moment.Moment = moment(chart.dateFrom, DateTimeService.getDbFormat());
                mStart = mStart.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                mEnd = mEnd.startOf(DateTimeService.dateTypeToStartOf(chart.dateType));
                while (mEnd >= mStart) {
                    const reportOutputs: IReportOutput[] = [];
                    for (const report of reports) {
                        let selectedCategories: ITradeCategory[] = [];
                        let ignoredCategories: ITradeCategory[] = [];

                        if (report.customListType === 1) {
                            selectedCategories = JSON.parse(report.customList);
                        }
                        if (report.ignore === 1) {
                            ignoredCategories = JSON.parse(report.ignoredList);
                        }
                        const reportOutput = this.calculateDebtCategoryReportTotal(report, debtsToCategory, selectedCategories, ignoredCategories, mStart);
                        reportOutputs.push(reportOutput);
                    }
                    mStart = mStart.add(1, DateTimeService.dateTypeToDuration(chart.dateType));
                    arr.push(reportOutputs);
                }
                res(arr);
            }).catch(() => {
                j(null);
            });
        });
    }
}
