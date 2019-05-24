# seneca-entity-util

[![Npm][BadgeNpm]][Npm]
[![Travis][BadgeTravis]][Travis]
[![Coveralls][BadgeCoveralls]][Coveralls]


Utilities for [Seneca](senecajs.org) entities.

* rtag: random revision tags generated per save; provides support for complex object caching.
* archive: archival of deleted entities.
* when: injection of created and modified time stamps
* duration: injection of entity action duration times in results as meta data



## Install

```sh
$ npm install seneca-entity-util seneca-promisify
```




<!--START:action-list-->


## Action Patterns

* [cmd:save,role:entity](#-cmdsaveroleentity-)
* [cmd:load,role:entity](#-cmdloadroleentity-)
* [cmd:list,role:entity](#-cmdlistroleentity-)
* [cmd:remove,role:entity](#-cmdremoveroleentity-)
* [resolve:rtag,role:cache](#-resolvertagrolecache-)
* [role:cache,stats:rtag](#-rolecachestatsrtag-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `cmd:save,role:entity` &raquo;

Override role:entity,cmd:save to apply utilities.



----------
### &laquo; `cmd:load,role:entity` &raquo;

No description provided.



----------
### &laquo; `cmd:list,role:entity` &raquo;

No description provided.



----------
### &laquo; `cmd:remove,role:entity` &raquo;

No description provided.



----------
### &laquo; `resolve:rtag,role:cache` &raquo;

Use rtag to load cached version of expensive result.


#### Parameters


* _space_: string <i><small>{presence:required}</small></i>
  * undefined
* _key_: string <i><small>{presence:required}</small></i>
  * undefined
* _rtag_: string <i><small>{presence:required}</small></i>
  * undefined
* _resolver_: object <i><small>{func:true,presence:required}</small></i>
  * undefined


----------
### &laquo; `role:cache,stats:rtag` &raquo;

Get rtag cache usage statistics.



----------


<!--END:action-desc-->


[BadgeCoveralls]: https://coveralls.io/repos/voxgig/seneca-entity-util/badge.svg?branch=master&service=github
[BadgeNpm]: https://badge.fury.io/js/%40seneca%2Fentity-util.svg
[BadgeTravis]: https://travis-ci.org/voxgig/seneca-entity-util.svg?branch=master
[Coveralls]: https://coveralls.io/github/voxgig/seneca-entity-util?branch=master
[Npm]: https://www.npmjs.com/package/seneca-entity-util
[Travis]: https://travis-ci.org/voxgig/seneca-entity-util?branch=master
