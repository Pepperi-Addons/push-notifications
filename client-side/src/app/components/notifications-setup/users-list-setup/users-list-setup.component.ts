import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonData, FormDataView } from '@pepperi-addons/papi-sdk';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsDialogService } from 'src/app/services/dialog-service.services';
import { FieldSelectorComponent } from '../field-selector/field-selector.component';
import { defaultFormViewForListSetup, defaultDataSourceForListSetup } from '../metadata'

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
    this.dataView = defaultFormViewForListSetup
    this.formDataSource = defaultDataSourceForListSetup
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
            this.userListData.SelectionDisplayFields = res
            this.isSaveListDisabled = false
        }
      },
      this.resourceFields)
    }
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
