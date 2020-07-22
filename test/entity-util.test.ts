/* Copyright (c) 2019-2020 voxgig and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const EntityUtilPlugin = require('../')


lab.test('validate', PluginValidator(EntityUtilPlugin, module))

lab.test('plugin-load', async () => {
  return await seneca_instance(null, null).ready()
})

lab.test('happy', async () => {
  var si = seneca_instance(null, { rtag: { active: true } })
  var foo_a = await si.entity('foo', { a: 1 }).save$()
  expect(foo_a).contains({ a: 1 })
  expect(foo_a.rtag.length).equal(
    si.find_plugin('entity_util').defaults.rtag.len
  )

  var first = foo_a.rtag

  var foo_b = await foo_a.save$()
  var second = foo_b.rtag

  expect(first).not.equal(second)

  // NOTE: Seneca entity updates in situ
  expect(foo_a.rtag).equal(foo_b.rtag)
})

lab.test('resolve', async () => {
  var si = seneca_instance(null, { rtag: { active: true } })

  var HIT = 1
  var MISS = 2

  function make_resolver(foo_id: string) {
    return async function resolver() {
      var foo = await si.entity('foo').load$(foo_id)
      var bar = await si.entity('bar').load$(foo.bar_id)
      var out: any = { foo: foo, bar: bar }

      if (foo.test_no_cache) {
        out.rtag_cache$ = false
      }


      return out
    }
  }

  var bar0 = await si.entity('bar').make$({ b: 1 }).save$()
  var foo0 = await si
    .entity('foo')
    .make$({ handle: 'foo0', a: 1, bar_id: bar0.id })
    .save$()

  var out0 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out0.foo.a).equal(1)
  expect(out0.bar.b).equal(1)
  expect(out0.rtag$).equal(MISS)

  var out1 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out1.foo.a).equal(1)
  expect(out1.bar.b).equal(1)
  expect(out1.rtag$).equal(HIT)

  bar0.b = 2
  await bar0.save$()
  await foo0.save$() // kicks util

  var out2 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out2.foo.a).equal(1)
  expect(out2.bar.b).equal(2)
  expect(out2.rtag$).equal(MISS)

  var out3 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out3.foo.a).equal(1)
  expect(out3.bar.b).equal(2)
  expect(out3.rtag$).equal(HIT)

  var out4 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out4.foo.a).equal(1)
  expect(out4.bar.b).equal(2)
  expect(out4.rtag$).equal(HIT)

  foo0.test_no_cache = true
  await foo0.save$() // kicks util

  var out5 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out5.foo.a).equal(1)
  expect(out5.bar.b).equal(2)
  expect(out5.rtag$).equal(MISS)

  // Still a MISS as we turned off caching with rtag_cache$:false
  var out6 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out6.foo.a).equal(1)
  expect(out6.bar.b).equal(2)
  expect(out6.rtag$).equal(MISS)

  var stats = await si.post('role:cache,stats:rtag')
  expect(stats).equal({
    hit: 3,
    miss: 4,
    space: { test0: { hit: 3, miss: 4 } },
  })
})

lab.test('resolve-entity', async () => {
  var si = await seneca_instance(null, { rtag: { active: true } }).ready()

  var entity_util = si.export('entity_util')

  var HIT = entity_util.HIT
  var MISS = entity_util.MISS

  function make_resolver(foo_id: string) {
    return async function resolver() {
      var foo = await si.entity('foo').load$(foo_id)
      var bar = await si.entity('bar').load$(foo.bar_id)
      return bar
    }
  }

  var bar0 = await si.entity('bar').make$({ b: 1 }).save$()
  var foo0 = await si
    .entity('foo')
    .make$({ handle: 'foo0', a: 1, bar_id: bar0.id })
    .save$()

  var out0 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out0.b).equal(1)
  expect(out0.rtag$).equal(MISS)

  var out1 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out1.b).equal(1)
  expect(out1.rtag$).equal(HIT)

  bar0.b = 2
  await bar0.save$()
  await foo0.save$() // kicks util

  var out2 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out2.b).equal(2)
  expect(out2.rtag$).equal(MISS)

  var out3 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out3.b).equal(2)
  expect(out3.rtag$).equal(HIT)

  var out4 = await si.post('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  expect(out4.b).equal(2)
  expect(out4.rtag$).equal(HIT)

  var stats = await si.post('role:cache,stats:rtag')
  expect(stats).equal({
    hit: 3,
    miss: 2,
    space: { test0: { hit: 3, miss: 2 } },
  })
})

lab.test('when', async () => {
  var si = seneca_instance(null, { when: { active: true } })

  var a1 = await si.entity('zed/foo').data$({ a: 1 }).save$()

  var a1_c = a1.t_c
  expect(a1.t_c).about(Date.now(), 200)
  expect(a1.t_m).about(Date.now(), 200)
  expect(a1.t_c).equal(a1.t_m)

  await new Promise((r) => {
    setTimeout(r, 1000)
  })
  a1.x = 1

  await a1.save$()
  expect(a1.t_c).equal(a1_c)
  expect(a1.t_m).about(Date.now(), 200)
})

lab.test('duration', async () => {
  var si = await Seneca(null, { legacy: { transport: false } })
    .test()
    .use('promisify')
    .use('entity')
    .ready()

  si.add('role:entity,cmd:save', function save_delay(msg: any, reply: any) {
    setTimeout(this.prior.bind(this, msg, reply), 500)
  })

  si.use(EntityUtilPlugin, { duration: { active: true } })

  await si.ready()

  return new Promise((s, f) => {
    si.entity('zed/foo')
      .data$({ a: 1 })
      .save$(function(err: any, a1: any, meta: any) {
        if (err) return f(err)
        expect(a1.d$).about(500, 100)
        expect(meta.custom.entity_util.duration[meta.id]).about(500, 100)

        a1.list$(function(err: any, list: any) {
          if (err) return f(err)
          expect(list.d$).about(0, 10)
          s()
        })
      })
  })
})

lab.test('archive', async () => {
  var si = seneca_instance(null, {
    archive: { active: true, custom_props: ['qaz'] },
  })
  si.quiet()
  si = si.delegate(null, { custom: { qaz: { w: 1 } } })

  var a1 = await si.entity('zed/foo').data$({ a: 1 }).save$()
  var a2 = await si.entity('zed/foo').data$({ a: 2 }).save$()

  await a1.remove$()
  var list = await a1.list$()
  expect(list[0].a).equal(2)

  try {
    await a2.remove$({ a: 2 })
  } catch (e) {
    expect(e.code).equal('archive-requires-id')
  }

  var a1r = await si.entity('sys/archive').load$({ ent_id: a1.id })

  expect(a1r).includes({
    ent_id: a1.id,
    qaz: { w: 1 },
    entity: '-/zed/foo',
    base: 'zed',
    name: 'foo',
  })

  expect(a1r.data).includes({ a: 1 })
  expect(a1r.zone).not.exists()
  expect(a1r.when).about(Date.now(), 200)
})

lab.test('duplicate-rtag', async () => {
  var si = await seneca_instance(null, { rtag: { active: true } }).ready()

  function make_resolver(foo_id: string) {
    return async function resolver() {
      var foo = await si.entity('foo').load$(foo_id)
      var bar = await si.entity('bar').load$(foo.bar_id)
      await new Promise((r) => {
        setTimeout(r, 1000)
      })
      return { foo: foo, bar: bar }
    }
  }

  var bar0 = await si.entity('bar').make$({ b: 1 }).save$()
  var foo0 = await si
    .entity('foo')
    .make$({ handle: 'foo0', a: 1, bar_id: bar0.id })
    .save$()

  si.act('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })
  si.act('role:cache,resolve:rtag,space:test0', {
    key: foo0.handle,
    rtag: foo0.rtag,
    resolver: make_resolver(foo0.id),
  })

  await si.ready()
})

function seneca_instance(config: any, plugin_options: any) {
  return Seneca(config, { legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use(EntityUtilPlugin, plugin_options)
}