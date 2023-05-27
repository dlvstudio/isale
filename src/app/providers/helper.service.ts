import { File } from '@awesome-cordova-plugins/file/ngx';
import * as moment from 'moment';
import { removeVietnameseTones } from './helper';
export class Helper {

    static currentVersion = '0.0.1';
    static userTableName = 'user';
    static storageTableName = 'storage1';
    static productTableName = 'product2';
    static productNoteTableName = 'productNote2';
    static debtTableName = 'debt';
    static debtToCategoryTableName = 'debtToCategory';
    static noteTableName = 'notes3';
    static notePictureTableName = 'notePictures1';
    static reportTableName = 'report';
    static categoryReportTableName = 'categoryReport';
    static productReportTableName = 'productReport';
    static debtReportTableName = 'debtReport';
    static tradeTableName = 'trade';
    static tradeCategoryTableName = 'tradeCategory';
    static tradeToCategoryTableName = 'tradeToCategory2';
    static contactTableName = 'contacts6';
    static moneyAccountTableName = 'moneyAccount';
    static moneyAccountTransactionTableName = 'moneyAccountTransaction';
    static orderTableName = 'orders';
    static receivedNoteTableName = 'receivedNote';

    static currencies: any = {
        USD: {
            name: 'US Dollar',
            symbol_native: '$',
            code: 'USD',
        },
        CAD: {
            name: 'Canadian Dollar',
            symbol_native: '$',
            code: 'CAD',
        },
        EUR: {
            name: 'Euro',
            symbol_native: '€',
            code: 'EUR',
        },
        AED: {
            name: 'United Arab Emirates Dirham',
            symbol_native: 'د.إ.‏',
            code: 'AED',
        },
        AFN: {
            name: 'Afghan Afghani',
            symbol_native: '؋',
            code: 'AFN',
        },
        ALL: {
            name: 'Albanian Lek',
            symbol_native: 'Lek',
            code: 'ALL',
        },
        AMD: {
            name: 'Armenian Dram',
            symbol_native: 'դր.',
            code: 'AMD',
        },
        ARS: {
            name: 'Argentine Peso',
            symbol_native: '$',
            code: 'ARS',
        },
        AUD: {
            name: 'Australian Dollar',
            symbol_native: '$',
            code: 'AUD',
        },
        AZN: {
            name: 'Azerbaijani Manat',
            symbol_native: 'ман.',
            code: 'AZN',
        },
        BAM: {
            name: 'Bosnia-Herzegovina Convertible Mark',
            symbol_native: 'KM',
            code: 'BAM',
        },
        BDT: {
            name: 'Bangladeshi Taka',
            symbol_native: '৳',
            code: 'BDT',
        },
        BGN: {
            name: 'Bulgarian Lev',
            symbol_native: 'лв.',
            code: 'BGN',
        },
        BHD: {
            name: 'Bahraini Dinar',
            symbol_native: 'د.ب.‏',
            code: 'BHD',
        },
        BIF: {
            name: 'Burundian Franc',
            symbol_native: 'FBu',
            code: 'BIF',
        },
        BND: {
            name: 'Brunei Dollar',
            symbol_native: '$',
            code: 'BND',
        },
        BOB: {
            name: 'Bolivian Boliviano',
            symbol_native: 'Bs',
            code: 'BOB',
        },
        BRL: {
            name: 'Brazilian Real',
            symbol_native: 'R$',
            code: 'BRL',
        },
        BWP: {
            name: 'Botswanan Pula',
            symbol_native: 'P',
            code: 'BWP',
        },
        BYR: {
            name: 'Belarusian Ruble',
            symbol_native: 'BYR',
            code: 'BYR',
        },
        BZD: {
            name: 'Belize Dollar',
            symbol_native: '$',
            code: 'BZD',
        },
        CDF: {
            symbol_native: 'FrCD',
            code: 'CDF',
            name: 'Congolese Franc'
        },
        CHF: {
            symbol_native: 'CHF',
            code: 'CHF',
            name: 'Swiss Franc'
        },
        CLP: {
            symbol_native: '$',
            code: 'CLP',
            name: 'Chilean Peso'
        },
        CNY: {
            symbol_native: 'CN¥',
            code: 'CNY',
            names: 'Chinese Yuan'
        },
        COP: {
            symbol_native: '$',
            code: 'COP',
            name: 'Colombian Peso'
        },
        CRC: {
            symbol_native: '₡',
            code: 'CRC',
            name: 'Costa Rican Colón'
        },
        CVE: {
            symbol_native: 'CV$',
            code: 'CVE',
            name: 'Cape Verdean Escudo'
        },
        CZK: {
            symbol_native: 'Kč',
            code: 'CZK',
            name: 'Czech Republic Koruna'
        },
        DJF: {
            symbol_native: 'Fdj',
            code: 'DJF',
            name: 'Djiboutian Franc'
        },
        DKK: {
            symbol_native: 'kr',
            code: 'DKK',
            name: 'Danish Krone'
        },
        DOP: {
            symbol_native: 'RD$',
            code: 'DOP',
            name: 'Dominican Peso'
        },
        DZD: {
            symbol_native: 'د.ج.‏',
            name: "Algerian Dinar",
            code: "DZD",
        },
        EEK: {
            symbol_native: "kr",
            name: "Estonian Kroon",
            code: "EEK"
        },
        EGP: {
            symbol_native: 'ج.م.‏',
            name: "Egyptian Pound",
            code: "EGP"
        },
        ERN: {
            symbol_native: "Nfk",
            name: "Eritrean Nakfa",
            code: "ERN"
        },
        ETB: {
            symbol_native: "Br",
            name: "Ethiopian Birr",
            code: "ETB"
        },
        GBP: {
            symbol_native: '£',
            name: "British Pound Sterling",
            code: "GBP"
        },
        GEL: {
            symbol_native: 'GEL',
            name: "Georgian Lari",
            code: "GEL"
        },
        GHS: {
            symbol_native: 'GH₵',
            name: "Ghanaian Cedi",
            code: "GHS"
        },
        GNF: {
            symbol_native: "FG",
            name: "Guinean Franc",
            code: "GNF"
        },
        GTQ: {
            symbol_native: 'Q',
            name: "Guatemalan Quetzal",
            code: "GTQ"
        },
        HKD: {
            symbol_native: '$',
            name: "Hong Kong Dollar",
            code: "HKD"
        },
        HNL: {
            symbol_native: 'L',
            name: "Honduran Lempira",
            code: "HNL"
        },
        HRK: {
            symbol_native: 'kn',
            name: "Croatian Kuna",
            code: "HRK"
        },
        HUF: {
            symbol_native: "Ft",
            name: "Hungarian Forint",
            code: "HUF"
        },
        IDR: {
            symbol_native: "Rp",
            name: "Indonesian Rupiah",
            code: "IDR"
        },
        ILS: {
            symbol_native: '₪',
            name: "Israeli New Sheqel",
            code: "ILS"
        },
        INR: {
            symbol_native: 'টকা',
            name: "Indian Rupee",
            code: "INR"
        },
        IQD: {
            symbol_native: 'د.ع.‏',
            name: "Iraqi Dinar",
            code: "IQD"
        },
        IRR: {
            symbol_native: '﷼',
            name: "Iranian Rial",
            code: "IRR"
        },
        ISK: {
            symbol_native: "kr",
            name: "Icelandic Króna",
            code: "ISK"
        },
        JMD: {
            symbol_native: '$',
            name: "Jamaican Dollar",
            code: "JMD"
        },
        JOD: {
            name: 'Jordanian Dinar',
            symbol_native: 'د.أ.‏',
            code: 'JOD',
        },
        JPY: {
            name: 'Japanese Yen',
            symbol_native: '￥',
            code: 'JPY',
        },
        KES: {
            name: 'Kenyan Shilling',
            symbol_native: 'Ksh',
            code: 'KES',
        },
        KHR: {
            name: 'Cambodian Riel',
            symbol_native: '៛',
            code: 'KHR',
        },
        KMF: {
            name: 'Comorian Franc',
            symbol_native: 'FC',
            code: 'KMF',
        },
        KRW: {
            name: 'South Korean Won',
            symbol_native: '₩',
            code: 'KRW',
        },
        KWD: {
            name: 'Kuwaiti Dinar',
            symbol_native: 'د.ك.‏',
            code: 'KWD',
        },
        KZT: {
            name: 'Kazakhstani Tenge',
            symbol_native: 'тңг.',
            code: 'KZT',
        },
        LBP: {
            name: 'Lebanese Pound',
            symbol_native: 'ل.ل.‏',
            code: 'LBP',
        },
        LKR: {
            name: 'Sri Lankan Rupee',
            symbol_native: 'SL Re',
            code: 'LKR',
        },
        LTL: {
            name: 'Lithuanian Litas',
            symbol_native: 'Lt',
            code: 'LTL',
        },
        LVL: {
            name: 'Latvian Lats',
            symbol_native: 'Ls',
            code: 'LVL',
        },
        LYD: {
            name: 'Libyan Dinar',
            symbol_native: 'د.ل.‏',
            code: 'LYD',
        },
        MAD: {
            name: 'Moroccan Dirham',
            symbol_native: 'د.م.‏',
            code: 'MAD',
        },
        MDL: {
            name: 'Moldovan Leu',
            symbol_native: 'MDL',
            code: 'MDL',
        },
        MGA: {
            name: 'Malagasy Ariary',
            symbol_native: 'MGA',
            code: 'MGA',
        },
        MKD: {
            name: 'Macedonian Denar',
            symbol_native: 'MKD',
            code: 'MKD',
        },
        MMK: {
            name: 'Myanma Kyat',
            symbol_native: 'K',
            code: 'MMK',
        },
        MOP: {
            name: 'Macanese Pataca',
            symbol_native: 'MOP$',
            code: 'MOP',
        },
        MUR: {
            name: 'Mauritian Rupee',
            symbol_native: 'MURs',
            code: 'MUR',
        },
        MXN: {
            name: 'Mexican Peso',
            symbol_native: '$',
            code: 'MXN',
        },
        MYR: {
            name: 'Malaysian Ringgit',
            symbol_native: 'RM',
            code: 'MYR',
        },
        MZN: {
            name: 'Mozambican Metical',
            symbol_native: 'MTn',
            code: 'MZN',
        },
        NAD: {
            name: 'Namibian Dollar',
            symbol_native: 'N$',
            code: 'NAD',
        },
        NGN: {
            name: 'Nigerian Naira',
            symbol_native: '₦',
            code: 'NGN',
        },
        NIO: {
            name: 'Nicaraguan Córdoba',
            symbol_native: 'C$',
            code: 'NIO',
        },
        NOK: {
            name: 'Norwegian Krone',
            symbol_native: 'kr',
            code: 'NOK',
        },
        NPR: {
            name: 'Nepalese Rupee',
            symbol_native: 'नेरू',
            code: 'NPR',
        },
        NZD: {
            name: 'New Zealand Dollar',
            symbol_native: '$',
            code: 'NZD',
        },
        OMR: {
            name: 'Omani Rial',
            symbol_native: 'ر.ع.‏',
            code: 'OMR',
        },
        PAB: {
            name: 'Panamanian Balboa',
            symbol_native: 'B/.',
            code: 'PAB',
        },
        PEN: {
            name: 'Peruvian Nuevo Sol',
            symbol_native: 'S/.',
            code: 'PEN',
        },
        PHP: {
            name: 'Philippine Peso',
            symbol_native: '₱',
            code: 'PHP',
        },
        PKR: {
            name: 'Pakistani Rupee',
            symbol_native: '₨',
            code: 'PKR',
        },
        PLN: {
            name: 'Polish Zloty',
            symbol_native: 'zł',
            code: 'PLN',
        },
        PYG: {
            name: 'Paraguayan Guarani',
            symbol_native: '₲',
            code: 'PYG',
        },
        QAR: {
            name: 'Qatari Rial',
            symbol_native: 'ر.ق.‏',
            code: 'QAR',
        },
        RON: {
            name: 'Romanian Leu',
            symbol_native: 'RON',
            code: 'RON',
        },
        RSD: {
            name: 'Serbian Dinar',
            symbol_native: 'дин.',
            code: 'RSD',
        },
        RUB: {
            name: 'Russian Ruble',
            symbol_native: 'руб.',
            code: 'RUB',
        },
        RWF: {
            name: 'Rwandan Franc',
            symbol_native: 'FR',
            code: 'RWF',
        },
        SAR: {
            name: 'Saudi Riyal',
            symbol_native: 'ر.س.‏',
            code: 'SAR',
        },
        SDG: {
            name: 'Sudanese Pound',
            symbol_native: 'SDG',
            code: 'SDG',
        },
        SEK: {
            name: 'Swedish Krona',
            symbol_native: 'kr',
            code: 'SEK',
        },
        SGD: {
            name: 'Singapore Dollar',
            symbol_native: '$',
            code: 'SGD',
        },
        SOS: {
            name: 'Somali Shilling',
            symbol_native: 'Ssh',
            code: 'SOS',
        },
        SYP: {
            name: 'Syrian Pound',
            symbol_native: 'ل.س.‏',
            code: 'SYP',
        },
        THB: {
            name: 'Thai Baht',
            symbol_native: '฿',
            code: 'THB',
        },
        TND: {
            name: 'Tunisian Dinar',
            symbol_native: 'د.ت.‏',
            code: 'TND',
        },
        TOP: {
            name: 'Tongan Paʻanga',
            symbol_native: 'T$',
            code: 'TOP',
        },
        TRY: {
            name: 'Turkish Lira',
            symbol_native: 'TL',
            code: 'TRY',
        },
        TTD: {
            name: 'Trinidad and Tobago Dollar',
            symbol_native: '$',
            code: 'TTD',
        },
        TWD: {
            name: 'New Taiwan Dollar',
            symbol_native: 'NT$',
            code: 'TWD',
        },
        TZS: {
            name: 'Tanzanian Shilling',
            symbol_native: 'TSh',
            code: 'TZS',
        },
        UAH: {
            name: 'Ukrainian Hryvnia',
            symbol_native: '₴',
            code: 'UAH',
        },
        UGX: {
            name: 'Ugandan Shilling',
            symbol_native: 'USh',
            code: 'UGX',
        },
        UYU: {
            name: 'Uruguayan Peso',
            symbol_native: '$',
            code: 'UYU',
        },
        UZS: {
            name: 'Uzbekistan Som',
            symbol_native: 'UZS',
            code: 'UZS',
        },
        VEF: {
            name: 'Venezuelan Bolívar',
            symbol_native: 'Bs.F.',
            code: 'VEF',
        },
        VND: {
            name: 'Vietnamese Dong',
            symbol_native: '₫',
            code: 'VND',
        },
        XAF: {
            name: 'CFA Franc BEAC',
            symbol_native: 'FCFA',
            code: 'XAF',
        },
        XOF: {
            name: 'CFA Franc BCEAO',
            symbol_native: 'CFA',
            code: 'XOF',
        },
        YER: {
            name: 'Yemeni Rial',
            symbol_native: 'ر.ي.‏',
            code: 'YER',
        },
        ZAR: {
            name: 'South African Rand',
            symbol_native: 'R',
            code: 'ZAR',
        },
        ZMK: {
            name: 'Zambian Kwacha',
            symbol_native: 'ZK',
            code: 'ZMK',
        }
    };

    static sendSms(mobile: string): void {
        this.openLink('sms', mobile);
    }

    static callPhone(mobile: string): void {
        this.openLink('tel', mobile);
    }

    static sendEmail(mobile: string): void {
        this.openLink('mailto', mobile);
    }

    static openLink(method: string, link: string): void {
        window.location.href = method + ':' + link;
    }

    static actionIcon(action: string): string {
        if (action === 'text') {
            return 'send';
        }
        if (action === 'call') {
            return 'call';
        }
        if (action === 'trade') {
            return 'cash';
        }
        if (action === 'pay') {
            return 'receipt';
        }
        if (action === 'note') {
            return 'document';
        }
        if (action === 'calendar') {
            return 'calendar';
        }
    }

    static currenciesList(): any[] {
        const keys = Object.keys(this.currencies);
        const ret = [];
        for (const key of keys) {
            ret.push(this.currencies[key]);
        }
        return ret;
    }

    static getCurrencyByCode(code: string): any {
        return this.currencies[code];
    }

    static productName(code: string, title: string): string {
        let ret = '';
        if (title && title.length > 0) {
            ret += title;
        }
        if (code && code.length > 0) {
            if (ret !== '') {
                ret += '-';
            }
            ret += code.toUpperCase();
        }
        return ret;
    }

    static getTypeAttributesString(product) {
        const arr = [];
        if (!product || !product.types || !product.types.length) {
            return arr;
        }
        for (const type of product.types) {
            const typeArr = [];
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price && val.selectOnly) {
                    typeArr.push(val.title);
                }
            }
            if (typeArr && typeArr.length) {
                const vals = typeArr.join(', ');
                arr.push(type.title + ': ' + vals);
            }
        }
        return arr.join('; ');
    }

    static getTypeOptions(types): any[] {
        const arr = [];
        for (const type of types) {
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price && val.selectOnly) {
                    continue;
                }
                let existType = arr.find(t => t.id === type.id);
                if (!existType) {
                    existType = JSON.parse(JSON.stringify(type));
                    existType.values = [];
                    arr.push(existType);
                }
                if (!existType.values) {
                    existType.values = [];
                }
                existType.values.push(val);
            }
        }
        return arr;
    }

    static limitText(text: string, maxLength: number = 200): string {
        if (text && text.length >= maxLength) {
            return text.substr(0, maxLength) + '...';
        }
        return text;
    }

    static getAttributesString(product) {
        const arr = [];
        for (const attribute of product.attributes) {
            arr.push(attribute.title);
        }
        return arr.join(', ');
    }

    static hasOptionsOrAttributes(product) {
        return product.options && product.options.length
            || product.attributes && product.attributes.length
            || product.typeAttributes && product.typeAttributes.length
            || product.typeOptions && product.typeOptions.length;
    }

    static selectAll(event: any): void {
        event.target.select();
    }

    static savebase64AsImageFile(folderpath: string, filename: string, content: string, contentType: string) {

        // Convert the base64 string in a Blob
        const data = this.b64toBlob(content, contentType, 512);
        Helper.saveblobToFile(folderpath, filename, data, contentType);
    }

    static saveblobToFile(folderpath: string, filename: string, data: Blob, contentType: string) {
        const blob = new Blob([data], { type: contentType });
        const file = new File();
        file.writeFile(
            folderpath,
            filename,
            blob,
            { replace: true }
        ).then(
            _ => { console.log('write complete:'); }
        ).catch(
            err => {
                console.error('file create failed:', err);
            }
        );
    }

    static b64toBlob(b64Data, contentType, sliceSize) {

        const byteCharacters = atob(b64Data);

        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);

        }

        const blob = new Blob(byteArrays, { type: contentType });

        // alternative way WITHOUT chunking the base64 data
        // let blob = new Blob([atob(b64Data)],  {type: contentType});

        return blob;
    }

    static getCurrentDate(): string {
        return moment().format('DD-MM-YYYY');
    }

    static contactImageOrPlaceholder(url): string {
        return url !== null && url !== ''
            ? url
            : 'assets/person-placeholder.jpg';
    }

    static toFixQuantity(count: any) {
        if (!count) {
            return count;
        }
        const countStr = count + '';
        if (countStr.indexOf('.') >= 0) {
            const decimal = countStr.split('.')[1];
            if (decimal && decimal.length > 2) {
                return count.toFixed(2);
            }
        }
        return count;
    }

    static getOptionPrices(orderItem: any) {
        let optionValue = 0;
        if (orderItem.options && orderItem.options.length) {
            for (const option of orderItem.options) {
                optionValue += option.count * option.price;
            }
        }
        return optionValue;
    }

    static simplifyString(inp: string): string {
        return removeVietnameseTones(inp).toLowerCase().split(' ').join('');
    }

    static stringSpecialContains(inp: string, toCheck: string) {
        const symInp = this.simplifyString(inp);
        const sym2Check = this.simplifyString(toCheck);
        return sym2Check.indexOf(symInp) >= 0;
    }

    static numberArrays(start, end) {
        const arr = [];
        for (let i = start; i < end; i++) {
            arr.push(i);
        }
        return arr;
    }

    static webPrint(body, timeout = 1000) {
        const mywindow = window.open('', 'PRINT', 'height=400,width=600');
        if (!mywindow || !mywindow.document) {
            return;
        }
        mywindow.document.write('<html><head><title>' + document.title + '</title>');
        mywindow.document.write('</head><body >');
        mywindow.document.write(body);
        mywindow.document.write('</body></html>');
        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10*/
        setTimeout(() => {
            mywindow.print();
            mywindow.close();
        }, timeout);
    }

    static toHtml(textInput, afterFix = ':') {
        let text = textInput;
        text = text ? text.split(' ').join('&nbsp;') : '';
        return text + afterFix;
    }

    static setValues(ob, arr) {
        if (arr) {
            const props = Object.keys(arr)
            for (const prop of props) {
                ob[prop] = arr[prop];
            }
        }
    }

    static setZero(ob, arr) {
        for (const prop of arr) {
            ob[prop] = 0;
        }
    }

    static setNull(ob, arr) {
        for (const prop of arr) {
            ob[prop] = null;
        }
    }

    static copyFields(ob1, ob2, arrCopy, arrMap, arrSet = null) {
        if (arrCopy && arrCopy.length) {
            for (const prop of arrCopy) {
                ob1[prop] = ob2[prop];
            }
        }
        if (arrMap) {
            const props = Object.keys(arrMap)
            for (const prop of props) {
                ob1[prop] = ob2[arrMap[prop]];
            }
        }
        this.setValues(ob1, arrSet);
    }

    static copyObject(ob1, ob2, arrMap, arrSet = null) {
        const propNames = Object.keys(ob1);
        for (const prop of propNames) {
            if (arrMap && (prop in arrMap)) {
                if (arrMap[prop] in ob2) {
                    ob1[prop] = ob2[arrMap[prop]];
                }
                continue;
            }

            const inOb2 = prop in ob2;
            if (inOb2) {
                ob1[prop] = ob2[prop];
            }
        }
        if (arrMap) {
            const propArrs = Object.keys(arrMap);
            for (const prop of propArrs) {
                const inOb1 = prop in ob1;
                if (inOb1) {
                    continue;
                }
                if (arrMap[prop] in ob2) {
                    ob1[prop] = ob2[arrMap[prop]];
                }
            }
        }
        this.setValues(ob1, arrSet);
    }
}

