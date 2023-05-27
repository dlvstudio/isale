export class ExcelColumn {
    id: string = 'A';
    type = 'string';
    rowId: number = 1;
    value: string = '';
    constructor(value: string, type = 'string') {
        this.value = value;
        this.type = type;
    }
    setId(id: string, rowId: number) {
        this.id = id;
        this.rowId = rowId;
    }
    toStr(): string {
        //<c r="A7" t="str"><v>Josh Smith</v></c>
        if (this.type == 'string') {
            return '<c r="' + this.id + this.rowId + '" t="str"><v>' + this.value + '</v></c>';
        }
        if (this.type == 'number') {
            return '<c r="' + this.id + this.rowId + '"><v>' + this.value + '</v></c>';
        }
        return '<c r="' + this.id + this.rowId + '" t="str"><v>' + this.value + '</v></c>';
    }
}