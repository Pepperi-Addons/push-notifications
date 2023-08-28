import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { IPepDraggableItem, } from '@pepperi-addons/ngx-lib/draggable-items';
import { AddonService } from 'src/app/services/addon.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
    protected addonService: AddonService,
    @Inject(MAT_DIALOG_DATA) private data: string[]
    ) {
      this.parseDataToSelect()
     }

  ngOnInit(): void {
   
  }

  parseDataToSelect(){
    this.data.forEach(entity =>{
      this.fieldsToSelect.push({title: entity, data: {key: entity, title: entity}})
    })
  }

  cancel(){
     this.dialogRef.close();
    // this.formDataSource = this.getFormDataSource()
    // this.dialogRef.close()
  }

  done() {
    this.dialogRef.close(this.selectedFields.map(field => {return field.title}))
  }
  addSelected(event: CdkDragDrop<IPepDraggableItem[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = this.fieldsToSelect.find(item => item.title === event.item.data.key);
      this.selectedFields.push(item)
      this.fieldsToSelect = this.fieldsToSelect.filter(removedItem => removedItem.data.key != item.data.key)
    }
  }
    
  removeSelected(event: CdkDragDrop<IPepDraggableItem[]>){
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const item = this.selectedFields.find(item => item.title === event.item.data.key);
      this.fieldsToSelect.push(item)
      this.selectedFields = this.selectedFields.filter(removedItem => removedItem.title != item.data.key)
    }
  }
}