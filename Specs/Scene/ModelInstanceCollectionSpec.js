/*global defineSuite*/
defineSuite([
        'Scene/ModelInstanceCollection',
        'Core/BoundingSphere',
        'Core/Cartesian3',
        'Core/HeadingPitchRange',
        'Core/Math',
        'Core/Matrix4',
        'Core/PrimitiveType',
        'Core/Transforms',
        'Scene/Model',
        'Scene/ModelAnimationLoop',
        'Scene/SceneMode',
        'Specs/createScene',
        'Specs/pollToPromise',
        'ThirdParty/when'
    ], function(
        ModelInstanceCollection,
        BoundingSphere,
        Cartesian3,
        HeadingPitchRange,
        CesiumMath,
        Matrix4,
        PrimitiveType,
        Transforms,
        Model,
        ModelAnimationLoop,
        SceneMode,
        createScene,
        pollToPromise,
        when) {
    "use strict";

    var boxUrl = './Data/Models/Box/CesiumBoxTest.gltf';
    var cesiumAirUrl = './Data/Models/CesiumAir/Cesium_Air.gltf';
    var riggedFigureUrl = './Data/Models/rigged-figure-test/rigged-figure-test.gltf';

    var boxModel;
    var cesiumAirModel;
    var riggedFigureModel;

    var scene;

    beforeAll(function() {
        scene = createScene();

        var modelPromises = [];
        modelPromises.push(loadModel(boxUrl).then(function(model) {
            boxModel = model;
        }));
        modelPromises.push(loadModel(cesiumAirUrl).then(function(model) {
            cesiumAirModel = model;
        }));
        modelPromises.push(loadModel(riggedFigureUrl).then(function(model) {
            riggedFigureModel = model;
        }));

        return when.all(modelPromises);
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    beforeEach(function() {
        // TODO : Nothing here yet
    });

    afterEach(function() {
        scene.primitives.removeAll();
    });

    function loadModel(url) {
        var model = scene.primitives.add(Model.fromGltf({
            url : url
        }));

        return pollToPromise(function() {
            // Render scene to progressively load the model
            scene.renderForSpecs();
            return model.ready;
        }).then(function() {
            model.show = false;
            return model;
        });
    }

    function loadCollection(options) {
        var collection = scene.primitives.add(new ModelInstanceCollection(options));

        return pollToPromise(function() {
            // Render scene to progressively load the model
            scene.renderForSpecs();
            return collection.ready;
        }).then(function() {
            return collection;
        });
    }

    function createInstances(count) {
        //var gridSize = Math.sqrt(count);
        //var spacing = 0.0002;
        //var centerLongitude = -123.0744619;
        //var centerLatitude = 44.0503706;
        //var height = 5000.0;
        //
        //var instances = [];
        //for (var y = 0; y < gridSize; ++y) {
        //    for (var x = 0; x < gridSize; ++x) {
        //        var longitude = centerLongitude + spacing * (x - gridSize / 2);
        //        var latitude = centerLatitude + spacing * (y - gridSize / 2);
        //        var position = Cartesian3.fromDegrees(longitude, latitude, height);
        //
        //        var heading = Math.random();
        //        var pitch = Math.random();
        //        var roll = Math.random();
        //        var scale = 1.0;//(Math.random() + 1.0)/2.0;
        //
        //        var modelMatrix = Transforms.headingPitchRollToFixedFrame(position, heading, pitch, roll);
        //        Matrix4.multiplyByUniformScale(modelMatrix, scale, modelMatrix);
        //
        //        instances.push({
        //            modelMatrix : modelMatrix
        //        });
        //    }
        //}

        var instances = [];
        for (var i = 0; i < count; ++i) {
            instances.push({
                modelMatrix : Matrix4.clone(Matrix4.IDENTITY)
            });
        }

        return instances;
    }

    function getBoundingVolume(instances, model) {
        var length = instances.length;
        var points = new Array(length);
        for (var i = 0; i < length; ++i) {
            var translation = new Cartesian3();
            Matrix4.getTranslation(instances[i].modelMatrix, translation);
            points[i] = translation;
        }
        var boundingSphere = new BoundingSphere();
        BoundingSphere.fromPoints(points, boundingSphere);
        boundingSphere.radius += model.boundingSphere.radius;
    }

    function zoomTo(collection) {
        var camera = scene.camera;
        var center = collection._boundingVolume.center;
        var radius = collection._boundingVolume.radius;
        var r = Math.max(radius, camera.frustum.near);
        camera.lookAt(center, new HeadingPitchRange(0.0, 0.0, r * 2.0));
    }

    function verifyRender(collection) {
        zoomTo(collection);
        collection.show = false;
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
        collection.show = true;
        expect(scene.renderForSpecs()).not.toEqual([0, 0, 0, 255]);
    }

    function verifyRenderNone(collection) {
        zoomTo(collection);
        collection.show = false;
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
        collection.show = true;
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
    }


    it('throws if neither options.gltf nor options.url are provided', function() {
        expect(function() {
            return new ModelInstanceCollection();
        }).toThrowDeveloperError();
    });

    it('throws when both options.gltf and options.url are provided', function() {
        expect(function() {
            return new ModelInstanceCollection({
                url : boxUrl,
                gltf : boxModel.gltf
            });
        }).toThrowDeveloperError();
    });

    it('sets properties', function() {
        return loadCollection({
            url : boxUrl,
            instances : createInstances(4)
        }).then(function(collection) {
            expect(collection.ready).toEqual(true);
            expect(collection.show).toEqual(true);
            expect(collection.allowPicking).toEqual(true);
            expect(collection.length).toEqual(4);
            expect(collection.debugShowBoundingVolume).toEqual(false);
            expect(collection.debugWireframe).toEqual(false);
            expect(collection._dynamic).toEqual(false);
            expect(collection._cull).toEqual(true);
            expect(collection._model).toBeDefined();
            expect(collection._offCenter).toEqual(true);
        });
    });

    it('renders from url', function() {
        return loadCollection({
            url : boxUrl,
            instances : createInstances(1),
            cull : false
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('renders from gltf', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('resolves readyPromise', function(done) {
        var collection = scene.primitives.add(new ModelInstanceCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4)
        }));

        collection.readyPromise.then(function(collection) {
            expect(collection.ready).toEqual(true);
            done();
        });

        while(!collection.ready) {
            scene.renderForSpecs();
        }
    });

    //it('rejects readyPromise', function(done) {
    //    var collection = scene.primitives.add(new ModelInstanceCollection({
    //        url : 'invalid_url.gltf',
    //        instances : createInstances(4)
    //    }));
    //
    //    collection.readyPromise.then(function(collection) {
    //        fail('should not resolve');
    //    }).otherwise(function(error) {
    //        expect(collection.ready).toEqual(false);
    //        done();
    //    });
    //
    //    while(!collection.ready) {
    //        scene.renderForSpecs();
    //    }
    //});

    it('renders one instance', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(1)
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    //it('renders zero instances', function() {
    //    // TODO : promise won't succeed because ready will never be true because the update loop is cut off early when there are no instances
    //});

    it('renders cesiumAir', function() {
        return loadCollection({
            gltf : cesiumAirModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('renders rigged figure', function() {
        return loadCollection({
            gltf : cesiumAirModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('verify bounding volume', function() {
        var instances = createInstances(4);
        return loadCollection({
            gltf : boxModel.gltf,
            instances : instances
        }).then(function(collection) {
            var boundingVolume = getBoundingVolume(instances, boxModel);
            expect(collection._boundingVolume.center).toEqual(boundingVolume.center);
            expect(collection._boundingVolume.radius).toEqual(boundingVolume.radius);
        });
    });

    it('renders bounding volume', function() {
        // TODO : not really a great test here or in ModelSpec
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4),
            debugShowBoundingVolume : true
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('renders in wireframe', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4),
            debugWireframe : true
        }).then(function(collection) {
            expect(collection._drawCommands[0].primitiveType).toEqual(PrimitiveType.LINES);
        });
    });

    it('destroys', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            expect(collection.isDestroyed()).toEqual(false);
            scene.primitives.remove(collection);
            expect(collection.isDestroyed()).toEqual(true);
        });
    });

    it('renders when instancing is disabled', function() {
        // Disable extension
        var instancedArrays = context._instancedArrays;
        context._instancedArrays = undefined;

        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            verifyRender(collection);
            // Re-enable extension
            context._instancedArrays = instancedArrays;
        });
    });

    it('renders when dynamic is true', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4),
            dynamic : true
        }).then(function(collection) {
            verifyRender(collection);
        });
    });

    it('renders with animations', function() {
        // TODO how to actually check that animation is working?
        return loadCollection({
            gltf : cesiumAirModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            collection.activeAnimations.addAll({
                speedup : 0.5,
                loop : ModelAnimationLoop.REPEAT
            });
            verifyRender(collection);
        });
    });

    it('Only renders when mode is SCENE3D', function() {
        return loadCollection({
            gltf : boxModel.gltf,
            instances : createInstances(4)
        }).then(function(collection) {
            verifyRender(collection);
            scene.frameState.mode = SceneMode.SCENE2D;
            verifyRenderNone(collection);
            scene.frameState.mode = SceneMode.SCENE3D;
        });
    });

    it('Renders two model instance collections that use the same model cache key', function() {

    });



    // Tests
    // * Check that precreated attributes works by creating two different collections that reference the same url
    // * When culled
    // * Test cull true or false
    // * Test that it changes shaders and uniform map - hard to test because it's hard to get the original values
    // * Renders two collections that use the same model cache key (check that vertexarrays are not shared


});
