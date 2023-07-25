import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonData, FormDataView } from '@pepperi-addons/papi-sdk';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsDialogService } from 'src/app/services/dialog-service.services';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';

@Component({
  selector: 'addon-users-list-setup',
  templateUrl: './users-list-setup.component.html',
  styleUrls: ['./users-list-setup.component.scss']
})
export class UsersListSetupComponent implements OnInit {
  dataView:FormDataView
  formDataSource:AddonData = {}
  userListData:AddonData = {}
  isSaveListDisabled: boolean = true
  selectedResource: AddonData
  selectedMappingResource: AddonData
  availableResources: AddonData[]
  notificationsDialogService: NotificationsDialogService
  resourceFields: string[]
  selectedDisplayFields: string[]


  constructor(
    private dialogRef: MatDialogRef<any>,
    private translate: TranslateService,
    private dialogService: PepDialogService,
    protected addonService: AddonService
    ) { 
      this.notificationsDialogService = new NotificationsDialogService(this.dialogService)
    }

  ngOnInit(): void {
    this.dataView = this.getDataView()
    this.formDataSource = this.getFormDataSource()
  }


  cancel(){
     this.dialogRef.close();
  }

done() {
  this.userListData.ListName = this.formDataSource.ListName
  this.userListData.ResourceListKey = this.formDataSource.ResourceListKey
  this.userListData.DisplayTitleField = this.formDataSource.DisplayTitleField
  this.userListData.MappingResourceUUID = this.formDataSource.MappingResourceUUID
  this.userListData.UserReferenceField = this.formDataSource.UserReferenceField
  this.dialogRef.close(this.userListData)
}

  async valueChange($event){
    let selectionList:any = {}
    if($event.ApiName == "ListName"){
      selectionList.ListName =  $event.Value
      this.formDataSource.ListName = selectionList.ListName
      this.dataView.Fields[4]["OptionalValues"] = await this.getSelectionResources()
      this.dataView.Fields[4].ReadOnly = false
    }
    if($event.ApiName == "ResourceListKey"){
      selectionList.ResourceListKey =  $event.Value
      this.formDataSource.ResourceListKey = selectionList.ResourceListKey
      this.selectedResource = selectionList.ResourceListKey
      this.dataView.Fields[6]["OptionalValues"] = this.getResourceFields()
      this.dataView.Fields[6].ReadOnly = false
    }
    if($event.ApiName == "DisplayTitleField"){
      selectionList.DisplayTitleField = $event.Value
      this.formDataSource.DisplayTitleField = selectionList.DisplayTitleField
      this.dataView.Fields[8]["OptionalValues"] = this.getMappingCollections()
      this.dataView.Fields[8].ReadOnly = false
    }
    if($event.ApiName == "MappingResourceUUID"){
      selectionList.MappingResourceUUID = $event.Value
      this.formDataSource.MappingResourceUUID = selectionList.MappingResourceUUID
      this.dataView.Fields[10]["OptionalValues"] = this.getUserReferenceFields(this.getSelectedMappingResource(this.formDataSource.MappingResourceUUID))
      console.log(JSON.stringify(this.dataView.Fields[10]["OptionalValues"]))
      this.dataView.Fields[10].ReadOnly = false
    }
    if($event.ApiName == "UserReferenceField"){
      selectionList.UserReferenceField = $event.Value
      this.formDataSource.UserReferenceField = selectionList.UserReferenceField
      this.dataView.Fields[12].ReadOnly = false
    }
    if($event.ApiName == 'ChipFieldsSelector'){
      this.isSaveListDisabled = false
    }

  // update the data view with the desired data
  this.dataView = JSON.parse(JSON.stringify(this.dataView))
  }

  fieldClick($event){
    console.log($event)
    console.log(JSON.stringify($event))
    if($event.ApiName == 'ChipFieldsSelector'){
      this.notificationsDialogService.openDialog(FieldSelectorComponent,(res) => {
        if(res){
            this.userListData.SelectionDisplayField = res
            this.isSaveListDisabled = false
        }
      },
      this.resourceFields)
    }
  }

  getFormDataSource(){
    let defaultData: any = {
        ListNameDesc:"<p>Please insert list name</p>",
        ListName:"",
        ResourceListKeyDesc:"<p>Select A Resource for group selection</p>",
        ResourceListKey:"",
        DisplayTitleFieldDesc:"<p>Please select the field that will use as the display title in the 'To'"
        +" element of the message composer</p>",
        DisplayTitleField:"",
        MappingResourceDesc:"<p> Collections that contain a reference field to a User resource and a reference field"
        +" to <br> the selection list chosen above are available in this dropdown</p>",
        MappingResourceUUID:"",
        UserReferenceFieldDesc:"<p>Please select the field that references user resource in the mapping resource</p>",
        UserReferenceField:'',
        ChipFieldsSelectorDesc: '<p> Display Fields Selection in Notifications Sending </p>',
        ChipFieldsSelector: 'Press To Select Fields To Display'
    }
    return defaultData
  }

  getDataView(): FormDataView{
    let dataView: FormDataView = {
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
              X: 0,
              Y: 0
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
          FieldID: "ListNameDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: false,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 1
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
          FieldID: "ListName",
          Type: "TextBox",
          Title: "List Name",
          Mandatory: true,
          ReadOnly: false,
          Layout: {
            Origin: {
              X: 0,
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
          FieldID: "ResourceListKeyDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: false,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 3
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
          ReadOnly:  true,
          Layout: {
            Origin: {
              X: 0,
              Y: 4
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
          FieldID: "DisplayTitleFieldDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: false,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 5
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
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 6
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
          FieldID: "MappingResourceDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: false,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 7
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
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 8
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
          FieldID: "UserReferenceFieldDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: false,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 9
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
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 10
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
          FieldID: "ChipFieldsSelectorDesc",
          Type: "RichTextHTML",
          Title: "",
          Mandatory: true,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 11
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
          FieldID: "ChipFieldsSelector",
          Type: "Button",
          Title: "Select Fields To Display When Selecting Groups For Sending Notifications",
          Mandatory: true,
          ReadOnly: true,
          Layout: {
            Origin: {
              X: 0,
              Y: 12
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
    return dataView
  }

      
  async getSelectionResources(){
    const resources = await this.addonService.papiClient.resources.resource('resources').get()
    this.availableResources = resources
    return resources.map(resource => {
      return {Key: resource.Name, Value: resource.Name}
    });
  }

  getResourceFields(){
    const resourceToSelect = this.availableResources.filter(resource => resource.Name === this.selectedResource)[0]
    const fields = [...Object.keys(resourceToSelect["Fields"])]
    this.resourceFields = fields
    return fields.map(field=>{
      return {Key:field, Value:field}
    })
  }

  getMappingCollections(){
    const mappingCollections: optionalValuesData[] = []
    this.availableResources.forEach(resource =>{
      const resourceField = this.getMappedResourceFields(resource)
      const userField = this.getUserReferenceFields(resource)
      if (resourceField.length > 0 && userField.length >0){
        mappingCollections.push({Key: resource.Name, Value: resource.Name})
      }
    })
    return mappingCollections
  }

  getMappedResourceFields(mappingResource){
    const mappedResourceFields: optionalValuesData[] = []
    Object.keys(mappingResource.Fields).forEach(key =>{
      if(mappingResource.Fields[key].Type == 'Resource' && mappingResource.Fields[key]["Resource"] == this.selectedResource){
        mappedResourceFields.push({Key: key, Value: key})
      }
    })
    return mappedResourceFields
  }

  getSelectedMappingResource(mappingResourceName){
    return this.availableResources.filter(resource => resource.Name === mappingResourceName)[0]
  }

  getUserReferenceFields(mappingResource){
    const mappedUserFields: optionalValuesData[] = []
    Object.keys(mappingResource.Fields).map(key =>{
      if(mappingResource.Fields[key].Type == 'Resource' && mappingResource.Fields[key]["Resource"] == 'users'){
        mappedUserFields.push({Key: key, Value: key})
      }
    })
    return mappedUserFields
  }

}

export interface optionalValuesData {
  Key: string;
  Value: string;
}
