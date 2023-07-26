import { Component, OnInit } from '@angular/core';
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { UserDevicesService } from '../../services/user-devices.services';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from 'src/app/services/addon.service';
import { ActivatedRoute } from '@angular/router';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { config } from '../../addon.config';

@Component({
  selector: 'app-device-managment',
  templateUrl: './device-managment.component.html',
  styleUrls: ['./device-managment.component.css']
})
export class DeviceManagmentComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    private userDevicesService: UserDevicesService,
    private addonService: AddonService,
    private route: ActivatedRoute
  ) {
    this.addonService.addonUUID = config.AddonUUID;
  }

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();

  getDataSource() {
    this.noDataMessage = this.translate.instant("No_Devices_Error");
    return {
      init: async (params: any) => {
        let devicesList = await this.userDevicesService.getUserDevices();

        return Promise.resolve({
          dataView: {
            Context: {
              Name: '',
              Profile: { InternalID: 0 },
              ScreenSize: 'Landscape'
            },
            Type: 'Grid',
            Title: 'Notifications',
            Fields: [
              {
                FieldID: 'Username',
                Type: 'TextBox',
                Title: this.translate.instant("Username"),
                Mandatory: true,
                ReadOnly: true
              },
              {
                FieldID: 'DeviceName',
                Type: 'TextBox',
                Title: this.translate.instant("Device_Name"),
                Mandatory: true,
                ReadOnly: true
              },
              {
                FieldID: 'DeviceType',
                Type: 'TextBox',
                Title: this.translate.instant("Device_Type"),
                Mandatory: true,
                ReadOnly: true
              },
              {
                FieldID: 'AppName',
                Type: 'TextBox',
                Title: this.translate.instant("App_Name"),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'LastRegistrationDate',
                Type: 'TextBox',
                Title: this.translate.instant("Last_Use_Date"),
                Mandatory: false,
                ReadOnly: true
              }
            ],
            Columns: [
              {
                Width: 30
              },
              {
                Width: 30
              },
              {
                Width: 30
              },
              {
                Width: 30
              },
              {
                Width: 30
              }
            ],

            FrozenColumnsCount: 0,
            MinimumColumnWidth: 0
          },
          totalCount: devicesList.length,
          items: devicesList
        });
      },
      inputs: () => {
        return Promise.resolve(
          {
            pager: {
              type: 'scroll'
            },
            selectionType: 'multi',
            noDataFoundMsg: this.noDataMessage
          }
        );
      },
    } as IPepGenericListDataSource
  }

  actions: IPepGenericListActions = {
    get: async (data) => {
      const actions = [];
      if (data.rows.length === 1 || data?.selectionType == 0) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
            const actionButtons = [
            new PepDialogActionButton(this.translate.instant("Delete"), 'main strong', async() => {
              await this.userDevicesService.removeUserDevices({ "DevicesKeys": objs.rows });
              this.dataSource = this.getDataSource();
            }),
            new PepDialogActionButton(this.translate.instant("Cancel"), 'main weak')
          ];
            this.addonService.openDefaultDialog("", actionButtons, this.translate.instant("Delete_Device_Validate"));
          }
        });
      }
      return actions;
    }
  }

}
