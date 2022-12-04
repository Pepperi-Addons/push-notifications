import { Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { IPepGenericFormDataView } from '@pepperi-addons/ngx-composite-lib/generic-form';
@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    constructor(    
        private translate: TranslateService,
        private notificationsSetupService: NotificationsSetupService,
        private addonService: AddonService,
        private route: ActivatedRoute,
        private router: Router,
        private dialogService: PepDialogService,
        // private dialogActions: PepDialogActionsType='cancel-ok',
        // private templateRef: TemplateRef<'list-form.component.html'>,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
         }
    dialogRef: MatDialogRef<any>
    @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
 
      ngOnInit() {
        
      }
    
      cancel(){
        this.dialogRef.close()
      }

      saveList(){
        console.log('Save clicked')
        this.dialogRef.close()
      }

      formDataSource = this.getFormDataSource();
      dataSource: IPepGenericListDataSource = this.getListDataSource()

      // dataView: IPepGenericFormDataView = this.getDataView();

      get dataView() : IPepGenericFormDataView {
        return this.getDataView();
      }

      getFormDataSource(){
        return {AddGroupList:'',ResourceListKey:'',SelectionViewUUID:'',DisplayTitleField:'',MappingResourceUUID:'',UserReferenceField:''}
      }

      getListDataSource(){
        return null
      }

      valueChange(){

      }

      fieldClick(){

      }

      getDataView(){
        const dataViewFields:IPepGenericFormDataView = {
          Type: 'Form',
          Hidden: false,
          Columns: [],
          Context: {
            Object: {
              Resource: "transactions",
              InternalID: 0,
              Name: "Object Name"
            },
            Name: '',
            Profile: { },
            ScreenSize: 'Tablet'
          },
          Fields: [
            {
              FieldID: "AddGroupList",
              Type: "Separator",
              Title: "Add Group List",
              Mandatory: true,
              ReadOnly: true,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "ResourceListKey",
              Type: "TextBox",
              Title: "Selection Resource List",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "SelectionViewUUID",
              Type: "MapDataDropDown",
              Title: "Selection View",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "DisplayTitleField",
              Type: "MapDataDropDown",
              Title: "Selection Display Title Field",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "MappingResourceUUID",
              Type: "MapDataDropDown",
              Title: "Choose Mapping Resource",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            },
            {
              FieldID: "UserReferenceField",
              Type: "MapDataDropDown",
              Title: "User Reference Field",
              Mandatory: true,
              ReadOnly: false,
              Layout: {
                Origin: {
                  X: 1,
                  Y: 2
                },
                Size: {
                  Width: 1,
                  Height: 0
                }
              },
              Style: {
                Alignment: {
                  Horizontal: "Stretch",
                  Vertical: "Stretch"
                }
              }
            }
          ],
          Rows: []
        }

        return dataViewFields
      }

      actions: IPepGenericListActions = {
        get: async (data) => {
          const actions = [];
          if(data.rows.length >= 1) {
            actions.push({
              title: this.translate.instant("Delete"),
              handler: async (objs) => {
                await this.notificationsSetupService.deleteSendToList(objs.rows);
                this.dataSource = this.getListDataSource();
              }
          });
          }
    
          return actions;
        }
      }

      addList(){
        this.dialogRef = this.dialogService.openDialog(this.listForm,'',{disableClose:false, height: '50%',
        width: '80%'})
      }
}