export interface ITableVariable {
    name: string,
    label: string
}

export interface ISkuData {
    brand: string,
    revenue: number,
    category: string,
    group: string,
    [propertyName: string]: string|number,
}

export interface ITableHeader {
    propertyName: string,
    propertyValue: string|number,
    columnName: string,
    label: string,
    isExpanded: boolean,
    canBeExpanded: boolean,
    indentLevel: number,
    isRowHeader: boolean,
    isColumnHeader: boolean
}

export interface IRowElement {
    [propertyName: string]: ITableCell
}

export interface ITableCell {
    isHeader: boolean,
    headerData?: ITableHeader,
    stringValue?: string
}

export interface ITableData {
    columnHeaders: ITableHeader[],
    rows: IRowElement[]
}

export default class TableController {
    public availableVariables: ITableVariable[];
    public chosenColumns: ITableVariable[] = [];
    public chosenRows: ITableVariable[] = [];

    private skuData: ISkuData[];

    constructor(skuData?: ISkuData[]) {
        this.skuData = skuData || DEFAULT_DATA;
        this.chosenColumns = [DEFAULT_VARIABLES[0]];
        this.availableVariables = DEFAULT_VARIABLES.splice(1);
    }

    public get tableData(): ITableData {
        var columnHeaders = this.computeColumnHeaders();
        let rowHeaders = this.computeRowHeaders();

        if (columnHeaders.length == 0 && rowHeaders.length == 0) {
            return {
                columnHeaders: columnHeaders,
                rows: []
            };
        }

        if (rowHeaders.length > 0) {
            columnHeaders.unshift(this.createRowHeadersElement(ColumnHeader));
            columnHeaders.push(this.createRowSumColumnHeader());

            //rowHeaders.unshift(this.createRowHeadersElement(RowHeader));
            rowHeaders.push(this.createColumnSumRowHeader());
        }

        let rows: IRowElement[] = [];
        if (rowHeaders.length == 0) {
            rows = this.createColumnSumRow(columnHeaders);
        }

        if (columnHeaders.length == 0) {
            rows = this.createRowSumRow(rowHeaders);
        }

        if (columnHeaders.length > 0 && rowHeaders.length > 0) {
            rows = this.createTableRows(rowHeaders, columnHeaders);
        }

        return {
          columnHeaders: columnHeaders,
          rows: rows  
        };
    }
    
    private createColumnSumRow(columnHeaders: ITableHeader[]): IRowElement[] {
        let rowData: IRowElement = {};
        let fakeHeader = this.createColumnSumRowHeader();
        let keysAndCells: [string, ITableCell][] = columnHeaders.map(cHeader => [cHeader.propertyName, this.generateCell(fakeHeader, cHeader)]);
        keysAndCells.forEach((keyAndCell) => {
            let key = keyAndCell[0];
            let cell = keyAndCell[1];

            rowData[key] = cell;
        });

        return [rowData];
    }

    private createRowSumRow(rowHeaders: ITableHeader[]): IRowElement[] {
        let rowData: IRowElement = {};
        let fakeHeader = this.createRowSumColumnHeader();
        let keysAndCells: [string, ITableCell][] = rowHeaders.map(rHeader => [rHeader.propertyName, this.generateCell(fakeHeader, rHeader)]);
        keysAndCells.forEach((keyAndCell) => {
            let key = keyAndCell[0];
            let cell = keyAndCell[1];

            rowData[key] = cell;
        });

        return [rowData];
    }

    private createTableRows(rowHeaders: ITableHeader[], columnHeaders: ITableHeader[]): IRowElement[] {
        let rows = rowHeaders.map<IRowElement>(rHeader => {
            let rowData: IRowElement = {};
            let keysAndCells: [string, ITableCell][] = columnHeaders.map(cHeader => [cHeader.propertyName, this.generateCell(rHeader, cHeader)]);
            keysAndCells.forEach((keyAndCell) => {
                let key = keyAndCell[0];
                let cell = keyAndCell[1];

                rowData[key] = cell;
            });

            return rowData;
        });

        return rows;
    }
    
    private generateCell(rowHeader: ITableHeader, columnHeader: ITableHeader): ITableCell {
        if (columnHeader.propertyName == "rowHeaders" && rowHeader.propertyName == "rowHeaders") {
            return {
                isHeader: true,
                headerData: columnHeader
            };
        }

        if (columnHeader.propertyName == "rowHeaders") {
            return {
                isHeader: true,
                headerData: rowHeader
            };
        }

        if (rowHeader.propertyName == "rowHeaders") {
            return {
                isHeader: true,
                headerData: columnHeader
            };
        }

        let elegibilityFilters: ((_: ISkuData) => boolean)[] = [];
        if (columnHeader.propertyName != "rowSum") {
            elegibilityFilters.push(
                (dataItem) => dataItem[columnHeader.propertyName] === columnHeader.propertyValue);
        }

        if (rowHeader.propertyName != "columnSum") {
            elegibilityFilters.push(
                (dataItem) => dataItem[rowHeader.propertyName] === rowHeader.propertyValue);
        }

        let cellValue = this.skuData
            .filter(dataItem => elegibilityFilters.every(filter => filter(dataItem)))
            .map(dataItem => dataItem.revenue)
            .reduce((accumulator, revenue) => accumulator + revenue, 0);
        let cellLabel = this.formatValue(cellValue);

        return {
            isHeader: false,
            stringValue: cellLabel
        };
    }

    private createColumnSumRowHeader(): ITableHeader {
        let rowColumnHeader = new RowHeader({
            propertyValue: "",
            propertyName: "columnSum",
            columnName: "columnSum",
            canBeExpanded: false,
            label: "Totales"
        });
        return rowColumnHeader;
    }

    private createRowSumColumnHeader(): ITableHeader {
        let rowSumHeader = new ColumnHeader({
            propertyValue: "",
            propertyName: "rowSum",
            columnName: "rowSum",
            canBeExpanded: false,
            label: "Totales"
        });
        return rowSumHeader;
    }

    private createRowHeadersElement<THeaderType extends BaseHeader>(HeaderConstructor: new (data: IHeaderData) => THeaderType): ITableHeader {
        let rowsColumnHeader = new HeaderConstructor({
            propertyValue: "",
            propertyName: "rowHeaders",
            columnName: "rowHeaders",
            canBeExpanded: false,
            label: ""
        });
        return rowsColumnHeader;
    }

    private computeRowHeaders(rows?: ITableVariable[]): ITableHeader[] {
        if (!rows) {
            rows = this.chosenRows;
        }

        if (rows.length == 0) {
            return [];
        }

        let [currentRow, ...remainingRows] = rows;
        return this.computeVariableHeaders(RowHeader, currentRow, remainingRows);
    }
    
    private computeColumnHeaders(columns?: ITableVariable[]): ITableHeader[] {
        if (!columns) {
            columns = this.chosenColumns;
        }

        if (columns.length == 0) {
            return [];
        }

        let [currentColumn, ...remainingColumns] = columns;
        return this.computeVariableHeaders(ColumnHeader, currentColumn, remainingColumns);
    }

    private computeVariableHeaders<THeaderType extends BaseHeader>(HeaderConstructor: new (data: IHeaderData) => THeaderType, currentVariable: ITableVariable, remainingVariables: ITableVariable[]): ITableHeader[] {
        let accessor = this.makeValueAccessor(currentVariable);
        let knownValues = this.skuData.map(accessor);
        let uniqueValues = [...new Set(knownValues)];
        let columnHeaders = uniqueValues.map(value => new HeaderConstructor({
            propertyName: currentVariable.name,
            propertyValue: value,
            columnName: `${currentVariable.name}.${value}`,
            label: this.formatValue(value),
            canBeExpanded: remainingVariables.length > 0
        }));

        return columnHeaders;
    }

    private makeValueAccessor(variable: ITableVariable): (row: ISkuData) => string|number {
        return (row) => row[variable.name];
    }

    // TODO: Currency formatting?
    private formatValue(value: string|number): string {
        if (typeof value === "string") {
            return value;
        }
        
        return value.toString();
    }
}

interface IHeaderData {
    propertyName: string,    
    propertyValue: string | number,
    columnName: string,
    label: string,
    canBeExpanded: boolean
}

abstract class BaseHeader implements ITableHeader {
    public propertyName: string;    
    public propertyValue: string | number;
    public columnName: string;
    public label: string;
    public isExpanded: boolean;
    public canBeExpanded: boolean;
    public indentLevel: number;

    constructor(data: IHeaderData) {
        this.propertyName = data.propertyName;
        this.propertyValue = data.propertyValue;
        this.columnName = data.columnName;
        this.label = data.label;
        this.canBeExpanded = data.canBeExpanded;
    }

    public get isRowHeader(): boolean {
        return false;
    }

    public get isColumnHeader(): boolean {
        return false;
    }
}

class RowHeader extends BaseHeader {
    public get isRowHeader(): boolean {
        return true;
    }
}

class ColumnHeader extends BaseHeader {
    public get isColumnHeader(): boolean {
        return true;
    }
}

let DEFAULT_VARIABLES: ITableVariable[] = [{
    name: "brand",
    label: "Marca"
  }, {
    name: "category",
    label: "Categoría"
  }, {
    name: "group",
    label: "Grupo"
  }];

let DEFAULT_DATA: ISkuData[] = [{
    brand: 'Leonisa',
    revenue: 1,
    category: 'Lista1',
    group: 'bra'
  }, {
    brand: 'Lumar',
    revenue: 2,
    category: 'Lista1',
    group: 'panty'
  }, {
    brand: 'Mundo Joven',
    revenue: 3,
    category: 'Lista1',
    group: 'bralete'
  }, {
    brand: 'Leo',
    revenue: 4,
    category: 'Lista1',
    group: 'panty'
  }, {
    brand: 'Leo',
    revenue: 5,
    category: 'Lista2',
    group: 'bra'
  }];