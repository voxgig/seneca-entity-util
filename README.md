# seneca-entity-util

[![Npm][BadgeNpm]][Npm]
[![Travis][BadgeTravis]][Travis]
[![Coveralls][BadgeCoveralls]][Coveralls]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/13018/branches/211297/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=13018&bid=211297)
[![Maintainability](https://api.codeclimate.com/v1/badges/a642840360b4eb209b21/maintainability)](https://codeclimate.com/github/voxgig/seneca-entity-util/maintainability)
[![devDependencies Status](https://david-dm.org/voxgig/seneca-entity-util/dev-status.svg)](https://david-dm.org/voxgig/seneca-entity-util?type=dev)


Utilities for [Seneca](senecajs.org) entities.

* rtag: random revision tags generated per save; provides support for complex object caching.
* archive: archival of deleted entities.
* when: injection of created and modified time stamps
* duration: injection of entity action duration times in results as meta data



## Install

```sh
$ npm install seneca-entity-util seneca-promisify
```


<!--START:options-->


## Options

* `rtag.active` : boolean <i><small>false</small></i>
* `rtag.field` : string <i><small>"rtag"</small></i>
* `rtag.len` : number <i><small>17</small></i>
* `rtag.annotate` : boolean <i><small>true</small></i>
* `rtag.stats` : boolean <i><small>true</small></i>
* `rtag.clone_before_hydrate` : boolean <i><small>true</small></i>
* `when.active` : boolean <i><small>false</small></i>
* `when.field_created` : string <i><small>"t_c"</small></i>
* `when.field_modified` : string <i><small>"t_m"</small></i>
* `duration.active` : boolean <i><small>false</small></i>
* `duration.annotation` : string <i><small>"d$"</small></i>
* `duration.stats` : boolean <i><small>true</small></i>
* `archive.active` : boolean <i><small>false</small></i>
* `archive.entity` : string <i><small>"sys/archive"</small></i>
* `archive.custom_props` : array <i><small></small></i>
* `derive.active` : boolean <i><small>false</small></i>


Set plugin options when loading with:
```js


seneca.use('entity-util', { name: value, ... })


```


<small>Note: <code>foo.bar</code> in the list above means 
<code>{ foo: { bar: ... } }</code></small> 



<!--END:options-->



<!--START:action-list-->


## Action Patterns

* [role:cache,resolve:rtag](#-rolecacheresolvertag-)
* [role:cache,stats:rtag](#-rolecachestatsrtag-)
* [role:entity,cmd:list](#-roleentitycmdlist-)
* [role:entity,cmd:load](#-roleentitycmdload-)
* [role:entity,cmd:remove](#-roleentitycmdremove-)
* [role:entity,cmd:save](#-roleentitycmdsave-)
* [sys:entity,derive:add](#-sysentityderiveadd-)
* [sys:entity,derive:list](#-sysentityderivelist-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `role:cache,resolve:rtag` &raquo;

Use rtag to load cached version of expensive result.


#### Parameters


* _space_ : string <i><small>"&nbsp;"</small></i>
* _key_ : string <i><small>"&nbsp;"</small></i>
* _rtag_ : string <i><small>"&nbsp;"</small></i>
* _resolver_ : function <i><small>"&nbsp;"</small></i>


----------
### &laquo; `role:cache,stats:rtag` &raquo;

Get rtag cache usage statistics.



----------
### &laquo; `role:entity,cmd:list` &raquo;

No description provided.



----------
### &laquo; `role:entity,cmd:load` &raquo;

No description provided.



----------
### &laquo; `role:entity,cmd:remove` &raquo;

No description provided.



----------
### &laquo; `role:entity,cmd:save` &raquo;

Override role:entity,cmd:save to apply utilities.



----------
### &laquo; `sys:entity,derive:add` &raquo;

No description provided.



----------
### &laquo; `sys:entity,derive:list` &raquo;

No description provided.



----------


<!--END:action-desc-->


[BadgeCoveralls]: https://coveralls.io/repos/voxgig/seneca-entity-util/badge.svg?branch=master&service=github
[BadgeNpm]: https://badge.fury.io/js/%40seneca%2Fentity-util.svg
[BadgeTravis]: https://travis-ci.org/voxgig/seneca-entity-util.svg?branch=master
[Coveralls]: https://coveralls.io/github/voxgig/seneca-entity-util?branch=master
[Npm]: https://www.npmjs.com/package/seneca-entity-util
[Travis]: https://travis-ci.org/voxgig/seneca-entity-util?branch=master
