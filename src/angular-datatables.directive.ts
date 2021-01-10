/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://raw.githubusercontent.com/l-lin/angular-datatables/master/LICENSE
 */

import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ADTSettings } from './models/settings';

@Directive({
  selector: '[datatable]'
})
export class DataTableDirective implements OnDestroy, OnInit {
  /**
   * The DataTable option you pass to configure your table.
   */
  @Input()
  dtOptions: ADTSettings = {};

  /**
   * This trigger is used if one wants to trigger manually the DT rendering
   * Useful when rendering angular rendered DOM
   */
  @Input()
  dtTrigger: Subject<any>;

  /**
   * The DataTable instance built by the jQuery library [DataTables](datatables.net).
   *
   * It's possible to execute the [DataTables APIs](https://datatables.net/reference/api/) with
   * this variable.
   */
  dtInstance: Promise<DataTables.Api>;

  // Only used for destroying the table when destroying this directive
  private dt: DataTables.Api;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    if (this.dtTrigger) {
      this.dtTrigger.subscribe(() => {
        this.displayTable();
      });
    } else {
      this.displayTable();
    }
  }

  ngOnDestroy(): void {
    if (this.dtTrigger) {
      this.dtTrigger.unsubscribe();
    }
    if (this.dt) {
      this.dt.destroy(true);
    }
  }

  private displayTable(): void {
    this.dtInstance = new Promise((resolve, reject) => {
      Promise.resolve(this.dtOptions).then(dtOptions => {
        // Using setTimeout as a "hack" to be "part" of NgZone
        setTimeout(() => {
          this.dt = $(this.el.nativeElement).DataTable({
            ...dtOptions,
            rowCallback: (row, data, index) => {
              if (dtOptions.columns) {
                const columns = dtOptions.columns;
                // Filter columns with pipe declared
                const colsWithPipe = columns.filter(x => x.ngPipeInstance);
                // Iterate
                colsWithPipe.forEach(el => {
                  const pipe = el.ngPipeInstance;
                  // find index of column using `data` attr
                  const i = columns.findIndex(e => e.data == el.data);
                  // get <td> element which holds data using index
                  const rowFromCol = row.childNodes.item(i);
                  // Transform data with Pipe
                  const rowVal = $(rowFromCol).text();
                  const rowValAfter = pipe.transform(rowVal);
                  // Apply transformed string to <td>
                  $(rowFromCol).text(rowValAfter);
                });
              }

              // run user specified row callback if provided.
              if (this.dtOptions.rowCallback) {
                this.dtOptions.rowCallback(row, data, index);
              }
            }
          });
          resolve(this.dt);
        });
      });
    });
  }
}
