export class Join{
    from: string = '';
    to: string = '';
    table: string = '';

    constructor(from: string, to: string, table: string) {
        this.from = from;
        this.to = to;
        this.table = table;
    }
}