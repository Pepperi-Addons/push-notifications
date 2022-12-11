import { Component, OnInit, ViewChild, TemplateRef,Inject, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { IPepGenericFormDataView } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { GenericFormComponent } from '@pepperi-addons/ngx-composite-lib/generic-form';
@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dataView
    formDataSource
    dialogData
    optValues: {Key: string, Value: string}[] = []
    constructor(    
        private injector: Injector,
        // @Inject(MAT_DIALOG_DATA) public incoming: any,
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
    @ViewChild(GenericFormComponent) genericForm  
 
      ngOnInit() {
        this.dataView = this.getDataView()
        this.formDataSource = this.getFormDataSource()
        this.optValues = this.getOptValues()
      }
    
      cancel(){
        this.dialogRef.close()
      }

      saveList(){
        console.log('Save clicked')
        this.dialogRef.close()
      }
      
      getOptValues(){
        return [{Key:"1",Value:"1"},{Key:"2",Value:"2"}]
      }
      dataSource: IPepGenericListDataSource = this.getListDataSource()

      // dataView: IPepGenericFormDataView = this.getDataView();

      getFormDataSource(){
        let fakeData: any =

        
          {AddGroupList:"",
          ResourceListKey:"",
          SelectionViewUUID:"",
          DisplayTitleField:"",
          MappingResourceUUID:"",
          UserReferenceField:'',
          }

        return fakeData
          
      }

      getListDataSource(){
        return null
      }

      valueChange($event){
        const selectionList = this.optValues?.find(selectionList => selectionList.Key == $event.Value)
      this.formDataSource.optValues = selectionList.Value
      this.formDataSource.optValues = selectionList.Key
      }

      fieldClick(){

      }

      getDataView(){
        return {
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
              OptionalValues: this.getOptValues(),
              Type: "ComboBox",
              Title: "Selection Resource List",
              Mandatory: true,
              ReadOnly:  false,
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
        this.dialogData = this.injector.get(MAT_DIALOG_DATA, null)
      }
      
}