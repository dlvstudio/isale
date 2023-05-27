/* eslint-disable eqeqeq */
import * as moment from 'moment';

export class DateTimeService {

    private static lang = 'vi';
    private static dateFormat = 'LL';
    private static timeFormat = 'HH:mm';

    static resetDateFormat(dateFormat: string): void {
        this.dateFormat = dateFormat;
    }

    static resetTimeFormat(timeFormat: string): void {
        this.timeFormat = timeFormat;
    }

    static getDbFormat(): string {
        return 'YYYY-MM-DD HH:mm:ss';
    }

    static getDateDbFormat(): string {
        return 'YYYY-MM-DD';
    }

    static getDateTimeDbFormat(): string {
        return 'YYYY-MM-DDTHH:mm';
    }

    static getDateUIFormat(): string {
        return 'DD-MM-YYYY';
    }

    static getUiFormat(): string {
        return this.timeFormat + ' ' + this.dateFormat;
    }

    static getUiReverseFormat(): string {
        return this.dateFormat + ' ' + this.timeFormat;
    }

    static getUiDateFormat(): string {
        return this.dateFormat;
    }

    static toDbDateOnlyString(date: string = '', format: string = ''): string {
        const dbformat: string = this.getDateDbFormat();
        if (date != null && date != '') {
            return moment(date, format).format(dbformat);
        }
        return moment().format(dbformat);
    }

    static toDbString(date: string = '', format: string = ''): string {
        const dbformat: string = this.getDbFormat();
        if (date != null && date != '') {
            return moment(date, format).format(dbformat);
        }
        return moment().format(dbformat);
    }

    static toUiString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment(date, dbformat).local().format(uiformat)
            : '';
    }

    static toUiLocalString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment(date, dbformat).format(uiformat)
            : '';
    }

    static toUiLocalDateString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiDateFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment(date, dbformat).format(uiformat)
            : '';
    }

    static getMomentRefined(date: string) {
        let promotionDate = date;
        if (promotionDate.indexOf(':00Z') < 0) {
            promotionDate = moment(promotionDate).format(DateTimeService.getDateTimeDbFormat());
        }
        return this.getMoment(promotionDate);
    }

    static getMoment(date: string) {
        const dbformat: string = this.getDbFormat();
        moment.locale(this.lang);
        return moment(date, dbformat);
    }

    static toUiLocalDateTimeString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiReverseFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment(date, dbformat).format(uiformat)
            : '';
    }

    static toUiDateLocalString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiDateFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment(date, dbformat).format(uiformat)
            : '';
    }

    static toUiDateString(date: string): string {
        const dbformat: string = this.getDbFormat();
        const uiformat: string = this.getUiDateFormat();
        moment.locale(this.lang);
        return moment(date, dbformat).isValid()
            ? moment.utc(date, dbformat).local().format(uiformat)
            : '';
    }

    static toUiAgeString(date: string): any {
        const dbformat: string = this.getDbFormat();
        moment.locale(this.lang);
        const birthday = moment(date, dbformat).isValid()
            ? moment.utc(date, dbformat)
            : null;
        const age = moment().diff(birthday, 'years');
        return age;
    }

    static getYear(date: string = '', format: string = ''): number {
        if (date != null && date != '') {
            return +moment(date, format).format('YYYY');
        }
        return +moment().format('YYYY');
    }

    static getCurrentYear(): number {
        return +moment().format('YYYY');
    }

    static getAgeYear(dateOfBirth: string): number {
        if (dateOfBirth && dateOfBirth != '') {
            const dateFormat = this.getDbFormat();
            const year = DateTimeService.getYear(dateOfBirth, dateFormat);
            return year;
        }
        return 0;
    }

    static getAge(dateOfBirth: string): number {
        if (dateOfBirth && dateOfBirth != '') {
            const dateFormat = this.getDbFormat();
            const year = DateTimeService.getYear(dateOfBirth, dateFormat);
            const currentYear = DateTimeService.getYear(dateOfBirth, dateFormat);
            return currentYear - year;
        }
        return 0;
    }

    static dateTypeToStartOf(dateType: number): moment.unitOfTime.StartOf {
        if (dateType == 0) {
            return 'week';
        }
        if (dateType == 1) {
            return 'month';
        }
        if (dateType == 2) {
            return 'year';
        }
        if (dateType == 3) {
            return 'day';
        }
        if (dateType == 4) {
            return 'day';
        }
        if (dateType == 5) {
            return 'quarter';
        }
        return 'day';
    }

    static dateTypeToDuration(dateType: number): moment.unitOfTime.DurationConstructor {
        if (dateType == 0) {
            return 'weeks';
        }
        if (dateType == 1) {
            return 'months';
        }
        if (dateType == 2) {
            return 'years';
        }
        if (dateType == 3) {
            return 'days';
        }
        if (dateType == 4) {
            return 'days';
        }
        if (dateType == 5) {
            return 'quarters';
        }
        return 'days';
    }

    static GetFirstDateOfMonth(): string {
        return moment().startOf('month').format(DateTimeService.getDbFormat());
    }
    static GetEndDateOfMonth(): string {
        return moment().endOf('month').format(DateTimeService.getDbFormat());
    }
}
