import { Component, OnInit, ViewChild, TemplateRef,Inject, Injector} from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from '../../services/addon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AddonData,FormDataView } from '@pepperi-addons/papi-sdk';
import { NotificationsSetupService } from '../../services/notifications-setup.services';
import { config } from '../../addon.config';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog'; 
import { GenericFormComponent } from '@pepperi-addons/ngx-composite-lib/generic-form';
@Component({
  selector: 'app-notifications-setup',
  templateUrl: './notifications-setup.component.html',
  styleUrls: ['./notifications-setup.component.scss']
})

export class NotificationsSetupComponent implements OnInit {
    dataView:FormDataView
    formDataSource:AddonData ={}
    dialogData: any
    constructor(    
        private injector: Injector,
        private translate: TranslateService,
        private notificationsSetupService: NotificationsSetupService,
        private addonService: AddonService,
        private route: ActivatedRoute,
        private router: Router,
        private dialogService: PepDialogService,
        ) {
          this.addonService.addonUUID = config.AddonUUID;
         }
    dialogRef: MatDialogRef<any>
    @ViewChild('listForm', { read: TemplateRef }) listForm:TemplateRef<any>;
    @ViewChild(GenericFormComponent) genericForm  
 
      async ngOnInit() {
        this.dataView = await this.getDataView()
        this.formDataSource = this.getFormDataSource()
      }
    
      cancel(){
        this.dialogRef.close()
      }

      saveList(){
        console.log('Save clicked')
        this.dialogRef.close()
      }
      
      async getOptValues(){
        let resources = []
        let res = await this.notificationsSetupService.getResourceList()
        res.forEach(resource => {
          resources.push({Key:resource,Value:resource})
        });
        return resources
      }
      dataSource: IPepGenericListDataSource = this.getListDataSource()


      getFormDataSource(){
        let fakeData: any =
          {AddGroupList:"",
          ResourceListKey:"",
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
      const selectionList = this.dataView.Fields[1]["OptionalValues"].find(selectionList => selectionList.Key == $event.Value)
      this.formDataSource.resource = selectionList.Key
      }

      fieldClick(){

      }

      async getDataView():Promise<FormDataView>{
        let dataView:FormDataView = {
          Type: "Form",
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
        dataView.Fields[1]["OptionalValues"] = await this.getOptValues()
        return dataView
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