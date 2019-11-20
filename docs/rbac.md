
Role based access for Cluster routes

| userName | USER_TYPE | PERMISSION | create | read  | update | delete | create deployment | updateRoles |
|----------|-----------|------------|--------|-------|--------|--------|-------------------|-------------|
| Billy    | user      | none       | FALSE  | FALSE | FALSE  | FALSE  | FALSE             | FALSE       |
| Oliver   | user      | read       | FALSE  | TRUE  | FALSE  | FALSE  | FALSE             | FALSE       |
| Alex     | user      | write      | FALSE  | TRUE  | TRUE   | FALSE  | TRUE              | FALSE       |
| Duncan   | admin     | none       | TRUE   | FALSE | FALSE  | FALSE  | FALSE             | FALSE       |
| Paul     | admin     | read       | TRUE   | TRUE  | FALSE  | FALSE  | FALSE             | FALSE       |
| Mikaela  | admin     | write      | TRUE   | TRUE  | TRUE   | TRUE   | TRUE              | TRUE        |
| Kevin    | superuser | x          | TRUE   | TRUE  | TRUE   | TRUE   | TRUE              | TRUE        |


Role based access for Deployment Routes

| userName | USER_TYPE | PERMISSION |  read | update | delete | updateRoles |
|:--------:|:---------:|:----------:|:-----:|:------:|:------:|:-----------:|
|   Billy  |    user   |    none    | FALSE |  FALSE |  FALSE |    FALSE    |
|  Oliver  |    user   |    read    |  TRUE |  FALSE |  FALSE |    FALSE    |
|   Alex   |    user   |    write   |  TRUE |  TRUE  |  TRUE  |    FALSE    |
|  Duncan  |   admin   |    none    | FALSE |  FALSE |  FALSE |    FALSE    |
|   Paul   |   admin   |    read    |  TRUE |  FALSE |  FALSE |    FALSE    |
|  Mikaela |   admin   |    write   |  TRUE |  TRUE  |  TRUE  |     TRUE    |
|   Kevin  | superuser |      x     |  TRUE |  TRUE  |  TRUE  |     TRUE    |

Role based access for User routes

| userName | USER_TYPE |  read | update | delete |
|:--------:|:---------:|:-----:|:------:|:------:|
|   Billy  |    user   | FALSE |  FALSE |  FALSE |
|  Oliver  |    user   |  TRUE |  FALSE |  FALSE |
|   Alex   |    user   |  TRUE |  FALSE |  TRUE  |
|  Duncan  |   admin   |  TRUE |  TRUE  |  FALSE |
|   Paul   |   admin   |  TRUE |  TRUE  |  FALSE |
|  Mikaela |   admin   |  TRUE |  TRUE  |  FALSE |
|   Kevin  | superuser |  TRUE |  TRUE  |  TRUE  |