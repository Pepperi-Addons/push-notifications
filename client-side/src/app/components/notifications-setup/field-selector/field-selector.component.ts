import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { IPepDraggableItem, } from '@pepperi-addons/ngx-lib/draggable-items';
import { AddonService } from 'src/app/services/addon.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';

@Component({
  selector: 'field-selector',
  templateUrl: './field-selector.component.html',
  styleUrls: ['./field-selector.component.scss']
})
export class FieldSelectorComponent implements OnInit {
  cancelDropArea = []
  selectDropArea = []
  fieldsToSelect: IPepDraggableItem[] = []
  selectedFields: IPepDraggableItem[] = []

  constructor(
    private dialogRef: MatDialogRef<any>,
    private translate: TranslateService,
    private dialogService: PepDialogService,
    protected addonService: AddonService
    ) { }

  ngOnInit(): void {
   
  }


  cancel(){
     this.dialogRef.close();
    // this.formDataSource = this.getFormDataSource()
    // this.dialogRef.close()
  }

  done() {

  }
  addSelected(event: CdkDragDrop<IPepDraggableItem[]>) {
    console.log(event)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = this.fieldsToSelect.find(item => item.title === event.item.data);
      console.log(item)
      this.selectedFields.push(item)
      this.fieldsToSelect = this.fieldsToSelect.filter(removedItem => removedItem.title != item.title)
      console.log(this.selectedFields)
    }
  }
    
  removeSelected(event: CdkDragDrop<IPepDraggableItem[]>){
    console.log(event)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = this.selectedFields.find(item => item.title === event.item.data);
      console.log(item)
      this.fieldsToSelect.push(item)
      console.log(this.fieldsToSelect)
      this.selectedFields = this.selectedFields.filter(removedItem => removedItem.title != item.title)
    }
  }
}