# pepperi-filters

Useful utilies for working with **Pepperi** `SQL` clause filters & **Pepperi** JSON Filters

## Installation
Install by running 
``` 
npm install @pepperi-addons/pepperi-filters
```

## concat
concat multiple filters into one

#### Usage
``` Typescript
import { concat } from '@pepperi-addons/pepperi-filters'

const filter = concat(
    true, 
    {
        FieldType: 'String',
        ApiName: 'TSAString',
        Operation: 'Contains'
        Values: ['hi']
    }, 
    {
        FieldType: 'Double',
        ApiName: 'TSADouble',
        Operation: '='
        Values: ['123.98']
    }
);
console.log(JSON.stringify(filter, null, 4)); 
```
#### Output
``` JSON
{
    "Operation": "AND",
    "LeftNode": {
        "FieldType": "String",
        "ApiName": "TSAString",
        "Operation": "Contains",
        "Values": [ "hi" ]
    },
    "RightNode": {
        "FieldType": "Double",
        "ApiName": "TSADouble",
        "Operation": "=",
        "Values": ["123.98"]
    }
}
```

It also works on sql like filters
``` Typescript
import { concat } from '@pepperi-addons/pepperi-filters'

const result = concat(
    true, 
    "TSAString LIKE '%Hello%'", 
    'TSADouble >= 1.2'
);
console.log(result); 
```
#### Output
`(TSAString LIKE '%Hello%' AND TSADouble >= 1.2)`

## parse
Convert an SQL clause into a JSON filter.

#### Usage
``` Typescript
import { parse } from '@pepperi-addons/pepperi-filters'

const filter = parse("TSAString LIKE '%Hello%'", new Map([
    ['TSAString', 'String']
]));
console.log(filter); 
```
#### Output
``` JSON
{
    "FieldType": "String",
    "ApiName": "TSAString",
    "Operation": "Contains",
    "Values": [
        "Hello"
    ]
}
```

## filter 
Filter JSON objects using a JSONFilter

#### Usage
``` Typescript
import { filter } from '@pepperi-addons/pepperi-filters'

const before = [
    {
        TSAString: 'Hi',
        TSADouble: 123.4
    },
    {
        TSAString: 'Bye',
        TSADouble: 53.6
    },
]

const after = filter(before, {
    FieldType: 'String',
    ApiName: 'TSAString',
    Operation: 'StartWith',
    Values: [ 'H' ]
});
console.log(after); 
```
#### Output
``` JSON
[{
    "TSAString": "Hi",
    "TSADouble": 123.4
}]
```

## sqlWhereClause
Convert a JSONFilter into a SQL style where clause

#### Usage
``` typescript
import { sqlWhereClause, concat } from '@pepperi-addons/pepperi-filters'

const where = sqlWhereClause(concat({
    FieldType: 'String',
    ApiName: 'TSAString',
    Operation: 'Contains'
    Values: ['hi']
}, {
    FieldType: 'Double',
    ApiName: 'TSADouble',
    Operation: '='
    Values: ['123.98']
}, true));
console.log(where); 
```
#### Output
``` SQL
TSAString LIKE '%hi%' AND TSADouble = 123.0
```

## transform
Travese through a JSON filter tree and transform nodes or emit them entirely.
This is useful when we create an API than returns some tranformed model from one or more other APIs.

#### example
For example we will use the data_views API (https://papi.pepperi.com/v1.0/meta_data/data_views). It supports all the regular API functions (GET, POST, etc.), but saves & gets the data based on the UIControls API (https://papi.pepperi.com/v1.0/UIControls).

So lets say the data_views endpoint gets a filter in a `SQL WHERE` clause like so: 
``` SQL
(Hidden = false) AND (Context.Name = 'OrderMenu') AND (Type = 'Grid' OR CreationDate > '2020-06-01T07:33:33.707Z')
```

Taking this query apart:

`Hidden = false` - can be sent to the UIControl endpoint

`Context.Name = 'OrderMenu'` - translates on the UIControl endpoint to `Type LIKE '%OrderMenu%'`

`Type = 'Grid'` - has no translation in the UIControl API

`CreationDate > '2020-06-01T07:33:33.707Z'` - can also be sent to the UIControl

We want to transform queries that need to be transformed.
We want to emlinate queries that aren't supported on the API. We also need to eliminate any queries that are `OR`'d with that query b/c we need the call to the UIControl API to be >= to the call to the data_views API call.
In summary the query we want to send the following filter to the UIControl API
``` SQL
(Hidden = false) AND (Type LIKE '%OrderMenu%')
```

#### Usage
``` Typescript
import { transform, parse, sqlWhereClause } from '@pepperi-addons/pepperi-filters'

const where = "(Hidden = false) AND (Context.Name = 'OrderMenu') AND (Type = 'Grid' OR CreationDate > '2020-06-01T07:33:33.707Z')";

// first let's turn this into a JSON Filter
const filter = parse(where, new Map([
    ['Hidden', 'Bool'], ['Context.Name', 'String'], ['Type', 'String'], ['CreationDate', 'DateTime']
]));
const transformed = transform(filter, new Map([
    
    // Type doesn't exist on UIControls
    ['Type', (node: JSONBaseFilter): boolean => { return false } ],
    
    // Context.Name maps to part of UIControl.Type
    ['Context.Name', (node: JSONBaseFilter) => { 

        // no matter what the operation - it is alway only contains
        node.Operation = 'Contains'
        node.ApiName = 'Type'

        return true 
    } ]
]);
const where2 = sqlWhereClause(transformed);
console.log(where2);
```
#### Output

``` SQL
Hidden = true AND Type LIKE '%OrderMenu%'
```
