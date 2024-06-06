/* Copyright (c) 2019-2024 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* $lab:coverage:on$ */
// TODO: replace with Gubu
const Joi = require('@hapi/joi');
module.exports = entity_util;
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
        human: 'no', // 'yes' - generate human readable stamps, 'only' - only human stamps
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
    },
    errors: {}
};
module.exports.errors = {};
function entity_util(options) {
    const seneca = this;
    const rtag = seneca.util.Nid({ length: options.rtag.len });
    const HIT = 1;
    const MISS = 2;
    const stats = {
        rtag: {
            hit: 0,
            miss: 0,
            space: {},
        },
    };
    const derive_router = seneca.util.Patrun();
    // TODO: rename role->sys
    seneca
        .message('sys:entity,cmd:save', cmd_save_util)
        .message('sys:entity,cmd:load', cmd_load_util)
        .message('sys:entity,cmd:list', cmd_list_util)
        .message('sys:entity,cmd:remove', cmd_remove_util)
        .message('sys:entity,derive:add', derive_add)
        .message('sys:entity,derive:list', derive_list)
        .message('role:cache,resolve:rtag', resolve_rtag)
        .message('role:cache,stats:rtag', stats_rtag);
    Object.assign(stats_rtag, {
        desc: 'Get rtag cache usage statistics.',
    });
    Object.assign(cmd_save_util, {
        desc: 'Override sys:entity,cmd:save to apply utilities.',
    });
    Object.assign(resolve_rtag, {
        desc: 'Use rtag to load cached version of expensive result.',
        validate: {
            space: Joi.string().required(),
            key: Joi.string().required(),
            rtag: Joi.string().required(),
            // Generate a fresh result to cache
            resolver: Joi.func().required(),
        },
    });
    function derive_add(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let match = this.util.Jsonic(msg.match);
            let spec = derive_router.find(match, true);
            if (null != spec) {
                spec = this.util.deep(spec, msg.spec);
            }
            else {
                spec = msg.spec;
            }
            derive_router.add(match, spec);
        });
    }
    function derive_list(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var match = this.util.Jsonic(msg.match);
            return derive_router.list(match);
        });
    }
    function stats_rtag() {
        return __awaiter(this, void 0, void 0, function* () {
            return stats.rtag;
        });
    }
    function cmd_save_util(msg, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            const ent = msg.ent;
            if (options.rtag.active) {
                ent[options.rtag.field] = rtag(); // always override
            }
            if (options.when.active) {
                ent[options.when.field_modified] = start;
                let human = 'n' !== options.when.human[0];
                let humanStamp = human ? intern.humanify(start) : -1;
                if (human) {
                    ent[options.when.field_modified + 'h'] = humanStamp;
                }
                if (null == ent.id) {
                    ent[options.when.field_created] = start;
                    if (human) {
                        ent[options.when.field_created + 'h'] = humanStamp;
                    }
                }
                if ('o' === options.when.human[0]) {
                    delete ent[options.when.field_created];
                    delete ent[options.when.field_modified];
                }
            }
            //console.log('EU save ', options.derive.active)
            if (options.derive.active) {
                let derive = derive_router.find(msg);
                //console.log('EU save derive', derive, msg)
                if (derive) {
                    intern.apply_derive(options, derive, msg, meta);
                }
            }
            //console.log('EU prior', msg.ent.data$())
            var out = yield this.prior(msg);
            //console.log('EU prior out', out.data$())
            intern.apply_duration(out, meta, start, options);
            return out;
        });
    }
    function cmd_load_util(msg, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            var start = Date.now();
            var out = yield this.prior(msg);
            intern.apply_duration(out, meta, start, options);
            return out;
        });
    }
    function cmd_list_util(msg, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            var start = Date.now();
            var out = yield this.prior(msg);
            intern.apply_duration(out, meta, start, options);
            return out;
        });
    }
    function cmd_remove_util(msg, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            var start = Date.now();
            // TODO: only supports id-based remove
            if (options.archive.active) {
                var id = msg.q.id;
                if (null == id) {
                    this.fail('archive-requires-id', { q: msg.q });
                }
                var old = yield msg.qent.load$(id);
                var canon = old.canon$({ object: true });
                var old_data = old.data$(false);
                var data = {};
                options.archive.custom_props.forEach((p) => {
                    data[p] = meta.custom[p];
                });
                data.when = Date.now();
                data.data = old_data;
                data.entity = old.entity$;
                data.ent_id = old.id;
                data.zone = canon.zone;
                data.base = canon.base;
                data.name = canon.name;
                yield this.entity(options.archive.entity).data$(data).save$();
            }
            var out = yield this.prior(msg);
            intern.apply_duration(out, meta, start, options);
            return out;
        });
    }
    const loading = {};
    function resolve_rtag(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const seneca = this;
            const space = msg.space;
            const key = msg.key;
            const rtag = msg.rtag;
            const resolver = msg.resolver;
            const id = space + '~' + key + '~' + rtag;
            var cache_entry = yield seneca.entity('sys/cache').load$(id);
            if (cache_entry) {
                var entrydata = cache_entry.data;
                var entryout = entrydata;
                // TODO: need a general entity hydration util as also needed by transport
                if (entrydata.__entity$) {
                    if (options.rtag.clone_before_hydrate) {
                        entrydata = Object.assign({}, entrydata);
                    }
                    entrydata.entity$ = entrydata.__entity$;
                    delete entrydata.__entity$;
                    entryout = seneca.entity(entrydata);
                }
                if (options.rtag.annotate) {
                    entryout.rtag$ = HIT;
                }
                stats.rtag.hit++;
                (stats.rtag.space[space] = stats.rtag.space[space] || {
                    hit: 0,
                    miss: 0,
                }).hit++;
                return entryout;
            }
            else {
                var origdata = yield resolver.call(seneca);
                var cachedata = origdata;
                stats.rtag.miss++;
                (stats.rtag.space[space] = stats.rtag.space[space] || {
                    hit: 0,
                    miss: 0,
                }).miss++;
                if (cachedata && false !== cachedata.rtag_cache$) {
                    if (cachedata.entity$) {
                        cachedata = cachedata.data$();
                        // Avoid seneca-entity auto replacement of entities with id
                        cachedata.__entity$ = cachedata.entity$;
                        delete cachedata.entity$;
                    }
                    cache_entry = seneca.entity('sys/cache').make$({
                        id$: id,
                        when: Date.now(),
                    });
                    cache_entry.data = cachedata;
                    // Avoid spurious error messages form cache duplicates
                    if (loading[id]) {
                        var try_count = 0;
                        while (loading[id] && try_count < 11) {
                            try_count++;
                            yield new Promise((r) => {
                                setImmediate(r);
                            });
                        }
                    }
                    loading[id] = true;
                    var cache_entry_exists = yield seneca.entity('sys/cache').load$(id);
                    if (!cache_entry_exists) {
                        yield cache_entry.save$();
                    }
                    delete loading[id];
                }
                if (options.rtag.annotate) {
                    origdata.rtag$ = MISS;
                }
                return origdata;
            }
        });
    }
    return {
        name: 'entity-util',
        export: {
            HIT: HIT,
            MISS: MISS,
            derive: derive_router
        },
    };
}
const intern = (module.exports.intern = {
    apply_duration: function (out, meta, start, options) {
        if (options.duration.active) {
            var duration = Date.now() - start;
            meta.custom.entity_util = (meta.custom.entity_util || { duration: {} });
            meta.custom.entity_util.duration[meta.id] = duration;
            if (out) {
                out[options.duration.annotation] = duration;
            }
            // TODO: rolling stats
        }
    },
    apply_derive: function (options, derive, msg, meta) {
        for (let fieldname in derive.fields) {
            let fieldspec = derive.fields[fieldname];
            //console.log('EU apply_derive', fieldname, 'function' === typeof fieldspec.build, fieldspec)
            if ('function' === typeof fieldspec.build) {
                msg.ent[fieldname] = fieldspec.build(msg.ent, { options, msg, meta, derive });
            }
            //console.log('EU apply_derive ent', msg.ent.data$())
        }
    },
    // TODO: confirm works
    humanify(when) {
        const d = new Date(when);
        // Only accurate to hundreth of a second as integer must be < 2^53
        return +(d.toISOString().replace(/[^\d]/g, '').replace(/\d$/, ''));
        // return +(d.toISOString().replace(/[^\d]/g, ''))
    }
});
//# sourceMappingURL=entity-util.js.map