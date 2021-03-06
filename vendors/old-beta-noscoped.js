/*!
betajs - v1.0.53 - 2016-05-30
Copyright (c) Oliver Friedmann,Victor Lingenthal
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS');
Scoped.define("module:", function () {
	return {
    "guid": "71366f7a-7da3-4e55-9a0b-ea0e4e2a9e79",
    "version": "499.1464633246540"
};
});
Scoped.require(['module:'], function (mod) {
	this.exports(typeof module != 'undefined' ? module : null, mod);
}, this);
Scoped.define("module:Class", ["module:Types", "module:Objs", "module:Functions", "module:Ids"], function (Types, Objs, Functions, Ids) {
	var Class = function () {};

	/** @suppress {checkTypes} */
	Class.extend = function (options, objects, statics, class_statics) {
		objects = objects || [];
		if (!Types.is_array(objects))
			objects = [objects];
		statics = statics || [];
		if (!Types.is_array(statics))
			statics = [statics];
		class_statics = class_statics || [];
		if (!Types.is_array(class_statics))
			class_statics = [class_statics];
		
		var parent = this;
		
		objects = Objs.map(objects, function (obj) {
			if (Types.is_function(obj))
				obj = obj(parent.prototype);
			return obj;
		});
		
		var result;
		
		// Setup JavaScript Constructor
		Objs.iter(objects, function (obj) {
			if (obj.hasOwnProperty("constructor"))
				result = obj.constructor;
		});
		var has_constructor = Types.is_defined(result);
		if (!has_constructor)
			result = function () { parent.prototype.constructor.apply(this, arguments); };
	
		// Add Parent Statics
		Objs.extend(result, parent);
	
		// Add External Statics
		Objs.iter(statics, function (stat) {
			stat = Types.is_function(stat) ? stat(parent) : stat;
			var extender = result._extender;
			Objs.extend(result, stat);
			if (stat._extender)
				result._extender = Objs.extend(Objs.clone(extender, 1), stat._extender);
		});
		
		
		// Add Class Statics
		var class_statics_keys = {};
		if (parent.__class_statics_keys) {
			for (var key in parent.__class_statics_keys) 
				result[key] = Objs.clone(parent[key], 1);
		}
		Objs.iter(class_statics, function (stat) {
			Objs.extend(result, stat);
			Objs.extend(class_statics_keys, Objs.keys(stat, true));
		});
		if (parent.__class_statics_keys)
			Objs.extend(class_statics_keys, parent.__class_statics_keys);
		result.__class_statics_keys = class_statics_keys;
		
		// Parent & Children Hierarchy
		result.parent = parent;
		result.children = [];
		result.extend = this.extend;
		if (!parent.children)
			parent.children = [];
		parent.children.push(result);
		
		// Setup Prototype
		var ctor = function () {};
		ctor.prototype = parent.prototype;
		result.prototype = new ctor();
	
		result.prototype.cls = result;
	
		
		options = Objs.extend({
		}, Types.is_string(options) ? {
			classname: options,
			register: true
		} : options);
		
		var classname = options.classname;
		if (options.scoped)
			classname = options.scoped.ns.path;
		
		result.classname = classname;
		if (classname && options.register)
			Scoped.setGlobal(classname, result);
		
		// Setup Prototype
		result.__notifications = {};
		result.__implements = {};
		
		if (parent.__notifications)
			Objs.extend(result.__notifications, parent.__notifications, 1);		
		if (parent.__implements)
			Objs.extend(result.__implements, parent.__implements, 1);		
	
		Objs.iter(objects, function (object) {
			for (var objkey in object)
				result.prototype[objkey] = result._extender && objkey in result._extender ? result._extender[objkey](result.prototype[objkey], object[objkey]) : object[objkey]; 
			//Objs.extend(result.prototype, object);
	
			// Note: Required for Internet Explorer
			if ("constructor" in object)
				result.prototype.constructor = object.constructor;
	
			if (object._notifications) {
				for (var key in object._notifications) {
					if (!result.__notifications[key])
						result.__notifications[key] = [];
					result.__notifications[key].push(object._notifications[key]);
				}
			}
			if (object._implements) {
				Objs.iter(Types.is_string(object._implements) ? [object._implements] : object._implements, function (impl) {
					result.__implements[impl] = true;
				});
			}
		});	
		delete result.prototype._notifications;
		delete result.prototype._implements;
	
		if (!has_constructor)
			result.prototype.constructor = parent.prototype.constructor;
			
		return result; 
	};
	
	
	/*
	 * 
	 * Extending the Class
	 * 
	 */
	
	Objs.extend(Class, {
		
		classname: "Class",
		
		__class_guid: "0f5499f9-f0d1-4c6c-a561-ef026a1eee05",	
		
		__notifications: {},
		
		ancestor_of: function (cls) {
			return (this == cls) || (this != Class && this.parent.ancestor_of(cls));
		},
		
		is_class: function (cls) {
			return cls && Types.is_object(cls) && ("__class_guid" in cls) && cls.__class_guid == this.__class_guid;
		},
		
		is_class_instance: function (obj) {
			return obj && Types.is_object(obj) && ("__class_instance_guid" in obj) && obj.__class_instance_guid == this.prototype.__class_instance_guid;
		},
		
		is_pure_json: function (obj) {
			return obj && Types.is_object(obj) && !this.is_class_instance(obj);
		},
		
		is_instance_of: function (obj) {
			return obj && this.is_class_instance(obj) && obj.instance_of(this);
		},
		
		define: function (parent, current) {
			var args = Functions.getArguments(arguments, 2);
			if (Types.is_object(parent)) {
				return Scoped.define(current, [], function (scoped) {
					args.unshift({scoped: scoped});
					return parent.extend.apply(parent, args);
				});
			} else {
				return Scoped.define(current, [parent], function (parent, scoped) {
					args.unshift({scoped: scoped});
					return parent.extend.apply(parent, args);
				});
			}
		},
		
		// Legacy Methods
	
		_inherited: function (cls, func) {
			return cls.parent[func].apply(this, Array.prototype.slice.apply(arguments, [2]));
		}	
		
	});
	
	
	
	
	
	
	/*
	 * 
	 * Extending the Object
	 * 
	 */
	
	Class.prototype.__class_instance_guid = "e6b0ed30-80ee-4b28-af02-7d52430ba45f";
	
	//Class.prototype.supportsGc = false;
	
	Class.prototype.constructor = function () {
		this._notify("construct");
	};
	
	Class.prototype.destroy = function () {
		this._notify("destroy");
		if (this.__auto_destroy_list) {
			for (var i = 0; i < this.__auto_destroy_list.length; ++i) {
				if ("destroy" in this.__auto_destroy_list[i])
					this.__auto_destroy_list[i].weakDestroy();
			}
		}
		var cid = this.cid();
		for (var key in this)
			delete this[key];
		Ids.objectId(this, cid);
		this.destroy = this.__destroyedDestroy;
	};
	
	Class.prototype.destroyed = function () {
		return this.destroy === this.__destroyedDestroy;
	};
	
	Class.prototype.weakDestroy = function () {
		if (!this.destroyed()) {
			if (this.__gc) {
				this.__gc.queue(this);
				return;
			}
			this.destroy();
		}
	};

	Class.prototype.__destroyedDestroy = function () {
		throw ("Trying to destroy destroyed object " + this.cid() + ": " + this.cls.classname + ".");
	};
	
	Class.prototype.enableGc = function (gc) {
		if (this.supportsGc)
			this.__gc = gc; 
	};
	
	Class.prototype.dependDestroy = function (other) {
		if (other.destroyed)
			return;
		if (this.__gc)
			other.enableGc();
		other.weakDestroy();
	};
	
	Class.prototype.cid = function () {
		return Ids.objectId(this);
	};

	Class.prototype.cls = Class;
	
	Class.prototype.as_method = function (s) {
		return Functions.as_method(this[s], this);
	};
	
	Class.prototype.auto_destroy = function (obj) {
		if (obj) {
			if (!this.__auto_destroy_list)
				this.__auto_destroy_list = [];
			var target = obj;
			if (!Types.is_array(target))
			   target = [target];
			for (var i = 0; i < target.length; ++i)
			   this.__auto_destroy_list.push(target[i]);
		}
		return obj;
	};
	
	Class.prototype._notify = function (name) {
		if (!this.cls.__notifications)
			return;
		var rest = Array.prototype.slice.call(arguments, 1);
		Objs.iter(this.cls.__notifications[name], function (entry) {
			var method = Types.is_function(entry) ? entry : this[entry];
			if (!method)
				throw this.cls.classname  + ": Could not find " + name + " notification handler " + entry;
			method.apply(this, rest);
		}, this);
	};
	
	Class.prototype.impl = function (identifier) {
		return !!(this.cls.__implements && this.cls.__implements[Types.is_string(identifier) ? identifier : identifier._implements]);
	};
	
	Class.prototype.instance_of = function (cls) {
		return this.cls.ancestor_of(cls);
	};
	
	Class.prototype.increaseRef = function () {
		this.__referenceCount = this.__referenceCount || 0;
		this.__referenceCount++;
	};
	
	Class.prototype.decreaseRef = function () {
		this.__referenceCount = this.__referenceCount || 0;
		this.__referenceCount--;
		if (this.__referenceCount <= 0)
			this.weakDestroy();
	};	
	
	Class.prototype.inspect = function () {
		return {
			header: {
				cid: this.cid(),
				classname: this.cls.classname,
				destroyed: this.destroyed()
			},
			attributes: {
				attributes_public: Objs.filter(this, function (value, key) {
					return !Types.is_function(value) && key.indexOf("_") !== 0;
				}, this),
				attributes_protected: Objs.filter(this, function (value, key) {
					return !Types.is_function(value) && key.indexOf("_") === 0 && key.indexOf("__") !== 0;
				}, this),
				attributes_private: Objs.filter(this, function (value, key) {
					return !Types.is_function(value) && key.indexOf("__") === 0;
				}, this)
			},
			methods: {
				methods_public: Objs.filter(this, function (value, key) {
					return Types.is_function(value) && key.indexOf("_") !== 0;
				}, this),
				methods_protected: Objs.filter(this, function (value, key) {
					return Types.is_function(value) && key.indexOf("_") === 0 && key.indexOf("__") !== 0;
				}, this),
				method_private: Objs.filter(this, function (value, key) {
					return Types.is_function(value) && key.indexOf("__") === 0;
				}, this)
			}
		};
	};

	
	// Legacy Methods
	
	Class.prototype._auto_destroy = function(obj) {
		return this.auto_destroy(obj);
	};
	
	Class.prototype._inherited = function (cls, func) {
		return cls.parent.prototype[func].apply(this, Array.prototype.slice.apply(arguments, [2]));
	};
	
	return Class;

});
	
Scoped.define("module:Classes.ReferenceCounterMixin", function () {
	return {
		__reference_count: 1,
		
		acquireReference: function () {
			this.__reference_count++;
		},
		
		releaseReference: function () {
			this.__reference_count--;
			if (this.__reference_count === 0)
				this.weakDestroy();
		}
	};
});

Scoped.define("module:Classes.InvokerMixin", ["module:Objs", "module:Types", "module:Functions"], function (Objs, Types, Functions) {
	return {
		
		invoke_delegate : function(invoker, members) {
			if (!Types.is_array(members))
				members = [members];
			invoker = this[invoker];
			var self = this;
			Objs.iter(members, function (member) {
				this[member] = function(member) {
					return function() {
						var args = Functions.getArguments(arguments);
						args.unshift(member);
						return invoker.apply(self, args);
					};
				}.call(self, member);
			}, this);
		}
	};
});




Scoped.define("module:Classes.HelperClassMixin", ["module:Objs", "module:Types", "module:Functions", "module:Promise"], function (Objs, Types, Functions, Promise) {
	return {
	
		addHelper: function (helper_class, options) {
			var helper = new helper_class(this, options);
			this.__helpers = this.__helpers || [];
			this.__helpers.push(this._auto_destroy(helper));
			return helper;
		},
		
		_helper: function (options) {
			this.__helpers = this.__helpers || [];
			if (Types.is_string(options)) {
				options = {
					method: options
				};
			}
			options = Objs.extend({
				fold_start: null,
				fold: function (acc, result) {
					return acc || result;
				}
			}, options);
			var args = Functions.getArguments(arguments, 1);
			var acc = options.async ? Promise.create(options.fold_start) : options.fold_start;
			for (var i = 0; i < this.__helpers.length; ++i) {
				var helper = this.__helpers[i];
				if (options.method in helper) {
					if (options.async)
						acc = Promise.func(options.fold, acc, Promise.methodArgs(helper, helper[options.method], args));
					else
						acc = options.fold(acc, helper[options.method].apply(helper, args));
				}
			}
			return acc;
		}
		
	};
});



Scoped.define("module:Classes.PathResolver", ["module:Class", "module:Objs"], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (bindings) {
				inherited.constructor.call(this);
				this._bindings = bindings || {};
			},
			
			extend: function (bindings, namespace) {
				if (namespace) {
					for (var key in bindings) {
						var value = bindings[key];
						var regExp = /\{([^}]+)\}/;
						while (true) {
							var matches = regExp.exec(value);
							if (!matches)
								break;
							value = value.replace(regExp, namespace + "." + matches[1]);
						}
						this._bindings[namespace + "." + key] = value;
					}
				} else
					this._bindings = Objs.extend(this._bindings, bindings);
			},
			
			map: function (arr) {
				var result = [];
				for (var i = 0; i < arr.length; ++i) {
					if (arr[i])
						result.push(this.resolve(arr[i]));
				}
				return result;
			},
			
			resolve : function(path) {
				var regExp = /\{([^}]+)\}/;
				while (true) {
					var matches = regExp.exec(path);
					if (!matches)
						break;
					path = path.replace(regExp, this._bindings[matches[1]]);
				}
				return this.simplify(path);
			},
			
			simplify: function (path) {
				return path.replace(/[^\/]+\/\.\.\//, "").replace(/\/[^\/]+\/\.\./, "");
			}
	
		};
	});
});


Scoped.define("module:Classes.MultiDelegatable", ["module:Class", "module:Objs"], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (objects, methods) {
				inherited.constructor.call(this);
				Objs.iter(methods, function (method) {
					this[method] = function () {
						var args = arguments;
						Objs.iter(objects, function (object) {
							object[method].apply(object, args);
						}, this);
						return this;
					};
				}, this);
			}
			
		};
	});
});



Scoped.define("module:Classes.ObjectIdScopeMixin", function () {
	return {

		__objects: {},

	    get: function (id) {
	        return this.__objects[id];
	    }

	};
});	
	
		
Scoped.define("module:Classes.ObjectIdScope", ["module:Class", "module:Classes.ObjectIdScopeMixin"], function (Class, Mixin, scoped) {
	return Class.extend({scoped: scoped}, Mixin, {
		singleton: function () {
			if (!this.__singleton)
				this.__singleton = new this();
			return this.__singleton;
		}
	});
});


Scoped.define("module:Classes.ObjectIdMixin", ["module:Classes.ObjectIdScope", "module:Objs", "module:Ids"], function (ObjectIdScope, Objs, Ids) {
	return {
	
	    _notifications: {
	        construct: "__register_object_id",
	        destroy: "__unregister_object_id"
	    },
	
	    __object_id_scope: function () {
	    	if (!this.object_id_scope)
	    		this.object_id_scope = ObjectIdScope.singleton();
            return this.object_id_scope;
	    },
	
	    __register_object_id: function () {
	        var scope = this.__object_id_scope();
	        scope.__objects[this.cid()] = this;
	    },
	
	    __unregister_object_id: function () {
	        var scope = this.__object_id_scope();
	        delete scope.__objects[this.cid()];
	    }
	
	};
});





Scoped.define("module:Comparators", ["module:Types", "module:Properties.Properties"], function (Types, Properties) {

	/**
	 * Comparator Functions
	 * 
	 * @module BetaJS.Comparators
	 */
	return {		
		
		
		/**
		 * Creates a function that compares two json object w.r.t. a json object, mapping keys to a comparison order,
		 * e.g. {'last_name': 1, 'first_name': -1, 'age': -1 }  
		 * 
		 * @param {json} object comparison object
		 * @return {function} function for comparing two objects w.r.t. the comparison object
		 */
		byObject: function (object) {
			var self = this;
			return function (left, right) {
				for (var key in object) {
					var c = 0;
					if (Properties.is_class_instance(left) && Properties.is_class_instance(right))
						c = self.byValue(left.get(key) || null, right.get(key) || null);
					else
						c = self.byValue(left[key] || null, right[key] || null);
					if (c !== 0)
						return c * object[key];
				}
				return 0;
			};
		},

		
		/**
		 * Compares to variables by the natural order in JS.
		 * 
		 * @param a value A
		 * @param b value B
		 * @return {int} 1 if a > b, -1 if a < b and 0 otherwise
		 */
		byValue: function (a, b) {
			if (Types.is_string(a))
				return a.localeCompare(b);
			if (a < b)
				return -1;
			if (a > b)
				return 1;
			return 0;
		},
		

		/**
		 * Compares two values a and b recursively.
		 * 
		 * @param a value A
		 * @param b value B
		 * @param {int} depth depth limit for the recursion, leave blank for infinite recursion
		 * @return {bool} true if both values are equal
		 */
		deepEqual: function (a, b, depth) {
			if (depth === 0)
				return true;
			if (depth === 1)
				return a === b;
			if (Types.is_array(a) && Types.is_array(b)) {
				if (a.length !== b.length)
					return false;
				for (var i = 0; i < a.length; ++i)
					if (!this.deepEqual(a[i], b[i], depth - 1))
						return false;
				return true;
			} else if (Types.is_object(a) && Types.is_object(b)) {
				if ((a && !b) || (b && !a))
					return a || b;
				for (var key in a)
					if (!this.deepEqual(a[key], b[key], depth - 1))
						return false;
				for (key in b)
					if (!(key in a))
						return false;
				return true;
			} else
				return a === b;
		},
		
		
		/**
		 * Determines whether two lists are equal. Two lists are considered equal if their elements are equal.
		 * 
		 * @param a list A
		 * @param b list B
		 * @return {bool} true if both lists are equal
		 */
		listEqual: function (a, b) {
			return this.deepEqual(a, b, 2);
		}
			
	};
});

Scoped.define("module:Events.EventsMixin", [
                                            "module:Timers.Timer",
                                            "module:Async",
                                            "module:Lists.LinkedList",
                                            "module:Functions",
                                            "module:Types",
                                            "module:Objs"
                                            ], function (Timer, Async, LinkedList, Functions, Types, Objs) {

	return {
		
		_implements: "3d63b44f-c9f0-4aa7-b39e-7cbf195122b4",

		_notifications: {
			"construct": function () {
			    this.__suspendedEvents = 0;
			    this.__suspendedEventsQueue = [];			    				
			},
			"destroy": function () {
				this.off(null, null, null);
			} 
		},

		EVENT_SPLITTER: /\s+/,

		__create_event_object: function (callback, context, options) {
			options = options || {};
			var obj = {
					callback: callback,
					context: context
			};
			if (options.eventually)
				obj.eventually = options.eventually;
			if (options.min_delay)
				obj.min_delay = new Timer({
					delay: options.min_delay,
					once: true,
					start: false,
					context: this,
					fire: function () {
						if (obj.max_delay)
							obj.max_delay.stop();
						obj.callback.apply(obj.context || this, obj.params);
					}
				});
			if (options.max_delay)
				obj.max_delay = new Timer({
					delay: options.max_delay,
					once: true,
					start: false,
					context: this,
					fire: function () {
						if (obj.min_delay)
							obj.min_delay.stop();
						obj.callback.apply(obj.context || this, obj.params);
					}
				});
			return obj;
		},

		__destroy_event_object: function (object) {
			if (object.min_delay)
				object.min_delay.destroy();
			if (object.max_delay)
				object.max_delay.destroy();
		},

		__call_event_object: function (object, params) {
			if (object.min_delay)
				object.min_delay.restart();
			if (object.max_delay)
				object.max_delay.start();
			if (!object.min_delay && !object.max_delay) {
				if (object.eventually)
					Async.eventually(object.callback, params, object.context || this);
				else
					object.callback.apply(object.context || this, params);
			} else
				object.params = params;
		},

		on: function(events, callback, context, options) {
			this.__events_mixin_events = this.__events_mixin_events || {};
			events = events.split(this.EVENT_SPLITTER);
			var event;
			while (true) {
				event = events.shift();
				if (!event)
					break;
				if (!this.__events_mixin_events[event])
					this._notify("register_event", event);
				this.__events_mixin_events[event] = this.__events_mixin_events[event] || new LinkedList();
				var event_object = this.__create_event_object(callback, context, options);
				this.__events_mixin_events[event].add(event_object);
				if (this.__events_mixin_persistent_events && this.__events_mixin_persistent_events[event]) {
					var argss = this.__events_mixin_persistent_events[event];
					for (var i = 0; i < argss.length; ++i)
						this.__call_event_object(event_object, argss[i]);
				}
			}
			return this;
		},

		off: function(events, callback, context) {
			this.__events_mixin_events = this.__events_mixin_events || {};
			if (events) {
				events = events.split(this.EVENT_SPLITTER);
				Objs.iter(events, function (event) {
					if (this.__events_mixin_events[event]) {
						this.__events_mixin_events[event].remove_by_filter(function (object) {
							var result = (!callback || object.callback == callback) && (!context || object.context == context);
							if (result && this.__destroy_event_object)
								this.__destroy_event_object(object);
							return result;
						});
						if (this.__events_mixin_events[event].count() === 0) {
							this.__events_mixin_events[event].destroy();
							delete this.__events_mixin_events[event];
							this._notify("unregister_event", event);
						}
					}
				}, this);
			} else {
				Objs.iter(this.__events_mixin_events, function (evntobj, evnt) {
					evntobj.remove_by_filter(function (object) {
						var result = (!callback || object.callback == callback) && (!context || object.context == context);
						if (result && this.__destroy_event_object)
							this.__destroy_event_object(object);
						return result;
					});
					if (evntobj.count() === 0) {
						evntobj.destroy();
						delete this.__events_mixin_events[evnt];
						this._notify("unregister_event", evnt);
					}
				}, this);
			}
			return this;
		},

		triggerAsync: function () {
			var self = this;
			var args = Functions.getArguments(arguments);
			var timeout = setTimeout(function () {
				clearTimeout(timeout);
				self.trigger.apply(self, args);
			}, 0);
		},

		trigger: function(events) {
			if (this.__suspendedEvents > 0) {
				this.__suspendedEventsQueue.push(arguments);
				return this;
			}
			var self = this;
			events = events.split(this.EVENT_SPLITTER);
			var rest = Functions.getArguments(arguments, 1);
			var event;
			if (!this.__events_mixin_events)
				return this;
			Objs.iter(events, function (event) {
				if (this.__events_mixin_events[event])
					this.__events_mixin_events[event].iterate(function (object) {
						self.__call_event_object(object, rest);
					});
				if (this.__events_mixin_events && "all" in this.__events_mixin_events)
					this.__events_mixin_events.all.iterate(function (object) {
						self.__call_event_object(object, [event].concat(rest));
					});
			}, this);
			return this;
		},
		
		persistentTrigger: function (events) {
			this.trigger.apply(this, arguments);
			events = events.split(this.EVENT_SPLITTER);
			var rest = Functions.getArguments(arguments, 1);
			this.__events_mixin_persistent_events = this.__events_mixin_persistent_events || [];
			Objs.iter(events, function (event) {
				this.__events_mixin_persistent_events[event] = this.__events_mixin_persistent_events[event] || [];
				this.__events_mixin_persistent_events[event].push(rest);
			}, this);
		},

		once: function (events, callback, context, options) {
			var self = this;
			var once = Functions.once(function() {
				self.off(events, once);
				callback.apply(this, arguments);
			});
			once._callback = callback;
			return this.on(events, once, context, options);
		},

		delegateEvents: function (events, source, prefix, params) {
			params = params || []; 
			prefix = prefix ? prefix + ":" : "";
			if (events === null) {
				source.on("all", function (event) {
					var rest = Functions.getArguments(arguments, 1);
					this.trigger.apply(this, [prefix + event].concat(params).concat(rest));
				}, this);
			} else {
				if (!Types.is_array(events))
					events = [events];
				Objs.iter(events, function (event) {
					source.on(event, function () {
						var rest = Functions.getArguments(arguments);
						this.trigger.apply(this, [prefix + event].concat(params).concat(rest));
					}, this);
				}, this);
			}
		},
		
		_eventChain: function () {},
		
		chainedTrigger: function (eventName, data) {
			data = Objs.extend({
				source: this,
				bubbles: true
			}, data);
			this.trigger(eventName, data);
			if (data.bubbles) {
				var chain = this._eventChain();
				if (chain && chain.chainedTrigger)
					chain.chainedTrigger(eventName, data);
			}
	    },
	    
	    suspendEvents: function () {
	    	this.__suspendedEvents++;
	    },
	    
	    resumeEvents: function () {
	    	this.__suspendedEvents--;
	    	if (this.__suspendedEvents !== 0)
	    		return;
	    	Objs.iter(this.__suspendedEventsQueue, function (ev) {
	    		this.trigger.apply(this, ev);
	    	}, this);
	    	this.__suspendedEventsQueue = [];
	    }

	};
});


Scoped.define("module:Events.Events", ["module:Class", "module:Events.EventsMixin"], function (Class, Mixin, scoped) {
	return Class.extend({scoped: scoped}, Mixin);
});


Scoped.define("module:Events.ListenMixin", ["module:Ids", "module:Objs"], function (Ids, Objs) {
	return {

		_notifications: {
			"destroy": "listenOff" 
		},

		listenOn: function (target, events, callback, options) {
			if (!this.__listen_mixin_listen) this.__listen_mixin_listen = {};
			this.__listen_mixin_listen[Ids.objectId(target)] = target;
			target.on(events, callback, this, options);
		},

		listenOnce: function (target, events, callback, options) {
			if (!this.__listen_mixin_listen) this.__listen_mixin_listen = {};
			this.__listen_mixin_listen[Ids.objectId(target)] = target;
			target.once(events, callback, this, options);
		},

		listenOff: function (target, events, callback) {
			if (!this.__listen_mixin_listen)
				return;
			if (target) {
				target.off(events, callback, this);
				if (!events && !callback)
					delete this.__listen_mixin_listen[Ids.objectId(target)];
			}
			else
				Objs.iter(this.__listen_mixin_listen, function (obj) {
					if (obj && "off" in obj)
						obj.off(events, callback, this);
					if (!events && !callback)
						delete this.__listen_mixin_listen[Ids.objectId(obj)];
				}, this);
		}		

	};
});


Scoped.define("module:Events.Listen", ["module:Class", "module:Events.ListenMixin"], function (Class, Mixin, scoped) {
	return Class.extend({scoped: scoped}, Mixin);
});
Scoped.define("module:Exceptions.Exception", [
    "module:Class",
    "module:Comparators"
], function (Class, Comparators, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (message) {
				inherited.constructor.call(this);
				this.__message = message;
			},
			
			assert: function (exception_class) {
				if (!this.instance_of(exception_class))
					throw this;
				return this;
			},
			
			message: function () {
				return this.__message;
			},
			
			toString: function () {
				return this.message();
			},
			
			format: function () {
				return this.cls.classname + ": " + this.toString();
			},
			
			json: function () {
				return {
					classname: this.cls.classname,
					message: this.message()
				};
			},
			
			equals: function (other) {
				return other && this.cls === other.cls && Comparators.deepEqual(this.json(), other.json(), -1);
			}			
			
		};
	});
});


Scoped.define("module:Exceptions.NativeException", ["module:Exceptions.Exception"], function (Exception, scoped) {
	return Exception.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (object) {
				inherited.constructor.call(this, object ? ("toString" in object ? object.toString() : object) : "null");
				this.__object = object;
			},
			
			object: function () {
				return this.__object;
			}

		};
	});
});


Scoped.extend("module:Exceptions", ["module:Types", "module:Exceptions.Exception", "module:Exceptions.NativeException"], function (Types, Exception, NativeException) {
	return {
		
		ensure: function (e) {
			return Exception.is_instance_of(e) ? e : new NativeException(e);
		}

	};
});

Scoped.extend("module:Exceptions.Exception", ["module:Exceptions"], ["module:Exceptions.ensure"], function (Exceptions) {
	
	return {
		
		ensure: function (e) {
			return Exceptions.ensure(e).assert(this);
		}
		
	};
});

Scoped.define("module:Functions", ["module:Types"], function (Types) {
	
	/**
	 * Function and Function Argument Support
	 * 
	 * @module BetaJS.Functions
	 */
	return {
	
		
	    /**
	     * Takes a function and an instance and returns the method call as a function
	     * 
	     * @param {function} func function
	     * @param {object} instance instance
	     * @return method call 
	     */
		as_method: function (func, instance) {
			return function() {
				return func.apply(instance, arguments);
			};
		},
		
		
	    /**
	     * Takes a function and returns a function that calls the original function on the first call and returns the return value on all subsequent call. In other words a lazy function cache.
	     * 
	     * @param {function} func function
	     * @return cached function 
	     */
		once: function (func) {
			var result = false;
			var executed = false;
			return function () {
				if (executed)
					return result;
				executed = true;
				result = func.apply(this, arguments);
				func = null;
				return result;
			};
		},
		
		
	    /**
	     * Converts some other function's arguments to an array
	     * 
	     * @param args function arguments
	     * @param {integer} slice number of arguments to be omitted (default: 0)
	     * @return {array} arguments as array 
	     */	
		getArguments: function (args, slice) {
			return Array.prototype.slice.call(args, slice || 0);
		},
		
		
	    /**
	     * Matches functions arguments against some pattern
	     * 
	     * @param args function arguments
	     * @param {integer} skip number of arguments to be omitted (default: 0) 
	     * @param {object} pattern typed pattern
	     * @return {object} matched arguments as associative array 
	     */	
		matchArgs: function (args, skip, pattern) {
			if (arguments.length < 3) {
				pattern = skip;
				skip = 0;
			}
			var i = skip;
			var result = {};
			for (var key in pattern) {
				var config = pattern[key];
				if (config === true)
					config = {required: true};
				else if (typeof config == "string")
					config = {type: config};
				if (config.required || (config.type && Types.type_of(args[i]) == config.type)) {
					result[key] = args[i];
					i++;
				} else if (config.def) {
					result[key] = Types.is_function(config.def) ? config.def(result) : config.def;
				}				
			}
			return result;
		},
		
		
		/**
		 * Creates a function for creating new instances of a class.
		 *  
		 * @param {object} cls Class
		 * @return {function} class instantiation function 
		 * @suppress {checkTypes}
		 */
		newClassFunc: function (cls) {
			return function () {
				var args = arguments;
				function F() {
					return cls.apply(this, args);
				}
				F.prototype = cls.prototype;
				return new F();
			};
		},
		

		/**
		 * Creates a new class instance with arguments.
		 *  
		 * @param {object} cls Class
		 * @return {function} class instance 
		 */
		newClass: function (cls) {
			return this.newClassFunc(cls).apply(this, this.getArguments(arguments, 1));
		},
		

		/**
		 * Call an object method.
		 *  
		 * @param {object} context object instance
		 * @param method function or string of method
		 * @return result of function call 
		 */
		callWithin: function (context, method) {
			if (Types.is_string(method))
				method = context[method];
			return method.apply(context, this.getArguments(arguments, 2));
		}
	
	};
});

Scoped.define("module:Ids", [
    "module:Types",
    "module:Objs"
], function (Types, Objs) {
	
	/**
	 * Id Generation
	 * 
	 * @module BetaJS.Ids
	 */
	return {
	
		__uniqueId: 0,
		
		
	    /**
	     * Returns a unique identifier
	     * 
	     * @param {string} prefix a prefix string for the identifier (optional)
	     * @return {string} unique identifier
	     */
		uniqueId: function (prefix) {
			return (prefix || "") + (this.__uniqueId++);
		},
		
		
	    /**
	     * Returns the object's unique identifier or sets it
	     * 
	     * @param {object} object the object
	     * @param {string} id (optional)
	     * @return {string} object's unique identifier
	     */
		objectId: function (object, id) {
			if (!object)
				return undefined;
			if (id !== undefined)
				object.__cid = id;
			else if (!object.__cid)
				object.__cid = this.uniqueId("cid_");
			return object.__cid;
		},
		
		/**
		 * Returns a unique key for any given value of any type.
		 * This is not a hash value.
		 * 
		 * @param value a value to generate a unique key
		 * @param {int} depth optional depth for exploring by value instead of by reference
		 * @return unique key
		 */
		uniqueKey: function (value, depth) {
			if (depth && depth > 0 && (Types.is_object(value) || Types.is_array(value))) {
				return JSON.stringify(Objs.map(value, function (x) {
					return this.uniqueKey(x, depth - 1);
				}, this));
			}
			if ((value !== null && Types.is_object(value)) || Types.is_array(value) || Types.is_function(value))
				return this.objectId(value);
			return value;
		}
	
	};
});


Scoped.define("module:IdGenerators.IdGenerator", ["module:Class"], function (Class, scoped) {
	return Class.extend({scoped: scoped}, {
	
		generate: function () {}
	
	});
});	


Scoped.define("module:IdGenerators.PrefixedIdGenerator", ["module:IdGenerators.IdGenerator"], function (IdGenerator, scoped) {
	return IdGenerator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (prefix, generator) {
				inherited.constructor.call(this);
				this.__prefix = prefix;
				this.__generator = generator;
			},
			
			generate: function () {
				return this.__prefix + this.__generator.generate();
			}
			
		};
	});
});


Scoped.define("module:Ids.RandomIdGenerator", ["module:IdGenerators.IdGenerator", "module:Tokens"], function (IdGenerator, Tokens, scoped) {
	return IdGenerator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (length) {
				inherited.constructor.call(this);
				this.__length = length || 16;
			},
			
			generate: function () {
				return Tokens.generate_token(this.__length);
			}

		};
	});
});


Scoped.define("module:IdGenerators.ConsecutiveIdGenerator", ["module:IdGenerators.IdGenerator"], function (IdGenerator, scoped) {
	return IdGenerator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (initial) {
				inherited.constructor.call(this);
				this.__current = initial || 0;
			},
			
			generate: function () {
				this.__current++;
				return this.__current;
			}

		};
	});
});

	
Scoped.define("module:IdGenerators.TimedIdGenerator", ["module:IdGenerators.IdGenerator", "module:Time"], function (IdGenerator, Time, scoped) {
	return IdGenerator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function () {
				inherited.constructor.call(this);
				this.__current = Time.now() - 1;
			},
			
			generate: function () {
				var now = Time.now();
				this.__current = now > this.__current ? now : (this.__current + 1); 
				return this.__current;
			}

		};
	});
});


Scoped.define("module:JavaScript", ["module:Objs"], function (Objs) {
	/**
	 * JavaScript Simple Parse Functions
	 * 
	 * @module JavaScript
	 */
	return {
		
		STRING_SINGLE_QUOTATION_REGEX: /'[^']*'/g,
		STRING_DOUBLE_QUOTATION_REGEX: /"[^"]*"/g,
		
		IDENTIFIER_REGEX: /[a-zA-Z_][a-zA-Z_0-9]*/g,
		IDENTIFIER_SCOPE_REGEX: /[a-zA-Z_][a-zA-Z_0-9\.]*/g,
	
		RESERVED: Objs.objectify([
	        "if", "then", "else", "return", "var"
	    ], true),
		
	    /**
	     * Is string a JS-reserved keyword?
	     * 
	     * @param {string} key string in question
	     * @return {boolean} true if reserved
	     */
		isReserved: function (key) {
			return key in this.RESERVED;
		},
		
		/**
		 * Is string a valid JS identifier?
		 * 
		 * @param {string} key string in question
		 * @return {boolean} true if identifier
		 */
		isIdentifier: function (key) {
			return !this.isReserved(key);
		},
		
		/**
		 * Remove string definitions from JS code.
		 * 
		 * @param {string} code input code
		 * @return {string} code without strings
		 */
		removeStrings: function (code) {
			return code.replace(this.STRING_SINGLE_QUOTATION_REGEX, "").replace(this.STRING_DOUBLE_QUOTATION_REGEX, "");
		},	

		/**
		 * Return JS identifiers from a piece of code.
		 * 
		 * @param {string} code input code
		 * @param {boolean} keepScopes keep scopes, e.g. `foo.bar` instead of `foo` and `bar` (default: false)
		 * @return {array} array of extracted identifiers
		 */
		extractIdentifiers: function (code, keepScopes) {
			var regex = keepScopes ? this.IDENTIFIER_SCOPE_REGEX : this.IDENTIFIER_REGEX;
			code = this.removeStrings(code);
			return Objs.filter(code.match(regex), this.isIdentifier, this);
		}
			
	};

});
Scoped.define("module:KeyValue.KeyValueStore", ["module:Class", "module:Events.EventsMixin"], function (Class, EventsMixin, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, {

		mem: function (key) {
			return this._mem(key);
		},
		
		get: function (key) {
			return this._get(key);
		},
		
		set: function (key, value) {
			this._set(key, value);
			this.trigger("change:" + key, value);
		},
		
		remove: function (key) {
			this._remove(key);
		}
	
	}]);
});


Scoped.define("module:KeyValue.PrefixKeyValueStore", ["module:KeyValue.KeyValueStore"], function (KeyValueStore, scoped) {
	return KeyValueStore.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (kv, prefix) {
				inherited.constructor.call(this);
				this.__kv = kv;
				this.__prefix = prefix;
			},
			
			_mem: function (key) {
				return this.__kv.mem(this.__prefix + key);
			},
			
			_get: function (key) {
				return this.__kv.get(this.__prefix + key);
			},
			
			_set: function (key, value) {
				this.__kv.set(this.__prefix + key, value);
			},
			
			_remove: function (key) {
				this.__kv.remove(this.__prefix + key);
			}
	
		};
	});
});


Scoped.define("module:KeyValue.MemoryKeyValueStore", ["module:KeyValue.KeyValueStore", "module:Objs"], function (KeyValueStore, Objs, scoped) {
	return KeyValueStore.extend({scoped: scoped}, function (inherited) {
		return {
	
			constructor: function (data, clone) {
				inherited.constructor.call(this);
				this.__data = Objs.clone(data, clone ? 1 : 0);
			},
			
			_mem: function (key) {
				return key in this.__data;
			},
			
			_get: function (key) {
				return this.__data[key];
			},
			
			_set: function (key, value) {
				this.__data[key] = value;
			},
			
			_remove: function (key) {
				delete this.__data[key];
			}

		};
	});
});


Scoped.define("module:KeyValue.DefaultKeyValueStore", ["module:KeyValue.KeyValueStore"], function (KeyValueStore, scoped) {
	return KeyValueStore.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (kv, def) {
				inherited.constructor.call(this);
				this.__kv = kv;
				this.__def = def;
			},
			
			_mem: function (key) {
				return this.__kv.mem(key) || this.__def.mem(key);
			},
			
			_get: function (key) {
				return this.__kv.mem(key) ? this.__kv.get(key) : this.__def.get(key);
			},
			
			_set: function (key, value) {
				this.__kv.set(key, value);
			},
			
			_remove: function (key) {
				this.__kv.remove(key);
			}

		};
	});
});

Scoped.define("module:Lists.AbstractList", [
                                            "module:Class",
                                            "module:Objs",
                                            "module:Types",
                                            "module:Iterators.ArrayIterator"
                                            ], function (Class, Objs, Types, ArrayIterator, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			_add: function (object) {},
			_remove: function (ident) {},
			_get: function (ident) {},
			_iterate: function (callback, context) {},

			get_ident: function (object) {
				var ident = null;
				this._iterate(function (obj, id) {
					if (obj == object) {
						ident = id;
						return false;
					}
					return true;	
				});
				return ident;
			},

			exists: function (object) {
				return object && this.get_ident(object) !== null;
			},

			_ident_changed: function (object, new_ident) {},

			constructor: function (objects) {
				inherited.constructor.call(this);
				this.__count = 0;
				if (objects) {
					Objs.iter(objects, function (object) {
						this.add(object);
					}, this);
				}
			},

			add: function (object) {
				var ident = this._add(object);
				if (Types.is_defined(ident))
					this.__count++;
				return ident;
			},

			count: function () {
				return this.__count;
			},

			clear: function () {
				this._iterate(function (object, ident) {
					this.remove_by_ident(ident);
					return true;
				}, this);
			},

			remove_by_ident: function (ident) {
				var ret = this._remove(ident);
				if (Types.is_defined(ret))
					this.__count--;
				return ret;
			},

			remove: function (object) {
				return this.remove_by_ident(this.get_ident(object));
			},

			remove_by_filter: function (filter) {
				this._iterate(function (object, ident) {
					if (filter(object))
						this.remove_by_ident(ident);
					return true;
				}, this);
			},

			get: function (ident) {
				return this._get(ident);
			},

			iterate: function (cb, context) {
				this._iterate(function (object, ident) {
					var ret = cb.apply(this, [object, ident]);
					return Types.is_defined(ret) ? ret : true;
				}, context);
			},

			iterator: function () {
				return ArrayIterator.byIterate(this.iterate, this);
			}

		};
	});
});


Scoped.define("module:Lists.LinkedList", ["module:Lists.AbstractList"], function (AbstractList, scoped) {
	return AbstractList.extend({scoped: scoped},  {

		__first: null,
		__last: null,

		_add: function (obj) {
			this.__last = {
					obj: obj,
					prev: this.__last,
					next: null
			};
			if (this.__first)
				this.__last.prev.next = this.__last;
			else
				this.__first = this.__last;
			return this.__last;
		},

		_remove: function (container) {
			if (container.next)
				container.next.prev = container.prev;
			else
				this.__last = container.prev;
			if (container.prev)
				container.prev.next = container.next;
			else
				this.__first = container.next;
			return container.obj;
		},

		_get: function (container) {
			return container.obj;
		},

		_iterate: function (cb, context) {
			var current = this.__first;
			while (current) {
				var prev = current;
				current = current.next;
				if (!cb.apply(context || this, [prev.obj, prev]))
					return;
			}
		}

	});
});


Scoped.define("module:Lists.ObjectIdList", ["module:Lists.AbstractList", "module:Ids"], function (AbstractList, Ids, scoped) {
	return AbstractList.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (objects, id_generator) {
				this.__map = {};
				this.__id_generator = id_generator;
				inherited.constructor.call(this, objects);
			},

			_add: function (object) {
				var id = object.__cid;
				if (!id) {
					while (true) {
						id = this.__id_generator ? Ids.objectId(object, this.__id_generator()) : Ids.objectId(object);
						if (!this.__map[id] || !this.__id_generator)
							break;
					}
				}
				this.__map[id] = object;
				return id;
			},

			_remove: function (ident) {
				var obj = this.__map[ident];
				delete this.__map[ident];
				return obj;
			},

			_get: function (ident) {
				return this.__map[ident];
			},

			_iterate: function (callback, context) {
				for (var key in this.__map)
					callback.apply(context || this, [this.__map[key], key]);
			},

			get_ident: function (object) {
				var ident = Ids.objectId(object);
				return this.__map[ident] ? ident : null;
			}

		};
	});
});



Scoped.define("module:Lists.ArrayList", ["module:Lists.AbstractList", "module:Ids", "module:Objs"], function (AbstractList, Ids, Objs, scoped) {
	return AbstractList.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (objects, options) {
				this.__idToIndex = {};
				this.__items = [];
				options = options || {};
				if ("compare" in options)
					this._compare = options.compare;
				if ("get_ident" in options)
					this._get_ident = options.get_ident;
				inherited.constructor.call(this, objects);
			},

			set_compare: function (compare) {
				this._compare = compare;
				if (compare)
					this.sort();
			},

			get_compare: function () {
				return this._compare;
			},

			sort: function (compare) {
				compare = compare || this._compare;
				if (!compare)
					return;
				this.__items.sort(compare);
				for (var i = 0; i < this.__items.length; ++i)
					this.__ident_changed(this.__items[i], i);
				this._sorted();
			},

			_sorted: function () {},

			re_index: function (index) {
				if (!this._compare)
					return index;
				var last = this.__items.length - 1;
				var object = this.__items[index];
				var i = index;	
				while (i < last && this._compare(this.__items[i], this.__items[i + 1]) > 0) {
					this.__items[i] = this.__items[i + 1];
					this.__ident_changed(this.__items[i], i);
					this.__items[i + 1] = object;
					++i;
				}
				if (i == index) {
					while (i > 0 && this._compare(this.__items[i], this.__items[i - 1]) < 0) {
						this.__items[i] = this.__items[i - 1];
						this.__ident_changed(this.__items[i], i);
						this.__items[i - 1] = object;
						--i;
					}
				}
				if (i != index) {
					this.__ident_changed(object, i);
					this._re_indexed(object);
				}
				return i;
			},

			_re_indexed: function (object) {},

			__objectId: function(object) {
				return this._get_ident ? this._get_ident(object) : Ids.objectId(object);
			},

			_add: function (object) {
				var last = this.__items.length;
				this.__items.push(object);
				var i = this.re_index(last);
				this.__idToIndex[this.__objectId(object)] = i;
				return i;
			},

			_remove: function (ident) {
				var obj = this.__items[ident];
				for (var i = ident + 1; i < this.__items.length; ++i) {
					this.__items[i-1] = this.__items[i];
					this.__ident_changed(this.__items[i-1], i-1);
				}
				this.__items.pop();
				delete this.__idToIndex[this.__objectId(obj)];
				return obj;
			},

			_get: function (ident) {
				return this.__items[ident];
			},

			_iterate: function (callback, context) {
				var items = Objs.clone(this.__items, 1);
				for (var i = 0; i < items.length; ++i)
					callback.apply(context || this, [items[i], this.get_ident(items[i])]);
			},

			__ident_changed: function (object, index) {
				this.__idToIndex[this.__objectId(object)] = index;
				this._ident_changed(object, index);
			},

			get_ident: function (object) {
				var id = this.__objectId(object);
				return id in this.__idToIndex ? this.__idToIndex[id] : null;
			},

			ident_by_id: function (id) {
				return this.__idToIndex[id];
			}

		};
	});
});

Scoped.define("module:Maths", [], function () {
	/**
	 * This module contains auxilary math functions.
	 * 
	 * @module BetaJS.Maths
	 */
	return {
		
		/**
		 * Ceiling an integer to be a multiple of another integer.
		 * 
		 * @param {int} number the number to be ceiled
		 * @param {int} steps the multiple
		 * @param {int} max an optional maximum
		 * 
		 * @return {int} ceiled integer
		 */
	    discreteCeil: function (number, steps, max) {
	        var x = Math.ceil(number / steps) * steps;
	        return max && x > max ? 0 : x;
	    }
	
	};
});
Scoped.define("module:Objs", ["module:Types"], function (Types) {
	return {

		ithKey: function (obj, i) {
			i = i || 0;
			for (var key in obj) {
				if (i <= 0)
					return key;
				else
					--i;
			}
			return null;
		},

		count: function (obj) {
			if (Types.is_array(obj))
				return obj.length;
			else {
				var c = 0;
				for (var key in obj)
					c++;
				return c;
			}
		},

		clone: function (item, depth) {
			if (!depth || depth === 0)
				return item;
			if (Types.is_array(item))
				return item.slice(0);
			else if (Types.is_object(item))
				return this.extend({}, item, depth-1);
			else
				return item;
		},

		acyclic_clone: function (object, def) {
			if (object === null || ! Types.is_object(object))
				return object;
			var s = "__acyclic_cloned";
			if (object[s])
				return def || "CYCLE";
			object[s] = true;
			var result = {};
			for (var key in object) {
				if (key != s)
					result[key] = this.acyclic_clone(object[key], def);
			}
			delete object[s];
			return result;
		},

		extend: function (target, source, depth) {
			target = target || {};
			if (source) {
				for (var key in source)
					target[key] = this.clone(source[key], depth);
			}
			return target;
		},

		weak_extend: function (target, source, depth) {
			target = target || {};
			if (source) {
				for (var key in source) {
					if (!(key in target))
						target[key] = this.clone(source[key], depth);
				}
			}
			return target;
		},

		tree_extend: function (target, source, depth) {
			target = target || {};
			if (source) {
				for (var key in source) {
					if (key in target && Types.is_object(target[key]) && Types.is_object(source[key]) && !Types.is_array(target[key]) && !Types.is_array(source[key]))
						target[key] = this.tree_extend(target[key], source[key], depth);
					else
						target[key] = this.clone(source[key], depth);
				}
			}
			return target;
		},

		merge: function (secondary, primary, options) {
			secondary = secondary || {};
			primary = primary || {};
			var result = {};
			var keys = this.extend(this.keys(secondary, true), this.keys(primary, true));
			for (var key in keys) {
				var opt = key in options ? options[key] : "primary";
				if (opt == "primary" || opt == "secondary") {
					if (key in primary || key in secondary) {
						if (opt == "primary")
							result[key] = key in primary ? primary[key] : secondary[key];
							else
								result[key] = key in secondary ? secondary[key] : primary[key];
					}			
				}
				else if (Types.is_function(opt))
					result[key] = opt(secondary[key], primary[key]);
				else if (Types.is_object(opt))
					result[key] = this.merge(secondary[key], primary[key], opt);
			}
			return result;
		},

		tree_merge: function (secondary, primary) {
			secondary = secondary || {};
			primary = primary || {};
			var result = {};
			var keys = this.extend(this.keys(secondary, true), this.keys(primary, true));
			for (var key in keys) {
				if (Types.is_object(primary[key]) && secondary[key])
					result[key] = this.tree_merge(secondary[key], primary[key]);
				else
					result[key] = key in primary ? primary[key] : secondary[key];
			}
			return result;
		},

		keys: function(obj, mapped) {
			var result = null;
			var key = null;
			if (Types.is_undefined(mapped)) {
				result = [];
				for (key in obj)
					result.push(key);
				return result;
			} else {
				result = {};
				for (key in obj)
					result[key] = mapped;
				return result;
			}
		},

		map: function (obj, f, context) {
			var result = null;
			if (Types.is_array(obj)) {
				result = [];
				for (var i = 0; i < obj.length; ++i)
					result.push(context ? f.apply(context, [obj[i], i]) : f(obj[i], i));
				return result;
			} else {
				result = {};
				for (var key in obj)
					result[key] = context ? f.apply(context, [obj[key], key]) : f(obj[key], key);
					return result;
			}
		},

		values: function (obj) {
			var result = [];
			for (var key in obj)
				result.push(obj[key]);
			return result;
		},

		filter: function (obj, f, context) {
			f = f || function (x) { return !!x; };
			if (Types.is_array(obj))
				return obj.filter(f, context);
			var ret = {};
			for (var key in obj) {
				if (context ? f.apply(context, [obj[key], key]) : f(obj[key], key))
					ret[key] = obj[key];
			}
			return ret;
		},

		equals: function (obj1, obj2, depth) {
			var key = null;
			if (depth && depth > 0) {
				for (key in obj1) {
					if (!(key in obj2) || !this.equals(obj1[key], obj2[key], depth-1))
						return false;
				}
				for (key in obj2) {
					if (!(key in obj1))
						return false;
				}
				return true;
			} else
				return obj1 == obj2;
		},

		iter: function (obj, f, context) {
			var result = null;
			if (Types.is_array(obj)) {
				for (var i = 0; i < obj.length; ++i) {
					result = context ? f.apply(context, [obj[i], i]) : f(obj[i], i);
					if (Types.is_defined(result) && !result)
						return false;
				}
			} else {
				for (var key in obj) {
					result = context ? f.apply(context, [obj[key], key]) : f(obj[key], key);
					if (Types.is_defined(result) && !result)
						return false;
				}
			}
			return true;
		},

		intersect: function (a, b) {
			var c = {};
			for (var key in a) {
				if (key in b)
					c[key] = a[key];
			}
			return c;
		},
		
		subset_of: function (a, b) {
			a = Types.is_array(a) ? this.objectify(a) : a;
			b = Types.is_array(b) ? this.objectify(b) : b;
			for (var key in a)
				if (a[key] != b[key])
					return false;
			return true;
		},
		
		superset_of: function (a, b) {
			return this.subset_of(b, a);
		},

		contains_key: function (obj, key) {
			if (Types.is_array(obj))
				return Types.is_defined(obj[key]);
			else
				return key in obj;
		},

		contains_value: function (obj, value) {
			if (Types.is_array(obj)) {
				for (var i = 0; i < obj.length; ++i) {
					if (obj[i] === value)
						return true;
				}
			} else {
				for (var key in obj) {
					if (obj[key] === value)
						return true;
				}
			}
			return false;
		},

		exists: function (obj, f, context) {
			var success = false;
			this.iter(obj, function () {
				success = success || f.apply(this, arguments);
				return !success;
			}, context);
			return success;
		},

		all: function (obj, f, context) {
			var success = true;
			this.iter(obj, function () {
				success = success && f.apply(this, arguments);
				return success;
			}, context);
			return success;
		},

		objectify: function (arr, f, context) {
			var result = {};
			var is_function = Types.is_function(f);
			if (Types.is_undefined(f))
				f = true;
			for (var i = 0; i < arr.length; ++i)
				result[arr[i]] = is_function ? f.apply(context || this, [arr[i], i]) : f;
				return result;
		},

		peek: function (obj) {
			if (Types.is_array(obj))
				return obj.length > 0 ? obj[0] : null;
				else {
					for (var key in obj)
						return obj[key];
					return null;
				} 
		},

		poll: function (obj) {
			if (Types.is_array(obj))
				return obj.shift();
			else {
				for (var key in obj) {
					var item = obj[key];
					delete obj[key];
					return item;
				}
				return null;
			} 
		},

		objectBy: function () {
			var obj = {};
			var count = arguments.length / 2;
			for (var i = 0; i < count; ++i)
				obj[arguments[2 * i]] = arguments[2 * i + 1];
			return obj;
		},

		valueByIndex: function (obj, idx) {
			idx = idx || 0;
			if (Types.is_array(obj))
				return obj[idx];
			for (var key in obj) {
				if (idx === 0)
					return obj[key];
				idx--;
			}
			return null;
		},

		keyByIndex: function (obj, idx) {
			idx = idx || 0;
			if (Types.is_array(obj))
				return idx;
			for (var key in obj) {
				if (idx === 0)
					return key;
				idx--;
			}
			return null;
		},

		pairArrayToObject: function (arr) {
			var result = {};
			for (var i = 0; i < arr.length / 2; i += 2)
				result[arr[i]] = arr[i+1];
			return result;
		},

		pairsToObject: function () {
			var result = {};
			for (var i = 0; i < arguments.length; ++i)
				result[arguments[i][0]] = arguments[i][1];
			return result;
		},
		
		specialize: function (ordinary, concrete, keys) {
			var result = {};
			var iterateOver = keys ? ordinary : concrete;
			for (var key in iterateOver)
				if (!(key in ordinary) || ordinary[key] != concrete[key])
					result[key] = concrete[key];
			return result;
		}

	};
});


Scoped.define("module:Objs.Scopes", ["module:Types"], function (Types) {
	return {

		has: function (key, scope) {
			var keys = key ? key.split(".") : [];
			for (var i = 0; i < keys.length; ++i) {
				if (!scope || !Types.is_object(scope))
					return false;
				scope = scope[keys[i]];
			}
			return Types.is_defined(scope);
		},

		get: function (key, scope) {
			var keys = key ? key.split(".") : [];
			for (var i = 0; i < keys.length; ++i) {
				if (!scope || !Types.is_object(scope))
					return null;
				scope = scope[keys[i]];
			}
			return scope;
		},

		set: function (key, value, scope) {
			if (!key)
				return;
			var keys = key.split(".");
			for (var i = 0; i < keys.length - 1; ++i) {
				if (!(keys[i] in scope) || !Types.is_object(scope[keys[i]]))
					scope[keys[i]] = {};
				scope = scope[keys[i]];
			}
			scope[keys[keys.length - 1]] = value;
		},

		unset: function (key, scope) {
			if (!key)
				return;
			var keys = key.split(".");
			for (var i = 0; i < keys.length - 1; ++i) {
				if (!scope || !Types.is_object(scope))
					return;
				scope = scope[keys[i]];
			}
			delete scope[keys[keys.length - 1]];
		},

		touch: function (key, scope) {
			if (!key)
				return scope;
			var keys = key.split(".");
			for (var i = 0; i < keys.length; ++i) {
				if (!(keys[i] in scope) || !Types.is_object(scope))
					scope[keys[i]] = {};
				scope = scope[keys[i]];
			}
			return scope[keys[keys.length - 1]];
		}

	};
});

Scoped.define("module:Parser.LexerException", ["module:Exceptions.Exception"], function (Exception, scoped) {
	return Exception.extend({scoped: scoped}, function (inherited) {
		return {
			constructor: function (head, tail) {
				inherited.constructor.call(this, "Lexer error: Unrecognized identifier at " + head.length + ".");
				this.__head = head;
				this.__tail = tail;
			}
		};
	});
});


Scoped.define("module:Parser.Lexer", ["module:Class", "module:Types", "module:Objs", "module:Parser.LexerException"], function (Class, Types, Objs, LexerException, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (patterns) {
				inherited.constructor.call(this);
				this.__patterns = [];
				Objs.iter(patterns, function (value, key) {
					this.__patterns.push({
						regex: new RegExp("^" + key, "m"),
						data: Types.is_string(value) ? {token: value} : value
					});
				}, this);
			},
			
			lex: function (source) {
				var result = [];
				var head = "";
				var tail = source;
				while (tail) {
					var match = null;
					var data = null;
					for (var i = 0; i < this.__patterns.length; ++i) {
						match = this.__patterns[i].regex.exec(tail);
						if (match) { 
							data = Objs.clone(this.__patterns[i].data, 1);
							break;
						}
					}
					if (!match)
						throw new LexerException(head, tail);
					head += match[0];
					tail = tail.substring(match[0].length);
					if (!data)
						continue;
					for (var key in data) {
						if (Types.is_string(data[key])) {
							for (var j = 0; j < match.length; ++j)
								data[key] = data[key].replace("$" + j, match[j]);
						}
					}
					result.push(data);
				}
				return result;
			}			
			
		};
	});
});


Scoped.define("module:Properties.PropertiesMixin", [
    "module:Objs.Scopes",
    "module:Objs",
	"module:Strings",
	"module:Types",
	"module:Functions"
	], function (Scopes, Objs, Strings, Types, Functions) {
	
	return {
			
		_notifications: {
			"construct": function () {
				this.__properties = {
					// hierarchical organization
					data: {},
					// hierarchical organization
					watchers: {
						children: {},
						eventCount: 0,
						parent: null,
						key: null
					},
					// flat organization
					computed: {},
					// flat organization
					bindings: {}
				};
				Objs.iter(this.materializes, function (key) {
					this.materializeAttr(key);
				}, this);
			},
			"destroy": function () {
				Objs.iter(this.__properties.bindings, function (value, key) {
					this.unbind(key);
				}, this);
				this.trigger("destroy");
			},
			"register_event": function (event) {
				Objs.iter(["change", "unset", "deepchange", "deepunset", "strongdeepchange", "strongchange"], function (eventType) {
					if (Strings.starts_with(event, eventType + ":"))
						this.__registerWatcher(Strings.strip_start(event, eventType + ":"), eventType);
				}, this);
			},
			"unregister_event": function (event) {
				Objs.iter(["change", "unset", "deepchange", "deepunset", "strongdeepchange", "strongchange"], function (eventType) {
					if (Strings.starts_with(event, eventType + ":"))
						this.__unregisterWatcher(Strings.strip_start(event, eventType + ":"), eventType);
				}, this);
			}
		},
		
		materializes: [],
		
		_resolveProps: function (key) {
			var result = {
				props: this,
				key: key
			};
			var scope = this.data();
			while (key) {
				if (!scope || !Types.is_object(scope))
					return result;
				if (scope.__properties_guid === this.__properties_guid)
					return scope._resolveProps(key);
				var spl = Strings.splitFirst(key, ".");
				if (!(spl.head in scope))
					return result;
				key = spl.tail;
				scope = scope[spl.head];
			}
			return result;
		},
		
		getProp: function (key) {
			var resolved = this._resolveProps(key);
			return resolved.props.get(resolved.key);
		},
		
		setProp: function (key, value) {
			var resolved = this._resolveProps(key);
			resolved.props.set(resolved.key, value);
		},
		
		uncomputeProp: function (key) {
			var resolved = this._resolveProps(key);
			return resolved.props.uncompute(resolved.key);
		},
		
		computeProp: function (key, func) {
			var resolved = this._resolveProps(key);
			return resolved.props.compute(resolved.key, func);
		},

		get: function (key) {
			return Scopes.get(key, this.__properties.data);
		},
		
		_canSet: function (key, value) {
			return true;
		},
		
		_beforeSet: function (key, value) {
			return value;
		},
		
		_afterSet: function (key, value) {},
		
		has: function (key) {
			return Scopes.has(key, this.__properties.data);
		},
		
		setAll: function (obj) {
			for (var key in obj)
				this.set(key, obj[key]);
			return this;
		},
		
		keys: function (mapped) {
			return Objs.keys(this.__properties.data, mapped);
		},
		
		data: function () {
			return this.__properties.data;
		},
		
		getAll: function () {
			return Objs.clone(this.__properties.data, 1);
		},
		
		materializeAttr: function (attr) {
			this[attr] = function (value) {
				if (arguments.length === 0)
					return this.get(attr);
				this.set(attr, value);
			};
		},
		
		__registerWatcher: function (key, event) {
			var keys = key ? key.split(".") : [];
			var current = this.__properties.watchers;
			for (var i = 0; i < keys.length; ++i) {
				if (!(keys[i] in current.children)) {
					current.children[keys[i]] = {
						parent: current,
						eventCount: 0,
						children: {},
						key: keys[i]
					};
				}
				current = current.children[keys[i]];
			}
			current.eventCount++;
		},
		
		__unregisterWatcher: function (key, event) {
			var keys = key ? key.split(".") : [];
			var current = this.__properties.watchers;
			for (var i = 0; i < keys.length; ++i) {
				if (current)
					current = current.children[keys[i]];
			}
			if (!current)
				return;
			current.eventCount--;
			while (current.eventCount <= 0 && Types.is_empty(current.children) && current.parent) {
				var parent = current.parent;
				delete parent.children[current.key];
				current = parent;
			}
		},
		
		uncompute: function (key) {
			if (key in this.__properties.computed) {
				Objs.iter(this.__properties.computed[key].dependencies, function (dependency) {
					dependency.properties.off("change:" + dependency.key, null, dependency);
				}, this);
				delete this.__properties.computed[key];
			}
			return this;
		},
		
		compute: function (key, func) {
			var args = Functions.matchArgs(arguments, 2, {
				setter: "function",
				context: {
					type: "object",
					def: this
				},
				dependencies: true
			});
			this.uncompute(key);
			var deps = [];
			Objs.iter(args.dependencies, function (dep) {
				if (Types.is_string(dep))
					deps.push({properties: this, key: dep});
				else
					deps.push({properties: dep[0], key: dep[1]});
			}, this);
			var computed = {
				ignore: 0,
				func: func,
				context: args.context,
				setter: args.setter,
				dependencies: deps
			};
			this.__properties.computed[key] = computed;
			var self = this;
			function recompute() {
				if (computed.ignore > 0)
					return;
				var values = Objs.map(deps, function (dep) {
					return dep.properties.get(dep.key);
				});
				self.set(key, func.apply(args.context, values));
			}
			Objs.iter(deps, function (dep) {
				var value = dep.properties.get(dep.key);
				// Ugly way of checking whether an EventsMixin is present - please improve in the future on this
				if (value && typeof value == "object" && "on" in value && "off" in value && "trigger" in value) {
					value.on("change update", function () {
						recompute();
					}, dep);
				}
				dep.properties.on("change:" + dep.key, function (value, oldValue) {
					if (oldValue && typeof oldValue == "object" && "on" in oldValue && "off" in oldValue && "trigger" in oldValue) {
						oldValue.off("change update", null, dep);
					}
					if (value && typeof value == "object" && "on" in value && "off" in value && "trigger" in value) {
						value.on("change update", function () {
							recompute();
						}, dep);
					}
					recompute();
				}, dep);
			}, this);
			recompute();
			return this;
		},
		
		unbind: function (key, props) {
			if (key in this.__properties.bindings) {
				for (var i = this.__properties.bindings[key].length - 1; i >= 0; --i) {
					var binding = this.__properties.bindings[key][i];
					if (!props || props == binding) {
						if (binding.left) 
							binding.properties.off(null, null, binding);
						if (binding.right)
							this.off(null, null, binding);
						this.__properties.bindings[key].splice(i, 1);
						i--;
					}
				}
				if (this.__properties.bindings[key].length === 0)
					delete this.__properties.bindings[key];
			}
			return this;
		},
		
		bind: function (key, properties, options) {
			options = Objs.extend({
				secondKey: key,
				left: true,
				right: true,
				deep: false
			}, options);
			var binding = {
				key: options.secondKey,
				left: options.left,
				right: options.right,
				deep: options.deep,
				properties: properties
			};
			this.__properties.bindings[key] = this.__properties.bindings[key] || [];
			this.__properties.bindings[key].push(binding);
			var self = this;
			if (binding.left) {
				binding.properties.on("strongchange:" + binding.key, function (value) {
					self.set(key, value);
				}, binding);
				binding.properties.on("unset:" + binding.key, function (value) {
					self.unset(key);
				}, binding);
				if (binding.deep) {
					binding.properties.on("strongdeepchange:" + binding.key, function (value, oldValue, subKey) {
						if (self.get(key ? key + "." + subKey : subKey) === value)
							self.__setChanged(key ? key + "." + subKey : subKey, value, oldValue, true);
						else
							self.set(key ? key + "." + subKey : subKey, value);					
					}, binding);
					binding.properties.on("deepunset:" + binding.key, function (oldValue, subKey) {
						if (!self.has(key ? key + "." + subKey : subKey))
							self.__unsetChanged(key ? key + "." + subKey : subKey, oldValue);
						else
							self.unset(key ? key + "." + subKey : subKey);					
					}, binding);
				}
				if (!binding.right || !this.has(key))
					this.set(key, binding.properties.get(binding.key));
				if (key === "") {
					Objs.iter(binding.properties.data(), function (value, k) {
						this.set(k, value);
					}, this);
				}
			}
			if (binding.right) {
				this.on("strongchange:" + key, function (value) {
					binding.properties.set(binding.key, value);
				}, binding);
				this.on("unset:" + key, function (value) {
					binding.properties.unset(binding.key);
				}, binding);
				if (binding.deep) {
					this.on("strongdeepchange:" + key, function (value, oldValue, subKey) {
						if (binding.properties.get(binding.key ? binding.key + "." + subKey : subKey) === value)
							binding.properties.__setChanged(binding.key ? binding.key + "." + subKey : subKey, value, oldValue, true);
						else
							binding.properties.set(binding.key ? binding.key + "." + subKey : subKey, value);
					}, binding);
					this.on("deepunset:" + key, function (oldValue, subKey) {
						if (!binding.properties.has(binding.key ? binding.key + "." + subKey : subKey))
							binding.properties.__unsetChanged(binding.key ? binding.key + "." + subKey : subKey, oldValue);
						else
							binding.properties.unset(binding.key ? binding.key + "." + subKey : subKey);
					}, binding);
				}
				if (!binding.left || this.has(key))
					binding.properties.set(binding.key, this.get(key));
				if (key === "") {
					Objs.iter(this.data(), function (value, k) {
						binding.properties.set(k, value);
					}, this);
				}
			}
			binding.properties.on("destroy", function () {
				if (!self.destroyed())
					self.unbind(key);
			}, binding);
			return this;
		},
		
		__unsetChanged: function (key, oldValue) {
			this.trigger("unset", key, oldValue);
			var keys = key ? key.split(".") : [];
			var current = this.__properties.watchers;
			var head = "";
			var tail = key;
			for (var i = 0; i < keys.length; ++i) {
				if (current.eventCount > 0)
					this.trigger("deepunset:" + head, oldValue, tail);
				if (!(keys[i] in current.children))
					return this;
				current = current.children[keys[i]];
				head = head ? (head + "." + keys[i]) : keys[i];
				tail = Strings.first_after(tail, ".");
			}
			function process_unset(current, key, oldValue) {
				if (Types.is_undefined(oldValue))
					return;
				if (current.eventCount > 0)
					this.trigger("unset:" + key, oldValue);
				Objs.iter(current.children, function (child, subkey) {
					process_unset.call(this, child, key ? (key + "." + subkey) : subkey, oldValue[subkey]);
				}, this);
			}
			process_unset.call(this, current, key, oldValue);
			return this;
		},
		
		__setChanged: function (key, value, oldValue, notStrong) {
			this.trigger("change", key, value, oldValue);
			this._afterSet(key, value);
			if (this.destroyed())
				return;
			var keys = key ? key.split(".") : [];
			var current = this.__properties.watchers;
			var head = "";
			var tail = key;
			for (var i = 0; i < keys.length; ++i) {
				if (current.eventCount > 0) {
					if (!notStrong)
						this.trigger("strongdeepchange:" + head, value, oldValue, tail);
					this.trigger("deepchange:" + head, value, oldValue, tail);
				}
				if (!(keys[i] in current.children))
					return;
				current = current.children[keys[i]];
				head = head ? (head + "." + keys[i]) : keys[i];
				tail = Strings.first_after(tail, ".");
			}
			function process_set(current, key, value, oldValue) {
				if (value == oldValue)
					return;
				if (current.eventCount > 0) {
					if (!notStrong)
						this.trigger("strongchange:" + key, value, oldValue);
					this.trigger("change:" + key, value, oldValue);
				}
				Objs.iter(current.children, function (child, subkey) {
					process_set.call(this, child, key ? (key + "." + subkey) : subkey, Types.is_object(value) && value ? value[subkey] : null, Types.is_object(oldValue) && oldValue ? oldValue[subkey] : null);
				}, this);
			}
			process_set.call(this, current, key, value, oldValue);
		},
		
		unset: function (key) {
			if (this.has(key)) {
				var oldValue = this.get(key);
				Scopes.unset(key, this.__properties.data);
				this.__unsetChanged(key, oldValue);
			}
			return this;
		},
		
		__properties_guid: "ec816b66-7284-43b1-a945-0600c6abfde3",
		
		set: function (key, value, force) {
			if (Types.is_object(value) && value && value.guid == this.__properties_guid) {
				if (value.properties)
					this.bind(key, value.properties, {secondKey: value.key});
				if (value.func)
					this.compute(key, value.func, value.dependencies);
				return this;
			}
			value = this._beforeSet(key, value);
			var oldValue = this.get(key);
			if (oldValue !== value) {
				Scopes.set(key, value, this.__properties.data);
				this.__setChanged(key, value, oldValue);
			} else if (force) {
				this.trigger("change", key, value, oldValue, true);
				this.trigger("change:" + key, value, oldValue, true);
			}
			return this;
		},
		
		binding: function (key) {
			return {
				guid: this.__properties_guid,
				properties: this,
				key: key
			};
		},
		
		computed : function (f, dependencies) {
			return {
				guid: this.__properties_guid,
				func: f,
				dependencies: dependencies
			};
		},
		
		pid: function () {
			return this.cid();
		},
		
		isSubsetOf: function (props) {
			return Objs.subset_of(this.data(), props.data ? props.data() : props);
		},
		
		isSupersetOf: function (props) {
			return Objs.superset_of(this.data(), props.data ? props.data() : props);
		}
		
	};
});


Scoped.define("module:Properties.Properties", [
	    "module:Class",
	    "module:Objs",
	    "module:Events.EventsMixin",
	    "module:Properties.PropertiesMixin",
	    "module:Classes.ReferenceCounterMixin"
	], function (Class, Objs, EventsMixin, PropertiesMixin, ReferenceCounterMixin, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, PropertiesMixin, ReferenceCounterMixin, function (inherited) {
		return {
			constructor: function (obj, materializes) {
				inherited.constructor.call(this);
				if (obj)
					this.setAll(obj);
				if (materializes) {
					Objs.iter(materializes, function (key) {
						this.materializeAttr(key);
					}, this);
				}
			}
		};
	}]);
});
Scoped.define("module:Sort", [
    "module:Comparators",	    
    "module:Types",
    "module:Objs"
], function (Comparators, Types, Objs) {
	
	/**
	 * Sort objects and arrays.
	 * 
	 * @module BetaJS.Sort
	 */
	return {		
	
		/**
		 * Sort keys in an object according to a comparator. 
		 * 
		 * @param {object} object object to be sorted
		 * @param {function} f comparator comparator for sorting, accepting keys first and then optionally values
		 * 
		 * @return {object} sorted object
		 */
		sort_object : function(object, f) {
			var a = [];
			for (var key in object)
				a.push({
					key : key,
					value : object[key]
				});
			a.sort(function (x, y) {
				return f(x.key, y.key, x.value, y.value);
			});
			var o = {};
			for (var i = 0; i < a.length; ++i)
				o[a[i].key] = a[i].value;
			return o;
		},
		
		/**
		 * Deep sorting an object according to a comparator. 
		 * 
		 * @param {object} object object to be sorted
		 * @param {function} f comparator comparator for sorting, accepting keys first and then optionally values
		 * 
		 * @return {object} sorted object
		 */
		deep_sort: function (object, f) {
			f = f || Comparators.byValue;
			if (Types.is_array(object)) {
				for (var i = 0; i < object.length; ++i)
					object[i] = this.deep_sort(object[i], f);
				return object.sort(f);
			} else if (Types.is_object(object)) {
				for (var key in object)
					object[key] = this.deep_sort(object[key], f);
				return this.sort_object(object, f);
			} else
				return object;
		},
	
		/**
		 * Sort an array of items with inter-dependency specifiers s.t. every item in the resulting array has all its dependencies come before.
		 * 
		 * @param {array} items list of items with inter-dependency specifiers
		 * @param {string|function} identifier function / key mapping an item to its unique identifier
		 * @param {string|function} before function / key mapping an item to its array of dependencies
		 * @param {string|function} after function / key mapping an item to its array of depending items
		 * 
		 * @return {array} sorted array
		 */
		dependency_sort : function(items, identifier, before, after) {
			var identifierf = Types.is_string(identifier) ? function(obj) {
				return obj[identifier];
			} : identifier;
			var beforef = Types.is_string(before) ? function(obj) {
				return obj[before];
			} : before;
			var afterf = Types.is_string(after) ? function(obj) {
				return obj[after];
			} : after;
			var n = items.length;
			var data = [];
			var identifier_to_index = {};
			var todo = {};
			var i = 0;
			for (i = 0; i < n; ++i) {
				todo[i] = true;
				var ident = identifierf(items[i], i);
				identifier_to_index[ident] = i;
				data.push({
					before : {},
					after : {}
				});
			}
			var make_before_iter_func = function (i) {
				return function (before) {
					var before_index = identifier_to_index[before];
					if (Types.is_defined(before_index)) {
						data[i].before[before_index] = true;
						data[before_index].after[i] = true;
					}
				};
			};
			var make_after_iter_func = function (i) {
				return function(after) {
					var after_index = identifier_to_index[after];
					if (Types.is_defined(after_index)) {
						data[i].after[after_index] = true;
						data[after_index].before[i] = true;
					}
				};
			};
			for (i = 0; i < n; ++i) {
				Objs.iter(beforef(items[i], i) || [], make_before_iter_func(i));
				Objs.iter(afterf(items[i]) || [], make_after_iter_func(i));
			}
			var result = [];
			while (!Types.is_empty(todo)) {
				for (i in todo) {
					if (Types.is_empty(data[i].after)) {
						delete todo[i];
						result.push(items[i]);
						for (var bef in data[i].before)
							delete data[bef].after[i];
					}
				}
			}
			return result;
		}
		
	};
});

Scoped.define("module:Strings", ["module:Objs"], function (Objs) {
	/**
	 * String Utilities
	 * 
	 * @module BetaJS.Strings
	 */
	return {
		
		/**
		 * Pads a string from the left with characters if necessary.
		 * 
		 * @param {string} s string that should be padded
		 * @param {string} padding padding string that should be used (e.g. whitespace)
		 * @param {int} length minimum length of result string
		 * 
		 * @return {string} padded string
		 */
		padLeft: function (s, padding, length) {
			while (s.length < length)
				s = padding + s;
			return s;
		},
		
		/**
		 * Pads a string from the left with zeros ('0') if necessary.
		 * 
		 * @param {string} s string that should be padded
		 * @param {int} length minimum length of result string
		 * 
		 * @return {string} zero-padded string
		 */
		padZeros: function (s, length) {
			return this.padLeft(s + "", "0", length);
		},
		
		/** Converts a string new lines to html <br /> tags
		 *
		 * @param s string
		 * @return string with new lines replaced by <br />
		 */
		nl2br : function(s) {
			return (s + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
		},
	
		/** Converts special characters in a string to html entitiy symbols
		 *
		 * @param s string
		 * @return converted string
		 */
		htmlentities : function(s) {
			return (s + "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
		},
	
		JS_ESCAPES : {
			"'" : "'",
			'\\' : '\\',
			'\r' : 'r',
			'\n' : 'n',
			'\t' : 't',
			'\u2028' : 'u2028',
			'\u2029' : 'u2029'
		},
	
		JS_ESCAPER_REGEX : function() {
			if (!this.JS_ESCAPER_REGEX_CACHED)
				this.JS_ESCAPER_REGEX_CACHED = new RegExp(Objs.keys(this.JS_ESCAPES).join("|"), 'g');
			return this.JS_ESCAPER_REGEX_CACHED;
		},
	
		/** Converts string such that it can be used in javascript by escaping special symbols
		 *
		 * @param s string
		 * @return escaped string
		 */
		js_escape : function(s) {
			var self = this;
			return s.replace(this.JS_ESCAPER_REGEX(), function(match) {
				return '\\' + self.JS_ESCAPES[match];
			});
		},
	
		/** Determines whether a string starts with a sub string
		 *
		 * @param s string in question
		 * @param needle sub string
		 * @return true if string in question starts with sub string
		 */
		starts_with : function(s, needle) {
			return s.substring(0, needle.length) == needle;
		},
	
		/** Determines whether a string ends with a sub string
		 *
		 * @param s string in question
		 * @param needle sub string
		 * @return true if string in question ends with sub string
		 */
		ends_with : function(s, needle) {
			return s.indexOf(needle, s.length - needle.length) !== -1;
		},
	
		/** Removes sub string from a string if string starts with sub string
		 *
		 * @param s string in question
		 * @param needle sub string
		 * @return string without sub string if it starts with sub string otherwise it returns the original string
		 */
		strip_start : function(s, needle) {
			return this.starts_with(s, needle) ? s.substring(needle.length) : s;
		},
		
		/**
		 * Returns the complete remaining part of a string after the last occurrence of a sub string
		 *
		 * @param s string in question
		 * @param needle sub string
		 * @return remaining part of the string in question after the last occurrence of the sub string
		 */
		last_after : function(s, needle) {
			return this.splitLast(s, needle).tail;
		},
		
		/**
		 * Returns the complete remaining part of a string after the first occurrence of a sub string
		 *
		 * @param s string in question
		 * @param needle sub string
		 * @return remaining part of the string in question after the first occurrence of the sub string
		 */
		first_after: function (s, needle) {
			return s.substring(s.indexOf(needle) + 1, s.length);
		},
	
		EMAIL_ADDRESS_REGEX : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	
		/** Determines whether a string is a syntactically valid email address
		 *
		 * @param s string in question
		 * @return true if string looks like an email address
		 */
		is_email_address : function(s) {
			return this.EMAIL_ADDRESS_REGEX.test(s);
		},
	
		STRIP_HTML_TAGS : ["script", "style", "head"],
		STRIP_HTML_REGEX : /<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi,
		STRIP_HTML_COMMENT_REGEX : /<![^>]*>/gi,
	
		/** Removes all html from data and returns plain text
		 *
		 * @param html string containing html
		 * @return string containing the plain text part of it
		 */
		strip_html : function(html) {
			var result = html;
			for (var i = 0; i < this.STRIP_HTML_TAGS.length; ++i)
				result = result.replace(new RegExp("<" + this.STRIP_HTML_TAGS[i] + ".*</" + this.STRIP_HTML_TAGS[i] + ">", "i"), '');
			result = result.replace(this.STRIP_HTML_REGEX, '').replace(this.STRIP_HTML_COMMENT_REGEX, '');
			return result;
		},
		
		/** Trims all trailing and leading whitespace and removes block indentations
		 *
		 * @param s string
		 * @return string with trimmed whitespaces and removed block indentation
		 */
		nltrim : function(s) {
			var a = s.replace(/\t/g, "  ").split("\n");
			var len = null;
			var i = 0;
			for ( i = 0; i < a.length; ++i) {
				var j = 0;
				while (j < a[i].length) {
					if (a[i].charAt(j) != ' ')
						break;
					++j;
				}
				if (j < a[i].length)
					len = len === null ? j : Math.min(j, len);
			}
			for ( i = 0; i < a.length; ++i)
				a[i] = a[i].substring(len);
			return a.join("\n").trim();
		},
	
		/**
		 * Replaces all occurrences of a substring with something else.
		 * 
		 * @param {string} s input string
		 * @param {string} sub search string
		 * @param {string} wth replacement string
		 * 
		 * @return {string} input with all occurrences of the search string replaced by the replacement string
		 */
		replaceAll: function (s, sub, wth) {
			while (s.indexOf(sub) >= 0)
				s = s.replace(sub, wth);
			return s;
		},
	
		/**
		 * Capitalizes all first characters of all words in a string.
		 * 
		 * @param {string} input input string
		 * 
		 * @return {string} input with all first characters capitalized
		 */
		capitalize : function(input) {
			return input.replace(/\w\S*/g, function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		},
	
		/**
		 * Extracts the name from an email address name string (e.g. 'Foo Bar <foobar@domain.com>')
		 * 
		 * @param {string} input email address name input string
		 * 
		 * @return {string} name included in the string
		 */
		email_get_name : function(input) {
		    input = input || "";
			var temp = input.split("<");
			input = temp[0].trim();
			if (!input && temp.length > 1) {
				temp = temp[1].split(">");
				input = temp[0].trim();
			}		
			input = input.replace(/['"]/g, "").replace(/[\\._@]/g, " ");
			return this.capitalize(input);
		},
	
		/**
		 * Extracts the email from an email address name string (e.g. 'Foo Bar <foobar@domain.com>')
		 * 
		 * @param {string} input email address name input string
		 * 
		 * @return {string} email included in the string
		 */
		email_get_email : function(input) {
	        input = input || "";
			var temp = input.split("<");
			input = temp[0].trim();
			if (temp.length > 1) {
				temp = temp[1].split(">");
				input = temp[0].trim();
			}
			input = input.replace(/'/g, "").replace(/"/g, "").trim();
			return input;
		},
	
		/**
		 * Extracts the salutatory name from an email address name string (normally the first name)
		 * 
		 * @param {string} input email address name input string
		 * 
		 * @return {string} salutatory name
		 */
		email_get_salutatory_name : function(input) {
			return (this.email_get_name(input || "").split(" "))[0];
		},
		
		/**
		 * Splits a string into two by the first occurrence of a delimiter
		 * 
		 * @param {string} s input string
		 * @param {string} delimiter delimiter string
		 * 
		 * @return {object} a json object, mapping 'head' to the region left and 'tail' to region right to the delimiter
		 */
		splitFirst: function (s, delimiter) {
			var i = s.indexOf(delimiter);
			return {
				head: i >= 0 ? s.substring(0, i) : s,
				tail: i >= 0 ? s.substring(i + delimiter.length) : ""
			};
		},
		
		/**
		 * Splits a string into two by the last occurrence of a delimiter
		 * 
		 * @param {string} s input string
		 * @param {string} delimiter delimiter string
		 * 
		 * @return {object} a json object, mapping 'head' to the region left and 'tail' to region right to the delimiter
		 */
		splitLast: function (s, delimiter) {
			var i = s.lastIndexOf(delimiter);
			return {
				head: i >= 0 ? s.substring(0, i) : "",
				tail: i >= 0 ? s.substring(i + delimiter.length) : s
			};
		},
		
		/**
		 * Replace all groups in a regular expression string by string parameters.
		 * 
		 * @param {string} regex regular expression with groups as a string
		 * @param {array} args array of string parameters
		 * 
		 * @return {string} regular expression with groups being replaced by string parameters
		 */
		regexReplaceGroups: function (regex, args) {
			var findGroup = /\(.*?\)/;
			var f = function (captured) {
				if (arg)
					return arg;
				return captured.substring(1, captured.length - 1);
			};
			while (args.length > 0) {
				var arg = args.shift();
				regex = regex.replace(findGroup, f);
			}
			return regex;
		},
		
		/**
		 * Given a regular expression with named capture groups (e.g. '(foobar:\d+)'), compute a normal regular expression with mappings to the named groups.
		 * 
		 * @param {string} regex regular expression with named capture groups
		 * 
		 * @return {object} mapping object
		 */
		namedCaptureRegex: function (regex) {
			var groupMap = {};
			var groupIdx = 0;
			var newRegex = new RegExp(regex.replace(/\([^)]+\)/ig, function (group) {
				if (group.charAt(1) != "?" && group.indexOf(":") > 0) {
					var delimiter = group.indexOf(":");
					groupMap[group.substring(1, delimiter)] = groupIdx;
					group = "(" + group.substring(delimiter + 1, group.length - 1) + ")";
				}
				groupIdx++;
				return group;
			}));
			var map = function (groups) {
				return Objs.map(groupMap, function (idx) {
					return groups[idx + 1];
				});
			};
			var exec = function (test) {
				var result = newRegex.exec(test);
				return result ? map(result) : null;
			};
			var mapBack = function (args) {
				var result = [];
				for (var i = 0; i < groupIdx; ++i)
					result.push(null);
				for (var key in args)
					if (key in groupMap)
						result[groupMap[key]] = args[key]; 
				return result;
			};
			return {
				regex: newRegex,
				map: map,
				exec: exec,
				mapBack: mapBack
			};
		}
		
	};

});

Scoped.define("module:Structures.AvlTree", function () {
	return {
	
		empty : function() {
			return null;
		},
	
		singleton : function(data) {
			return {
				data : data,
				left : null,
				right : null,
				height : 1,
				length: 1
			};
		},
	
		min : function(root) {
			return root.left ? this.min(root.left) : root.data;
		},
	
		max : function(root) {
			return root.right ? this.max(root.right) : root.data;
		},
	
		height : function(node) {
			return node ? node.height : 0;
		},
		
		length : function (node){
			return node ? node.length : 0;
		}, 
	
		height_join : function(left, right) {
			return 1 + Math.max(this.height(left), this.height(right));
		},
	
		length_join : function(left, right) {
			return 1 + this.length(left) + this.length(right);
		},

		create : function(data, left, right) {
			return {
				data : data,
				left : left,
				right : right,
				height : this.height_join(left, right),
				length : this.length_join(left, right)
			};
		},
	
		balance : function(data, left, right) {
			if (this.height(left) > this.height(right) + 2) {
				if (this.height(left.left) >= this.height(left.right))
					return this.create(left.data, left.left, this.create(data,
							left.right, right));
				else
					return this.create(left.right.data, this.create(left.data,
							left.left, left.right.left), this.create(data,
							left.right.right, right));
			} else if (this.height(right) > this.height(left) + 2) {
				if (this.height(right.right) >= this.height(right.left))
					return this.create(right.data, this.create(data, left,
							right.left), right.right);
				else
					return this.create(right.left.data, this.create(data, left,
							right.left.left), this.create(right.data,
							right.left.right, right.right));
			} else
				return this.create(data, left, right);
		},
	
		__add_left : function(data, left) {
			return left ? this.balance(left.data, this.__add_left(data, left.left),
					left.right) : this.singleton(data);
		},
	
		__add_right : function(data, right) {
			return right ? this.balance(right.data, right.data, this.__add_right(
					data, right.right)) : this.singleton(data);
		},
	
		join : function(data, left, right) {
			if (!left)
				return this.__add_left(data, right);
			else if (!right)
				return this.__add_right(data, left);
			else if (this.height(left) > this.height(right) + 2)
				return this.balance(left.data, left.left, this.join(data,
						left.right, right));
			else if (this.height(right) > this.height(left) + 2)
				return this.balance(right.data, this.join(data, left, right.left),
						right.right);
			else
				return this.create(data, left, right);
		},
	
		take_min : function(root) {
			if (!root.left)
				return [ root.data, root.right ];
			var result = this.take_min(root.left);
			return [ result[0], this.join(root.data, result[1], root.right) ];
		},
	
		take_max : function(root) {
			if (!root.right)
				return [ root.data, root.left ];
			var result = this.take_max(root.right);
			return [ result[0], this.join(root.data, root.left, result[1]) ];
		},
	
		reroot : function(left, right) {
			if (!left || !right)
				return left || right;
			if (this.height(left) > this.height(right)) {
				var max = this.take_max(left);
				return this.join(max[0], max[1], right);
			}
			var min = this.take_min(right);
			return this.join(min[0], left, min[1]);
	
		},
	
		take_min_iter : function(root) {
			if (!root)
				return null;
			if (!root.left)
				return [ root.data, root.left ];
			return this.take_min_iter(this.create(root.left.data, root.left.left,
					this.create(root.data, root.left.right, root.right)));
		},
	
		take_max_iter : function(root) {
			if (!root)
				return null;
			if (!root.right)
				return [ root.data, root.right ];
			return this.take_max_iter(this.create(root.right.data, this.create(
					root.data, root.left, root.right.left), root.right.right));
		}
	
	};
	
});


Scoped.define("module:Structures.TreeMap", ["module:Structures.AvlTree"], function (AvlTree) {
	return {
	
		empty : function(compare) {
			return {
				root : null,
				compare : compare || function(x, y) {
					return x > y ? 1 : x < y ? -1 : 0;
				}
			};
		},
	
		is_empty : function(t) {
			return !t.root;
		},
	
		length : function(t) {
			return t.root ? t.root.length : 0;
		},
	
		__add : function(key, value, t, node) {
			var kv = {
				key : key,
				value : value
			};
			if (!node) 
				return AvlTree.singleton(kv);
			var c = t.compare(key, node.data.key);
			if (c === 0) {
				node.data = kv;
				return node;
			} else if (c < 0)
				return AvlTree.balance(node.data, this.__add(key, value, t, node.left), node.right);
			else
				return AvlTree.balance(node.data, node.left, this.__add(key, value, t, node.right));
		},
	
		add : function(key, value, t) {
			t.root = this.__add(key, value, t, t.root);
			return t;
		},
	
		singleton : function(key, value, compare) {
			return this.add(key, value, this.empty(compare));
		},
	
		__find : function(key, t, root) {
			if (!root)
				return null;
			var c = t.compare(key, root.data.key);
			return c === 0 ? root.data.value : this.__find(key, t, c < 0 ? root.left : root.right);
		},
	
		find : function(key, t) {
			return this.__find(key, t, t.root);
		},
	
		__iterate : function(t, node, callback, context, reverse) {
			if (!node)
				return true;
			return (
				this.__iterate(t, reverse ? node.right : node.left, callback, context, reverse) &&
				(callback.call(context, node.data.key, node.data.value) !== false) &&
				this.__iterate(t, reverse ? node.left : node.right, callback, context, reverse));
		},
	
		iterate : function(t, callback, context, reverse) {
			this.__iterate(t, t.root, callback, context, reverse);
		},
	
		__iterate_from : function(key, t, node, callback, context, reverse) {
			if (!node)
				return true;
			var c = t.compare(key, node.data.key) * (reverse ? -1 : 1);
			if (c < 0 && !this.__iterate_from(key, t, reverse ? node.right : node.left, callback, context, reverse))
				return false;
			if (c <= 0 && callback.call(context, node.data.key, node.data.value) === false)
				return false;
			return this.__iterate_from(key, t, reverse ? node.left : node.right, callback, context, reverse);
		},
	
		iterate_from : function(key, t, callback, context, reverse) {
			this.__iterate_from(key, t, t.root, callback, context, reverse);
		},
	
		iterate_range : function(from_key, to_key, t, callback, context, reverse) {
			this.iterate_from(from_key, t, function(key, value) {
				return t.compare(key, to_key) * (reverse ? -1 : 1) <= 0 && callback.call(context, key, value) !== false;
			}, this, reverse);
		},

		/*
		__downpath: function (current, reverse, path) {
			path = path || [];
			while (current) {
				path.push(current);
				current = reverse ? current.right : current.left
			}
			return path;
		},
		
		iteratorInit: function (t, reverse) {
			return {
				path: this.__downpath(t.root, reverse),
				reverse: reverse
			};
		},
		
		iteratorHasNext: function (iter) {
			return iter.path.length > 0;
		},
		
		iteratorNext: function (iter) {
			var current = iter.path[iter.path.length - 1];
			var data = current.data;
			var next = iter.reverse ? current.left : current.right;
			if (next)
				iter.path = this.__downpath(next, iter.reverse, iter.path);
			else {
				while (iter.path.length > 0) {
					var child = iter.path.pop();
					current = iter.path[iter.path.length - 1];
					next = iter.reverse ? current.left : current.right;
					if (current !== next)
						break;
				}
			}
			return data;
		},
		*/
		
		take_min: function (t) {
			var a = AvlTree.take_min(t.root);
			a[1] = {
				compare: t.compare,
				root: a[1]
			};
			return a;
		},
		
		__treeSizeLeft: function (key, t, node) {
			var c = t.compare(key, node.data.key);
			if (c < 0)
				return this.__treeSizeLeft(key, t, node.left);
			return 1 + (node.left ? node.left.length : 0) + (c > 0 ? this.__treeSizeLeft(key, t, node.right) : 0);
		},
		
		__treeSizeRight: function (key, t, node) {
			var c = t.compare(key, node.data.key);
			if (c > 0)
				return this.__treeSizeRight(key, t, node.right);
			return 1 + (node.right ? node.right.length : 0) + (c < 0 ? this.__treeSizeRight(key, t, node.left) : 0);
		},
		
		__distance: function (keyLeft, keyRight, t, node) {
			var cLeft = t.compare(keyLeft, node.data.key);
			var cRight = t.compare(keyRight, node.data.key);
			if (cLeft > 0 || cRight < 0)
				return this.__distance(keyLeft, keyRight, t, cLeft > 0 ? node.right : node.left);
			return 1 + (cRight > 0 ? this.__treeSizeLeft(keyRight, t, node.right) : 0) + (cLeft < 0 ? this.__treeSizeRight(keyLeft, t, node.left) : 0);
		},
		
		treeSizeLeft: function (key, t) {
			return this.__treeSizeLeft(key, t, t.root);
		},
		
		treeSizeRight: function (key, t) {
			return this.__treeSizeRight(key, t, t.root);
		},

		distance: function (keyLeft, keyRight, t) {
			return t.compare(keyLeft, keyRight) < 0 ? this.__distance(keyLeft, keyRight, t, t.root) - 1 : 0;
		}
	
	};

});
/*
 * Inspired by Underscore's Templating Engine
 * (which itself is inspired by John Resig's implementation)
 */

Scoped.define("module:Templates", ["module:Types", "module:Strings"], function (Types, Strings) {
	/**
     * A very simple templating engine.
     *
	 * @module BetaJS.Templates
	 */
	return {
		
		/**
		 * Tokenizes a string comprised of escaped javascript code and normal text.
		 * 
		 * @param {string} s input string
         *
		 * @return {array} array of token objects
		 */
		tokenize: function (s) {
			// Already tokenized?
			if (Types.is_array(s))
				return s;
			var tokens = [];
			var index = 0;
			var self = this;
			s.replace(self.SYNTAX_REGEX(), function(match, expr, esc, code, offset) {
				if (index < offset) 
					tokens.push({
						type: self.TOKEN_STRING,
						data: Strings.js_escape(s.slice(index, offset))
					});
				if (code)
					tokens.push({type: self.TOKEN_CODE, data: code});
				if (expr)
					tokens.push({type: self.TOKEN_EXPR, data: expr});
				if (esc)
					tokens.push({type: self.TOKEN_ESC, data: esc});
			    index = offset + match.length;
			    return match;
			});
			return tokens;
		},
		
		/**
		 * Compiles a template string into a function that evaluates the template w.r.t. a given environment.
		 * 
		 * @param {string} s input string
		 * @param {object} options options hash, allowing to specify start_index and end_index within the input string (optional)
		 * @return {function} evaluation function
		 */
		compile: function(source, options) {
			if (Types.is_string(source))
				source = this.tokenize(source);
			options = options || {};
			var start_index = options.start_index || 0;
			var end_index = options.end_index || source.length;
			var result = "__p+='";
			for (var i = start_index; i < end_index; ++i) {
				switch (source[i].type) {
					case this.TOKEN_STRING:
						result += source[i].data;
						break;
					case this.TOKEN_CODE:
						result += "';\n" + source[i].data + "\n__p+='";
						break;
					case this.TOKEN_EXPR:
						result += "'+\n((__t=(" + source[i].data + "))==null?'':__t)+\n'";
						break;
					case this.TOKEN_ESC:
						result += "'+\n((__t=(" + source[i].data + "))==null?'':Helpers.Strings.htmlentities(__t))+\n'";
						break;
					default:
						break;
				}	
			}
			result += "';\n";
			result = 'with(obj||{}){\n' + result + '}\n';
			result = "var __t,__p='',__j=Array.prototype.join," +
			  "echo=function(){__p+=__j.call(arguments,'');};\n" +
			  result + "return __p;\n";
			/*jslint evil: true */
			var func = new Function('obj', 'Helpers', result);
			var func_call = function(data) {
				return func.call(this, data, {Strings: Strings});
			};
			func_call.source = 'function(obj, Helpers){\n' + result + '}';
			return func_call;
		},
		
		SYNTAX: {
			OPEN: "{%",
			CLOSE: "%}",
			MODIFIER_CODE: "",
			MODIFIER_EXPR: "=",
			MODIFIER_ESC: "-"
		},
		
		SYNTAX_REGEX: function () {
			var syntax = this.SYNTAX;
			if (!this.SYNTAX_REGEX_CACHED) {
				this.SYNTAX_REGEX_CACHED = new RegExp(
					syntax.OPEN + syntax.MODIFIER_EXPR + "([\\s\\S]+?)" + syntax.CLOSE + "|" +
					syntax.OPEN + syntax.MODIFIER_ESC + "([\\s\\S]+?)" + syntax.CLOSE + "|" +
					syntax.OPEN + syntax.MODIFIER_CODE + "([\\s\\S]+?)" + syntax.CLOSE + "|" +
					"$",
				'g');
			}
			return this.SYNTAX_REGEX_CACHED;
		},
		
		TOKEN_STRING: 1,
		TOKEN_CODE: 2,
		TOKEN_EXPR: 3,
		TOKEN_ESC: 4
	
	};
});


Scoped.define("module:Templates.Template", ["module:Class", "module:Templates"], function (Class, Templates, scoped) {	
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (template_string) {
				inherited.constructor.call(this);
				this.__tokens = Templates.tokenize(template_string);
				this.__compiled = Templates.compile(this.__tokens);
			},
			
			evaluate: function (obj) {
				return this.__compiled.apply(this, [obj]);
			}
			
		};
	});	
});


Scoped.define("module:Time", [], function () {
	return {
			
		/*
		 * All time routines are based on UTC time.
		 * The optional timezone parameter should be used as follows:
		 *    - undefined or false: UTC
		 *    - true: user's local time zone
		 *    - int value: actual time zone bias in minutes
		 */
			
		
		timezoneBias: function (timezone) {
			if (timezone === true)
				timezone = (new Date()).getTimezoneOffset();
			if (typeof timezone == "undefined" || timezone === null || timezone === false)
				timezone = 0;
			return timezone * 60 * 1000;
		},
			
		timeToDate: function (t, timezone) {
			return new Date(t + this.timezoneBias(timezone));
		},
		
		dateToTime: function (d, timezone) {
			return d.getTime() - this.timezoneBias(timezone);
		},
		
		timeToTimezoneBasedDate: function (t, timezone) {
			return new Date(t - this.timezoneBias(timezone));
		},
		
		timezoneBasedDateToTime: function (d, timezone) {
			return d.getTime() + this.timezoneBias(timezone);
		},
	
		__components: {
			"year": {
				"set": function (date, value) { date.setUTCFullYear(value); },
				"get": function (date) { return date.getUTCFullYear(); }
			},
			"month": {
				"set": function (date, value) { date.setUTCMonth(value); },
				"get": function (date) { return date.getUTCMonth(); }
			},
			"day": {
				"dependencies": {"weekday": true},
				"set": function (date, value) { date.setUTCDate(value + 1); },
				"get": function (date) { return date.getUTCDate() - 1; },
				"milliseconds": 24 * 60 * 60 * 1000
			},
			"weekday": {
				"dependencies": {"day": true, "month": true, "year": true},
				"set": function (date, value) { date.setUTCDate(date.getUTCDate() + value - date.getUTCDay()); },
				"get": function (date) { return date.getUTCDay(); }
			},
			"hour": {
				"set": function (date, value) { date.setUTCHours(value); },
				"get": function (date) { return date.getUTCHours(); },
				"max": 23,
				"milliseconds": 60 * 60 * 1000
			},
			"minute": {
				"set": function (date, value) { date.setUTCMinutes(value); },
				"get": function (date) { return date.getUTCMinutes(); },
				"max": 59,
				"milliseconds": 60 * 1000
			},
			"second": {
				"set": function (date, value) { date.setUTCSeconds(value); },
				"get": function (date) { return date.getUTCSeconds(); },
				"max": 59,
				"milliseconds": 1000
			},
			"millisecond": {
				"set": function (date, value) { date.setUTCMilliseconds(value); },
				"get": function (date) { return date.getUTCMilliseconds(); },
				"max": 999,
				"milliseconds": 1
			}
		},
		
		decodeTime: function (t, timezone) {
			var d = this.timeToTimezoneBasedDate(t || this.now(), timezone);
			var result = {};
			for (var key in this.__components)
				result[key] = this.__components[key].get(d);
			return result;
		},
	
		encodeTime: function (data, timezone) {
			return this.updateTime(this.now(), data, timezone);
		},
		
		encodePeriod: function (data) {
			return this.incrementTime(0, data);
		},
		
		updateTime: function (t, data, timezone) {
			var d = this.timeToTimezoneBasedDate(t, timezone);
			for (var key in data)
				this.__components[key].set(d, data[key]);
			return this.timezoneBasedDateToTime(d, timezone);
		},
		
		now: function (timezone) {
			return this.dateToTime(new Date(), timezone);
		},
		
		incrementTime: function (t, data) {
			var d = this.timeToDate(t);
			for (var key in data) 
				this.__components[key].set(d, this.__components[key].get(d) + data[key]);
			return this.dateToTime(d);
		},
		
		floorTime: function (t, key, timezone) {
			var d = this.timeToTimezoneBasedDate(t, timezone);
			var found = false;
			for (var comp in this.__components) {
				var c = this.__components[comp];
				found = found || comp == key;
				if (found && (!c.dependencies || !c.dependencies[key]))
					c.set(d, 0);
			}
			return this.timezoneBasedDateToTime(d, timezone);
		},
		
		ago: function (t, timezone) {
			return this.now(timezone) - t;
		},
		
		timeComponent: function (t, key, round) {
			return Math[round || "floor"](t / this.__components[key].milliseconds);
		},
		
		timeComponentGet: function (t, key) {
			return this.__components[key].get(t);
		},
		
		timeModulo: function (t, key, round) {
			return this.timeComponent(t, key, round) % (this.__components[key].max + 1);
		}
				
	};

});


Scoped.define("module:TimeFormat", ["module:Time", "module:Strings", "module:Objs"], function (Time, Strings, Objs) {
	/**
	 * Module for formatting Time / Date
	 * 
	 * @module BetaJS.TimeFormat
	 */
	return {
		
		/*
			HH	Hours; leading zero for single-digit hours (24-hour clock).
			H	Hours; no leading zero for single-digit hours (24-hour clock).
			h+  Hours; hours as absolute number
			hh	Hours; leading zero for single-digit hours (12-hour clock).
			h	Hours; no leading zero for single-digit hours (12-hour clock).
			M+  Minutes; minutes as absolute number
			MM	Minutes; leading zero for single-digit minutes.
			M	Minutes; no leading zero for single-digit minutes.
			s+	Seconds; seconds as absolute number
			ss	Seconds; leading zero for single-digit seconds.
			s	Seconds; no leading zero for single-digit seconds.
			mmm	Month as a three-letter abbreviation.
			mm	Month as digits; leading zero for single-digit months.
			m	Month as digits; no leading zero for single-digit months.
			d+	Days; days as absolute number
			ddd	Day of the week as a three-letter abbreviation.
			dd	Day of the month as digits; leading zero for single-digit days.
			d	Day of the month as digits; no leading zero for single-digit days.
			yy	Year as last two digits; leading zero for years less than 10.
			yyyyYear represented by four digits.
			l+  Milliseconds; absolute
			l   Milliseconds 3 digits
			L   Milliseconds 2 digits
			t	Lowercase, single-character time marker string: a or p.
			tt	Lowercase, two-character time marker string: am or pm.
			T	Uppercase, single-character time marker string: A or P.
			TT	Uppercase, two-character time marker string: AM or PM.
			o	GMT/UTC timezone offset, e.g. -0500 or +0230.
			
		*/
		
		formatMappings: {
			"HH": function (t) {
				return Strings.padZeros(Time.timeModulo(t, "hour", "floor"), 2);
			},
			"H": function (t) {
				return Time.timeModulo(t, "hour", "floor");
			},
			"h+": function (t) {
				return Time.timeComponent(t, "hour", "floor");
			},
			"hh": function (t) {
				var h = Time.timeModulo(t, "hour", "floor");
				h = h === 0 ? 12 : (h > 12 ? h - 12 : h);
				return Strings.padZeros(h, " ", 2);
			},
			"h": function (t) {
				var h = Time.timeModulo(t, "hour", "floor");
				h = h === 0 ? 12 : (h > 12 ? h - 12 : h);
				return h;
			},
			"M+": function (t) {
				return Time.timeComponent(t, "minute", "floor");
			},
			"MM": function (t) {
				return Strings.padZeros(Time.timeModulo(t, "minute", "floor"), 2);
			},
			"M": function (t) {
				return Time.timeModulo(t, "minute", "floor");
			},
			"s+": function (t) {
				return Time.timeComponent(t, "second", "floor");
			},
			"ss": function (t) {
				return Strings.padZeros(Time.timeModulo(t, "second", "floor"), 2);
			},
			"s": function (t) {
				return Time.timeModulo(t, "second", "floor");
			},
			"mmm": function (t) {
				return (new Date(t)).toDateString().substring(4,7);
			},
			"mm": function (t) {
				return Strings.padZeros(Time.timeComponentGet(t, "month"), 2);
			},
			"m": function (t) {
				return Time.timeComponentGet(t, "month");
			},
			"d+": function (t) {
				return Time.timeComponent(t, "day", "floor");
			},
			"ddd": function (t) {
				return (new Date(t)).toDateString().substring(0,3);
			},
			"dd": function (t) {
				return Strings.padZeros(Time.timeComponentGet(t, "day"), 2);
			},
			"d": function (t) {
				return Time.timeComponentGet(t, "day");
			},
			"yyyy": function (t) {
				return Time.timeComponentGet(t, "year");
			},
			"yy": function (t) {
				return Time.timeComponentGet(t, "year") % 100;
			},
			"l+": function (t) {
				return t;
			},
			"l": function (t) {
				return Time.timeComponent(t, "millisecond", "floor");
			},
			"L": function (t) {
				return Time.timeComponent(t, "millisecond", "floor") % 10;
			},
			"tt": function (t) {
				return Time.timeModulo(t, "hour", "floor") < 12 ? 'am' : 'pm';
			},
			"t": function (t) {
				return Time.timeModulo(t, "hour", "floor") < 12 ? 'a' : 'p';
			},
			"TT": function (t) {
				return Time.timeModulo(t, "hour", "floor") < 12 ? 'AM' : 'PM';
			},
			"T": function (t) {
				return Time.timeModulo(t, "hour", "floor") < 12 ? 'A' : 'P';
			},
			"o": function (t, bias) {
				bias = Math.floor(bias / 1000 / 60);
				return (bias > 0 ? "-" : "+") + Strings.padZeros(Math.floor(Math.abs(bias) / 60) * 100 + Math.abs(bias) % 60, 4);
			}
			
		},
		
		ELAPSED_HOURS_MINUTES_SECONDS: "h+:MM:ss",
		ELAPSED_MINUTES_SECONDS: "M+:ss",
		FULL_YEAR: "yyyy",
		LETTER_MONTH: "mmm",
		LETTER_MONTH_AND_DAY: "mmm d",
		WEEKDAY: "ddd",
		HOURS_MINUTES_TT: "hh:MM tt",
		
		
		/**
		 * Format a given time w.r.t. a given time format
		 * 
		 * @param {string} timeFormat a time format string
		 * @param {int} time time as integer to be formatted
		 * @param {int} timezone timezone bias (optional)
		 * @return {string} formatted time
		 * 
		 */
		format: function (timeFormat, time, timezone) {
			var timezoneTime = Time.timeToTimezoneBasedDate(time, timezone);
			var bias = Time.timezoneBias(timezone);
			var result = timeFormat;
			var replacers = [];			
			Objs.iter(this.formatMappings, function (formatter, key) {
				if (result.indexOf(key) >= 0) {
					var i = replacers.length;
					replacers.push(formatter(timezoneTime, bias));
					result = result.replace(key, "$" + i + "$");
				}
			}, this);
			for (var i = 0; i < replacers.length; ++i)
				result = result.replace("$" + i + "$", replacers[i]);
			return result;
		},
		
		/**
		 * Format the month as a three letter string
		 * 
		 * @param {int} month month as an int
		 * @return {string} three letter month string
		 */
		monthString: function (month) {
			return this.format("mmm", Time.encodePeriod({month: month}));			
		},
		
		/**
		 * Format the weekday as a three letter string
		 * 
		 * @param {int} weekday weekday as an int
		 * @return {string} three letter weekday string
		 */
		weekdayString: function (weekday) {
			return this.format("ddd", Time.encodePeriod({weekday: weekday}));
		},
		
		/**
		 * Format most significant part of date / time relative to current time
		 * 
		 * @param {int} time date/time to be formatted
		 * @param {int} currentTime relative to current time (optional)
		 * @param {int} timezone time zone bias (optional)
		 * @return {string} formatted time
		 */
		formatRelativeMostSignificant: function (time, currentTime, timezone) {
			currentTime = currentTime || Time.now();
			var t = Time.decodeTime(time, timezone);
			var c = Time.decodeTime(currentTime, timezone);
			// Same day. Return time.
			if (t.year === c.year && t.month === c.month && t.day === c.day)
				return this.format(this.HOURS_MINUTES_TT, time, timezone);
			// Less than 7 days. Return week day.
			if (currentTime - time < 7 * 24 * 60 * 60 * 1000 && t.weekday !== c.weekday)
				return this.format(this.WEEKDAY, time, timezone);
			// Last 2 months?
			if ((t.year === c.year && t.month + 1 >= c.month) || (t.year + 1 === c.year && t.month + 1 >= c.month + 12 - 1))
				return this.format(this.LETTER_MONTH_AND_DAY, time, timezone);
			// Last 11 month?
			if (t.year === c.year || (t.year + 1 === c.year && t.month > c.month))
				return this.format(this.LETTER_MONTH, time, timezone);
			// Return year
			return this.format(this.FULL_YEAR, time, timezone);
		}
		
	};
});
Scoped.define("module:Tokens", function() {
	/**
	 * Unique Token Generation
	 * 
	 * @module BetaJS.Tokens
	 */
	return {

		/**
		 * Generates a random token
		 * 
		 * @param {integer} length optional length of token, default is 16
		 * @return {string} generated token
		 */
		generate_token : function(length) {
			length = length || 16;
			var s = "";
			while (s.length < length)
				s += Math.random().toString(36).substr(2);
			return s.substr(0, length);
		},

		/**
		 * Generated a simple hash value from a string.
		 * 
		 * @param {string} input string
		 * @return {integer} simple hash value
		 * @see http://jsperf.com/string-hashing-methods 
		 */
		simple_hash : function(s) {
			var nHash = 0;
			if (!s.length)
				return nHash;
			for (var i = 0, imax = s.length, n; i < imax; ++i) {
				n = s.charCodeAt(i);
				nHash = ((nHash << 5) - nHash) + n;
				nHash = nHash & nHash;
			}
			return Math.abs(nHash);
		}

	};
});
Scoped.define("module:Trees.TreeNavigator", function () {
	return {		

		nodeRoot: function () {},
		nodeId: function (node) {},
		nodeParent: function (node) {},
		nodeChildren: function (node) {},
		nodeWatch: function (node, func, context) {},
		nodeUnwatch: function (node, func, context) {},
		nodeData: function (node) {}

	};
});


Scoped.define("module:Trees.TreeQueryEngine", ["module:Class", "module:Parser.Lexer", "module:Trees.TreeQueryObject"], function (Class, Lexer, TreeQueryObject, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (navigator) {
				inherited.constructor.call(this);
				this.__navigator = navigator;
				this.__lexer = this._auto_destroy(new Lexer({
					"<\\+": {token: "Up"},
					"<": {token: "Up", single: true},
					">\\+": {token: "Down"},
					">": {token: "Down", single: true},
					"\\[\s*([a-zA-Z]+)\s*=\s*\'([^']*)\'\s*\\]": {token: "Selector", key: "$1", value: "$2"},
					"\\[\s*([a-zA-Z]+)\s*=\s*\"([^']*)\"\s*\\]": {token: "Selector", key: "$1", value: "$2"},
					"\s": null
				}));
			},

			query: function (node, query) {
				return new TreeQueryObject(this.__navigator, node, this.__lexer.lex(query));
			}

		};
	});
});


Scoped.define("module:Trees.TreeQueryObject", ["module:Class", "module:Events.EventsMixin", "module:Objs", "module:Types"], function (Class, EventsMixin, Objs, Types, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {

			constructor: function (navigator, node, query) {
				inherited.constructor.call(this);
				this.__navigator = navigator;
				this.__node = node;
				this.__query = query;
				this.__result = {};
				this.__partials = {};
				this.__ids = 0;
				this.__register(node, 0, {});
			},

			destroy: function () {
				Objs.iter(this.__partials, function (partials) {
					Objs.iter(partials.partials, function (partial) {
						this.__navigator.nodeUnwatch(partials.node, null, partial);
					}, this);			
				}, this);
				inherited.destroy.call(this);
			},

			result: function () {
				var result = [];
				Objs.iter(this.__result, function (value) {
					result.push(value.node);
				});
				return result;
			},

			__register: function (node, index) {
				var node_id = this.__navigator.nodeId(node);
				if (!this.__partials[node_id]) {
					this.__partials[node_id] = {
							node: node,
							partials: {}
					};
				}
				var partials = this.__partials[node_id];
				this.__ids++;
				var partial = {
						owner: partials,
						id: this.__ids,
						query_index_start: index,
						query_index_next: index,
						query_index_last: index,
						partial_match: false,
						partial_final: index >= this.__query.length,
						partial_data: false,
						partial_children: false,
						partial_parent: false,
						partial_star: false,
						parent: null,
						deps: {}
				};
				partials.partials[partial.id] = partial;
				for (var i = partial.query_index_start; i < this.__query.length; ++i) {
					if (this.__query[i].token == "Selector")
						partial.partial_data = true;
					else {
						if (this.__query[i].token == "Up")
							partial.partial_parent = true;
						else if (this.__query[i].token == "Down")
							partial.partial_children = true;
						partial.partial_star = !this.__query[i].single;
						if (!partial.partial_star)
							partial.query_index_next = i + 1;
						break;
					}
					partial.query_index_next = i + 1;
					partial.partial_final = i + 1 == this.__query.length;
				}
				partial.query_index_last = partial.partial_star ? partial.query_index_next + 1 : partial.query_index_next;
				var self = this;
				this.__navigator.nodeWatch(node, function (action, node) {
					if (action == "data" && partial.partial_data)
						self.__update(partial);
					if (action == "remove")
						self.__unregisterPartial(partial);
					if (action == "addChild" && partial.partial_children && partial.partial_match)
						self.__addDependentPartial(partial, node);
				}, partial);
				this.__update(partial);
				return partial;
			},

			__unregisterPartial: function (partial) {
				var owner = partial.owner;
				var node = owner.node;
				var node_id = this.__navigator.nodeId(node);
				if (partial.partial_final && this.__result[node_id]) {
					this.__result[node_id].count--;
					if (this.__result[node_id].count <= 0) {
						delete this.__result[node_id];
						this.trigger("remove", node);
						this.trigger("change");
					}
				}
				Objs.iter(partial.deps, this.__unregisterPartial, this);
				if (partial.parent)
					delete partial.parent.deps[partial.id];
				this.__navigator.nodeUnwatch(node, null, partial);
				delete owner.partials[partial.id];
				if (Types.is_empty(owner.partials))
					delete this.__partials[node_id];
			},

			__addDependentPartial: function (partial, node) {
				var partials = [];
				partials.push(this.__register(node, partial.query_index_next));
				if (partial.partial_star)
					partials.push(this.__register(node, partial.query_index_next + 1));
				Objs.iter(partials, function (p) {
					partial.deps[p.id] = p;
					p.parent = partial;
				}, this);
			},

			__update: function (partial) {
				var matching = true;
				var node = partial.owner.node;
				var node_id = this.__navigator.nodeId(node);
				var node_data = this.__navigator.nodeData(node);
				for (var i = partial.query_index_start; i < partial.query_index_last; ++i) {
					var q = this.__query[i];
					if (q.token != "Selector")
						break;
					if (node_data[q.key] != q.value) {
						matching = false;
						break;
					}
				}
				if (matching == partial.partial_match)
					return;
				partial.partial_match = matching;
				if (matching) {
					if (partial.partial_final) {
						if (!this.__result[node_id]) {
							this.__result[node_id] = {
									node: node,
									count: 1
							};
							this.trigger("add", node);
							this.trigger("change");
						} else
							this.__result[node_id].count++;
					} else if (partial.partial_parent) {
						var parent = this.__navigator.nodeParent(node);
						if (parent)
							this.__addDependentPartial(partial, parent);
					} else if (partial.partial_children) {
						Objs.iter(this.__navigator.nodeChildren(node), function (child) {
							this.__addDependentPartial(partial, child);
						}, this);
					}
				} else {
					if (partial.partial_final) {
						this.__result[node_id].count--;
						if (this.__result[node_id].count <= 0) {
							delete this.__result[node_id];
							this.trigger("remove", node);
							this.trigger("change");
						}
					}
					Objs.iter(partial.deps, this.__unregisterPartial, this);
				}
			}
		};
	}]);
});

Scoped.define("module:Types", function () {
	/**
	 * Type-Testing and Type-Parsing
	 * 
	 * @module BetaJS.Types
	 */
	return {
		/**
		 * Returns whether argument is an object
		 * 
		 * @param x argument
		 * @return true if x is an object
		 */
		is_object : function(x) {
			return typeof x == "object";
		},

		/**
		 * Returns whether argument is an array
		 * 
		 * @param x argument
		 * @return true if x is an array
		 */
		is_array : function(x) {
			return Array.isArray(x);
		},

		/**
		 * Returns whether argument is undefined (which is different from being
		 * null)
		 * 
		 * @param x argument
		 * @return true if x is undefined
		 */
		is_undefined : function(x) {
			return typeof x == "undefined";
		},

		/**
		 * Returns whether argument is null (which is different from being
		 * undefined)
		 * 
		 * @param x argument
		 * @return true if x is null
		 */
		is_null : function(x) {
			return x === null;
		},

		/**
		 * Returns whether argument is undefined or null
		 * 
		 * @param x argument
		 * @return true if x is undefined or null
		 */
		is_none : function(x) {
			return this.is_undefined(x) || this.is_null(x);
		},

		/**
		 * Returns whether argument is defined (could be null)
		 * 
		 * @param x argument
		 * @return true if x is defined
		 */
		is_defined : function(x) {
			return typeof x != "undefined";
		},

		/**
		 * Returns whether argument is empty (undefined, null, an empty array or
		 * an empty object)
		 * 
		 * @param x argument
		 * @return true if x is empty
		 */
		is_empty : function(x) {
			return this.is_none(x) || (this.is_array(x) && x.length === 0) || (this.is_object(x) && this.is_empty_object(x));
		},
		
		/**
		 * Returns whether object argument is empty
		 * 
		 * @param x object argument
		 * @return true if x is empty
		 */
		is_empty_object: function (x) {
			for (var key in x)
				return false;
			return true;
		},

		/**
		 * Returns whether argument is a string
		 * 
		 * @param x argument
		 * @return true if x is a a string
		 */
		is_string : function(x) {
			return typeof x == "string";
		},

		/**
		 * Returns whether argument is a function
		 * 
		 * @param x argument
		 * @return true if x is a function
		 */
		is_function : function(x) {
			return typeof x == "function";
		},

		/**
		 * Returns whether argument is boolean
		 * 
		 * @param x argument
		 * @return true if x is boolean
		 */
		is_boolean : function(x) {
			return typeof x == "boolean";
		},

		/**
		 * Compares two values
		 * 
		 * If values are booleans, we compare them directly. If values are
		 * arrays, we compare them recursively by their components. Otherwise,
		 * we use localeCompare which compares strings.
		 * 
		 * @param x left value
		 * @param y right value
		 * @return 1 if x > y, -1 if x < y and 0 if x == y
		 */
		compare : function(x, y) {
			if (this.is_boolean(x) && this.is_boolean(y))
				return x == y ? 0 : (x ? 1 : -1);
			if (this.is_array(x) && this.is_array(y)) {
				var len_x = x.length;
				var len_y = y.length;
				var len = Math.min(len_x, len_y);
				for (var i = 0; i < len; ++i) {
					var c = this.compare(x[i], y[i]);
					if (c !== 0)
						return c;
				}
				return len_x == len_y ? 0 : (len_x > len_y ? 1 : -1);
			}
			return x.localeCompare(y);
		},

		/**
		 * Parses a boolean string
		 * 
		 * @param x boolean as a string
		 * @return boolean value
		 */
		parseBool : function(x) {
			if (this.is_boolean(x))
				return x;
			if (x === "true" || x === "")
				return true;
			if (x === "false")
				return false;
			return null;
		},

		/**
		 * Returns the type of a given expression
		 * 
		 * @param x expression
		 * @return type string
		 */
		type_of : function(x) {
			if (this.is_array(x))
				return "array";
			return typeof x;
		},

		/**
		 * Parses a value given a specific type.
		 * 
		 * @param x value to be parsed
		 * @param {string} type the specific type to be parsed (accepts: bool, boolean, int, integer, date, time, datetime, float, double)
		 * @return parsed value
		 */
		parseType : function(x, type) {
			if (!this.is_string(x))
				return x;
			type = type.toLowerCase();
			if (type == "bool" || type == "boolean")
				return this.parseBool(x);
			if (type == "int" || type == "integer")
				return parseInt(x, 10);
			if (type == "date" || type == "time" || type == "datetime")
				return parseInt(x, 10);
			if (type == "float" || type == "double")
				return parseFloat(x);
			return x;
		},
		
		/**
		 * Returns the specific type of a JavaScript object
		 * 
		 * @param {object} obj an object instance
		 * @return {string} the object type
		 */
		objectType: function (obj) {
			if (!this.is_object(obj))
				return null;
			var matcher = obj.match(/\[object (.*)\]/);
			return matcher ? matcher[1] : null;
		}
		
		
	};
});

Scoped.define("module:Channels.Sender", ["module:Class", "module:Events.EventsMixin"], function (Class, EventsMixin, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, {
		
		send: function (message, data) {
			this.trigger("send", message, data);
			this._send(message, data);
		},
		
		_send: function (message, data) {}
	
	}]);
});


Scoped.define("module:Channels.Receiver", ["module:Class", "module:Events.EventsMixin"], function (Class, EventsMixin, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, {
			
		_receive: function (message, data) {
			this.trigger("receive", message, data);
			this.trigger("receive:" + message, data);
		}
	
	}]);
});


Scoped.define("module:Channels.ReceiverSender", ["module:Channels.Sender"], function (Sender, scoped) {
	return Sender.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (receiver) {
				inherited.constructor.call(this);
				this.__receiver = receiver;
			},
			
			_send: function (message, data) {
				this.__receiver._receive(message, data);
			}
			
		};
	});
});


Scoped.define("module:Channels.SenderMultiplexer", ["module:Channels.Sender"], function (Sender, scoped) {
	return Sender.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (sender, prefix) {
				inherited.constructor.call(this);
				this.__sender = sender;
				this.__prefix = prefix;
			},
			
			_send: function (message, data) {
				this.__sender.send(this.__prefix + ":" + message, data);
			}
			
		};
	});
});


Scoped.define("module:Channels.ReceiverMultiplexer", ["module:Channels.Receiver", "module:Strings"], function (Receiver, Strings, scoped) {
	return Receiver.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (receiver, prefix) {
				inherited.constructor.call(this);
				this.__receiver = receiver;
				this.__prefix = prefix;
				this.__receiver.on("receive", function (message, data) {
					if (Strings.starts_with(message, this.__prefix + ":"))
						this._receive(Strings.strip_start(message, this.__prefix + ":"), data);
				}, this);
			}
		
		};
	});
});

Scoped.define("module:Channels.SimulatorSender", ["module:Channels.Sender"], function (Sender, scoped) {
	return Sender.extend({scoped: scoped}, function (inherited) {
		return {
			
			online: true,

			constructor: function (sender) {
				inherited.constructor.call(this);
				this.__sender = sender;
			},
			
			_send: function (message, data) {
				if (this.online)
					this.__sender.send(message, data);
			}
			
		};
	});
});


Scoped.define("module:Channels.TransportChannel", [
	    "module:Class",
	    "module:Objs",
	    "module:Timers.Timer",
	    "module:Time",
	    "module:Promise"
	], function (Class, Objs, Timer, Time, Promise, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
					
			constructor: function (sender, receiver, options) {
				inherited.constructor.call(this);
				this.__sender = sender;
				this.__receiver = receiver;
				this.__options = Objs.extend(options, {
					timeout: 10000,
					tries: 1,
					timer: 500
				});
				this.__receiver.on("receive:send", function (data) {
					this.__reply(data);
				}, this);
				this.__receiver.on("receive:reply", function (data) {
					this.__complete(data);
				}, this);
				this.__sent_id = 0;
				this.__sent = {};
				this.__received = {};
				this.__timer = this._auto_destroy(new Timer({
					delay: this.__options.timer,
					context: this,
					fire: this.__maintenance
				}));
			},
			
			// Returns Promise
			_reply: function (message, data) {},
			
			send: function (message, data, options) {
				var promise = Promise.create();
				options = options || {};
				if (options.stateless) {
					this.__sender.send("send", {
						message: message,
						data: data,
						stateless: true
					});
					promise.asyncSuccess(true);
				} else {
					this.__sent_id++;
					this.__sent[this.__sent_id] = {
						message: message,
						data: data,
						tries: 1,
						time: Time.now(),
						id: this.__sent_id,
						promise: promise
					};
					this.__sender.send("send", {
						message: message,
						data: data,
						id: this.__sent_id
					});
				}
				return promise;
			},
			
			__reply: function (data) {
				if (data.stateless) {
					this._reply(data.message, data.data);
					return;
				}
				if (!this.__received[data.id]) {
					this.__received[data.id] = data;
					this.__received[data.id].time = Time.now();
					this.__received[data.id].returned = false;
					this.__received[data.id].success = false;
					this._reply(data.message, data.data).success(function (result) {
						this.__received[data.id].reply = result;
						this.__received[data.id].success = true;
					}, this).error(function (error) {
						this.__received[data.id].reply = error;
					}, this).callback(function () {
						this.__received[data.id].returned = true;
						this.__sender.send("reply", {
							id: data.id,
							reply: data.reply,
							success: data.success
						});
					}, this);			  
				} else if (this.__received[data.id].returned) {
					this.__sender.send("reply", {
						id: data.id,
						reply: data.reply,
						success: data.success
					});
				}
			},
			
			__complete: function (data) {
				if (this.__sent[data.id]) {
					var promise = this.__sent[data.id].promise;
					promise[data.success ? "asyncSuccess" : "asyncError"](data.reply);
					delete this.__sent[data.id];
				}
			},
			
			__maintenance: function () {
				var now = Time.now();
				for (var received_key in this.__received) {
					var received = this.__received[received_key];
					if (received.time + this.__options.tries * this.__options.timeout <= now)
						delete this.__received[received_key];
				}
				for (var sent_key in this.__sent) {
					var sent = this.__sent[sent_key];
					if (sent.time + sent.tries * this.__options.timeout <= now) {
						if (sent.tries < this.__options.tries) {
							sent.tries++;
							this.__sender.send("send", {
								message: sent.message,
								data: sent.data,
								id: sent.id
							});
						} else {
							sent.promise.asyncError({
								message: sent.message,
								data: sent.data
							});
							delete this.__sent[sent_key];
						}
					}
				}
			}
			
		};
	});
});


Scoped.define("module:Classes.ConditionalInstance", [
	 "module:Class",
	 "module:Objs"
], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (options) {
				inherited.constructor.call(this);
				this._options = this.cls._initializeOptions(options);
			}
			
		};
	}, {
		
		_initializeOptions: function (options) {
			return options;
		},
		
		supported: function (options) {
			return false;
		}
		
	}, {

		__registry: [],
		
		register: function (cls, priority) {
			this.__registry.push({
				cls: cls,
				priority: priority
			});
		},
		
		match: function (options) {
			options = this._initializeOptions(options);
			var bestMatch = null;
			Objs.iter(this.__registry, function (entry) {
				if ((!bestMatch || bestMatch.priority < entry.priority) && entry.cls.supported(options))
					bestMatch = entry;				
			}, this);
			return bestMatch;
		},
		
		create: function (options) {
			var match = this.match(options);
			return match ? new match.cls(options) : null;
		},
		
		anySupport: function (options) {
			return this.match(options) !== null;
		}
		
	});	
});




Scoped.define("module:Classes.OptimisticConditionalInstance", [
	"module:Class",
	"module:Objs",
	"module:Promise"
], function (Class, Objs, Promise, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (options, transitionals) {
				inherited.constructor.call(this);
				this._transitionals = {};
			},
			
			_initializer: function () {
				// returns a promise
			},
			
			_initialize: function () {
				return this._initializer().success(function () {
					this._afterInitialize();
				}, this);
			},
			
			transitionals: function () {
				return this._transitionals;
			},
			
			_afterInitialize: function () {
				// setup
			}
		
		};
	}, {}, {
		
		__registry: [],
		
		register: function (cls, priority) {
			this.__registry.push({
				cls: cls,
				priority: priority
			});
		},
		
		create: function (options) {
			var promise = Promise.create();
			var reg = Objs.clone(this.__registry, 1);
			var transitionals = {};
			var next = function () {
				if (!reg.length) {
					promise.asyncError(true);
					return;
				}
				var p = -1;
				var j = -1;
				for (var i = 0; i < reg.length; ++i) {
					if (reg[i].priority > p) {
						p = reg[i].priority;
						j = i;
					}
				}
				var cls = reg[j].cls;
				reg.splice(j, 1);
				var instance = new cls(options, transitionals);
				instance._initialize().error(function () {
					transitionals = instance.transitionals();
					instance.destroy();
					next.call(this);
				}, this).success(function () {
					promise.asyncSuccess(instance);
				});
			};
			next.call(this);
			return promise;
		}
		
	});	
});

Scoped.define("module:Classes.AbstractGarbageCollector", [
    "module:Class"    
], function (Class, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function () {
				inherited.constructor.call(this);
				this.__classes = {};
				this.__queue = [];
			},
			
			queue: function (obj) {
				if (!obj || obj.destroyed() || this.__classes[obj.cid()])
					return;
				this.__queue.push(obj);
				this.__classes[obj.cid()] = obj;
			},
			
			hasNext: function () {
				return this.__queue.length > 0;
			},
			
			destroyNext: function () {
				var obj = this.__queue.shift();
				delete this.__classes[obj.cid()];
				if (!obj.destroyed())
					obj.destroy();
				delete obj.__gc;
			}

		};
	});
});


Scoped.define("module:Classes.DefaultGarbageCollector", [
    "module:Classes.AbstractGarbageCollector",
    "module:Timers.Timer",
    "module:Time"
], function (Class, Timer, Time, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (delay, duration) {
				inherited.constructor.call(this);
				this.__duration = duration || 5;
				this.auto_destroy(new Timer({
					fire: this.__fire,
					context: this,
					delay: delay || 100
				}));
			},
			
			__fire: function () {
				var t = Time.now() + this.__duration;
				while (Time.now() < t && this.hasNext())
					this.destroyNext();
			}		

		};
	});
});

Scoped.define("module:Classes.LocaleMixin", function () {
    return {

        _clearLocale: function () {},
        _setLocale: function (locale) {},

        getLocale: function () {
            return this.__locale;
        },

        clearLocale: function () {
            this._clearLocale();
            this.__locale = null;
        },

        setLocale: function (locale) {
            this.clearLocale();
            this.__locale = locale;
            this._setLocale(locale);
        },

        isLocaleSet: function () {
            return !!this.__locale;
        },

        setWeakLocale: function (locale) {
            if (!this.isLocaleSet())
                this.setLocale(locale);
        }

    };
});



Scoped.define("module:Classes.LocaleAggregator", [
    "module:Class",
    "module:Classes.LocaleMixin",
    "module:Objs"
], function (Class, LocaleMixin, Objs, scoped) {
    return Class.extend({scoped: scoped}, [LocaleMixin, function (inherited) {
        return {

            constructor: function () {
                inherited.constructor.call(this);
                this.__locales = [];
            },

            register: function (obj) {
                this.__locales.push(obj);
            },

            _clearLocale: function () {
                Objs.iter(this.__locales, function (obj) {
                    obj.clearLocale();
                }, this);
            },

            _setLocale: function (locale) {
                Objs.iter(this.__locales, function (obj) {
                    obj.setLocale(locale);
                }, this);
            }

        };
    }]);
});
Scoped.define("module:Classes.ClassRegistry", [
    "module:Class",
    "module:Types",
    "module:Functions",
    "module:Objs"
], function (Class, Types, Functions, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (classes, lowercase) {
				inherited.constructor.call(this);
				this._classes = Types.is_array(classes) ? classes : [classes || {}];
				this._lowercase = lowercase;
			},
			
			_sanitize: function (key) {
				return this._lowercase ? key.toLowerCase() : key;
			},
			
			register: function (key, cls) {
				this._classes[this._classes.length - 1][this._sanitize(key)] = cls;
			},
			
			get: function (key) {
				if (!Types.is_string(key))
					return key;
				key = this._sanitize(key);
				for (var i = this._classes.length - 1; i >= 0; --i)
					if (key in this._classes[i])
						return this._classes[i][key];
				return null;
			},
			
			create: function (key) {
				var cons = Functions.newClassFunc(this.get(key));
				return cons.apply(this, Functions.getArguments(arguments, 1));
			},
			
			classes: function () {
				var result = {};
				Objs.iter(this._classes, function (classes) {
					result = Objs.extend(result, classes);
				});
				return result;
			}
			
		};
	});
});


Scoped.define("module:Classes.ContextRegistry", [
    "module:Class",
    "module:Ids",
    "module:Types",
    "module:Objs",
    "module:Iterators.MappedIterator",
    "module:Iterators.ObjectValuesIterator"
], function (Class, Ids, Types, Objs, MappedIterator, ObjectValuesIterator, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (serializer, serializerContext) {
				inherited.constructor.apply(this);
				this.__data = {};
				this.__contexts = {};
				this.__serializer = serializer || this.__defaultSerializer;
				this.__serializerContext = serializerContext || this;
			},
			
			__defaultSerializer: function (data) {
				return Types.is_object(data) ? Ids.objectId(data) : data;
			},
			
			_serializeContext: function (ctx) {
				return ctx ? Ids.objectId(ctx) : null;
			},
			
			_serializeData: function (data) {
				return this.__serializer.call(this.__serializerContext, data);
			},
			
			get: function (data) {
				var serializedData = this._serializeData(data);
				return this.__data[serializedData];
			},
			
			/*
			 * Registers data with respect to an optional context
			 *
			 * @param data - data (mandatory)
			 * @param context - context (optional)
			 * 
			 * @return data if data was not registered before, null otherwise
			 * 
			 */
			register: function (data, context) {
				var serializedData = this._serializeData(data);
				var serializedCtx = this._serializeContext(context);
				var result = false;
				if (!(serializedData in this.__data)) {
					this.__data[serializedData] = {
						data: data,
						contexts: {}
					};
					result = true;
				}
				if (!(serializedCtx in this.__contexts)) {
					this.__contexts[serializedCtx] = {
						context: context,
						datas: {}
					};
				}
				this.__data[serializedData].contexts[serializedCtx] = true;
				this.__contexts[serializedCtx].datas[serializedData] = true;
				return result ? this.__data[serializedData].data : null;
			},
			
			/*
			 * Unregisters data with respect to a context.
			 * If no data is given, all data with respect to the context is unregistered.
			 * If no context is given, all context with respect to the data are unregistered.
			 * If nothing is given, everything is unregistered.
			 * 
			 * @param data - data (optional)
			 * @param context - context (optional)
			 * 
			 * @result unregistered data in an array
			 */
			
			unregister: function (data, context) {
				var result = [];
				if (data) {
					var serializedData = this.__serializer.call(this.__serializerContext, data);
					if (this.__data[serializedData]) {
						if (context) {
							var serializedCtx = this._serializeContext(context);
							if (this.__contexts[serializedCtx]) {
								delete this.__contexts[serializedCtx].datas[serializedData];
								if (Types.is_empty(this.__contexts[serializedCtx].datas))
									delete this.__contexts[serializedCtx];
							}
							delete this.__data[serializedData].contexts[serializedCtx];
							if (Types.is_empty(this.__data[serializedData].contexts)) {
								result.push(this.__data[serializedData].data);
								delete this.__data[serializedData];
							}
						} else {
							Objs.iter(this.__data[serializedData].contexts, function (dummy, serializedCtx) {
								if (this.__contexts[serializedCtx]) {
									delete this.__contexts[serializedCtx].datas[serializedData];
									if (Types.is_empty(this.__contexts[serializedCtx].datas))
										delete this.__contexts[serializedCtx];
								}
							}, this);
							result.push(this.__data[serializedData].data);
							delete this.__data[serializedData];
						}
					}
				} else if (context) {
					var serializedCtx2 = this._serializeContext(context);
					if (this.__contexts[serializedCtx2]) {
						Objs.iter(this.__contexts[serializedCtx2].datas, function (dummy, serializedData) {
							if (this.__data[serializedData]) {
								delete this.__data[serializedData].contexts[serializedCtx2];
								if (Types.is_empty(this.__data[serializedData].contexts)) {
									result.push(this.__data[serializedData].data);
									delete this.__data[serializedData];
								}
							}
						}, this);
						delete this.__contexts[serializedCtx2];
					}
				} else {
					Objs.iter(this.__data, function (data) {
						result.push(data.data);
					}, this);
					this.__data = {};
					this.__contexts = [];
				}
				return result;
			},
			
			customIterator: function () {
				return new ObjectValuesIterator(this.__data);
			},
			
			iterator: function () {
				return new MappedIterator(this.customIterator(), function (item) {
					return item.data;
				});
			}

		};
	});
});

Scoped.define("module:Classes.Taggable", [
    "module:Objs"
], function (Objs) {
	return {
		
		__tags: {},
		
		hasTag: function (tag) {
			return tag in this.__tags;
		},
		
		getTags: function () {
			return Object.keys(this.__tags);
		},
		
		removeTag: function (tag) {
			delete this.__tags[tag];
			this._notify("tags-changed");
			return this;
		},
		
		removeTags: function (tags) {
			Objs.iter(tags, this.removeTag, this);
		},
		
		addTag: function (tag) {
			this.__tags[tag] = true;
			this._notify("tags-changed");
			return this;
		},
		
		addTags: function (tags) {
			Objs.iter(tags, this.addTag, this);
		},

		tagIntersect: function (tags) {
			return Objs.filter(tags, this.hasTag, this);
		}
		
	};
});


Scoped.define("module:Classes.StringTable", [
    "module:Class",
    "module:Classes.Taggable",
    "module:Functions",
    "module:Objs"
], function (Class, Taggable, Functions, Objs, scoped) {
	return Class.extend({scoped: scoped}, [Taggable, function (inherited) {
		return {
			
			_notifications: {
				"tags-changed": function () {
					this.__cache = {};
				}
			},
			
			constructor: function () {
				inherited.constructor.call(this);
				this.__cache = {};
				this.__strings = {};
			},
			
			__resolveKey: function (key, prefix) {
				if (prefix)
					key = prefix + "." + key;
				key = key.replace(/[^\.]+\.</g, "");
				return key;
			},
			
			__betterMatch: function (candidate, reference) {
				var c = this.tagIntersect(candidate.tags).length - this.tagIntersect(reference.tags).length;
				if (c !== 0)
					return c > 0;
				c = candidate.priority - reference.priority;
				if (c !== 0)
					return c > 0;
				c = reference.tags.length - candidate.tags.length;
				return c > 0;
			},
			
			register: function () {
				var args = Functions.matchArgs(arguments, {
					strings: true,
					prefix: "string",
					tags: "array",
					priority: "int"
				});
				Objs.iter(args.strings, function (value, key) {
					key = this.__resolveKey(key, args.prefix);
					this.__strings[key] = this.__strings[key] || [];
					this.__strings[key].push({
						value: value,
						tags: args.tags || [],
						priority: args.priority || 0
					});
					delete this.__cache[key];
				}, this);
			},
			
			get: function (key, prefix) {
				key = this.__resolveKey(key, prefix);
				if (key in this.__cache)
					return this.__cache[key];
				if (!(key in this.__strings))
					return null;
				var current = null;
				Objs.iter(this.__strings[key], function (candidate) {
					if (!current || this.__betterMatch(candidate, current))
						current = candidate;
				}, this);
				this.__cache[key] = current.value;
				return current.value;
			},
			
			all: function () {
				return Objs.map(this.__strings, function (value, key) {
					return this.get(key);
				}, this);
			}

		};
	}]);
});



Scoped.define("module:Classes.LocaleTable", [
	"module:Classes.StringTable",
	"module:Classes.LocaleMixin"
], function (StringTable, LocaleMixin, scoped) {
	return StringTable.extend({scoped: scoped}, [LocaleMixin, {

		_localeTags: function (locale) {
			if (!locale)
				return null;
			var result = [];
			result.push("language:" + locale);
			if (locale.indexOf("-") > 0)
				result.push("language:" + locale.substring(0, locale.indexOf("-")));
			return result;
		},

		_clearLocale: function () {
			this.removeTags(this._localeTags(this.getLocale()));
		},

		_setLocale: function (locale) {
			this.addTags(this._localeTags(locale));
		}
			
	}]);
});
Scoped.define("module:Collections.Collection", [
	    "module:Class",
	    "module:Events.EventsMixin",
	    "module:Objs",
	    "module:Functions",
	    "module:Lists.ArrayList",
	    "module:Ids",
	    "module:Properties.Properties",
	    "module:Iterators.ArrayIterator",
	    "module:Iterators.FilteredIterator",
	    "module:Iterators.ObjectValuesIterator",
	    "module:Types",
	    "module:Promise"
	], function (Class, EventsMixin, Objs, Functions, ArrayList, Ids, Properties, ArrayIterator, FilteredIterator, ObjectValuesIterator, Types, Promise, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {

			constructor : function(options) {
				inherited.constructor.call(this);
				if (Types.is_array(options)) {
					options = {
						objects: options
					};
				}
				options = options || {};
				this.__indices = {};
				if (options.release_references)
					this.__release_references = true;
				if (options.indices)
					Objs.iter(options.indices, this.add_secondary_index, this);
				var list_options = {};
				if ("compare" in options)
					list_options.compare = options.compare;
				list_options.get_ident = Functions.as_method(this.get_ident, this);
				this.__data = new ArrayList([], list_options);
				var self = this;
				this.__data._ident_changed = function (object, index) {
					self._index_changed(object, index);
				};
				this.__data._re_indexed = function (object) {
					self._re_indexed(object);
				};
				this.__data._sorted = function () {
					self._sorted();
				};
				if ("objects" in options)
					this.add_objects(options.objects);
			},
			
			add_secondary_index: function (key) {
				this.__indices[key] = {};
				this.iterate(function (object) {
					var value = object.get(key);
					this.__indices[key][value] = this.__indices[key][value] || {};
					this.__indices[key][value][this.get_ident(object)] = object;
				}, this);
			},
			
			get_by_secondary_index: function (key, value) {
				return this.__indices[key][value];
			},
			
			get_ident: function (obj) {
				return Ids.objectId(obj);
			},
			
			set_compare: function (compare) {
				this.trigger("set_compare", compare);
				this.__data.set_compare(compare);
			},
			
			get_compare: function () {
				this.__data.get_compare();
			},
			
			__unload_item: function (object) {
				if ("off" in object)
					object.off(null, null, this);
				if (this.__release_references)
					object.releaseReference();
			},
		
			destroy: function () {
				this.__data.iterate(this.__unload_item, this);
				this.__data.destroy();
				this.trigger("destroy");
				inherited.destroy.call(this);
			},
			
			count: function () {
				return this.__data.count();
			},
			
			_index_changed: function (object, index) {
				this.trigger("index", object, index);
			},
			
			_re_indexed: function (object) {
				this.trigger("reindexed", object);
			},
			
			_sorted: function () {
				this.trigger("sorted");
			},
			
			_object_changed: function (object, key, value) {
				this.trigger("update");
				this.trigger("change", object, key, value);
				this.trigger("change:" + key, object, value);
				this.__data.re_index(this.getIndex(object));
			},
			
			add: function (object) {
				if (!Class.is_class_instance(object))
					object = new Properties(object);
				if (this.exists(object))
					return null;
				var ident = this.__data.add(object);
				if (ident !== null) {
					Objs.iter(this.__indices, function (entries, key) {
						var value = object.get(key);
						entries[value] = entries[value] || {};
						entries[value][this.get_ident(object)] = object;
					}, this);
					this.trigger("add", object);
					this.trigger("update");
					if ("on" in object)
						object.on("change", function (key, value, oldvalue) {
							this._object_changed(object, key, value, oldvalue);
						}, this);
				}
				return ident;
			},
			
			replace_object: function (oriObject) {
				var is_prop = Class.is_class_instance(oriObject);
				var object = is_prop ? oriObject : new Properties(oriObject);
				if (this.exists(object)) {
					var existing = this.getById(this.get_ident(object));
					if (is_prop) {
						this.remove(existing);
						this.add(object);
					} else {
						existing.setAll(oriObject);
						return existing;
					}
				} else
					this.add(object);
				return object;
			},
			
			replace_objects: function (objects, keep_others) {
				var ids = {};
				Objs.iter(objects, function (oriObject) {
					var object = this.replace_object(oriObject);
					ids[this.get_ident(object)] = true;
				}, this);
				if (!keep_others) {
					var iterator = this.iterator();
					while (iterator.hasNext()) {
						var object = iterator.next();
						var ident = this.get_ident(object);
						if (!(ident in ids))
							this.remove(object);
					}
					iterator.destroy();
				}
			},
			
			add_objects: function (objects) {
				var count = 0;
				Objs.iter(objects, function (object) {
					if (this.add(object))
						count++;
				}, this);		
				return count;
			},
			
			exists: function (object) {
				return this.__data.exists(object);
			},
			
			remove: function (object) {
				if (!this.exists(object))
					return null;
				Objs.iter(this.__indices, function (entry, key) {
					var value = object.get(key);
					if (entry[value]) {
						delete entry[value][this.get_ident(object)];
						if (Types.is_empty(entry[value]))
							delete entry[value];
					}
				}, this);
				var result = this.__data.remove(object);
				this.trigger("remove", object);
				this.__unload_item(object);
				this.trigger("update");
				return result;
			},
			
			getByIndex: function (index) {
				return this.__data.get(index);
			},
			
			getById: function (id) {
				return this.__data.get(this.__data.ident_by_id(id));
			},
			
			getIndex: function (object) {
				return this.__data.get_ident(object);
			},
			
			iterate: function (cb, context) {
				this.__data.iterate(cb, context);
			},
			
			iterator: function () {
				return ArrayIterator.byIterate(this.iterate, this);
			},
			
			iterateSecondaryIndexValue: function (key, value) {
				return new ObjectValuesIterator(this.__indices[key][value]);
			},
			
			query: function (subset) {
				var iterator = null;
				for (var index_key in this.__indices) {
					if (index_key in subset) {
						iterator = this.iterateSecondaryIndexValue(index_key, subset[index_key]);
						break;
					}
				}
				return new FilteredIterator(iterator || this.iterator(), function (prop) {
					return prop.isSupersetOf(subset); 
				});
			},
			
			clear: function () {
				this.iterate(function (obj) {
					this.remove(obj);
				}, this);
			},
			
			increase_forwards: function (steps) {
				return Promise.error(true);
			}
			
		};
	}]);
});

Scoped.define("module:Collections.ConcatCollection", [
    "module:Collections.Collection",
    "module:Objs",
    "module:Functions"
], function (Collection, Objs, Functions, scoped) {
	return Collection.extend({scoped: scoped}, function (inherited) {
		return {

			constructor : function (parents, options) {
				this.__parents = {};
				this.__itemToParent = {};
				options = options || {};
				delete options.objects;
				options.compare = Functions.as_method(this.__compareByParent, this);
				inherited.constructor.call(this, options);				
				var idx = 0;
				Objs.iter(parents, function (parent) {
					this.__parents[parent.cid()] = {
						idx: idx,
						parent: parent
					};
					parent.iterate(function (item) {
						this.__parentAdd(parent, item);
					}, this);
					parent.on("add", function (item) {
						this.__parentAdd(parent, item);
					}, this);
					parent.on("remove", function (item) {
						this.__parentRemove(parent, item);
					}, this);
					idx++;
				}, this);
			},
			
			destroy: function () {
				Objs.iter(this.__parents, function (parent) {
					parent.parent.off(null, null, this);
				}, this);
				inherited.destroy.call(this);
			},
			
			__parentAdd: function (parent, item) {
				this.__itemToParent[item.cid()] = parent;
				this.add(item);
			},
			
			__parentRemove: function (parent, item) {
				delete this.__itemToParent[item.cid()];
				this.remove(item);
			},
			
			__compareByParent: function (item1, item2) {
				var parent1 = this.__itemToParent[item1.cid()];
				var parent2 = this.__itemToParent[item2.cid()];
				if (parent1 === parent2)
					return parent1.getIndex(item1) - parent2.getIndex(item2);
				return this.__parents[parent1.cid()].idx - this.__parents[parent2.cid()].idx;
			}			
		
		};	
	});
});

Scoped.define("module:Collections.FilteredCollection", [
	    "module:Collections.Collection"
	], function (Collection, scoped) {
	return Collection.extend({scoped: scoped}, function (inherited) {
		return {

			constructor : function(parent, options) {
				this.__parent = parent;
				options = options || {};
				delete options.objects;
				options.compare = options.compare || parent.get_compare();
				inherited.constructor.call(this, options);
				this.__parent.on("add", this.add, this);
				this.__parent.on("remove", this.__selfRemove, this);
				this.setFilter(options.filter, options.context);
			},
			
			filter: function (object) {
				return !this.__filter || this.__filter.call(this.__filterContext || this, object);
			},
			
			setFilter: function (filterFunction, filterContext) {
				this.__filterContext = filterContext;
				this.__filter = filterFunction;
				this.iterate(function (obj) {
					if (!this.filter(obj))
						this.__selfRemove(obj);
				}, this);
				this.__parent.iterate(function (object) {
					if (!this.exists(object) && this.filter(object))
						this.__selfAdd(object);
					return true;
				}, this);
			},
			
			_object_changed: function (object, key, value) {
				inherited._object_changed.call(this, object, key, value);
				if (!this.filter(object))
					this.__selfRemove(object);
			},
			
			destroy: function () {
				this.__parent.off(null, null, this);
				inherited.destroy.call(this);
			},
			
			__selfAdd: function (object) {
				return inherited.add.call(this, object);
			},
			
			add: function (object) {
				if (this.exists(object) || !this.filter(object))
					return null;
				var id = this.__selfAdd(object);
				this.__parent.add(object);
				return id;
			},
			
			__selfRemove: function (object) {
				return inherited.remove.call(this, object);
			},
		
			remove: function (object) {
				if (!this.exists(object))
					return null;
				var result = this.__selfRemove(object);
				if (!result)
					return null;
				return this.__parent.remove(object);
			}
			
		};	
	});
});

Scoped.define("module:Collections.GroupedCollection", [
    "module:Collections.Collection",
    "module:Objs",
    "module:Properties.Properties"
], function (Collection, Objs, Properties, scoped) {
	return Collection.extend({scoped: scoped}, function (inherited) {
		return {

			constructor : function(parent, options) {
				this.__parent = parent;
				options = options || {};
				delete options.objects;
				this.__groupby = options.groupby;
				this.__insertCallback = options.insert;
				this.__removeCallback = options.remove;
				this.__callbackContext = options.context || this;
				this.__propertiesClass = options.properties || Properties;
				this.__createProperties = options.create;
				inherited.constructor.call(this, options);
				Objs.iter(this.__groupby, this.add_secondary_index, this);
				this.__parent.iterate(this.__addParentObject, this);
				this.__parent.on("add", this.__addParentObject, this);
				this.__parent.on("remove", this.__removeParentObject, this);
			},
			
			destroy: function () {
				this.__parent.off(null, null, this);
				inherited.destroy.call(this);
			},
			
			__addParentObject: function (object) {
				var group = this.__objectToGroup(object);
				if (!group) {
					group = this.__createProperties ? this.__createProperties.call(this.__callbackContext) : new this.__propertiesClass();
					group.objects = {};
					group.object_count = 0;
					Objs.iter(this.__groupby, function (key) {
						group.set(key, object.get(key));
					});
					this.__addObjectToGroup(object, group);
					this.add(group);
				} else
					this.__addObjectToGroup(object, group);
			},
			
			__removeParentObject: function (object) {
				var group = this.__objectToGroup(object);
				if (group) {
					this.__removeObjectFromGroup(object, group);
					if (group.object_count === 0)
						this.remove(group);
				}
			},
			
			__objectToGroup: function (object) {
				var query = {};
				Objs.iter(this.__groupby, function (key) {
					query[key] = object.get(key);
				});
				return this.query(query).nextOrNull();
			},
			
			__addObjectToGroup: function (object, group) {
				group.objects[this.__parent.get_ident(object)] = object;
				group.object_count++;
				this.__insertObject(object, group);
			},
			
			__removeObjectFromGroup: function (object, group) {
				if (!(this.__parent.get_ident(object) in group.objects))
					return;
				delete group.objects[this.__parent.get_ident(object)];
				group.object_count--;
				if (group.object_count > 0)
					this.__removeObject(object, group);
			},
			
			increase_forwards: function (steps) {
				return this.__parent.increase_forwards(steps);
			},
			
			__insertObject: function (object, group) {
				if (this.__insertCallback)
					this.__insertCallback.call(this.__callbackContext, object, group);
				else
					group.trigger("insert", object);
			},
			
			__removeObject: function (object, group) {
				if (this.__removeCallback)
					this.__removeCallback.call(this.__callbackContext, object, group);
				else
					group.trigger("remove", object);
			}
			
		};	
	});
});

Scoped.define("module:Collections.MappedCollection", [
    "module:Collections.Collection",
    "module:Functions"
], function (Collection, Functions, scoped) {
	return Collection.extend({scoped: scoped}, function (inherited) {
		return {

			constructor : function(parent, options) {
				this.__parent = parent;
				this.__parentToThis = {};
				this.__thisToParent = {};
				options = options || {};
				delete options.objects;
				options.compare = Functions.as_method(this.__compareByParent, this);
				inherited.constructor.call(this, options);
				this._mapFunction = options.map;
				this._mapCtx = options.context;
				parent.on("add", this.__parentAdd, this);
				parent.on("remove", this.__parentRemove, this);
				parent.on("change", this.__parentUpdate, this);
				parent.iterate(this.__parentAdd, this);		
			},
			
			destroy: function () {
				this.__parent.off(null, null, this);
				inherited.destroy.call(this);
			},

			__compareByParent: function (item1, item2) {
				return this.__parent.getIndex(this.__thisToParent[item1.cid()]) - this.__parent.getIndex(this.__thisToParent[item2.cid()]);
			},
			
			__mapItem: function (parentItem, thisItem) {
				return this._mapFunction.call(this._mapCtx || this, parentItem, thisItem);
			},
			
			__parentAdd: function (item) {
				var mapped = this.__mapItem(item);
				this.__parentToThis[item.cid()] = mapped;
				this.__thisToParent[mapped.cid()] = item;
				this.add(mapped);
			},
			
			__parentUpdate: function (item) {
				this.__mapItem(item, this.__parentToThis[item.cid()]);
			},
			
			__parentRemove: function (item) {
				var mapped = this.__parentToThis[item.cid()];
				delete this.__parentToThis[item.cid()];
				delete this.__thisToParent[mapped.cid()];
				this.remove(mapped);
			}
		
		};	
	});
});

Scoped.define("module:Async", ["module:Types", "module:Functions"], function (Types, Functions) {
	
	var __eventuallyOnce = {};
	var __eventuallyOnceIdx = 1;

	
	/**
	 * Auxilary functions for asynchronous operations.
	 * 
	 * @module BetaJS.Async
	 */
	return {		
		
		
		/**
		 * Wait asynchronously for a condition to be met.
		 * 
		 * @param {function} condition condition function
		 * @param {object} conditionCtx condition context (optional)
		 * @param {function} callback callback function
		 * @param {object} callbackCtx callback context (optional)
		 * @param {int} interval interval time between checks (optional, default 1)
		 * 
		 */
		waitFor: function () {
			var args = Functions.matchArgs(arguments, {
				condition: true,
				conditionCtx: "object",
				callback: true,
				callbackCtx: "object",
				interval: "int"
			});
			var h = function () {
				try {
					return !!args.condition.apply(args.conditionCtx || args.callbackCtx || this);
				} catch (e) {
					return false;
				}
			};
			if (h())
				args.callback.apply(args.callbackCtx || this);
			else {
				var timer = setInterval(function () {
					if (h()) {
						clearInterval(timer);
						args.callback.apply(args.callbackCtx || this);
					}
				}, args.interval || 1);
			}
		},
		
		
		/**
		 * Execute a function asynchronously eventually.
		 * 
		 * @param {function} function function to be executed asynchronously
		 * @param {array} params optional list of parameters to be passed to the function
		 * @param {object} context optional context for the function execution
		 * @param {int} time time to wait until execution (default is 0)
		 * 
		 * @return handle to the eventual call
		 */
		eventually: function () {
			var args = Functions.matchArgs(arguments, {
				func: true,
				params: "array",
				context: "object",
				time: "number"
			});
			var timer = setTimeout(function () {
				clearTimeout(timer);
				args.func.apply(args.context || this, args.params || []);
			}, args.time || 0);
			return timer;
		},
		
		
		/**
		 * Clears a call scheduled for eventual execution.
		 * 
		 * @param ev event handle
		 * 
		 */
		clearEventually: function (ev) {
			clearTimeout(ev);
		},
		
		
		/**
		 * Executes a function asynchronously eventually, but only once.
		 * 
		 * @param {function} function function to be executed asynchronously
		 * @param {array} params list of parameters to be passed to the function
		 * @param {object} context optional context for the function execution
		 * 
		 */
		eventuallyOnce: function (func, params, context) {
			var data = {
				func: func,
				params: params,
				context: context
			};
			for (var key in __eventuallyOnce) {
				var record = __eventuallyOnce[key];
				if (record.func == func && record.params == params && record.context == context)
					return;
			}
			__eventuallyOnceIdx++;
			var index = __eventuallyOnceIdx;
			__eventuallyOnce[index] = data;
			return this.eventually(function () {
				delete __eventuallyOnce[index];
				func.apply(context || this, params || []);
			}, this);
		}
				
	};

});
Scoped.define("module:Promise", [
    "module:Types",
    "module:Functions",
    "module:Async",
    "module:Objs"
], function (Types, Functions, Async, Objs) {
	var Promise = {		
			
		Promise: function (value, error, finished) {
			this.__value = error ? null : (value || null);
			this.__error = error ? error : null;
			this.__isFinished = finished;
			this.__hasError = !!error;
			this.__resultPromise = null;
			this.__callbacks = [];
		},
		
		create: function (value, error) {
			return new this.Promise(value, error, arguments.length > 0);
		},
		
		value: function (value) {
			return this.is(value) ? value : new this.Promise(value, null, true);
		},
		
		eventualValue: function (value) {
			var promise = new this.Promise();
			Async.eventually(function () {
				promise.asyncSuccess(value);
			});
			return promise;
		},
	
		error: function (error) {
			return this.is(error) ? error : new this.Promise(null, error, true);
		},
		
		box: function (f, ctx, params) {
			try {
				var result = f.apply(ctx || this, params || []);
				return this.is(result) ? result : this.value(result);
			} catch (e) {
				return this.error(e);
			}
		},
		
		tryCatch: function (f, ctx) {
			try {
				return this.value(f.apply(ctx || this));
			} catch (e) {
				return this.error(e);
			}
		},
		
		funcCallback: function (ctx, func) {
			var args  = Functions.getArguments(arguments, 1);
			if (Types.is_function(ctx)) {
				args = Functions.getArguments(arguments, 1);
				func = ctx;
				ctx = this;
			} else
				args = Functions.getArguments(arguments, 2);
			var promise = this.create();
			args.push(promise.asyncCallbackFunc());
			func.apply(ctx, args);
			return promise;
		},
		
		and: function (promises) {
			var promise = this.create();
			promise.__promises = [];
			promise.__successCount = 0;
			promise.__values = [];
			promise.__errorPromise = null;
			promise.and = function (promises) {
				promises = promises || [];
				if (this.__ended)
					return this;
				if (!Types.is_array(promises))
					promises = [promises];
				var f = function (error, value) {
					if (error)
						this.__errorPromise = promises[this.idx];
					else {
						this.promise.__successCount++;
						this.promise.__values[this.idx] = value;
					}
					this.promise.results();
				};
				for (var i = 0; i < promises.length; ++i) {
					var last = this.__promises.length;
					this.__promises.push(promises[i]);
					this.__values.push(null);
					if (promises[i].isFinished()) {
						if (promises[i].hasValue()) {
							this.__successCount++;
							this.__values[last] = promises[i].value();
						} else
							this.__errorPromise = promises[i];
					} else {
						promises[i].callback(f, {promise: this, idx: last});					
					}
				}
				return this;
			};
			promise.end = function () {
				if (this.__ended)
					return this;
				this.__ended = true;
				this.results();
				return this;
			};
			promise.results = function () {
				if (this.__ended && this.__errorPromise)
					this.asyncError(this.__errorPromise.err(), this.__errorPromise);
				else if (this.__ended && this.__successCount == this.__promises.length)
					this.asyncSuccess(this.__values);
				return this;
			};
			promise.successUnfold = function (f, context, options) {
				return this.success(function () {
					return f.apply(context, arguments);
				}, context, options);
			};
			promise.and(promises);
			return promise;
		},
		
		func: function (func) {
			var args = Functions.getArguments(arguments, 1);
			var promises = [];
			for (var i = 0; i < args.length; ++i) {
				if (this.is(args[i]))
					promises.push(args[i]);
			}
			var promise = this.create();
			this.and(promises).end().success(function (values) {
				var params = [];
				for (var i = 0; i < args.length; ++i)
					params[i] = this.is(args[i]) ? args[i].value() : args[i];
				var result = func.apply(this, params);
				if (this.is(result))
					result.forwardCallback(promise);
				else
					promise.asyncSuccess(result);
			}, this).forwardError(promise);
			return promise;
		},
		
		methodArgs: function (ctx, func, params) {
			params.unshift(function () {
				return func.apply(ctx, arguments);
			});
			return this.func.apply(this, params);
		},
		
		method: function (ctx, func) {
			return this.methodArgs(ctx, func, Functions.getArguments(arguments, 2));
		},
	
		newClass: function (cls) {
			var params = Functions.getArguments(arguments, 1);
			params.unshift(Functions.newClassFunc(cls));
			return this.func.apply(this, params);
		},
		
		is: function (obj) {
			return obj && Types.is_object(obj) && obj.classGuid == this.Promise.prototype.classGuid;
		},
		
		resilience: function (method, context, resilience, args) {
			return method.apply(context, args).mapError(function (error) {
				return resilience === 0 ? error : this.resilience(method, context, resilience - 1, args);
			}, this);
		}
		
	};
	
	Objs.extend(Promise.Promise.prototype, {
		classGuid: "7e3ed52f-22da-4e9c-95a4-e9bb877a3935",
		
		success: function (f, context, options) {
			return this.callback(f, context, options, "success");
		},
		
		error: function (f, context, options) {
			return this.callback(f, context, options, "error");
		},
		
		callback: function (f, context, options, type) {
			if ("end" in this)
				this.end();
			var record = {
				type: type || "callback",
				func: f,
				options: options || {},
				context: context
			};
			if (this.__isFinished)
				this.triggerResult(record);
			else
				this.__callbacks.push(record);
			return this;
		},
		
		triggerResult: function (record) {
			if (!this.__isFinished)
				return this;
			if (record) {
				if (record.type == "success" && !this.__hasError)
					record.func.call(record.context || this, this.__value, this.__resultPromise || this);
				else if (record.type == "error" && this.__hasError)
					record.func.call(record.context || this, this.__error, this.__resultPromise || this);
				else if (record.type == "callback")
					record.func.call(record.context || this, this.__error, this.__value, this.__resultPromise || this);
			} else {
				var records = this.__callbacks;
				this.__callbacks = [];
				for (var i = 0; i < records.length; ++i)
					this.triggerResult(records[i]);
			}
			return this;
		},
		
		value: function () {
			return this.__value;
		},

		err: function () {
			return this.__error;
		},

		isFinished: function () {
			return this.__isFinished;
		},

		hasValue: function () {
			return this.__isFinished && !this.__hasError;
		},

		hasError: function () {
			return this.__isFinished && this.__hasError;
		},

		asyncSuccess: function (value, promise) {
			if (this.__isFinished) 
				return this;
			this.__resultPromise = promise;
			this.__error = null;
			this.__isFinished = true;
			this.__hasError = false;
			this.__value = value;
			return this.triggerResult();
		},

		forwardSuccess: function (promise) {
			this.success(promise.asyncSuccess, promise);
			return this;
		},

		asyncError: function (error, promise) {
			if (this.__isFinished) 
				return this;
			this.__resultPromise = promise;
			this.__isFinished = true;
			this.__hasError = true;
			this.__error = error;
			this.__value = null;
			return this.triggerResult();
		},

		forwardError: function (promise) {
			this.error(promise.asyncError, promise);
			return this;
		},

		asyncCallback: function (error, value, promise) {
			if (error)
				return this.asyncError(error, promise);
			else
				return this.asyncSuccess(value, promise);
		},

		asyncCallbackFunc: function () {
			return Functions.as_method(this.asyncCallback, this);
		},

		forwardCallback: function (promise) {
			this.callback(promise.asyncCallback, promise);
			return this;
		},

		mapSuccess: function (func, ctx) {
			var promise = Promise.create();
			this.forwardError(promise).success(function (value, pr) {
				var result = func.call(ctx || promise, value, pr);
				if (Promise.is(result))
					result.forwardCallback(promise);
				else
					promise.asyncSuccess(result);
			});
			return promise;
		},
		
		mapError: function (func, ctx) {
			var promise = Promise.create();
			this.forwardSuccess(promise).error(function (err, pr) {
				var result = func.call(ctx || promise, err, pr);
				if (Promise.is(result))
					result.forwardCallback(promise);
				else
					promise.asyncError(result);
			});
			return promise;
		},

		mapCallback: function (func, ctx) {
			var promise = Promise.create();
			this.callback(function (err, value, pr) {
				var result = func.call(ctx || promise, err, value, pr);
				if (Promise.is(result))
					result.forwardCallback(promise);
				else
					promise.asyncCallback(err ? result : err, err ? value : result, pr);
			});
			return promise;
		},

		and: function (promises) {
			var result = Promise.and(this);
			return result.and(promises);
		}
	});
	
	return Promise;
});



Scoped.define("module:Timers.Timer", [
    "module:Class",
    "module:Objs",
    "module:Time"
], function (Class, Objs, Time, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
			
			/*
			 * int delay (mandatory): number of milliseconds until it fires
			 * bool once (optional, default false): should it fire infinitely often
			 * func fire (optional): will be fired
			 * object context (optional): for fire
			 * bool start (optional, default true): should it start immediately
			 * bool real_time (default false)
			 * int duration (optional, default null)
			 * int fire_max (optional, default null)
			 * 
			 */
			constructor: function (options) {
				inherited.constructor.call(this);
				options = Objs.extend({
					once: false,
					start: true,
					fire: null,
					context: this,
					destroy_on_fire: false,
					destroy_on_stop: false,
					real_time: false,
					duration: null,
					fire_max: null
				}, options);
				this.__delay = options.delay;
				this.__destroy_on_fire = options.destroy_on_fire;
				this.__destroy_on_stop = options.destroy_on_stop;
				this.__once = options.once;
				this.__fire = options.fire;
				this.__context = options.context;
				this.__started = false;
				this.__real_time = options.real_time;
				this.__end_time = options.duration !== null ? Time.now() + options.duration : null;
				this.__fire_max = options.fire_max;
				if (options.start)
					this.start();
			},
			
			destroy: function () {
				this.stop();
				inherited.destroy.call(this);
			},
			
			fire_count: function () {
				return this.__fire_count;
			},
			
			duration: function () {
				return Time.now() - this.__start_time;
			},
			
			fire: function () {
				if (this.__once)
					this.__started = false;
				if (this.__fire) {
					this.__fire.call(this.__context, this);
					this.__fire_count++;
					if (this.__real_time && !this.__destroy_on_fire && !this.__once) {
						while ((this.__fire_count + 1) * this.__delay <= Time.now() - this.__start_time) {
							this.__fire.call(this.__context, this);
							this.__fire_count++;
						}
					}
				}
				if ((this.__end_time !== null && Time.now() + this.__delay > this.__end_time) ||
					(this.__fire_max !== null && this.__fire_max <= this.__fire_count))
					this.stop();
				if (this.__destroy_on_fire)
					this.weakDestroy();
			},
			
			stop: function () {
				if (!this.__started)
					return;
				if (this.__once)
					clearTimeout(this.__timer);
				else
					clearInterval(this.__timer);
				this.__started = false;
				if (this.__destroy_on_stop)
					this.weakDestroy();
			},
			
			start: function () {
				if (this.__started)
					return;
				var self = this;
				this.__start_time = Time.now();
				this.__fire_count = 0;
				if (this.__once)
					this.__timer = setTimeout(function () {
						self.fire();
					}, this.__delay);
				else
					this.__timer = setInterval(function () {
						self.fire();
					}, this.__delay);
				this.__started = true;
			},
			
			restart: function () {
				this.stop();
				this.start();
			}
			
			
		};
	});
});

Scoped.define("module:Iterators.ArrayIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		
		/** ArrayIterator Class
		 * 
		 * @class BetaJS.Iterators.ArrayIterator
		 */
		return {

			/** Creates an Array Iterator
			 * 
			 * @param arr array
			 */
			constructor: function (arr) {
				inherited.constructor.call(this);
				this.__array = arr;
				this.__i = 0;
			},

			/** Determines whether there are more items.
			 * 
			 * @return true if there are more items
			 */
			hasNext: function () {
				return this.__i < this.__array.length;
			},

			/** Returns the next items if there is one.
			 * 
			 * @return next item
			 */
			next: function () {
				var ret = this.__array[this.__i];
				this.__i++;
				return ret;
			}
			
		};
	}, {

		byIterate: function (iterate_func, iterate_func_ctx) {
			var result = [];
			iterate_func.call(iterate_func_ctx || this, function (item) {
				result.push(item);
			}, this);
			return new this(result);
		}
	});
});


Scoped.define("module:Iterators.ObjectKeysIterator", ["module:Iterators.ArrayIterator"], function (ArrayIterator, scoped) {
	return ArrayIterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (obj) {
				inherited.constructor.call(this, Object.keys(obj));
			}

		};
	});
});


Scoped.define("module:Iterators.ObjectValuesIterator", ["module:Iterators.ArrayIterator", "module:Objs"], function (ArrayIterator, Objs, scoped) {
	return ArrayIterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (obj) {
				inherited.constructor.call(this, Objs.values(obj));
			}

		};
	});
});


Scoped.define("module:Iterators.LazyMultiArrayIterator", ["module:Iterators.LazyIterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (next_callback, next_context) {
				inherited.constructor.call(this);
				this.__next_callback = next_callback;
				this.__next_context = next_context;
				this.__array = null;
				this.__i = 0;
			},

			_next: function () {
				if (this.__array === null || this.__i >= this.__array.length) {
					this.__array = this.__next_callback.apply(this.__next_context);
					this.__i = 0;
				}
				if (this.__array !== null) {
					var ret = this.__array[this.__i];
					this.__i++;
					return ret;
				} else
					this._finished();
			}

		};
	});
});

Scoped.define("module:Iterators.MappedIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, map, context) {
				inherited.constructor.call(this);
				this.__iterator = iterator;
				this.__map = map;
				this.__context = context || this;
			},

			hasNext: function () {
				return this.__iterator.hasNext();
			},

			next: function () {
				return this.hasNext() ? this.__map.call(this.__context, this.__iterator.next()) : null;
			}

		};
	});
});


Scoped.define("module:Iterators.FilteredIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, filter, context) {
				inherited.constructor.call(this);
				this.__iterator = iterator;
				this.__filter = filter;
				this.__context = context || this;
				this.__next = null;
			},

			hasNext: function () {
				this.__crawl();
				return this.__next !== null;
			},

			next: function () {
				this.__crawl();
				var item = this.__next;
				this.__next = null;
				return item;
			},

			__crawl: function () {
				while (!this.__next && this.__iterator.hasNext()) {
					var item = this.__iterator.next();
					if (this.__filter_func(item))
						this.__next = item;
				}
			},

			__filter_func: function (item) {
				return this.__filter.apply(this.__context, [item]);
			}

		};
	});
});


Scoped.define("module:Iterators.SkipIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, skip) {
				inherited.constructor.call(this);
				this.__iterator = iterator;
				while (skip > 0) {
					iterator.next();
					skip--;
				}
			},

			hasNext: function () {
				return this.__iterator.hasNext();
			},

			next: function () {
				return this.__iterator.next();
			}

		};
	});
});


Scoped.define("module:Iterators.LimitIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, limit) {
				inherited.constructor.call(this);
				this.__iterator = iterator;
				this.__limit = limit;
			},

			hasNext: function () {
				return this.__limit > 0 && this.__iterator.hasNext();
			},

			next: function () {
				if (this.__limit <= 0)
					return null;
				this.__limit--;
				return this.__iterator.next();
			}

		};
	});
});


Scoped.define("module:Iterators.SortedIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, compare) {
				inherited.constructor.call(this);
				this.__array = iterator.asArray();
				this.__array.sort(compare);
				this.__i = 0;
			},

			hasNext: function () {
				return this.__i < this.__array.length;
			},

			next: function () {
				var ret = this.__array[this.__i];
				this.__i++;
				return ret;
			}

		};
	});
});


Scoped.define("module:Iterators.LazyIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function () {
				inherited.constructor.call(this);
				this.__finished = false;
				this.__initialized = false;
				this.__current = null;
				this.__has_current = false;
			},

			_initialize: function () {},

			_next: function () {},

			_finished: function () {
				this.__finished = true;
			},

			_current: function (result) {
				this.__current = result;
				this.__has_current = true;
			},

			__touch: function () {
				if (!this.__initialized)
					this._initialize();
				this.__initialized = true;
				if (!this.__has_current && !this.__finished)
					this._next();
			},

			hasNext: function () {
				this.__touch();
				return this.__has_current;
			},

			next: function () {
				this.__touch();
				this.__has_current = false;
				return this.__current;
			}

		};
	});
});


Scoped.define("module:Iterators.SortedOrIterator", ["module:Iterators.LazyIterator", "module:Structures.TreeMap", "module:Objs"], function (Iterator, TreeMap, Objs, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterators, compare) {
				this.__iterators = iterators;
				this.__map = TreeMap.empty(compare);
				inherited.constructor.call(this);
			},

			__process: function (iter) {
				if (iter.hasNext()) {
					var n = iter.next();
					var value = TreeMap.find(n, this.__map);
					if (value)
						value.push(iter);
					else 
						this.__map = TreeMap.add(n, [iter], this.__map);
				}
			},

			_initialize: function () {
				Objs.iter(this.__iterators, this.__process, this);
				if (TreeMap.is_empty(this.__map))
					this._finished();
			},

			_next: function () {
				var ret = TreeMap.take_min(this.__map);
				this._current(ret[0].key);
				this.__map = ret[1];
				Objs.iter(ret[0].value, this.__process, this);
				if (TreeMap.is_empty(this.__map))
					this._finished();
			}

		};
	});
});


Scoped.define("module:Iterators.PartiallySortedIterator", ["module:Iterators.Iterator"], function (Iterator, scoped) {
	return Iterator.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (iterator, compare, partial_same) {
				inherited.constructor.call(this);
				this.__compare = compare;
				this.__partial_same = partial_same;
				this.__iterator = iterator;
				this.__head = [];
				this.__tail = [];
			},

			__cache: function () {
				if (this.__head.length > 0)
					return;
				this.__head = this.__tail;
				this.__tail = [];
				if (!this.__iterator.hasNext())
					return;
				if (this.__head.length === 0)
					this.__head.push(this.__iterator.next());
				while (this.__iterator.hasNext()) {
					var n = this.__iterator.next();
					if (!this.__partial_same(this.__head[0], n)) {
						this.__tail.push(n);
						break;
					}
					this.__head.push(n);
				}
				this.__head.sort(this.__compare);
			},

			hasNext: function () {
				this.__cache();
				return this.__head.length > 0;
			},

			next: function () {
				this.__cache();
				return this.__head.shift();
			}

		};
	});		
});

Scoped.extend("module:Iterators", ["module:Types", "module:Iterators.Iterator", "module:Iterators.ArrayIterator"], function (Types, Iterator, ArrayIterator) {
	return {
		ensure: function (mixed) {
			if (mixed === null)
				return new ArrayIterator([]);
			if (mixed.instance_of(Iterator))
				return mixed;
			if (Types.is_array(mixed))
				return new ArrayIterator(mixed);
			return new ArrayIterator([mixed]);
		}		
	};
});


Scoped.define("module:Iterators.Iterator", [
    "module:Class",
    "module:Functions",
    "module:Async",
    "module:Promise"
], function (Class, Functions, Async, Promise, scoped) {
	return Class.extend({scoped: scoped}, {
		
		hasNext: function () {
			return false;
		},
		
		next: function () {
			return null;
		},
		
		nextOrNull: function () {
			return this.hasNext() ? this.next() : null;
		},

		asArray: function () {
			var arr = [];
			while (this.hasNext())
				arr.push(this.next());
			return arr;
		},

		asArrayDelegate: function (f) {
			var arr = [];
			while (this.hasNext()) {
				var obj = this.next();			
				arr.push(obj[f].apply(obj, Functions.getArguments(arguments, 1)));
			}
			return arr;
		},

		iterate: function (cb, ctx) {
			while (this.hasNext()) {
				var result = cb.call(ctx || this, this.next());
				if (result === false)
					return;
			}
		},
		
		asyncIterate: function (cb, ctx, time) {
			if (!this.hasNext())
				return Promise.value(true);
			var result = cb.call(ctx || this, this.next());
			if (result === false)
				return Promise.value(true);
			var promise = Promise.create();
			Async.eventually(function () {
				this.asyncIterate(cb, ctx, time).forwardCallback(promise);
			}, this, time);
			return promise;
		}

	});
});

Scoped.define("module:Net.AjaxException", [
    "module:Exceptions.Exception",
    "module:Objs"
], function (Exception, Objs, scoped) {
	return Exception.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (status_code, status_text, data) {
				inherited.constructor.call(this, status_code + ": " + status_text);
				this.__status_code = status_code;
				this.__status_text = status_text;
				this.__data = data;
			},

			status_code: function () {
				return this.__status_code;
			},

			status_text: function () {
				return this.__status_text;
			},

			data: function () {
				return this.__data;
			},

			json: function () {
				return Objs.extend({
					data: this.data(),
					status_code: this.status_code(),
					status_text: this.status_text()
				}, inherited.json.call(this));
			}
			
		};
	});
});


/*
 * <ul>
 *  <li>uri: target uri</li>
 *  <li>method: get, post, ...</li>
 *  <li>data: data as JSON to be passed with the request</li>
 * </ul>
 * 
 */

Scoped.define("module:Net.AbstractAjax", [ "module:Class", "module:Objs", "module:Net.Uri" ], function(Class, Objs, Uri, scoped) {
	return Class.extend({ scoped : scoped }, function(inherited) {
		return {

			constructor : function(options) {
				inherited.constructor.call(this);
				this.__options = Objs.extend({
					"method" : "GET",
					"data" : {}
				}, options);
			},

			asyncCall : function(options) {
				if (this._shouldMap(options))
					options = this._mapToPost(options);
				return this._asyncCall(Objs.extend(Objs
						.clone(this.__options, 1), options));
			},

			_asyncCall : function(options) {
				throw "Abstract";
			},

			/**
			 * @method _shouldMap
			 * 
			 * Check if should even attempt a mapping. Important to not assume
			 * that the method option is always specified.
			 * 
			 * @return Boolean
			 */
			_shouldMap : function(options) {
				return (this.__options.mapPutToPost && options.method && options.method.toLowerCase() === "put") ||
				       (this.__options.mapDestroyToPost && options.method && options.method.toLowerCase() === "destroy");
			},

			/**
			 * @method _mapPutToPost
			 * 
			 * Some implementations do not supporting sending data with
			 * the non-standard request. This fix converts the Request to use POST, so
			 * the data is sent, but the server still thinks it is receiving a
			 * non-standard request.
			 * 
			 * @param {object}
			 *            options
			 * 
			 * @return {object}
			 */
			_mapToPost : function(options) {
				options.uri = Uri.appendUriParams(options.uri, {
					_method : options.method.toUpperCase()
				});
				options.method = "POST";
				return options;
			}
		};
	});
});

Scoped.define("module:Net.SocketSenderChannel", ["module:Channels.Sender", "module:Types"], function (Sender, Types, scoped) {
	return Sender.extend({scoped: scoped}, function (inherited) {
		return {
			
			constructor: function (socket, message, ready) {
				inherited.constructor.call(this);
				this.__socket = socket;
				this.__message = message;
				this.__ready = Types.is_defined(ready) ? ready : true;
				this.__cache = [];
			},
			
			/** @suppress {missingProperties} */
			_send: function (message, data) {
				if (this.__ready) {
					this.__socket.emit(this.__message, {
						message: message,
						data: data
					});
				} else {
					this.__cache.push({
						message: message,
						data: data
					});
				}
			},
			
			ready: function () {
				this.__ready = true;
				for (var i = 0; i < this.__cache.length; ++i)
					this._send(this.__cache[i].message, this.__cache[i].data);
				this.__cache = [];
			},
			
			unready: function () {
			    this.__ready = false;
			},
			
			socket: function () {
			    if (arguments.length > 0)
			        this.__socket = arguments[0];
			    return this.__socket;
			}
			
		};
	});
});


Scoped.define("module:Net.SocketReceiverChannel", ["module:Channels.Receiver"], function (Receiver, scoped) {
	return Receiver.extend({scoped: scoped}, function (inherited) {
		return {
						
			constructor: function (socket, message) {
				inherited.constructor.call(this);
				this.__message = message;
				this.socket(socket);
			},
			
		    socket: function () {
		        if (arguments.length > 0) {
		            this.__socket = arguments[0];
		            if (this.__socket) {
		                var self = this;
		                this.__socket.on(this.__message, function (data) {
		                    self._receive(data.message, data.data);
		                });
		            }
		        }
		        return this.__socket;
		    }
	
		};
	});
});

Scoped.define("module:Net.HttpHeader", function () {
	/**
	 * Http Header Codes and Functions
	 * 
	 * @module BetaJS.Net.HttpHeader
	 */
	return {
		
		HTTP_STATUS_OK : 200,
		HTTP_STATUS_CREATED : 201,
		HTTP_STATUS_PAYMENT_REQUIRED : 402,
		HTTP_STATUS_FORBIDDEN : 403,
		HTTP_STATUS_NOT_FOUND : 404,
		HTTP_STATUS_PRECONDITION_FAILED : 412,
		HTTP_STATUS_INTERNAL_SERVER_ERROR : 500,
		
		
		/**
		 * Formats a HTTP status code to a string.
		 * 
		 * @param {integer} code the http status code
		 * @param {boolean} prepend_code should the integer status code be prepended (default false)
		 * 
		 * @return HTTP status code as a string.
		 */
		format: function (code, prepend_code) {
			var ret = "";
			if (code == this.HTTP_STATUS_OK)
				ret = "OK";
			else if (code == this.HTTP_STATUS_CREATED)
				ret = "Created";
			else if (code == this.HTTP_STATUS_PAYMENT_REQUIRED)
				ret = "Payment Required";
			else if (code == this.HTTP_STATUS_FORBIDDEN)
				ret = "Forbidden";
			else if (code == this.HTTP_STATUS_NOT_FOUND)
				ret = "Not found";
			else if (code == this.HTTP_STATUS_PRECONDITION_FAILED)
				ret = "Precondition Failed";
			else if (code == this.HTTP_STATUS_INTERNAL_SERVER_ERROR)
				ret = "Internal Server Error";
			else
				ret = "Other Error";
			return prepend_code ? (code + " " + ret) : ret;
		}
		
	};
});
Scoped.define("module:Net.Uri", ["module:Objs", "module:Types"], function (Objs, Types) {
	
	var parse_strict_regex = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var parse_loose_regex = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var parse_key = ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];
	var parse_key_parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
	
	
	/**
	 * Uri Auxilary Functions
	 * 
	 * @module BetaJS.Net.Uri
	 */
	return {
		
		/**
		 * Create a URI string from a set of parameters.
		 * 
		 * @param {object} obj parameters
		 * 
		 * @return {string} uri
		 */
		build: function (obj) {
			var s = "";
			if (obj.protocol)
				s += obj.protocol + "://";
			if (obj.username)
				s += obj.username + ":";
			if (obj.password)
				s += obj.password + "@";
			s += obj.server;
			if (obj.port)
				s += ":" + obj.port;
			if (obj.path)
				s += "/" + obj.path;			
			return s;
		},
		
		
		/**
		 * Encode a set of uri query parameters.
		 * 
		 * @param {object} arr a key-value set of query parameters
		 * @param {string} prefix an optional prefix to be used for generating the keys
		 * 
		 * @return {string} encoded query parameters
		 */
		encodeUriParams: function (arr, prefix) {
			prefix = prefix || "";
			var res = [];
			Objs.iter(arr, function (value, key) {
				if (Types.is_object(value))
					res = res.concat(this.encodeUriParams(value, prefix + key + "_"));
				else
					res.push(prefix + key + "=" + encodeURIComponent(value));
			}, this);
			return res.join("&");
		},
		
		
		/**
		 * Append a set of uri query parameters to a URI.
		 * 
		 * @param {string} uri a uri
		 * @param {object} arr a key-value set of query parameters
		 * @param {string} prefix an optional prefix to be used for generating the keys
		 * 
		 * @return {string} uri with the encoded query parameters attached
		 */
		appendUriParams: function (uri, arr, prefix) {
			return Types.is_empty(arr) ? uri : (uri + (uri.indexOf("?") != -1 ? "&" : "?") + this.encodeUriParams(arr, prefix));
		},
		
		
		/**
		 * Parses a given uri into decomposes it into its components.
		 * 
		 * @thanks parseUri 1.2.2, (c) Steven Levithan <stevenlevithan.com>, MIT License
		 * 
		 * @param {string} str uri to be parsed
		 * @param {boolean} strict use strict parsing (default false)
		 * 
		 * @return {object} decomposed uri
		 */
		parse: function (str, strict) {
			var parser = strict ? parse_strict_regex : parse_loose_regex;
			var m = parser.exec(str);
			var uri = {};
			for (var i = 0; i < parse_key.length; ++i)
				uri[parse_key[i]] = m[i] || "";
			uri.queryKey = {};
			uri[parse_key[12]].replace(parse_key_parser, function ($0, $1, $2) {
				if ($1) uri.queryKey[$1] = $2;
			});
			return uri;
		}
			
	};
});	

Scoped.define("module:RMI.Client", [
                                    "module:Class",
                                    "module:Objs",
                                    "module:Channels.TransportChannel",
                                    "module:Ids",
                                    "module:RMI.Skeleton",
                                    "module:Types",
                                    "module:RMI.Stub"
                                    ], function (Class, Objs, TransportChannel, Ids, Skeleton, Types, Stub, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {			

			constructor: function (sender_or_channel_or_null, receiver_or_null) {
				inherited.constructor.call(this);
				this.__channel = null;
				this.__instances = {};
				if (sender_or_channel_or_null) {
					var channel = sender_or_channel_or_null;
					if (receiver_or_null)
						channel = this._auto_destroy(new TransportChannel(sender_or_channel_or_null, receiver_or_null));
					this.__channel = channel;
				}
			},

			destroy: function () {
				if (this.__channel)
					this.disconnect();
				inherited.destroy.call(this);
			},

			connect: function (channel) {
				if (this.__channel)
					return;
				this.__channel = channel;
			},

			disconnect: function () {
				if (!this.__channel)
					return;
				this.__channel = null;
				Objs.iter(this.__instances, function (inst) {
					this.release(inst);
				}, this);
			},

			_serializeValue: function (value) {
				if (Skeleton.is_instance_of(value)) {
					var registry = this.server;
					registry.registerInstance(value);
					return {
						__rmi_meta: true,
						__rmi_stub: value.stub(),
						__rmi_stub_id: Ids.objectId(value)
					};
				} else
					return value;		
			},

			_unserializeValue: function (value) {
				if (value && value.__rmi_meta) {
					var receiver = this;
					return receiver.acquire(value.__rmi_stub, value.__rmi_stub_id);
				} else
					return value;		
			},

			acquire: function (class_type, instance_name) {
				if (this.__instances[instance_name])
					return this.__instances[instance_name];
				if (Types.is_string(class_type))
					class_type = Scoped.getGlobal(class_type);
				if (!class_type || !class_type.ancestor_of(Stub))
					return null;
				var instance = new class_type();
				this.__instances[Ids.objectId(instance, instance_name)] = instance;
				var self = this;
				instance.__send = function (message, data) {
					if (!self.__channel)
						return;
					data = Objs.map(data, self._serializeValue, self);
					return self.__channel.send(instance_name + ":" + message, data).mapSuccess(function (result) {
						return this._unserializeValue(result);
					}, self);
				};
				return instance;		
			},

			release: function (instance) {
				var instance_name = Ids.objectId(instance);
				if (!this.__instances[instance_name])
					return;
				instance.weakDestroy();
				delete this.__instances[instance_name];
			}

		};
	});
});




Scoped.define("module:RMI.Peer", [
                                  "module:Class",
                                  "module:Channels.SenderMultiplexer",
                                  "module:Channels.ReceiverMultiplexer",
                                  "module:RMI.Client",
                                  "module:RMI.Server"
                                  ], function (Class, SenderMultiplexer, ReceiverMultiplexer, Client, Server, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {			

			constructor: function (sender, receiver) {
				inherited.constructor.call(this);
				this.__sender = sender;
				this.__receiver = receiver;
				this.__client_sender = this._auto_destroy(new SenderMultiplexer(sender, "client"));
				this.__server_sender = this._auto_destroy(new SenderMultiplexer(sender, "server"));
				this.__client_receiver = this._auto_destroy(new ReceiverMultiplexer(receiver, "server"));
				this.__server_receiver = this._auto_destroy(new ReceiverMultiplexer(receiver, "client"));
				this.client = this._auto_destroy(new Client(this.__client_sender, this.__client_receiver));
				this.server = this._auto_destroy(new Server(this.__server_sender, this.__server_receiver));
				this.client.server = this.server;
				this.server.client = this.client;
			},	

			acquire: function (class_type, instance_name) {
				return this.client.acquire(class_type, instance_name);
			},

			release: function (instance) {
				this.client.release(instance);
			},

			registerInstance: function (instance, options) {
				return this.server.registerInstance(instance, options);
			},

			unregisterInstance: function (instance) {
				this.server.unregisterInstance(instance);
			}

		};
	});
});



Scoped.define("module:RMI.Server", [
                                    "module:Class",
                                    "module:Events.EventsMixin",
                                    "module:Objs",
                                    "module:Channels.TransportChannel",
                                    "module:Lists.ObjectIdList",
                                    "module:Ids",
                                    "module:RMI.Skeleton",
                                    "module:Promise"
                                    ], function (Class, EventsMixin, Objs, TransportChannel, ObjectIdList, Ids, Skeleton, Promise, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {

			constructor: function (sender_or_channel_or_null, receiver_or_null) {
				inherited.constructor.call(this);
				this.__channels = new ObjectIdList();
				this.__instances = {};
				if (sender_or_channel_or_null) {
					var channel = sender_or_channel_or_null;
					if (receiver_or_null)
						channel = this._auto_destroy(new TransportChannel(sender_or_channel_or_null, receiver_or_null));
					this.registerClient(channel);
				}
			},

			destroy: function () {
				this.__channels.iterate(this.unregisterClient, this);
				Objs.iter(this.__instances, function (inst) {
					this.unregisterInstance(inst.instance);
				}, this);
				this.__channels.destroy();
				inherited.destroy.call(this);
			},

			registerInstance: function (instance, options) {
				options = options || {};
				this.__instances[Ids.objectId(instance, options.name)] = {
						instance: instance,
						options: options
				};
				return instance;
			},

			unregisterInstance: function (instance) {
				delete this.__instances[Ids.objectId(instance)];
				instance.weakDestroy();
			},

			registerClient: function (channel) {
				var self = this;
				this.__channels.add(channel);
				channel._reply = function (message, data) {
					var components = message.split(":");
					if (components.length == 2)
						return self._invoke(channel, components[0], components[1], data);
					else
						return Promise.error(true);
				};
			},

			unregisterClient: function (channel) {
				this.__channels.remove(channel);
				channel._reply = null;
			},

			_serializeValue: function (value) {
				if (Skeleton.is_instance_of(value)) {
					var registry = this;
					registry.registerInstance(value);
					return {
						__rmi_meta: true,
						__rmi_stub: value.stub(),
						__rmi_stub_id: Ids.objectId(value)
					};
				} else
					return value;		
			},

			_unserializeValue: function (value) {
				if (value && value.__rmi_meta) {
					var receiver = this.client;
					return receiver.acquire(value.__rmi_stub, value.__rmi_stub_id);
				} else
					return value;		
			},

			_invoke: function (channel, instance_id, method, data) {
				var instance = this.__instances[instance_id];
				if (!instance) {
					this.trigger("loadInstance", channel, instance_id);
					instance = this.__instances[instance_id];
				}
				if (!instance)
					return Promise.error(instance_id);
				instance = instance.instance;
				data = Objs.map(data, this._unserializeValue, this);
				return instance.invoke(method, data, channel).mapSuccess(function (result) {
					return this._serializeValue(result);
				}, this);
			}

		};
	}]);
});




Scoped.define("module:RMI.Skeleton", [
                                      "module:Class",
                                      "module:Objs",
                                      "module:Promise"
                                      ], function (Class, Objs, Promise, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			_stub: null,
			intf: [],
			_intf: {},
			__superIntf: ["_destroy"],

			constructor: function (options) {
				this._options = Objs.extend({
					destroyable: false
				}, options);
				inherited.constructor.call(this);
				this.intf = this.intf.concat(this.__superIntf);
				for (var i = 0; i < this.intf.length; ++i)
					this._intf[this.intf[i]] = true;
			},

			_destroy: function () {
				if (this._options.destroyable)
					this.destroy();
			},

			invoke: function (message, data) {
				if (!(this._intf[message]))
					return Promise.error(message);
				try {
					var result = this[message].apply(this, data);
					return Promise.is(result) ? result : Promise.value(result);
				} catch (e) {
					return Promise.error(e);
				}
			},

			_success: function (result) {
				return Promise.value(result);
			},

			_error: function (result) {
				return Promise.error(result);
			},

			stub: function () {
				if (this._stub)
					return this._stub;
				var stub = this.cls.classname;
				return stub.indexOf("Skeleton") >= 0 ? stub.replace("Skeleton", "Stub") : stub;
			}

		};
	});
});

Scoped.define("module:RMI.Stub", [
                                  "module:Class",
                                  "module:Classes.InvokerMixin",
                                  "module:Functions"
                                  ], function (Class, InvokerMixin, Functions, scoped) {
	return Class.extend({scoped: scoped}, [InvokerMixin, function (inherited) {
		return {

			intf: [],

			constructor: function () {
				inherited.constructor.call(this);
				this.invoke_delegate("invoke", this.intf);
			},

			destroy: function () {
				this.invoke("_destroy");
				inherited.destroy.call(this);
			},

			invoke: function (message) {
				return this.__send(message, Functions.getArguments(arguments, 1));
			}

		};
	}]);
});


Scoped.define("module:RMI.StubSyncer", [
                                        "module:Class",
                                        "module:Classes.InvokerMixin",
                                        "module:Functions",
                                        "module:Promise"
                                        ], function (Class, InvokerMixin, Functions, Promise, scoped) {
	return Class.extend({scoped: scoped}, [InvokerMixin, function (inherited) {
		return {

			constructor: function (stub) {
				inherited.constructor.call(this);
				this.__stub = stub;
				this.__current = null;
				this.__queue = [];
				this.invoke_delegate("invoke", this.__stub.intf);
			},

			invoke: function () {
				var object = {
						args: Functions.getArguments(arguments),
						promise: Promise.create()
				};
				this.__queue.push(object);
				if (!this.__current)
					this.__next();
				return object.promise;		
			},

			__next: function () {
				if (this.__queue.length === 0)
					return;
				this.__current = this.__queue.shift();
				this.__stub.invoke.apply(this.__stub, this.__current.args).forwardCallback(this.__current.promise).callback(this.__next, this);
			}

		};
	}]);
});


Scoped.define("module:States.CompetingComposite", [
                                                   "module:Class",
                                                   "module:Objs"
                                                   ], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, {

		_register_host: function (competing_host) {
			this._hosts = this._hosts || [];
			this._hosts.push(this._auto_destroy(competing_host));
		},

		other_hosts: function (competing_host) {
			return Objs.filter(this._hosts || [], function (other) {
				return other != competing_host;
			}, this);
		},

		_next: function (competing_host, state) {
			var others = this.other_hosts(competing_host);
			for (var i = 0; i < others.length; ++i) {
				var other = others[i];
				var other_state = other.state();
				if (!other_state.can_coexist_with(state))
					other_state.retreat_against(state);
			}
		}

	});
});


Scoped.define("module:States.CompetingHost", ["module:States.Host"], function (Host, scoped) {
	return Host.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (composite) {
				inherited.constructor.call(this);
				this._composite = composite;
				if (composite)
					composite._register_host(this);
			},

			composite: function () {
				return this._composite;
			},

			_can_transition_to: function (state) {
				if (!inherited._can_transition_to.call(this, state))
					return false;
				if (!this._composite)
					return true;
				var others = this._composite.other_hosts(this);
				for (var i = 0; i < others.length; ++i) {
					var other = others[i];
					var other_state = other.state();
					if (!state.can_coexist_with(other_state) && !state.can_prevail_against(other_state))
						return false;
				}
				return true;
			},

			_next: function (state) {
				if (this._composite)
					this._composite._next(this, state);
				inherited._next.call(this, state);
			}

		};
	});    
});


Scoped.define("module:States.CompetingState", ["module:States.State"], function (State, scoped) {
	return State.extend({scoped: scoped}, {

		can_coexist_with: function (foreign_state) {
			return true;
		},

		can_prevail_against: function (foreign_state) {
			return false;
		},

		retreat_against: function (foreign_state) {
		}

	});
});

Scoped.define("module:Router.RouteParser", [ "module:Class", "module:Strings",
                                             "module:Objs" ], function(Class, Strings, Objs, scoped) {
	return Class.extend({
		scoped : scoped
	}, function(inherited) {
		return {

			constructor : function(routes) {
				inherited.constructor.call(this);
				this.routes = {};
				Objs.iter(routes, function(route, key) {
					this.bind(key, route);
				}, this);
			},

			parse : function(route) {
				for ( var key in this.routes) {
					var entry = this.routes[key];
					var result = entry.captureRegex.exec(route);
					if (result) {
						return {
							name : entry.name,
							args : result
						};
					}
				}
				return null;
			},

			format : function(name, args) {
				args = args || {};
				var entry = this.routes[name];
				return Strings.regexReplaceGroups(entry.regex,
						entry.captureRegex.mapBack(args));
			},

			bind : function(key, route) {
				this.routes[key] = {
						name : key,
						regex : route,
						captureRegex : Strings.namedCaptureRegex("^" + route + "$")
				};
				return this;
			}

		};
	});
});

Scoped.define("module:Router.RouteMap", [ "module:Class", "module:Strings",
                                          "module:Objs" ], function(Class, Strings, Objs, scoped) {
	return Class.extend({
		scoped : scoped
	}, function(inherited) {
		return {

			constructor : function(options) {
				inherited.constructor.call(this);
				options = options || {};
				this._defaultMap = options.map;
				this._context = options.context || this;
				this._bindings = options.bindings || {};
			},

			map : function(name, args) {
				var binding = this._bindings[name];
				if (binding)
					return binding.call(this._context, name, args);
				if (this._defaultMap)
					return this._defaultMap.call(this._context, name, args);
				return {
					name : name,
					args : args
				};
			},

			bind : function(name, func) {
				this._bindings[name] = func;
				return this;
			}

		};
	});
});

Scoped.define("module:Router.Router", [ "module:Class",
                                        "module:Events.EventsMixin", "module:Objs",
                                        "module:Router.RouteParser", "module:Comparators" ], function(Class,
                                        		EventsMixin, Objs, RouteParser, Comparators, scoped) {
	return Class.extend({
		scoped : scoped
	}, [
	    EventsMixin,
	    function(inherited) {
	    	return {

	    		constructor : function(routes) {
	    			inherited.constructor.call(this);
	    			this._routeParser = new RouteParser(routes);
	    			this._current = null;
	    		},

	    		destroy : function() {
	    			this._routeParser.destroy();
	    			inherited.destroy.call(this);
	    		},

	    		bind : function(key, route, func, ctx) {
	    			this._routeParser.bind(key, route);
	    			if (func)
	    				this.on("dispatch:" + key, func, ctx);
	    			return this;
	    		},

	    		current : function() {
	    			return this._current;
	    		},

	    		navigate : function(route) {
	    			this.trigger("navigate", route);
	    			this.trigger("navigate:" + route);
	    			var parsed = this._routeParser.parse(route);
	    			if (parsed)
	    				this.dispatch(parsed.name, parsed.args, route);
	    		},

	    		dispatch : function(name, args, route) {
	    			if (this._current) {
	    				if (this._current.name === name && Comparators.deepEqual(args, this._current.args, 2))
	    					return;
	    				this.trigger("leave", this._current.name,
	    						this._current.args, this._current);
	    				this.trigger("leave:" + this._current.name,
	    						this._current.args, this._current);
	    			}
	    			var current = {
    					route : route || this.format(name, args),
    					name : name,
    					args : args
	    			};
	    			this.trigger("dispatch", name, args, current);
	    			this.trigger("dispatch:" + name, args, current);
	    			this._current = current;
	    			this.trigger("dispatched", name, args, current);
	    			this.trigger("dispatched:" + name, args, current);
	    		},

	    		format : function(name, args) {
	    			return this._routeParser.format(name, args);
	    		}

	    	};
	    } ]);
});



Scoped.define("module:Router.RouteBinder", [ "module:Class", "module:Types" ], function(Class, Types, scoped) {
	return Class.extend({ scoped : scoped
	}, function(inherited) {
		return {
			
			_setLocalRoute: function (currentRoute) {},
			
			_getLocalRoute: function () {},
			
			_localRouteChanged: function () {
				this.setGlobalRoute(this._getLocalRoute());
			},

			constructor : function(router) {
				inherited.constructor.call(this);
				this._router = router;
				router.on("dispatched", function () {
					this.setLocalRoute(router.current());
				}, this);
				if (router.current())
					this.setLocalRoute(router.current());
				else if (this._getLocalRoute())
					this.setGlobalRoute(this._getLocalRoute());
			},

			destroy : function() {
				this._router.off(null, null, this);
				inherited.destroy.call(this);
			},
			
			setLocalRoute: function (currentRoute) {
				this._setLocalRoute(currentRoute);
			},
			
			setGlobalRoute: function (route) {
				if (Types.is_string(route))
					this._router.navigate(route);
				else
					this._router.dispatch(route.name, route.args);
			}

		};
	});
});


Scoped.define("module:Router.StateRouteBinder", [ "module:Router.RouteBinder", "module:Objs", "module:Strings",
                                                  "module:Router.RouteMap" ], function(RouteBinder, Objs, Strings, RouteMap, scoped) {
	return RouteBinder.extend({ scoped : scoped
	}, function(inherited) {
		return {

			constructor : function(router, stateHost, options) {
				this._stateHost = stateHost;
				options = Objs.extend({
					capitalizeStates: false
				}, options);
				this._options = options;
				this._routeToState = new RouteMap({
					map : this._options.routeToState || function (name, args) {
						return {
							name: options.capitalizeStates ? Strings.capitalize(name) : name,
							args: args
						};
					},
					context : this._options.context
				});
				this._stateToRoute = new RouteMap({
					map : this._options.stateToRoute || function (name, args) {
						return {
							name: name.toLowerCase(),
							args: args
						};
					},
					context : this._options.context
				});
				inherited.constructor.call(this, router);
				stateHost.on("start", this._localRouteChanged, this);
			},

			destroy : function() {
				this._routeToState.destroy();
				this._stateToRoute.destroy();
				this._stateHost.off(null, null, this);
				inherited.destroy.call(this);
			},

			bindRouteToState : function(name, func) {
				this._routeToState.bind(name, func);
				return this;
			},

			bindStateToRoute : function(name, func) {
				this._stateToRoute.bind(name, func);
				return this;
			},

			register: function (name, route, extension) {
				this._router.bind(name, route);
				this._stateHost.register(this._options.capitalizeStates ? Strings.capitalize(name) : name, extension);
				return this;
			},			

			_setLocalRoute: function (currentRoute) {
				var mapped = this._routeToState.map(currentRoute.name, currentRoute.args);
				if (mapped) {
					this._stateHost.weakNext(mapped.name, mapped.args);
					/*
					Objs.iter(args, function (value, key) {
						this._stateHost.set(key, value);
					}, this);
					*/
				}
			},
			
			_getLocalRoute: function () {
				if (!this._stateHost.state())
					return null;
				var state = this._stateHost.state();
				return this._stateToRoute.map(state.state_name(), state.allAttr());
			}			

		};
	});
});

Scoped.define("module:Router.RouterHistory", [ "module:Class",
                                               "module:Events.EventsMixin" ], function(Class, EventsMixin, scoped) {
	return Class.extend({
		scoped : scoped
	}, [ EventsMixin, function(inherited) {
		return {

			constructor : function(router) {
				inherited.constructor.call(this);
				this._router = router;
				this._history = [];
				router.on("dispatched", function(name, args, current) {
					this._history.push(current);
					this.trigger("change", current);
					this.trigger("insert", current);
				}, this);
			},

			destroy : function() {
				this._router.off(null, null, this);
				inherited.destroy.call(this);
			},

			last : function(index) {
				index = index || 0;
				return this.get(this.count() - 1 - index);
			},

			count : function() {
				return this._history.length;
			},

			get : function(index) {
				index = index || 0;
				return this._history[index];
			},

			back : function(index) {
				if (this.count() < 2)
					return null;
				index = index || 0;
				while (index >= 0 && this.count() > 1) {
					var removed = this._history.pop();
					this.trigger("remove", removed);
					--index;
				}
				var item = this._history.pop();
				this.trigger("change", item);
				return this._router.dispatch(item.name, item.args);
			}

		};
	} ]);
});

Scoped.define("module:States.Host", [
                                     "module:Properties.Properties",
                                     "module:Events.EventsMixin",
                                     "module:States.State",
                                     "module:Types",
                                     "module:Strings",
                                     "module:Classes.ClassRegistry"
                                     ], function (Class, EventsMixin, State, Types, Strings, ClassRegistry, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {

			constructor: function (options) {
				inherited.constructor.call(this);
				options = options || {};
				this._stateRegistry = options.stateRegistry;
				this._baseState = options.baseState;
				this._enabled = true;
			},

			initialize: function (initial_state, initial_args) {
				if (!this._stateRegistry) {
					var s = null;
					if (Types.is_string(initial_state) && initial_state.indexOf(".") >= 0) {
						var split = Strings.splitLast(initial_state, ".");
						initial_state = split.tail;
						s = split.head;
					} else if (!Types.is_string(initial_state))
						s = Strings.splitLast(initial_state.classname, ".").head;
					else
						s = Strings.splitLast(this.cls.classname, ".").head;
					this._stateRegistry = this._auto_destroy(new ClassRegistry(Scoped.getGlobal(s)));
				}
				this._createState(initial_state, initial_args).start();
				this._baseState = this._baseState || this._state.cls; 
			},

			_createState: function (state, args, transitionals) {
				return this._stateRegistry.create(state, this, args || {}, transitionals || {});
			},

			finalize: function () {
				if (this._state)
					this._state.end();
				this._state = null;    	
			},

			destroy: function () {
				this.finalize();
				inherited.destroy.call(this);
			},
			
			enable: function () {
				this._enabled = true;
			},
			
			disable: function () {
				this._enabled = false;
			},

			state: function () {
				return this._state;
			},

			state_name: function () {
				return this.state().state_name();
			},

			next: function () {
				return this.state() ? this.state().next.apply(this.state(), arguments) : this.initialize.apply(this, arguments);
			},
			
			weakNext: function () {
				return this.state() ? this.state().weakNext.apply(this.state(), arguments) : this.initialize.apply(this, arguments);
			},
			
			_start: function (state) {
				this._stateEvent(state, "before_start");
				this._state = state;
				this.set("name", state.state_name());
			},

			_afterStart: function (state) {
				this._stateEvent(state, "start");
			},

			_end: function (state) {
				this._stateEvent(state, "end");
				this._state = null;
			},

			_afterEnd: function (state) {
				this._stateEvent(state, "after_end");
			},

			_next: function (state) {
				this._stateEvent(state, "next");
			},

			_afterNext: function (state) {
				this._stateEvent(state, "after_next");
			},

			_can_transition_to: function (state) {
				return this._enabled;
			},

			_stateEvent: function (state, s) {
				this.trigger("event", s, state.state_name(), state.description());
				this.trigger(s, state.state_name(), state.description());
				this.trigger(s + ":" + state.state_name(), state.description());
			},

			register: function (state_name, parent_state, extend) {
				if (!Types.is_string(parent_state)) {
					extend = parent_state;
					parent_state = null;
				}
				if (!this._stateRegistry)
					this._stateRegistry = this._auto_destroy(new ClassRegistry(Strings.splitLast(this.cls.classname).head));
				var base = this._baseState ? (Strings.splitLast(this._baseState.classname, ".").head + "." + state_name) : (state_name.indexOf(".") >= 0 ? state_name : null);
				var cls = (this._stateRegistry.get(parent_state) || this._baseState || State).extend(base, extend);
				if (!base)
					cls.classname = state_name;
				this._stateRegistry.register(Strings.last_after(state_name, "."), cls);
				return this;
			}

		};
	}]);
});


Scoped.define("module:States.State", [
                                      "module:Class",
                                      "module:Types",
                                      "module:Strings",
                                      "module:Async",
                                      "module:Objs"
                                      ], function (Class, Types, Strings, Async, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			_locals: [],
			_persistents: [],
			_defaults: {},
			_clonedDefaults: {},

			_white_list: null,
			
			_starting: false,
			_started: false,
			_stopped: false,
			_transitioning: false,
			__next_state: null,
			__suspended: 0,

			constructor: function (host, args, transitionals) {
				inherited.constructor.call(this);
				this.host = host;
				this.transitionals = transitionals;
				args = Objs.extend(Objs.extend(Objs.clone(this._clonedDefaults || {}, -1), Objs.clone(this._defaults || {}, 1)), args);
				this._locals = Types.is_function(this._locals) ? this._locals() : this._locals;
				var used = {};
				for (var i = 0; i < this._locals.length; ++i) {
					this["_" + this._locals[i]] = args[this._locals[i]];
					used[this._locals[i]] = true;
				}
				this._persistents = Types.is_function(this._persistents) ? this._persistents() : this._persistents;
				for (i = 0; i < this._persistents.length; ++i) {
					this["_" + this._persistents[i]] = args[this._persistents[i]];
					used[this._locals[i]] = true;
				}
				host.suspendEvents();
				Objs.iter(args, function (value, key) {
					if (!used[key])
						host.set(key, value);
				}, this);
				host.resumeEvents();
			},
			
			allAttr: function () {
				var result = Objs.clone(this.host.data(), 1);
				Objs.iter(this._locals, function (key) {
					result[key] = this["_" + key];
				}, this);
				Objs.iter(this._persistents, function (key) {
					result[key] = this["_" + key];
				}, this);
				return result;
			},

			state_name: function () {
				return Strings.last_after(this.cls.classname, ".");
			},

			description: function () {
				return this.state_name();
			},

			start: function () {
				if (this._starting)
					return;
				this._starting = true;
				this.host._start(this);
				this._start();
				if (this.host) {
					this.host._afterStart(this);
					this._started = true;
				}
			},

			end: function () {
				if (this._stopped)
					return;
				this._stopped = true;
				this._end();
				this.host._end(this);
				this.host._afterEnd(this);
				this.destroy();
			},

			eventualNext: function (state_name, args, transitionals) {
				this.suspend();
				this.next(state_name, args, transitionals);
				this.eventualResume();
			},

			next: function (state_name, args, transitionals) {
				if (!this._starting || this._stopped || this.__next_state)
					return;
				args = args || {};
				for (var i = 0; i < this._persistents.length; ++i) {
					if (!(this._persistents[i] in args))
						args[this._persistents[i]] = this["_" + this._persistents[i]];
				}
				var obj = this.host._createState(state_name, args, transitionals);
				if (!this.can_transition_to(obj)) {
					obj.destroy();
					return;
				}
				if (!this._started) {
					this.host._afterStart(this);
					this._started = true;
				}
				this.__next_state = obj;
				this._transitioning = true;
				this._transition();
				if (this.__suspended <= 0)
					this.__next();
			},
			
			weakSame: function (state_name, args, transitionals) {
				var same = true;
				if (state_name !== this.state_name())
					same = false;
				var all = this.allAttr();
				Objs.iter(args, function (value, key) {
					if (all[key] !== value)
						same = false;
				}, this);
				return same;
			},
			
			weakNext: function (state_name, args, transitionals) {
				return this.weakSame.apply(this, arguments) ? this : this.next.apply(this, arguments);
			},

			__next: function () {
				var host = this.host;
				var obj = this.__next_state;
				host._next(obj);
				this.end();
				obj.start();
				host._afterNext(obj);
			},

			_transition: function () {
			},

			suspend: function () {
				this.__suspended++;
			},

			eventualResume: function () {
				Async.eventually(this.resume, this);
			},

			resume: function () {
				this.__suspended--;
				if (this.__suspended === 0 && !this._stopped && this.__next_state)
					this.__next();
			},

			can_transition_to: function (state) {
				return this.host && this.host._can_transition_to(state) && this._can_transition_to(state);
			},

			_start: function () {},

			_end: function () {},

			_can_transition_to: function (state) {
				return !Types.is_array(this._white_list) || Objs.contains_value(this._white_list, state.state_name());
			}

		};
	}, {

		_extender: {
			_defaults: function (base, overwrite) {
				return Objs.extend(Objs.clone(base, 1), overwrite);
			}
		}

	});
});


Scoped.define("module:States.StateRouter", ["module:Class", "module:Objs"], function (Class, Objs, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {

			constructor: function (host) {
				inherited.constructor.call(this);
				this._host = host;
				this._routes = [];
				this._states = {};
			},

			registerRoute: function (route, state, mapping) {
				var descriptor = {
						key: route,
						route: new RegExp("^" + route + "$"),
						state: state,
						mapping: mapping || []
				};
				this._routes.push(descriptor);
				this._states[state] = descriptor;
				return this;
			},

			readRoute: function (stateObject) {
				var descriptor = this._states[stateObject.state_name()];
				if (!descriptor)
					return null;
				var regex = /\(.*?\)/;
				var route = descriptor.key;
				Objs.iter(descriptor.mapping, function (arg) {
					route = route.replace(regex, stateObject["_" + arg]);
				}, this);
				return route;
			},

			parseRoute: function (route) {
				for (var i = 0; i < this._routes.length; ++i) {
					var descriptor = this._routes[i];
					var result = descriptor.route.exec(route);
					if (result === null)
						continue;
					var args = {};
					for (var j = 0; j < descriptor.mapping.length; ++j)
						args[descriptor.mapping[j]] = result[j + 1];
					return {
						state: descriptor.state,
						args: args
					};
				}
				return null;
			},

			currentRoute: function () {
				return this.readRoute(this._host.state());
			},

			navigateRoute: function (route) {
				var parsed = this.parseRoute(route);
				if (parsed)
					this._host.next(parsed.state, parsed.args);
			}

		};		
	});
});

}).call(Scoped);