BetaJS.Structures = {};

BetaJS.Structures.AvlTree = {

	empty : function() {
		return null;
	},

	singleton : function(data) {
		return {
			data : data,
			left : null,
			right : null,
			height : 1
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

	height_join : function(left, right) {
		return 1 + Math.max(this.height(left), this.height(right));
	},

	create : function(data, left, right) {
		return {
			data : data,
			left : left,
			right : right,
			height : this.height_join(left, right)
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

	rereoot : function(left, right) {
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

BetaJS.Structures.TreeMap = {

	empty : function(compare) {
		return {
			root : null,
			length : 0,
			compare : compare || function(x, y) {
				return x > y ? 1 : x < y ? -1 : 0;
			}
		};
	},

	is_empty : function(t) {
		return !t.root;
	},

	length : function(t) {
		return t.length;
	},

	__add : function(key, value, t, node) {
		var kv = {
			key : key,
			value : value
		};
		if (!node) {
			t.length++;
			return BetaJS.Data.AvlTree.singleton(kv);
		}
		var c = t.compare(key, node.data.key);
		if (c === 0) {
			node.data = kv;
			return node;
		} else if (c < 0)
			return BetaJS.Data.AvlTree.balance(node.data, this.__add(key,
					value, t, node.left), node.right);
		else
			return BetaJS.Data.AvlTree.balance(node.data, node.left, this.__add(key, value, t, node.right));
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

	__iterate : function(t, node, callback, context) {
		if (!node)
			return true;
		return this.__iterate(t, node.left, callback, context) && (callback.call(context, node.data.key, node.data.value) !== false) && this.__iterate(t, node.right, callback, context);
	},

	iterate : function(t, callback, context) {
		this.__iterate(t, t.root, callback, context);
	},

	__iterate_from : function(key, t, node, callback, context) {
		if (!node)
			return true;
		var c = t.compare(key, node.data.key);
		if (c < 0 && !this.__iterate_from(key, t, node.left, callback, context))
			return false;
		if (c <= 0 && callback.call(context, node.data.key, node.data.value) === false)
			return false;
		return this.__iterate_from(key, t, node.right, callback, context);
	},

	iterate_from : function(key, t, callback, context) {
		this.__iterate_from(key, t, t.root, callback, context);
	},

	iterate_range : function(from_key, to_key, t, callback, context) {
		this.iterate_from(from_key, t, function(key, value) {
			return t.compare(key, to_key) <= 0 && callback.call(context, key, value) !== false;
		}, this);
	}

};