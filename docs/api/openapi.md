---
title: Sextant API v2.1.0
language_tabs:
  - python: Python
  - ruby: Ruby
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="sextant-api">Sextant API v2.1.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Sextant API

Base URLs:

* <a href="/api/v1">/api/v1</a>

# Authentication

* API Key (bearerAuth)
    - Parameter Name: **Authorization**, in: header.

<h1 id="sextant-api-default">Default</h1>

## get__config_values

`GET /config/values`

Get the ui configuration data.

<h3 id="get__config_values-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|return the ui configuration data|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__administration_startTime

`GET /administration/startTime`

Get the application start-up time.

> Example responses

> default Response

<h3 id="get__administration_starttime-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC|integer|

<aside class="success">
This operation does not require authentication
</aside>

## post__administration_restart

`POST /administration/restart`

Exit current process and restart application.

<h3 id="post__administration_restart-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__user_status

`GET /user/status`

Get information about the current user.

> Example responses

> default Response

<h3 id="get__user_status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|a complete user definition|[#/components/responses/basicUser](#schema#/components/responses/basicuser)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__user_hasInitialUser

`GET /user/hasInitialUser`

Get the list of users and check the length of it.

> Example responses

> default Response

<h3 id="get__user_hasinitialuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|returns true if the length of the user list is greater than 1|boolean|

<aside class="success">
This operation does not require authentication
</aside>

## post__user_login

`POST /user/login`

Login a currently logged out user.

<h3 id="post__user_login-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ok|None|

<aside class="success">
This operation does not require authentication
</aside>

## get__user_logout

`GET /user/logout`

Logout the current user.

<h3 id="get__user_logout-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|ok|None|

<aside class="success">
This operation does not require authentication
</aside>

## get__user

`GET /user`

Get the list of all users.

<h3 id="get__user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__user

`POST /user`

Create and save a new user.

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "permission": {
      "type": "string"
    }
  }
}
```

<h3 id="post__user-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|user information|
|» username|body|string|false|none|
|» password|body|string|false|none|
|» permission|body|string|false|none|

> Example responses

> default Response

<h3 id="post__user-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|a complete user definition|[#/components/responses/userRes](#schema#/components/responses/userres)|

<aside class="success">
This operation does not require authentication
</aside>

## get__user_search

`GET /user/search`

Get a list of all users with their id and permission.

<h3 id="get__user_search-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|search|query|string|false|search query|

> Example responses

> default Response

<h3 id="get__user_search-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|Inline|

<h3 id="get__user_search-responseschema">Response Schema</h3>

Status Code **default**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/components/responses/filteredUserRes](#schema#/components/responses/filtereduserres)]|false|none|none|
|» id|integer|false|none|none|
|» permission|string|false|none|none|
|» username|string|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__user_{user}

`GET /user/{user}`

Get information for a specific user.

<h3 id="get__user_{user}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|user|path|string|true|id of the user|

<h3 id="get__user_{user}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## put__user_{user}

`PUT /user/{user}`

Update information for a specific user.

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "permission": {
      "type": "string"
    }
  }
}
```

<h3 id="put__user_{user}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|user information|
|» username|body|string|false|none|
|» password|body|string|false|none|
|» permission|body|string|false|none|
|user|path|string|true|id of the user|

> Example responses

> default Response

<h3 id="put__user_{user}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|a user definition|[#/components/responses/userRes](#schema#/components/responses/userres)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__user_{user}

`DELETE /user/{user}`

Delete information for a specific user.

<h3 id="delete__user_{user}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|user|path|string|true|id of the user|

<h3 id="delete__user_{user}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__user_{id}_token

`GET /user/{id}/token`

Get the token for a specific user.

<h3 id="get__user_{id}_token-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|user|path|string|true|id of the user|

<h3 id="get__user_{id}_token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## put__user_{id}_token

`PUT /user/{id}/token`

Update the bearer token for a specific user.

<h3 id="put__user_{id}_token-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|user|path|string|true|id of the user|

<h3 id="put__user_{id}_token-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters

`GET /clusters`

Get a list of all active and inactive clusters.

<h3 id="get__clusters-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|user|path|string|true|id of the user|

<h3 id="get__clusters-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters

`POST /clusters`

Create and activate a cluster.

> Body parameter

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "provision_type": {
      "type": "string"
    },
    "desired_state": {
      "type": "object",
      "properties": {
        "apiServer": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "ca": {
          "type": "string"
        }
      }
    }
  }
}
```

<h3 id="post__clusters-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|false|cluster information|
|» name|body|string|false|none|
|» provision_type|body|string|false|none|
|» desired_state|body|object|false|none|
|»» apiServer|body|string|false|none|
|»» token|body|string|false|none|
|»» ca|body|string|false|none|
|user|path|string|true|id of the user|

<h3 id="post__clusters-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}

`GET /clusters/{cluster}`

Get a specific cluster.

<h3 id="get__clusters_{cluster}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="get__clusters_{cluster}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## put__clusters_{cluster}

`PUT /clusters/{cluster}`

Update a specific cluster.

<h3 id="put__clusters_{cluster}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="put__clusters_{cluster}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}

`DELETE /clusters/{cluster}`

Deactivate a specific cluster or delete the cluster definition from the database.

<h3 id="delete__clusters_{cluster}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="delete__clusters_{cluster}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_roles

`GET /clusters/{cluster}/roles`

Get all user roles for a specific cluster.

<h3 id="get__clusters_{cluster}_roles-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="get__clusters_{cluster}_roles-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_roles

`POST /clusters/{cluster}/roles`

Create a new user role for a specific cluster.

<h3 id="post__clusters_{cluster}_roles-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="post__clusters_{cluster}_roles-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_roles_{user}

`DELETE /clusters/{cluster}/roles/{user}`

Delete a role for a specific user on a specific cluster.

<h3 id="delete__clusters_{cluster}_roles_{user}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|user|path|string|true|id of the user|

<h3 id="delete__clusters_{cluster}_roles_{user}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_tasks

`GET /clusters/{cluster}/tasks`

Get a list of all tasks for a specific cluster.

<h3 id="get__clusters_{cluster}_tasks-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="get__clusters_{cluster}_tasks-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_resources

`GET /clusters/{cluster}/resources`

Get a list of nodes on a specific cluster.

<h3 id="get__clusters_{cluster}_resources-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="get__clusters_{cluster}_resources-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_summary

`GET /clusters/{cluster}/summary`

Get the summary information for a specific cluster.

<h3 id="get__clusters_{cluster}_summary-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|

<h3 id="get__clusters_{cluster}_summary-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments

`GET /clusters/{cluster}/deployments`

Get a list of all deployed and undeployed deployments for a specific cluster.

<h3 id="get__clusters_{cluster}_deployments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|showDeleted|query|string|false|y or n|
|withTasks|query|string|false|y or n|
|cluster|path|string|true|id of the cluster|
|user|path|string|true|id of the user|

<h3 id="get__clusters_{cluster}_deployments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments

`POST /clusters/{cluster}/deployments`

Create and deploy a new deployment on a specific cluster.

> Body parameter

```json
{}
```

<h3 id="post__clusters_{cluster}_deployments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|any|false|deployment definition|
|cluster|path|string|true|id of the cluster|
|user|path|string|true|id of the user|

<h3 id="post__clusters_{cluster}_deployments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="success">
This operation does not require authentication
</aside>

## get__clusters_{cluster}_deployments_{deployment}

`GET /clusters/{cluster}/deployments/{deployment}`

Get a specific deployment on a specific cluster.

<h3 id="get__clusters_{cluster}_deployments_{deployment}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## put__clusters_{cluster}_deployments_{deployment}

`PUT /clusters/{cluster}/deployments/{deployment}`

Update a specific deployment on a specific cluster.

<h3 id="put__clusters_{cluster}_deployments_{deployment}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="put__clusters_{cluster}_deployments_{deployment}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_deployments_{deployment}

`DELETE /clusters/{cluster}/deployments/{deployment}`

Delete or un-deploy a specific deployment on a specific cluster.

<h3 id="delete__clusters_{cluster}_deployments_{deployment}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="delete__clusters_{cluster}_deployments_{deployment}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_roles

`GET /clusters/{cluster}/deployments/{deployment}/roles`

Get all the user roles for a specific deployment.

<h3 id="get__clusters_{cluster}_deployments_{deployment}_roles-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_roles-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_roles

`POST /clusters/{cluster}/deployments/{deployment}/roles`

Create a new role for a specific user on a specific deployment.

<h3 id="post__clusters_{cluster}_deployments_{deployment}_roles-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_roles-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_deployments_{deployment}_roles_{user}

`DELETE /clusters/{cluster}/deployments/{deployment}/roles/{user}`

Delete a role for a specific user on a specific deployment.

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_roles_{user}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|user|path|string|true|id of the user|

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_roles_{user}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_tasks

`GET /clusters/{cluster}/deployments/{deployment}/tasks`

Get a list of all tasks for a specific deployment.

<h3 id="get__clusters_{cluster}_deployments_{deployment}_tasks-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_tasks-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="success">
This operation does not require authentication
</aside>

## get__clusters_{cluster}_deployments_{deployment}_resources

`GET /clusters/{cluster}/deployments/{deployment}/resources`

Get the kubernetes resources for a specific deployment.

<h3 id="get__clusters_{cluster}_deployments_{deployment}_resources-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_resources-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_summary

`GET /clusters/{cluster}/deployments/{deployment}/summary`

Get the summary information for a specific deployment.

<h3 id="get__clusters_{cluster}_deployments_{deployment}_summary-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_summary-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_daml_keyManagerKeys

`GET /clusters/{cluster}/deployments/{deployment}/daml/keyManagerKeys`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_keymanagerkeys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_keymanagerkeys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_daml_enrolledKeys

`GET /clusters/{cluster}/deployments/{deployment}/daml/enrolledKeys`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_enrolledkeys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_enrolledkeys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_enrolledKeys

`POST /clusters/{cluster}/deployments/{deployment}/daml/enrolledKeys`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_enrolledkeys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_enrolledkeys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_daml_participants

`GET /clusters/{cluster}/deployments/{deployment}/daml/participants`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_participants-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_participants-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_daml_archives

`GET /clusters/{cluster}/deployments/{deployment}/daml/archives`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_archives-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_archives-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_daml_timeServiceInfo

`GET /clusters/{cluster}/deployments/{deployment}/daml/timeServiceInfo`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_timeserviceinfo-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_daml_timeserviceinfo-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_registerParticipant

`POST /clusters/{cluster}/deployments/{deployment}/daml/registerParticipant`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_registerparticipant-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_registerparticipant-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_rotateKeys

`POST /clusters/{cluster}/deployments/{deployment}/daml/rotateKeys`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_rotatekeys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_rotatekeys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_addParty

`POST /clusters/{cluster}/deployments/{deployment}/daml/addParty`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_addparty-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_addparty-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_generatePartyToken

`POST /clusters/{cluster}/deployments/{deployment}/daml/generatePartyToken`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_generatepartytoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_generatepartytoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_generateAdminToken

`POST /clusters/{cluster}/deployments/{deployment}/daml/generateAdminToken`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_generateadmintoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_generateadmintoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_daml_uploadArchive

`POST /clusters/{cluster}/deployments/{deployment}/daml/uploadArchive`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_uploadarchive-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_daml_uploadarchive-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_taekion_keys

`GET /clusters/{cluster}/deployments/{deployment}/taekion/keys`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_keys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_keys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_taekion_keys

`POST /clusters/{cluster}/deployments/{deployment}/taekion/keys`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_keys-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_keys-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_deployments_{deployment}_taekion_keys_{keyId}

`DELETE /clusters/{cluster}/deployments/{deployment}/taekion/keys/{keyId}`

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_keys_{keyid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_keys_{keyid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_taekion_volumes

`GET /clusters/{cluster}/deployments/{deployment}/taekion/volumes`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_volumes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_volumes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_taekion_volumes

`POST /clusters/{cluster}/deployments/{deployment}/taekion/volumes`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_volumes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_volumes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## put__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}

`PUT /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}`

<h3 id="put__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|volume|path|string|true|id of the volume|

<h3 id="put__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}

`DELETE /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}`

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|volume|path|string|true|id of the volume|

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## get__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots

`GET /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}/snapshots`

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|volume|path|string|true|id of the volume|

<h3 id="get__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## post__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots

`POST /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}/snapshots`

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|volume|path|string|true|id of the volume|

<h3 id="post__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

## delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots_{snapshot}

`DELETE /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}/snapshots/{snapshot}`

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots_{snapshot}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|cluster|path|string|true|id of the cluster|
|deployment|path|string|true|id of the deployment|
|volume|path|string|true|id of the volume|
|snapshot|path|string|true|id of the snapshot|

<h3 id="delete__clusters_{cluster}_deployments_{deployment}_taekion_volumes_{volume}_snapshots_{snapshot}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>
