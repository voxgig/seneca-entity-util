/* Copyright (c) 2019-2020 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict'

/* $lab:coverage:on$ */


module.exports = entity_util
module.exports.defaults = {
  // revision tag
  rtag: {
    active: false,
    field: 'rtag',
    len: 17,
    annotate: true,
    stats: true,

    // TODO: mem-store should deep clone!
    clone_before_hydrate: true,
  },

  when: {
    active: false,
    field_created: 't_c',
    field_modified: 't_m',
  },

  duration: {
    active: false,
    annotation: 'd$',
    stats: true,
  },

  // archiving of removed items
  archive: {
    active: false,
    entity: 'sys/archive',
    custom_props: [],
  },

  derive: {
    active: false
  }
}
module.exports.errors = {}


interface DeriveSpec {
  fields: { [_: string]: (options: any, derive: DeriveSpec, msg: any, meta: any) => any }
}



function entity_util(options: any) {
  const seneca = this
  const Joi = seneca.util.Joi
  const rtag = seneca.util.Nid({ length: options.rtag.len })

  const HIT = 1
  const MISS = 2

  const stats: any = {
    rtag: {
      hit: 0,
      miss: 0,
      space: {},
    },
  }

  const derive_router = seneca.util.Patrun()

  // TODO: rename role->sys
  seneca
    .message('role:entity,cmd:save', cmd_save_util)
    .message('role:entity,cmd:load', cmd_load_util)
    .message('role:entity,cmd:list', cmd_list_util)
    .message('role:entity,cmd:remove', cmd_remove_util)

    .message('sys:entity,derive:add', derive_add)
    .message('sys:entity,derive:list', derive_list)

    .message('role:cache,resolve:rtag', resolve_rtag)
    .message('role:cache,stats:rtag', stats_rtag)

  Object.assign(stats_rtag, {
    desc: 'Get rtag cache usage statistics.',
  })

  Object.assign(cmd_save_util, {
    desc: 'Override role:entity,cmd:save to apply utilities.',
  })

  Object.assign(resolve_rtag, {
    desc: 'Use rtag to load cached version of expensive result.',
    validate: {
      space: Joi.string().required(),
      key: Joi.string().required(),
      rtag: Joi.string().required(),

      // Generate a fresh result to cache
      resolver: Joi.func().required(),
    },
  })


  async function derive_add(msg: any) {
    let match = this.util.Jsonic(msg.match)

    let spec = derive_router.find(match, true)

    if (null != spec) {
      spec = this.util.deep(spec, msg.spec)
    }
    else {
      spec = msg.spec
    }

    derive_router.add(match, spec)
  }

  async function derive_list(msg: any) {
    var match = this.util.Jsonic(msg.match)
    return derive_router.list(match)
  }


  async function stats_rtag() {
    return stats.rtag
  }

  async function cmd_save_util(msg: any, meta: any) {
    var start = Date.now()
    const ent = msg.ent

    if (options.rtag.active) {
      ent[options.rtag.field] = rtag() // always override
    }

    if (options.when.active) {
      ent[options.when.field_modified] = start
      if (null == ent.id) {
        ent[options.when.field_created] = start
      }
    }

    //console.log('EU save ', options.derive.active)
    if (options.derive.active) {
      let derive = derive_router.find(msg)
      //console.log('EU save derive', derive, msg)

      if (derive) {
        intern.apply_derive(options, derive, msg, meta)
      }
    }

    //console.log('EU prior', msg.ent.data$())
    var out = await this.prior(msg)
    //console.log('EU prior out', out.data$())

    intern.apply_duration(out, meta, start, options)
    return out
  }

  async function cmd_load_util(msg: any, meta: any) {
    var start = Date.now()

    var out = await this.prior(msg)
    intern.apply_duration(out, meta, start, options)
    return out
  }

  async function cmd_list_util(msg: any, meta: any) {
    var start = Date.now()

    var out = await this.prior(msg)
    intern.apply_duration(out, meta, start, options)
    return out
  }

  async function cmd_remove_util(msg: any, meta: any) {
    var start = Date.now()

    // TODO: only supports id-based remove
    if (options.archive.active) {
      var id = msg.q.id
      if (null == id) {
        this.fail('archive-requires-id', { q: msg.q })
      }
      var old = await msg.qent.load$(id)
      var canon = old.canon$({ object: true })
      var old_data = old.data$(false)

      var data: any = {}
      options.archive.custom_props.forEach((p: any) => {
        data[p] = meta.custom[p]
      })

      data.when = Date.now()
      data.data = old_data
      data.entity = old.entity$
      data.ent_id = old.id
      data.zone = canon.zone
      data.base = canon.base
      data.name = canon.name

      await this.entity(options.archive.entity).data$(data).save$()
    }

    var out = await this.prior(msg)

    intern.apply_duration(out, meta, start, options)
    return out
  }

  const loading: any = {}

  async function resolve_rtag(msg: any) {
    const seneca = this

    const space = msg.space
    const key = msg.key
    const rtag = msg.rtag
    const resolver = msg.resolver

    const id = space + '~' + key + '~' + rtag

    var cache_entry = await seneca.entity('sys/cache').load$(id)

    if (cache_entry) {
      var entrydata = cache_entry.data
      var entryout = entrydata

      // TODO: need a general entity hydration util as also needed by transport
      if (entrydata.__entity$) {
        if (options.rtag.clone_before_hydrate) {
          entrydata = Object.assign({}, entrydata)
        }

        entrydata.entity$ = entrydata.__entity$
        delete entrydata.__entity$
        entryout = seneca.entity(entrydata)
      }

      if (options.rtag.annotate) {
        entryout.rtag$ = HIT
      }

      stats.rtag.hit++
        ; (stats.rtag.space[space] = stats.rtag.space[space] || {
          hit: 0,
          miss: 0,
        }).hit++

      return entryout
    } else {
      var origdata = await resolver.call(seneca)
      var cachedata = origdata

      stats.rtag.miss++
        ; (stats.rtag.space[space] = stats.rtag.space[space] || {
          hit: 0,
          miss: 0,
        }).miss++

      if (cachedata && false !== cachedata.rtag_cache$) {
        if (cachedata.entity$) {
          cachedata = cachedata.data$()

          // Avoid seneca-entity auto replacement of entities with id
          cachedata.__entity$ = cachedata.entity$
          delete cachedata.entity$
        }

        cache_entry = seneca.entity('sys/cache').make$({
          id$: id,
          when: Date.now(),
        })

        cache_entry.data = cachedata

        // Avoid spurious error messages form cache duplicates
        if (loading[id]) {
          var try_count = 0
          while (loading[id] && try_count < 11) {
            try_count++
            await new Promise((r) => {
              setImmediate(r)
            })
          }
        }

        loading[id] = true

        var cache_entry_exists = await seneca.entity('sys/cache').load$(id)
        if (!cache_entry_exists) {
          await cache_entry.save$()
        }

        delete loading[id]
      }

      if (options.rtag.annotate) {
        origdata.rtag$ = MISS
      }

      return origdata
    }
  }

  return {
    name: 'entity-util',
    export: {
      HIT: HIT,
      MISS: MISS,
      derive: derive_router
    },
  }
}

const intern = (module.exports.intern = {
  apply_duration: function(out: any, meta: any, start: any, options: any) {
    if (options.duration.active) {
      var duration = Date.now() - start

      meta.custom.entity_util = (meta.custom.entity_util || { duration: {} })
      meta.custom.entity_util.duration[meta.id] = duration

      if (out) {
        out[options.duration.annotation] = duration
      }

      // TODO: rolling stats
    }
  },

  apply_derive: function(options: any, derive: DeriveSpec, msg: any, meta: any) {
    for (let fieldname in derive.fields) {
      let fieldspec: any = derive.fields[fieldname]

      //console.log('EU apply_derive', fieldname, 'function' === typeof fieldspec.build, fieldspec)

      if ('function' === typeof fieldspec.build) {
        msg.ent[fieldname] = fieldspec.build(msg.ent, { options, msg, meta, derive })
      }

      //console.log('EU apply_derive ent', msg.ent.data$())
    }
  }
})
