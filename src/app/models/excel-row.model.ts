import { ExcelColumn } from './excel-column.model';

export class ExcelRow {
    id: number = 1;
    columns: ExcelColumn[] = [];

    constructor() {
    }

    setId(id: number) {
        this.id = id;
    }

    addColumn(column: ExcelColumn) {
        this.columns.push(column);
    }

    toStr(): string {
        //<row r="1"><c r="A1" t="str"><v>name</v></c></row>
        let ret = '<row r="' + this.id + '">';
        if (this.columns.length > 0) {
            let id = 1;
            for (let column of this.columns) {
                let letter = this.columnToLetter(id);
                column.setId(letter, this.id);
                id++;
                ret += column.toStr();
            }
        }
        ret += "</row>";
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