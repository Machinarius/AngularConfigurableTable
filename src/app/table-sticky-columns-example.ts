import {Component} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import TableController, { ITableHeader, ITableVariable, ITableData, IRowElement } from './table-controller';

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
  }

  public expandColumn(header: ITableHeader) {
    this.tableController.expandColumn(header);
    this.fetchStateFromTableController();
  }

  public contractColumn(header: ITableHeader) {
    throw new Error("Not Implemented");
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

  public onCellClicked(cellData: IRowElement) {
    console.log(cellData);
  }
}
