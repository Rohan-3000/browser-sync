"use strict";

var browserSync = require("../../../index");

var sinon   = require("sinon");
var request = require("supertest");
var assert  = require("chai").assert;

var config = {
    server: {
        baseDir: "test/fixtures"
    },
    debugInfo: false,
    open: false
};

describe("Plugins: Registering Hooks:", function () {

    var instance;
    var initSpy;
    var mwSpy1;
    var mwSpy2;

    before(function (done) {
        initSpy = sinon.spy();
        mwSpy2 = sinon.spy(function (res, req, next) {
            next();
        });
        mwSpy1 = sinon.spy(function (res, req, next) {
            next();
        });

        browserSync.use({
            plugin: initSpy,
            hooks: {
                "client:events": function () {
                    return "cp:goto";
                },
                "client:js": function () {
                    return "SHANE123456";
                },
                "server:middleware": function () {
                    return [mwSpy2, mwSpy1];
                }
            }
        });

        instance = browserSync.init(config, done);
    });

    afterEach(function () {
        initSpy.reset();
    });

    after(function () {
        instance.cleanup();
    });
    it("calls the function returned from the plugin method", function () {
        sinon.assert.calledOnce(initSpy); // the plugin init method
    });
    it("adds an item to the clientEvents array", function(){
        assert.include(instance.clientEvents, "cp:goto");
    });
    it("adds an item to the Server Middleware array", function(){
        assert.include(instance.clientJs, "SHANE123456");
    });
    it("adds an item to the Server Middleware array", function(done){

        request(instance.server)
            .get("/")
            .expect(200)
            .end(function () {
                sinon.assert.calledOnce(mwSpy1);
                sinon.assert.calledOnce(mwSpy2);
                done();
            });
    });
});

describe("Plugins: Registering hooks - client events:", function () {

    var instance;

    before(function (done) {
        browserSync.use({
            plugin: function(){},
            hooks: {
                "client:events": function () {
                    return ["cp:goto", "custom:event"];
                }
            }
        });

        instance = browserSync.init(config, function (err, bs) {
            done();
        });
    });
    after(function () {
        instance.cleanup();
    });
    it("adds multiple items to the clientEvents array", function() {
        assert.include(instance.clientEvents, "cp:goto");
        assert.include(instance.clientEvents, "custom:event");
    });
});

describe("Plugins: Registering hooks - server middleware", function () {

    var instance, mwSpy1;

    before(function (done) {

        mwSpy1 = sinon.spy(function (res, req, next) {
            next();
        });

        browserSync.use({
            plugin: function(){},
            hooks: {
                "server:middleware": function () {
                    return mwSpy1;
                }
            }
        });

        instance = browserSync(config, done);
    });
    after(function () {
        instance.cleanup();
    });
    it("Calls the middleware function", function(done) {
        request(instance.server)
            .get("/")
            .expect(200)
            .end(function () {
                sinon.assert.calledOnce(mwSpy1);
                done();
            });
    });
});