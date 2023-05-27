import { ExcelRow } from './excel-row.model';

export class ExcelSheet {
    rows: ExcelRow[] = [];
    constructor() {
    }

    addRow(row: ExcelRow) {
        this.rows.push(row);
    }

    toStr(): string {
        var minRow = 1;
        var maxRow = this.rows.length > 0 ? this.rows.length + 1 : 1;
        var minCol = 'A';
        var maxCol = this.columnToLetter(this.rows.length > 0 && this.rows[0].columns.length > 0 ? this.rows[0].columns.length + 1 : 1);
        let ret = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
        ret += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="' + minCol + minRow + ':' + maxCol + maxRow + '"/>';
        ret += '<sheetData>';
        if (this.rows.length > 0) {
            let id = 1;
            for (let row of this.rows) {
                row.setId(id);
                id++;
                ret += row.toStr();
            }
        }
        ret += '</sheetData></worksheet>';
        return ret;
    }

    private columnToLetter(column: number): string {
        var temp, letter = '';
        while (column > 0) {
            temp = (column - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            column = (column - temp - 1) / 26;
        }
        return letter;
    }
}