import {Component, ViewChild} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import TableController, { ITableHeader, ITableVariable, ITableData, IRowElement } from './table-controller';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

/**
 * @title Table with sticky columns
 */
@Component({
  selector: 'table-sticky-columns-example',
  styleUrls: ['table-sticky-columns-example.css'],
  templateUrl: 'table-sticky-columns-example.html',
})
export class TableStickyColumnsExample {
  private tableController: TableController;

  public availableVariables: ITableVariable[];
  public chosenRows: ITableVariable[];
  public chosenColumns: ITableVariable[];
  public tableColumns: ITableHeader[];
  public columnNames: string[];

  public tableData: ITableData;
  public generatedRows: IRowElement[];

  public tableCanSortColumns: boolean;

  public uiDataSource: MatTableDataSource<IRowElement>;
  @ViewChild(MatSort) 
  public set tableSort(sort: MatSort) {
    if (this.uiDataSource) {
      this.uiDataSource.sort = sort;
    }
  }

  constructor() {
    this.tableController = new TableController();
    this.fetchStateFromTableController();
  }

  private sendStateToTableController() {
    this.tableController.availableVariables = this.availableVariables;
    this.tableController.chosenRows = this.chosenRows;
    this.tableController.chosenColumns = this.chosenColumns;
  }

  private fetchStateFromTableController() {
    this.availableVariables = this.tableController.availableVariables;
    this.chosenRows = this.tableController.chosenRows;
    this.chosenColumns = this.tableController.chosenColumns;
    this.tableData = this.tableController.tableData;

    this.tableColumns = this.tableData.columnHeaders;
    this.columnNames = this.tableColumns.map(element => element.columnName);
    this.generatedRows = this.tableData.rows;
    this.tableCanSortColumns = this.tableData.canSortColumns;
    this.uiDataSource = new MatTableDataSource(this.generatedRows);
    this.uiDataSource.sortingDataAccessor = this.getSortingData;

    console.info("Column names: " + this.columnNames);
  }

  private getSortingData(data: IRowElement, sortHeaderId: string): string | number {
    let cell = data[sortHeaderId];
    if (cell.isHeader) {
      throw new Error("Header rows can not be sorted - This may be caused by an bug deeper in the table controller or view code");
    }

    return cell.numberValue!;
  }

  public expandColumn(header: ITableHeader) {
    console.log("trying to expand " + header.columnName);

    this.tableController.expandColumn(header);
    this.fetchStateFromTableController();
  }

  public contractColumn(header: ITableHeader) {
    console.log("trying to contract " + header.columnName);

    this.tableController.contractColumn(header);
    this.fetchStateFromTableController();
  }

  public onVariableDropped(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }

    this.sendStateToTableController();
    this.fetchStateFromTableController();
  }

  public generateColumnTrackingId(column: ITableHeader) {
    return column.columnName;
  }

  public onCellClicked(cellData: IRowElement) {
    console.log(cellData);
  }
}
