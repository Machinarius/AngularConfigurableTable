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
    isColumnHeader: boolean,
    parent?: ITableHeader
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
    public expandedColumns: Set<string>;

    private skuData: ISkuData[];

    constructor(skuData?: ISkuData[]) {
        this.skuData = skuData || DEFAULT_DATA;
        this.chosenColumns = [DEFAULT_VARIABLES[0]];
        this.availableVariables = DEFAULT_VARIABLES.splice(1);
        this.expandedColumns = new Set<string>();
    }

    public expandColumn(header: ITableHeader) {
        this.expandedColumns.add(header.columnName);
        console.log("Expanded columns: " + [...this.expandedColumns]);
    }

    public contractColumn(header: ITableHeader) {
        this.expandedColumns.delete(header.columnName);
        console.log("Expanded columns: " + [...this.expandedColumns]);
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
            columnHeaders.unshift(this.createRowHeadersElement());
            columnHeaders.push(this.createRowSumColumnHeader());

            rowHeaders.push(this.createColumnSumRowHeader());
        }

        let rows: IRowElement[] = [];
        if (columnHeaders.length > 0 && rowHeaders.length > 0) {
            rows = this.createTableRows(rowHeaders, columnHeaders);
        } else if (rowHeaders.length == 0) {
            rows = this.createColumnSumRow(columnHeaders);
        } if (columnHeaders.length == 0) {
            rows = this.createRowSumRow(rowHeaders);
        }

        return {
          columnHeaders: columnHeaders,
          rows: rows  
        };
    }
    
    private createColumnSumRow(columnHeaders: ITableHeader[]): IRowElement[] {
        let rowData: IRowElement = {};
        let fakeHeader = this.createColumnSumRowHeader();
        let keysAndCells: [string, ITableCell][] = columnHeaders.map(cHeader => [cHeader.columnName, this.generateCell(fakeHeader, cHeader)]);
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
        let keysAndCells: [string, ITableCell][] = rowHeaders.map(rHeader => [rHeader.columnName, this.generateCell(fakeHeader, rHeader)]);
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
            let keysAndCells: [string, ITableCell][] = columnHeaders.map(cHeader => [cHeader.columnName, this.generateCell(rHeader, cHeader)]);
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
        let colHeaderIterator: ITableHeader | undefined = columnHeader;
        while (colHeaderIterator != undefined) {
            let currentColHeader: ITableHeader = colHeaderIterator;
            if (colHeaderIterator.propertyName != "rowSum") {
                elegibilityFilters.push(
                    (dataItem) => dataItem[currentColHeader.propertyName] === currentColHeader.propertyValue);
            }

            colHeaderIterator = currentColHeader.parent;
        } 

        let rowHeaderIterator: ITableHeader | undefined = rowHeader;
        while (rowHeaderIterator != undefined) {
            let currentRowHeader: ITableHeader = rowHeaderIterator;
            if (currentRowHeader.propertyName != "columnSum") {
                elegibilityFilters.push(
                    (dataItem) => dataItem[currentRowHeader.propertyName] === currentRowHeader.propertyValue);
            }

            rowHeaderIterator = currentRowHeader.parent;
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
        let rowColumnHeader: ITableHeader = {
            propertyValue: "",
            propertyName: "columnSum",
            columnName: "columnSum",
            canBeExpanded: false,
            label: "Totales",
            indentLevel: 0,
            isColumnHeader: false,
            isExpanded: false,
            isRowHeader: false
        };
        return rowColumnHeader;
    }

    private createRowSumColumnHeader(): ITableHeader {
        let rowSumHeader: ITableHeader = {
            propertyValue: "",
            propertyName: "rowSum",
            columnName: "rowSum",
            canBeExpanded: false,
            label: "Totales",
            indentLevel: 0,
            isColumnHeader: false,
            isExpanded: false,
            isRowHeader: false
        };
        return rowSumHeader;
    }

    private createRowHeadersElement(): ITableHeader {
        let rowsColumnHeader: ITableHeader = {
            propertyValue: "",
            propertyName: "rowHeaders",
            columnName: "rowHeaders",
            canBeExpanded: false,
            label: "",
            indentLevel: 0,
            isColumnHeader: false,
            isExpanded: false,
            isRowHeader: false
        };
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
        return this.computeVariableHeaders(currentRow, remainingRows);
    }
    
    private computeColumnHeaders(columnVariables?: ITableVariable[], parent?: ITableHeader): ITableHeader[] {
        if (!columnVariables) {
            columnVariables = this.chosenColumns;
        }

        if (columnVariables.length == 0) {
            return [];
        }

        let [currentColumnVar, ...remainingVariables] = columnVariables;
        let primaryVariableHeaders = this.computeVariableHeaders(currentColumnVar, remainingVariables);
        if (parent) {
            primaryVariableHeaders.forEach(pHeader => {
                pHeader.parent = parent;
                pHeader.columnName = this.computeFullNameOfHeaderChain(pHeader);
                pHeader.indentLevel = this.computeHeaderChainDepth(pHeader);
            });
        }
        
        if (this.expandedColumns.size == 0) {
            return primaryVariableHeaders;
        }

        let expandedColumns = primaryVariableHeaders.map(pHeader => {
            let isExpanded = this.expandedColumns.has(pHeader.columnName);
            if (!isExpanded) {
                return new Array<ITableHeader>(pHeader);
            }

            let secondaryHeaders = this.computeColumnHeaders(remainingVariables, pHeader);
            if (secondaryHeaders.length > 0) {
                pHeader.isExpanded = true;
            }
            secondaryHeaders.unshift(pHeader);

            return secondaryHeaders;
        }).reduce((acc, item) => acc.concat(item), []);

        return expandedColumns;
    }

    private computeVariableHeaders(currentVariable: ITableVariable, remainingVariables: ITableVariable[]): ITableHeader[] {
        let accessor = this.makeValueAccessor(currentVariable);
        let knownValues = this.skuData.map(accessor);
        let uniqueValues = [...new Set(knownValues)];
        let canBeExpanded = remainingVariables.length > 0;
        let columnHeaders = uniqueValues.map<ITableHeader>(value => {
            let headerObject = {
                propertyName: currentVariable.name,
                propertyValue: value,
                columnName: "",
                label: this.formatValue(value),
                canBeExpanded: canBeExpanded,
                indentLevel: 42,
                isColumnHeader: false,
                isExpanded: false,
                isRowHeader: false
            };

            headerObject.columnName = this.computeFullNameOfHeaderChain(headerObject);
            return headerObject;
        });

        return columnHeaders;
    }

    private computeFullNameOfHeaderChain(header?: ITableHeader): string {
        if (!header) {
            return "";
        }

        return this.computeFullNameOfHeaderChain(header.parent) + 
            (header.parent ? "<" : "") +
            `${header.propertyName}.${header.propertyValue}` +
            (header.canBeExpanded ? ">" : "");
    }

    private computeHeaderChainDepth(header?: ITableHeader): number {
        if (!header) {
            return 0;
        }

        return this.computeHeaderChainDepth(header.parent) + 1;
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