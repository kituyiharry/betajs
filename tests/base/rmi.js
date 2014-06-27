test("test rmi", function() {
	var Stub = BetaJS.RMI.Stub.extend("Stub", {
		intf : ["test"]
	});

	var Skeleton = BetaJS.RMI.Skeleton.extend("Skeleton", {

		intf : ["test"],

		test : function(callbacks, a, b, c) {
			this._success(callbacks, a + b + c);
		}
	});

	var stub = new Stub();

	var skeleton = new Skeleton();

	stub.on("send", skeleton.invoke, skeleton);

	stub.test(1, 2, 3).success(function(result) {
		QUnit.equal(result, 6);
	});

});

test("test rmi client server", function() {
	var receiver_x = new BetaJS.Channels.Receiver();
	var receiver_y = new BetaJS.Channels.Receiver();
	var sender_x = new BetaJS.Channels.ReveiverSender(receiver_y);
	var sender_y = new BetaJS.Channels.ReveiverSender(receiver_x);
	var transport_x = new BetaJS.Channels.TransportChannel(sender_x, receiver_x);
	var transport_y = new BetaJS.Channels.TransportChannel(sender_y, receiver_y);

	var Stub = BetaJS.RMI.Stub.extend("Stub", {
		intf : ["test", "test2"]
	});

	var Skeleton = BetaJS.RMI.Skeleton.extend("Skeleton", {

		intf : ["test"],
		intfSync : ["test2"],

		constructor : function(d) {
			this._inherited(Skeleton, "constructor");
			this.__d = d;
		},

		test : function(callbacks, a, b, c) {
			this._success(callbacks, a + b + c + this.__d);
		},

		test2 : function(a, b, c) {
			return a + b + c + this.__d;
		}
	});

	var server = new BetaJS.RMI.Server();
	server.registerInstance(new Skeleton(100), {
		name : "x"
	});
	server.registerInstance(new Skeleton(1000), {
		name : "y"
	});
	server.registerClient(transport_x);

	var client = new BetaJS.RMI.Client();
	client.connect(transport_y);

	var stub_x = client.acquire(Stub, "x");
	var stub_y = client.acquire(Stub, "y");

	stub_x.test(1, 2, 3).success(function(result) {
		QUnit.equal(result, 106);
	});

	stub_x.test2(1, 2, 3).success(function(result) {
		QUnit.equal(result, 106);
	});

	stub_y.test(1, 2, 3).success(function(result) {
		QUnit.equal(result, 1006);
	});

});



test("test rmi client server create instance", function() {
	var receiver_x = new BetaJS.Channels.Receiver();
	var receiver_y = new BetaJS.Channels.Receiver();
	var sender_x = new BetaJS.Channels.ReveiverSender(receiver_y);
	var sender_y = new BetaJS.Channels.ReveiverSender(receiver_x);
	var transport_x = new BetaJS.Channels.TransportChannel(sender_x, receiver_x);
	var transport_y = new BetaJS.Channels.TransportChannel(sender_y, receiver_y);

	var Stub = BetaJS.RMI.Stub.extend("BetaJS.Test.Stub", {
		intf : ["generate"]
	});

	var StubX = BetaJS.RMI.Stub.extend("BetaJS.Test.StubX", {
		intf : ["foo"]
	});

	var Skeleton = BetaJS.RMI.Skeleton.extend("BetaJS.Test.Skeleton", {

		intfSync : ["generate"],

		generate : function() {
			return new SkeletonX();
		}
	});

	var SkeletonX = BetaJS.RMI.Skeleton.extend("BetaJS.Test.SkeletonX", {

		intfSync : ["foo"],

		foo : function() {
			return "bar";
		}
	});

	var server = new BetaJS.RMI.Server();
	server.registerInstance(new Skeleton(), {
		name : "generator"
	});
	server.registerClient(transport_x);

	var client = new BetaJS.RMI.Client();
	client.connect(transport_y);

	var stub = client.acquire(Stub, "generator");
	stub.generate().success(function (x) {
		x.foo().success(function (y) {
			QUnit.equal(y, "bar");
		});
	});

});
