
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* ../src/Route.svelte generated by Svelte v3.37.0 */

    // (9:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*components*/ ctx[0][0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*components*/ ctx[0][0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(9:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (5:0) {#if components.length > 1}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*components*/ ctx[0][0];

    	function switch_props(ctx) {
    		return {
    			props: {
    				$$slots: { "route-child": [create_route_child_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*$$scope, components*/ 3) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*components*/ ctx[0][0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(5:0) {#if components.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (7:2) 
    function create_route_child_slot(ctx) {
    	let route;
    	let current;

    	route = new Route({
    			props: {
    				slot: "route-child",
    				components: /*components*/ ctx[0].slice(1)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_changes = {};
    			if (dirty & /*components*/ 1) route_changes.components = /*components*/ ctx[0].slice(1);
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_route_child_slot.name,
    		type: "slot",
    		source: "(7:2) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*components*/ ctx[0].length > 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, []);
    	let { components } = $$props;
    	const writable_props = ["components"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    	};

    	$$self.$capture_state = () => ({ components });

    	$$self.$inject_state = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [components];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { components: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*components*/ ctx[0] === undefined && !("components" in props)) {
    			console.warn("<Route> was created without expected prop 'components'");
    		}
    	}

    	get components() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set components(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../src/Router.svelte generated by Svelte v3.37.0 */

    // (10:0) {#if $currentRoute}
    function create_if_block(ctx) {
    	let route;
    	let current;

    	route = new Route({
    			props: {
    				components: /*$currentRoute*/ ctx[0].components
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_changes = {};
    			if (dirty & /*$currentRoute*/ 1) route_changes.components = /*$currentRoute*/ ctx[0].components;
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:0) {#if $currentRoute}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$currentRoute*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$currentRoute*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$currentRoute*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $currentRoute;
    	validate_store(currentRoute, "currentRoute");
    	component_subscribe($$self, currentRoute, $$value => $$invalidate(0, $currentRoute = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { config } = $$props;
    	initRouter(config);
    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		Route,
    		currentRoute,
    		initRouter,
    		config,
    		$currentRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(1, config = $$props.config);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$currentRoute, config];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { config: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[1] === undefined && !("config" in props)) {
    			console.warn("<Router> was created without expected prop 'config'");
    		}
    	}

    	get config() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../src/Link.svelte generated by Svelte v3.37.0 */
    const file$a = "../src/Link.svelte";

    function create_fragment$a(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", /*href*/ ctx[1]);
    			attr_dev(a, "class", /*cssClasses*/ ctx[2]);
    			attr_dev(a, "role", /*role*/ ctx[0]);
    			add_location(a, file$a, 31, 0, 678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*onClick*/ ctx[3]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*href*/ 2) {
    				attr_dev(a, "href", /*href*/ ctx[1]);
    			}

    			if (!current || dirty & /*cssClasses*/ 4) {
    				attr_dev(a, "class", /*cssClasses*/ ctx[2]);
    			}

    			if (!current || dirty & /*role*/ 1) {
    				attr_dev(a, "role", /*role*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $currentPath;
    	validate_store(currentPath, "currentPath");
    	component_subscribe($$self, currentPath, $$value => $$invalidate(9, $currentPath = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Link", slots, ['default']);

    	let { path } = $$props,
    		{ activeClass = "active" } = $$props,
    		{ resetScroll = true } = $$props,
    		{ scrollToId } = $$props,
    		{ role } = $$props;

    	let { class: classes } = $$props;
    	let href;
    	let cssClasses = classes || "";

    	function onClick(event) {
    		push({ path, resetScroll, scrollToId });
    	}

    	const writable_props = ["path", "activeClass", "resetScroll", "scrollToId", "role", "class"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("path" in $$props) $$invalidate(4, path = $$props.path);
    		if ("activeClass" in $$props) $$invalidate(5, activeClass = $$props.activeClass);
    		if ("resetScroll" in $$props) $$invalidate(6, resetScroll = $$props.resetScroll);
    		if ("scrollToId" in $$props) $$invalidate(7, scrollToId = $$props.scrollToId);
    		if ("role" in $$props) $$invalidate(0, role = $$props.role);
    		if ("class" in $$props) $$invalidate(8, classes = $$props.class);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		currentPath,
    		push,
    		path,
    		activeClass,
    		resetScroll,
    		scrollToId,
    		role,
    		classes,
    		href,
    		cssClasses,
    		onClick,
    		$currentPath
    	});

    	$$self.$inject_state = $$props => {
    		if ("path" in $$props) $$invalidate(4, path = $$props.path);
    		if ("activeClass" in $$props) $$invalidate(5, activeClass = $$props.activeClass);
    		if ("resetScroll" in $$props) $$invalidate(6, resetScroll = $$props.resetScroll);
    		if ("scrollToId" in $$props) $$invalidate(7, scrollToId = $$props.scrollToId);
    		if ("role" in $$props) $$invalidate(0, role = $$props.role);
    		if ("classes" in $$props) $$invalidate(8, classes = $$props.classes);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("cssClasses" in $$props) $$invalidate(2, cssClasses = $$props.cssClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*path, href, $currentPath, classes, activeClass*/ 818) {
    			{
    				$$invalidate(1, href = path);
    				if (href.charAt(0) !== "/" && !href.startsWith("#/")) $$invalidate(1, href = "/" + href);
    				if (href.charAt(0) !== "#") $$invalidate(1, href = "#" + href);
    				const isActive = $currentPath === path || path !== "/" && $currentPath.startsWith(path);
    				if (isActive) $$invalidate(2, cssClasses = classes ? classes + " " + activeClass : activeClass); else $$invalidate(2, cssClasses = classes);
    			}
    		}
    	};

    	return [
    		role,
    		href,
    		cssClasses,
    		onClick,
    		path,
    		activeClass,
    		resetScroll,
    		scrollToId,
    		classes,
    		$currentPath,
    		$$scope,
    		slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			path: 4,
    			activeClass: 5,
    			resetScroll: 6,
    			scrollToId: 7,
    			role: 0,
    			class: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*path*/ ctx[4] === undefined && !("path" in props)) {
    			console.warn("<Link> was created without expected prop 'path'");
    		}

    		if (/*scrollToId*/ ctx[7] === undefined && !("scrollToId" in props)) {
    			console.warn("<Link> was created without expected prop 'scrollToId'");
    		}

    		if (/*role*/ ctx[0] === undefined && !("role" in props)) {
    			console.warn("<Link> was created without expected prop 'role'");
    		}

    		if (/*classes*/ ctx[8] === undefined && !("class" in props)) {
    			console.warn("<Link> was created without expected prop 'class'");
    		}
    	}

    	get path() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeClass() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeClass(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resetScroll() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resetScroll(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollToId() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollToId(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const currentRoute = writable(null);
    const currentPath = writable('');

    let config = {};
    const routerHistory = [];
    let currentHistoryIndex = null;

    // ROUTER INIT

    function initRouter (initialConfig) {
    	config.routes = flattenRoutes(initialConfig.routes);

    	// Render the first child of the parent route
    	config.renderFirstChild = initialConfig.renderFirstChild || true;

    	// Reset the scroll position on route change
    	config.resetScroll = initialConfig.resetScroll || true;

    	// Route that will be used if no route is matched
    	config.errorRoute = {
    		path: '',
    		components: [initialConfig.notFoundComponent]
    	};

    	window.addEventListener('popstate', onPopState);
    	history.scrollRestoration = 'manual';

    	// push(config.routes[0].path);
    	push(window.location.pathname);
    }

    function flattenRoutes (routesTree) {
    	const routes = [];

    	routesTree.forEach((route) => {
    		const flatRoute = {
    			path: route.path,
    			components: route.component ? [route.component] : route.components,
    			blockPageScroll: route.blockPageScroll
    		};

    		// All paths should start with /
    		if (flatRoute.path.charAt(0) !== '/') flatRoute.path = '/' + flatRoute.path;

    		if (route.children) {
    			const children = flattenRoutes(route.children);

    			const firstChild = children[0];

    			routes.push({
    				path: flatRoute.path,
    				components: config.renderFirstChild ? flatRoute.components : [...flatRoute.components, ...firstChild.components]
    			});

    			children.forEach((child, index) => {

    				// If the first child does not have a path
    				// it will never be rendered on its own
    				if (index === 0 && !child.path) return;

    				routes.push({
    					path: flatRoute.path + child.path,
    					components: [...flatRoute.components, ...child.components]
    				});
    			});
    		} else {
    			routes.push(flatRoute);
    		}
    	});

    	return routes;
    }

    // UTILS

    function getHistoryItemById (id) {
    	return routerHistory.find((item) => item.id === id);
    }

    function getLastHistoryItem () {
    	return routerHistory[routerHistory.length - 1];
    }

    function getHistoryItemIndexById (id) {
    	return routerHistory.findIndex((item) => item.id === id);
    }

    function setScroll ({x, y}) {
    	window.scrollTo({
    		top: y,
    		left: x
    	});
    }

    function getScrollPositionById (id) {
    	const element = document.getElementById(id);

    	if (element) {
    		// Find the best scroll position to center the element on the viewport
    		const rectangle = element.getBoundingClientRect();

    		let scrollTop = rectangle.top - window.innerHeight / 2;
    		let scrollLeft = rectangle.left - window.innerWidth / 2;

    		const position = {
    			x: scrollLeft < 0 ? 0 : scrollLeft,
    			y: scrollTop < 0 ? 0 : scrollTop
    		};

    		return position;
    	} else {
    		throw `Element id "${id}" doesn't exist in the page`;
    	}
    }

    function getRouteFromPath (path) {
    	// Clean the path because paths on routes will always start with /
    	path = path.charAt(0) === '#' ? path.slice(1) : path;
    	path = path.charAt(0) !== '/' ? '/' + path : path;

    	for (var i = 0; i < config.routes.length; i++) {
    		const route = config.routes[i];
    		if (route.path === path) return route;
    	}

    	// If we haven't matched a route we return the error route
    	return config.errorRoute;
    }

    function blockPageScroll () {
    	// console.log('blocking scroll');
    	document.body.style.overflow = 'hidden';
    }

    function unblockPageScroll () {
    	document.body.style.overflow = 'auto';
    }

    function saveScrollPositionToLastHistoryItem () {
    	const lastHistoryItem = getLastHistoryItem();

    	if (lastHistoryItem) {
    		lastHistoryItem.scrollPosition = {
    			x: window.scrollX,
    			y: window.scrollY
    		};
    	}
    }

    // NAVIGATION

    async function push (options) {

    	if (typeof options === 'string') {
    		options = {
    			path: options
    		};
    	}

    	// If we're pushing and we're not on the last history item
    	// we need to delete the following items in the history
    	if (currentHistoryIndex !== null && currentHistoryIndex !== routerHistory.length - 1) {
    		routerHistory.splice(currentHistoryIndex + 1);
    	}

    	saveScrollPositionToLastHistoryItem();

    	// Find the route from a path
    	const route = getRouteFromPath(options.path);

    	// Trigger updates on the UI
    	currentPath.set(route.path);
    	currentRoute.set(route);

    	await tick();

    	if (route.blockPageScroll) blockPageScroll();
    	else unblockPageScroll();

    	// Determine the position to scroll to after the navigation
    	let scrollPosition;

    	// If the route doesn't block scroll
    	// And the router is configured to reset scroll on navigation
    	// And the Link is not blocking the scroll to reset...
    	if (route.blockPageScroll !== true && config.resetScroll && options.resetScroll !== false) {
    		scrollPosition = options.scrollToId ? getScrollPositionById(options.scrollToId) : {x: 0, y: 0};
    		if (scrollPosition) setScroll(scrollPosition);
    	}

    	// Create a new history item
    	const historyItem = {
    		id: Date.now(),
    		path: route.path,
    		blockPageScroll: route.blockPageScroll
    	};

    	if (options.scrollToId) {
    		historyItem.scrollToId = options.scrollToId;
    	}

    	// console.log({currentHistoryIndex});

    	routerHistory.push(historyItem);
    	currentHistoryIndex = routerHistory.length - 1;

    	window.history.pushState({id: historyItem.id}, '', options.path);
    }

    function back (options) {
    	if (options.fallbackPath && routerHistory.length === 1) {
    		console.log('fallback!', routerHistory.length);
    		push(options.fallbackPath);
    	} else {
    		console.log('going back!');
    		saveScrollPositionToLastHistoryItem();
    		window.history.back();
    	}
    }

    async function onPopState (event) {
    	// Find the history item by using the id
    	const id = event.state.id;
    	const historyItem = getHistoryItemById(id);
    	currentHistoryIndex = getHistoryItemIndexById(id);

    	// console.log({currentHistoryIndex});
    	// console.log(historyItem);

    	if (!historyItem) return;

    	const route = getRouteFromPath(historyItem.path);

    	// Trigger updates on the UI
    	currentPath.set(route.path);
    	currentRoute.set(route);

    	await tick();

    	if (route.blockPageScroll) blockPageScroll();
    	else unblockPageScroll();

    	if (historyItem.scrollPosition || historyItem.scrollToId) {
    		const scrollPosition = historyItem.scrollToId ? getScrollPositionById(historyItem.scrollToId) : historyItem.scrollPosition;
    		if (scrollPosition) setScroll(scrollPosition);
    	}
    }

    /* src/components/Menu.svelte generated by Svelte v3.37.0 */
    const file$9 = "src/components/Menu.svelte";

    // (9:4) <Link class="nav-link" path="/">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Home");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(9:4) <Link class=\\\"nav-link\\\" path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (12:4) <Link class="nav-link" path="/about">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("About");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(12:4) <Link class=\\\"nav-link\\\" path=\\\"/about\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:4) <Link class="nav-link" path="/nested">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Nested");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(15:4) <Link class=\\\"nav-link\\\" path=\\\"/nested\\\">",
    		ctx
    	});

    	return block;
    }

    // (18:4) <Link class="nav-link" path="/something">
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Doesn't exist");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(18:4) <Link class=\\\"nav-link\\\" path=\\\"/something\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let nav;
    	let div;
    	let ul;
    	let li0;
    	let link0;
    	let t0;
    	let li1;
    	let link1;
    	let t1;
    	let li2;
    	let link2;
    	let t2;
    	let li3;
    	let link3;
    	let current;

    	link0 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/about",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link2 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/nested",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link3 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/something",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t0 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t1 = space();
    			li2 = element("li");
    			create_component(link2.$$.fragment);
    			t2 = space();
    			li3 = element("li");
    			create_component(link3.$$.fragment);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$9, 7, 3, 191);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$9, 10, 3, 273);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$9, 13, 3, 361);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$9, 16, 3, 451);
    			attr_dev(ul, "class", "navbar-nav");
    			add_location(ul, file$9, 6, 2, 164);
    			attr_dev(div, "class", "container-fluid");
    			add_location(div, file$9, 5, 1, 132);
    			attr_dev(nav, "class", "navbar navbar-expand navbar-dark bg-primary fixed-top");
    			add_location(nav, file$9, 4, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			mount_component(link0, li0, null);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			mount_component(link1, li1, null);
    			append_dev(ul, t1);
    			append_dev(ul, li2);
    			mount_component(link2, li2, null);
    			append_dev(ul, t2);
    			append_dev(ul, li3);
    			mount_component(link3, li3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    			const link3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link3_changes.$$scope = { dirty, ctx };
    			}

    			link3.$set(link3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(link3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
    			destroy_component(link3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Link });
    	return [];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/Home.svelte generated by Svelte v3.37.0 */

    const file$8 = "src/components/Home.svelte";

    function create_fragment$8(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let p4;
    	let t11;
    	let p5;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Home";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id con ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros  velit sem eu urna. Suspendisse potenti.";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t11 = space();
    			p5 = element("p");
    			p5.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut Suspendisse potenti.";
    			add_location(h1, file$8, 0, 0, 0);
    			add_location(p0, file$8, 1, 0, 14);
    			add_location(p1, file$8, 2, 0, 703);
    			add_location(p2, file$8, 3, 0, 1282);
    			add_location(p3, file$8, 4, 0, 1797);
    			add_location(p4, file$8, 5, 0, 2367);
    			add_location(p5, file$8, 6, 0, 3056);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p5, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.37.0 */
    const file$7 = "src/components/About.svelte";
    const get_route_child_slot_changes$2 = dirty => ({});
    const get_route_child_slot_context$2 = ctx => ({});

    // (9:1) <Link class="btn btn-primary" role="button" path="/about/some-modal">
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Open modal");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(9:1) <Link class=\\\"btn btn-primary\\\" role=\\\"button\\\" path=\\\"/about/some-modal\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let div;
    	let link;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let t10;
    	let p4;
    	let t12;
    	let p5;
    	let t14;
    	let current;

    	link = new Link({
    			props: {
    				class: "btn btn-primary",
    				role: "button",
    				path: "/about/some-modal",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route_child_slot_template = /*#slots*/ ctx[0]["route-child"];
    	const route_child_slot = create_slot(route_child_slot_template, ctx, /*$$scope*/ ctx[1], get_route_child_slot_context$2);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "About";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id";
    			t3 = space();
    			div = element("div");
    			create_component(link.$$.fragment);
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id con ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t8 = space();
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut Suspendisse potenti.";
    			t10 = space();
    			p4 = element("p");
    			p4.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros  velit sem eu urna. Suspendisse potenti.";
    			t12 = space();
    			p5 = element("p");
    			p5.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t14 = space();
    			if (route_child_slot) route_child_slot.c();
    			add_location(h1, file$7, 4, 0, 63);
    			add_location(p0, file$7, 5, 0, 78);
    			attr_dev(div, "class", "mt-4 mb-4");
    			add_location(div, file$7, 7, 0, 594);
    			add_location(p1, file$7, 11, 0, 714);
    			add_location(p2, file$7, 12, 0, 1293);
    			add_location(p3, file$7, 13, 0, 1982);
    			add_location(p4, file$7, 14, 0, 2554);
    			add_location(p5, file$7, 15, 0, 3124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(link, div, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t14, anchor);

    			if (route_child_slot) {
    				route_child_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (route_child_slot) {
    				if (route_child_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(route_child_slot, route_child_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_route_child_slot_changes$2, get_route_child_slot_context$2);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(route_child_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(route_child_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			destroy_component(link);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t14);
    			if (route_child_slot) route_child_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, ['route-child']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Link });
    	return [slots, $$scope];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Modal.svelte generated by Svelte v3.37.0 */
    const file$6 = "src/components/Modal.svelte";

    function create_fragment$6(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let h5;
    	let t1;
    	let button0;
    	let t2;
    	let div1;
    	let p;
    	let t4;
    	let div2;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "A Modal";
    			t1 = space();
    			button0 = element("button");
    			t2 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t4 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Close";
    			attr_dev(h5, "class", "modal-title");
    			attr_dev(h5, "id", "exampleModalLiveLabel");
    			add_location(h5, file$6, 13, 4, 367);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn-close");
    			attr_dev(button0, "data-bs-dismiss", "modal");
    			attr_dev(button0, "aria-label", "Close");
    			add_location(button0, file$6, 14, 4, 435);
    			attr_dev(div0, "class", "modal-header");
    			add_location(div0, file$6, 12, 3, 336);
    			add_location(p, file$6, 17, 4, 592);
    			attr_dev(div1, "class", "modal-body");
    			add_location(div1, file$6, 16, 3, 563);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$6, 20, 4, 1325);
    			attr_dev(div2, "class", "modal-footer");
    			add_location(div2, file$6, 19, 3, 1294);
    			attr_dev(div3, "class", "modal-content");
    			add_location(div3, file$6, 11, 2, 305);
    			attr_dev(div4, "class", "modal-dialog");
    			add_location(div4, file$6, 10, 1, 276);
    			attr_dev(div5, "class", "modal show svelte-kjrpie");
    			attr_dev(div5, "id", "exampleModalLive");
    			attr_dev(div5, "tabindex", "-1");
    			attr_dev(div5, "aria-labelledby", "exampleModalLiveLabel");
    			attr_dev(div5, "aria-modal", "true");
    			attr_dev(div5, "role", "dialog");
    			add_location(div5, file$6, 9, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*closeModal*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*closeModal*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);

    	function closeModal() {
    		back({ fallbackPath: "/about" });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ back, closeModal });
    	return [closeModal];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Error.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1 } = globals;
    const file$5 = "src/components/Error.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Not found!";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "404 Error";
    			add_location(h1, file$5, 1, 1, 18);
    			add_location(h2, file$5, 2, 1, 39);
    			attr_dev(div, "id", "Error");
    			attr_dev(div, "class", "svelte-ytp4ia");
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Error", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Nested.svelte generated by Svelte v3.37.0 */
    const file$4 = "src/components/Nested.svelte";
    const get_route_child_slot_changes$1 = dirty => ({});
    const get_route_child_slot_context$1 = ctx => ({});

    // (10:2) <Link class="nav-link" path="/nested/child-a" resetScroll={false}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Child A");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(10:2) <Link class=\\\"nav-link\\\" path=\\\"/nested/child-a\\\" resetScroll={false}>",
    		ctx
    	});

    	return block;
    }

    // (13:2) <Link class="nav-link" path="/nested/child-b" resetScroll={false}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Child B");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(13:2) <Link class=\\\"nav-link\\\" path=\\\"/nested/child-b\\\" resetScroll={false}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let ul;
    	let li0;
    	let link0;
    	let t4;
    	let li1;
    	let link1;
    	let t5;
    	let current;

    	link0 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/nested/child-a",
    				resetScroll: false,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				class: "nav-link",
    				path: "/nested/child-b",
    				resetScroll: false,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route_child_slot_template = /*#slots*/ ctx[0]["route-child"];
    	const route_child_slot = create_slot(route_child_slot_template, ctx, /*$$scope*/ ctx[1], get_route_child_slot_context$1);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Nested";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe, atque, itaque. Minima nulla nostrum, voluptates temporibus reprehenderit ullam eaque voluptas maxime beatae, ratione nisi qui amet, in voluptatem aspernatur. Voluptatum.";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t4 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t5 = space();
    			if (route_child_slot) route_child_slot.c();
    			add_location(h1, file$4, 4, 0, 63);
    			attr_dev(p, "class", "mb-4");
    			add_location(p, file$4, 5, 0, 79);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$4, 8, 1, 381);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$4, 11, 1, 494);
    			attr_dev(ul, "id", "tab-menu");
    			attr_dev(ul, "class", "nav nav-tabs mb-4");
    			add_location(ul, file$4, 7, 0, 335);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			mount_component(link0, li0, null);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			mount_component(link1, li1, null);
    			insert_dev(target, t5, anchor);

    			if (route_child_slot) {
    				route_child_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (route_child_slot) {
    				if (route_child_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(route_child_slot, route_child_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_route_child_slot_changes$1, get_route_child_slot_context$1);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(route_child_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(route_child_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
    			destroy_component(link0);
    			destroy_component(link1);
    			if (detaching) detach_dev(t5);
    			if (route_child_slot) route_child_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nested", slots, ['route-child']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nested> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Link });
    	return [slots, $$scope];
    }

    class Nested extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nested",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ChildA.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/components/ChildA.svelte";
    const get_route_child_slot_changes = dirty => ({});
    const get_route_child_slot_context = ctx => ({});

    // (10:1) <Link class="btn btn-primary" role="button" path="/nested/child-b" scrollToId="tab-menu">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Go to child B");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:1) <Link class=\\\"btn btn-primary\\\" role=\\\"button\\\" path=\\\"/nested/child-b\\\" scrollToId=\\\"tab-menu\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h3;
    	let t1;
    	let p0;
    	let t3;
    	let div;
    	let link;
    	let t4;
    	let p1;
    	let t6;
    	let current;

    	link = new Link({
    			props: {
    				class: "btn btn-primary",
    				role: "button",
    				path: "/nested/child-b",
    				scrollToId: "tab-menu",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route_child_slot_template = /*#slots*/ ctx[0]["route-child"];
    	const route_child_slot = create_slot(route_child_slot_template, ctx, /*$$scope*/ ctx[1], get_route_child_slot_context);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Child A";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit am Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc v mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t3 = space();
    			div = element("div");
    			create_component(link.$$.fragment);
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t6 = space();
    			if (route_child_slot) route_child_slot.c();
    			add_location(h3, file$3, 4, 0, 63);
    			add_location(p0, file$3, 6, 0, 81);
    			attr_dev(div, "class", "mt-4 mb-4");
    			add_location(div, file$3, 8, 0, 659);
    			attr_dev(p1, "class", "mb-4");
    			add_location(p1, file$3, 12, 0, 802);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(link, div, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t6, anchor);

    			if (route_child_slot) {
    				route_child_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (route_child_slot) {
    				if (route_child_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(route_child_slot, route_child_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_route_child_slot_changes, get_route_child_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(route_child_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(route_child_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			destroy_component(link);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (route_child_slot) route_child_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ChildA", slots, ['route-child']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ChildA> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Link });
    	return [slots, $$scope];
    }

    class ChildA extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChildA",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/ChildB.svelte generated by Svelte v3.37.0 */

    const file$2 = "src/components/ChildB.svelte";

    function create_fragment$2(ctx) {
    	let h3;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Child B";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas porttitor diam cursus ligula tristique bibendum. Aliquam at erat quis tellus adipiscing tempus. Cras sed rutrum velit. Curabitur vel lacus eget erat tincidunt fringilla nec in ante. Pellentesque lacinia tellus nec neque tempus fermentum. Pellentesque ligula arcu, auctor at sagittis id, imperdiet eget tortor. Pellentesque imperdiet tempus risus non condimentum. Phasellus ut venenatis turpis. Fusce tincidunt nulla sit amet elit lacinia id consequat eros lacinia. Phasellus ut justo velit. Aenean dignissim, nunc vitae molestie blandit, mi diam vehicula ligula, nec vehicula velit sem eu urna. Suspendisse potenti.";
    			add_location(h3, file$2, 0, 0, 0);
    			add_location(p0, file$2, 1, 0, 17);
    			add_location(p1, file$2, 2, 0, 706);
    			add_location(p2, file$2, 3, 0, 1395);
    			add_location(p3, file$2, 4, 0, 2084);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ChildB", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ChildB> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ChildB extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChildB",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/GrandchildA.svelte generated by Svelte v3.37.0 */

    const file$1 = "src/components/GrandchildA.svelte";

    function create_fragment$1(ctx) {
    	let h4;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Grandchild A";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque impedit aliquam commodi, reiciendis. Atque tenetur fugiat, rem praesentium quibusdam molestiae nisi obcaecati aspernatur mollitia, quas fuga suscipit necessitatibus corrupti dicta!";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque impedit aliquam commodi, reiciendis. Atque tenetur fugiat, rem praesentium quibusdam molestiae nisi obcaecati aspernatur mollitia, quas fuga suscipit necessitatibus corrupti dicta!";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque impedit aliquam commodi, reiciendis. Atque tenetur fugiat, rem praesentium quibusdam molestiae nisi obcaecati aspernatur mollitia, quas fuga suscipit necessitatibus corrupti dicta!";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque impedit aliquam commodi, reiciendis. Atque tenetur fugiat, rem praesentium quibusdam molestiae nisi obcaecati aspernatur mollitia, quas fuga suscipit necessitatibus corrupti dicta!";
    			add_location(h4, file$1, 0, 0, 0);
    			add_location(p0, file$1, 2, 0, 23);
    			add_location(p1, file$1, 3, 0, 275);
    			add_location(p2, file$1, 4, 0, 527);
    			add_location(p3, file$1, 5, 0, 779);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GrandchildA", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GrandchildA> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class GrandchildA extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GrandchildA",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var routerConfig = {
    	notFoundComponent: Error$1,
    	routes: [
    		{ path: '/', component: Home },
    		{ path: '/about', component: About },
    		{ path: '/about/some-modal', components: [About, Modal], blockPageScroll: true },
    		{
    			path: '/nested',
    			component: Nested,
    			children: [
    				{
    					path: 'child-a',
    					component: ChildA,
    					children: [
    						{ path: 'grandchild-a', component: GrandchildA }
    					]
    				},
    				{ path: 'child-b', component: ChildB }
    			]
    		}
    	]
    };

    /* src/components/App.svelte generated by Svelte v3.37.0 */
    const file = "src/components/App.svelte";

    function create_fragment(ctx) {
    	let menu;
    	let t;
    	let div;
    	let router;
    	let current;
    	menu = new Menu({ $$inline: true });

    	router = new Router({
    			props: { config: routerConfig },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(router.$$.fragment);
    			set_style(div, "padding-top", "4rem");
    			add_location(div, file, 8, 0, 151);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(router, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Menu, Router, routerConfig });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.getElementById('app')
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
