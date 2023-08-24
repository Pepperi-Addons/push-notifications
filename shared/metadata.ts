import { AddonDataScheme, FormDataView } from "@pepperi-addons/papi-sdk";
import { USERS_LISTS_TABLE_NAME, UsersLists } from "./entities";
import { AddonUUID } from '../addon.config.json';

export const DefaultNotificationsSlug = {
  slug:{
    Name: "Notifications",
    Slug: "notifications",
    Description: "Notifications Default Slug",
  }
}

export const DefaultNotificationsPage: any = {
  Description: "Notifications Default Page",
  Blocks:[{
    Key:`notifications_${AddonUUID}_BlockPage`,
    Configuration: {
      Resource: "Notifications",
      Data: {},
      AddonUUID: AddonUUID
    }
  }],
  Layout: {
    ColumnsGap: "md",
    SectionsGap: "md",
    HorizontalSpacing: "md",
    Sections: [
        {
            Columns: [
                {
                    BlockContainer: {
                        BlockKey: `notifications_${AddonUUID}_BlockPage`
                    }
                }
            ],
            Key: `notifications_${AddonUUID}_Layout`
        }
    ],
    VerticalSpacing: "md",
    MaxWidth: 0
  },
  Hidden: false,
  Name: "Notifications"
}

export const setupListViewIndexes = {
  ListNameDesc: 0,
  ListName: 1,
  ResourceNameDesc: 2,
  ResourceName: 3,
  TitleFieldDesc: 4,
  TitleField: 5,
  MappingResourceNameDesc: 6,
  MappingResourceName: 7,
  UserReferenceFieldDesc: 8,
  UserReferenceField: 9,
  ResourceReferenceFieldDesc: 10,
  ResourceReferenceField: 11,
  DisplayFieldsSelectorDesc: 12,
  DisplayFieldsSelector: 13,
  SmartSearchFieldsDesc: 14,
  SmartSearchFields: 15
}

export const usersListFields: AddonDataScheme = {
  Name: USERS_LISTS_TABLE_NAME,
  Type: 'meta_data',
  Fields: {
      ListName: {
          Type: 'String'
      },
      ResourceName: {
          Type: 'String'
      },
      TitleField: {
          Type: 'String'
      },
      MappingResourceName: {
          Type: 'String'
      },
      UserReferenceField: {
          Type: 'String'
      },
      ResourceReferenceField: {
          Type: 'String'
      },
      SelectionDisplayFields: {
          Type: "MultipleStringValues"
      },
      SmartSearchFields: {
          Type: "MultipleStringValues"
      }
  }

};

export const defaultFormViewForListSetup: FormDataView = {
    Type: "Form",
    Hidden: false,
    Columns: [],
    Context: {
      Object: {
        Resource: "None",
        InternalID: 0,
        Name: "Object Name"
      },
      Name: '',
      Profile: { },
      ScreenSize: 'Tablet'
    },
    Fields: [
      {
        FieldID: "ListNameDesc",
        Type: "Separator",
        Title: "Please insert list name",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.ListNameDesc
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
            Y: setupListViewIndexes.ListName
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
        FieldID: "ResourceNameDesc",
        Type: "Separator",
        Title: "Select A Resource for group selection",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.ResourceNameDesc
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
        FieldID: "ResourceName",
        Type: "ComboBox",
        Title: "Selection Resource List",
        Mandatory: true,
        ReadOnly:  true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.ResourceName
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
        FieldID: "TitleFieldDesc",
        Type: "Separator",
        Title: "Please select the field that will use as the display title in the 'To'"
        +" element of the message composer",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.TitleFieldDesc
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
        FieldID: "TitleField",
        Type: "MapDataDropDown",
        Title: "Selection Display Title Field",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.TitleField
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
        FieldID: "MappingResourceNameDesc",
        Type: "Separator",
        Title: "Collections that contain a reference field to a User resource and a reference field"
        +" to <br> the selection list chosen above are available in this dropdown",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.MappingResourceNameDesc
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
        FieldID: "MappingResourceName",
        Type: "MapDataDropDown",
        Title: "Choose Mapping Resource",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.MappingResourceName
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
        Type: "Separator",
        Title: " Please select the field that references user resource in the mapping"
        +" resource <br> if there is only one field available it will be selected automatically",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.UserReferenceFieldDesc
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
            Y: setupListViewIndexes.UserReferenceField
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
        FieldID: "ResourceReferenceFieldDesc",
        Type: "Separator",
        Title: "Please select the field that references the selected resource in the mapping"
        +" resource <br> if there is only one field available it will be selected automatically",
        Mandatory: false,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.ResourceReferenceFieldDesc
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
        FieldID: "ResourceReferenceField",
        Type: "MapDataDropDown",
        Title: "Resource Reference Field",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.ResourceReferenceField
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
        FieldID: "DisplayFieldsSelectorDesc",
        Type: "Separator",
        Title: " Display Fields Selection in Notifications Sending ",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.DisplayFieldsSelectorDesc
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
        FieldID: "DisplayFieldsSelector",
        Type: "Button",
        Title: "Select Fields To Display When Selecting Groups For Sending Notifications",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.DisplayFieldsSelector
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
        FieldID: "SmartSearchFieldsDesc",
        Type: "Separator",
        Title: "Fields to search by in Notifications Sending",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.SmartSearchFieldsDesc
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
        FieldID: "SmartSearchFields",
        Type: "Button",
        Title: "Select Fields To Search By When Selecting Groups For Sending Notifications",
        Mandatory: true,
        ReadOnly: true,
        Layout: {
          Origin: {
            X: 0,
            Y: setupListViewIndexes.SmartSearchFieldsDesc
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

export const defaultDataSourceForListSetup = {
    ListName:"",
    ResourceName:"",
    TitleField:"",
    MappingResourceName:"",
    UserReferenceField:'',
    ResourceReferenceField:'',
    DisplayFieldsSelector: 'Press To Select Fields To Display',
    SmartSearchFields: 'Press To Select Fields To Search By'
}

export const UsersListDataView = {
  List: {
    Key: "Notifications_Employees_List",
    Name: "Users list",
    Resource: "employees",
    Views: [{
      Key: "notifications_employees_view",
      Type: "Grid",
      Title: "Users",
      Blocks: [{
        Title: "Email",
        Configuration: {
            Type: "TextBox",
            FieldID: "Email",
            Width: 10
        }, 
      },
      {
        Title: "First Name",
        Configuration: {
            Type: "TextBox",
            FieldID: "FirstName",
            Width: 10
        },
      },
      {
        Title: "Last Name",
        Configuration: {
            Type: "TextBox",
            FieldID: "LastName",
            Width: 10
        },
      },
      {
        Title: "User UUID",
        Configuration: {
            Type: "TextBox",
            FieldID: "Key",
            Width: 10
        },
      }],
    }],
    SelectionType: "Multi",
    Search: {
      Fields: [
          {
              FieldID: "FirstName"
          },
          {
              FieldID: "LastName"
          },
          {
              FieldID: "Email"
          }
      ]
    },
    Sorting: {Ascending: true, FieldID: "FirstName"},     
  },
  State: {
    ListKey: "Notifications_Employees_List",
  },          
}

export const DefaultAccountBuyersList: UsersLists = {
  Key: 'account_buyers',
  ListName: 'Account Buyers',
  ResourceName: 'accounts', 
  TitleField: 'Name',
  MappingResourceName: 'account_buyers',
  UserReferenceField: 'User',
  ResourceReferenceField: 'Account',
  SelectionDisplayFields: ["Email", "Name", "Key"],
  SmartSearchFields: ["Email", "Name"]
}
