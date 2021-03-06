/*global defineSuite*/
defineSuite([
        'Scene/Polygon',
        'Core/BoundingSphere',
        'Core/Cartesian3',
        'Core/defaultValue',
        'Core/Ellipsoid',
        'Core/Math',
        'Renderer/ClearCommand',
        'Scene/Material',
        'Scene/SceneMode',
        'Specs/createCamera',
        'Specs/createContext',
        'Specs/createFrameState',
        'Specs/createScene',
        'Specs/pick',
        'Specs/render'
    ], function(
        Polygon,
        BoundingSphere,
        Cartesian3,
        defaultValue,
        Ellipsoid,
        CesiumMath,
        ClearCommand,
        Material,
        SceneMode,
        createCamera,
        createContext,
        createFrameState,
        createScene,
        pick,
        render) {
    "use strict";

    var context;
    var frameState;
    var polygon;
    var us;

    beforeAll(function() {
        context = createContext();
    });

    afterAll(function() {
        context.destroyForSpecs();
    });

    beforeEach(function() {
        frameState = createFrameState(context, createCamera({
            offset : new Cartesian3(1.02, 0.0, 0.0)
        }));
        us = context.uniformState;
        us.update(frameState);
    });

    afterEach(function() {
        polygon = polygon && polygon.destroy();
        us = undefined;
    });

    function createPolygon(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var ellipsoid = Ellipsoid.UNIT_SPHERE;
        var material = Material.fromType('Color');
        material.translucent = false;

        return new Polygon({
            ellipsoid : ellipsoid,
            granularity : CesiumMath.toRadians(20.0),
            positions : Cartesian3.fromDegreesArray([
                -50.0, -50.0,
                50.0, -50.0,
                50.0, 50.0,
                -50.0, 50.0
            ], ellipsoid),
            material : material,
            id : options.id,
            asynchronous : false,
            debugShowBoundingVolume : options.debugShowBoundingVolume
        });
    }

    it('constructor sets properties', function() {
        var positions = [
             new Cartesian3(1.0, 2.0, 3.0),
             new Cartesian3(4.0, 5.0, 6.0),
             new Cartesian3(7.0, 8.0, 9.0)
         ];
        var material = Material.fromType('Checkerboard');

        var polygon = new Polygon({
            ellipsoid : Ellipsoid.UNIT_SPHERE,
            positions : positions,
            granularity : CesiumMath.toRadians(10.0),
            height : 100.0,
            textureRotationAngle : CesiumMath.toRadians(45.0),
            show : false,
            material : material,
            asynchronous : false,
            debugShowBoundingVolume : true
        });

        expect(polygon.ellipsoid).toEqual(Ellipsoid.UNIT_SPHERE);
        expect(polygon.positions).toEqual(positions);
        expect(polygon.granularity).toEqual(CesiumMath.toRadians(10.0));
        expect(polygon.height).toEqual(100.0);
        expect(polygon.textureRotationAngle).toEqual(CesiumMath.toRadians(45.0));
        expect(polygon.show).toEqual(false);
        expect(polygon.material).toBe(material);
        expect(polygon.asynchronous).toEqual(false);
        expect(polygon.debugShowBoundingVolume).toEqual(true);
    });

    it('construction throws with both positions and polygonHierarchy', function() {
        expect(function() {
            return new Polygon({
                positions : [
                     new Cartesian3(1.0, 2.0, 3.0),
                     new Cartesian3(4.0, 5.0, 6.0),
                     new Cartesian3(7.0, 8.0, 9.0)
                 ],
                 polygonHierarchy : {
                     positions : Cartesian3.fromDegreesArray([
                         -124.0, 35.0,
                         -110.0, 35.0,
                         -110.0, 40.0,
                         -124.0, 40.0
                    ])
                }
            });
        }).toThrowDeveloperError();
    });

    it('construction throws with less than three positions', function() {
        expect(function() {
            return new Polygon({
                positions : []
            });
        }).toThrowDeveloperError();
    });

    it('gets default show', function() {
        polygon = createPolygon();
        expect(polygon.show).toEqual(true);
    });

    it('sets positions', function() {
        polygon = new Polygon();
        var positions = [
            new Cartesian3(1.0, 2.0, 3.0),
            new Cartesian3(4.0, 5.0, 6.0),
            new Cartesian3(7.0, 8.0, 9.0)
        ];

        expect(polygon.positions).not.toBeDefined();

        polygon.positions = positions;
        expect(polygon.positions).toEqual(positions);
    });

    it('positions throws with less than three positions', function() {
        polygon = new Polygon();

        expect(function() {
            polygon.positions = [new Cartesian3()];
        }).toThrowDeveloperError();
    });

    it('configure polygon from hierarchy', function() {
        var hierarchy = {
                positions : Cartesian3.fromDegreesArray([
                    -124.0, 35.0,
                    -110.0, 35.0,
                    -110.0, 40.0,
                    -124.0, 40.0
                ]),
                holes : [{
                        positions : Cartesian3.fromDegreesArray([
                            -122.0, 36.0,
                            -122.0, 39.0,
                            -112.0, 39.0,
                            -112.0, 36.0
                        ]),
                        holes : [{
                            positions : Cartesian3.fromDegreesArray([
                                -120.0, 36.5,
                                -114.0, 36.5,
                                -114.0, 38.5,
                                -120.0, 38.5
                            ])
                        }]
                }]
        };

        polygon = createPolygon();
        polygon.configureFromPolygonHierarchy(hierarchy);
        expect(polygon.positions).not.toBeDefined();
    });

    it('configure polygon from clockwise hierarchy', function() {
        var hierarchy = {
                positions : Cartesian3.fromDegreesArray([
                    -124.0, 35.0,
                    -124.0, 40.0,
                    -110.0, 40.0,
                    -110.0, 35.0
                ]),
                holes : [{
                        positions : Cartesian3.fromDegreesArray([
                            -122.0, 36.0,
                            -112.0, 36.0,
                            -112.0, 39.0,
                            -122.0, 39.0
                        ]),
                        holes : [{
                            positions : Cartesian3.fromDegreesArray([
                                -120.0, 36.5,
                                -120.0, 38.5,
                                -114.0, 38.5,
                                -114.0, 36.5
                            ])
                        }]
                }]
        };

        polygon = createPolygon();
        polygon.configureFromPolygonHierarchy(hierarchy);
        expect(polygon.positions).not.toBeDefined();
    });

    it('gets the default color', function() {
        polygon = new Polygon();
        expect(polygon.material.uniforms.color).toEqual({
            red : 1.0,
            green : 1.0,
            blue : 0.0,
            alpha : 0.5
        });
    });

    it('has a default ellipsoid', function() {
        polygon = new Polygon();
        expect(polygon.ellipsoid).toEqual(Ellipsoid.WGS84);
    });

    it('gets the default granularity', function() {
        polygon = new Polygon();
        expect(polygon.granularity).toEqual(CesiumMath.RADIANS_PER_DEGREE);
    });

    it('renders', function() {
        // This test fails in Chrome if a breakpoint is set inside this function.  Strange.
        polygon = createPolygon();
        polygon.material.uniforms.color = {
            red : 1.0,
            green : 0.0,
            blue : 0.0,
            alpha : 1.0
        };

        ClearCommand.ALL.execute(context);
        expect(context.readPixels()).toEqual([0, 0, 0, 0]);

        render(frameState, polygon);
        expect(context.readPixels()).not.toEqual([0, 0, 0, 0]);
    });

    it('does not render when show is false', function() {
        polygon = createPolygon();
        polygon.material.uniforms.color = {
            red : 1.0,
            green : 0.0,
            blue : 0.0,
            alpha : 1.0
        };
        polygon.show = false;

        expect(render(frameState, polygon)).toEqual(0);
    });

    it('does not render without positions', function() {
        polygon = new Polygon();
        polygon.ellipsoid = Ellipsoid.UNIT_SPHERE;
        polygon.granularity = CesiumMath.toRadians(20.0);
        polygon.asynchronous = false;
        expect(render(frameState, polygon)).toEqual(0);
    });

    it('renders bounding volume with debugShowBoundingVolume', function() {
        var scene = createScene();
        scene.primitives.add(createPolygon({
            debugShowBoundingVolume : true
        }));

        var camera = scene.camera;
        camera.position = new Cartesian3(1.02, 0.0, 0.0);
        camera.direction = Cartesian3.negate(Cartesian3.UNIT_X, new Cartesian3(), new Cartesian3());
        camera.up = Cartesian3.clone(Cartesian3.UNIT_Z);

        var pixels = scene.renderForSpecs();
        expect(pixels[0]).not.toEqual(0);
        expect(pixels[1]).toEqual(0);
        expect(pixels[2]).toEqual(0);
        expect(pixels[3]).toEqual(255);

        scene.destroyForSpecs();
    });

    it('is picked', function() {
        polygon = createPolygon({
            id : 'id'
        });

        var pickedObject = pick(frameState, polygon, 0, 0);
        expect(pickedObject.primitive).toEqual(polygon);
        expect(pickedObject.id).toEqual('id');
    });

    it('is not picked (show === false)', function() {
        polygon = createPolygon();
        polygon.show = false;

        var pickedObject = pick(frameState, polygon, 0, 0);
        expect(pickedObject).not.toBeDefined();
    });

    it('is not picked (alpha === 0.0)', function() {
        polygon = createPolygon();
        polygon.material.uniforms.color.alpha = 0.0;

        var pickedObject = pick(frameState, polygon, 0, 0);
        expect(pickedObject).not.toBeDefined();
    });

    it('test 3D bounding sphere from positions', function() {
        polygon = createPolygon();
        polygon.update(frameState);
        var boundingVolume = frameState.commandList[0].boundingVolume;
        var sphere = BoundingSphere.fromPoints(polygon.positions);
        expect(boundingVolume.center).toEqualEpsilon(sphere.center, CesiumMath.EPSILON1);
        expect(boundingVolume.radius).toEqualEpsilon(sphere.radius, CesiumMath.EPSILON2);
    });

    function test2DBoundingSphereFromPositions(testMode) {
        var projection = frameState.mapProjection;
        var ellipsoid = projection.ellipsoid;
        var positions = Cartesian3.fromDegreesArray([
            -1.0, -1.0,
            1.0, -1.0,
            1.0, 1.0,
            -1.0, 1.0
        ], ellipsoid);

        var polygon = new Polygon();
        polygon.ellipsoid = ellipsoid;
        polygon.granularity = CesiumMath.toRadians(20.0);
        polygon.positions = positions;
        polygon.asynchronous = false;
        polygon.material.translucent = false;

        var mode = frameState.mode;
        frameState.mode = testMode;
        polygon.update(frameState);
        var boundingVolume = frameState.commandList[0].boundingVolume;
        frameState.mode = mode;

        var projectedPositions = [];
        for (var i = 0; i < positions.length; ++i) {
            projectedPositions.push(projection.project(ellipsoid.cartesianToCartographic(positions[i])));
        }

        var sphere = BoundingSphere.fromPoints(projectedPositions);
        sphere.center.x = (testMode === SceneMode.SCENE2D) ? 0.0 : sphere.center.x;
        expect(boundingVolume.center).toEqualEpsilon(sphere.center, CesiumMath.EPSILON2);
        expect(boundingVolume.radius).toEqualEpsilon(sphere.radius, CesiumMath.EPSILON2);
    }

    it('test Columbus view bounding sphere from positions', function() {
        test2DBoundingSphereFromPositions(SceneMode.COLUMBUS_VIEW);
    });

    it('test 2D bounding sphere from positions', function() {
        test2DBoundingSphereFromPositions(SceneMode.SCENE2D);
    });

    it('isDestroyed', function() {
        var p = new Polygon();
        expect(p.isDestroyed()).toEqual(false);
        p.destroy();
        expect(p.isDestroyed()).toEqual(true);
    });

    it('throws when updated/rendered without a ellipsoid', function() {
        polygon = createPolygon();
        polygon.ellipsoid = undefined;

        expect(function() {
            polygon.update(context, frameState);
        }).toThrowDeveloperError();
    });

    it('throws when updated/rendered without an invalid granularity', function() {
        polygon = createPolygon();
        polygon.granularity = -1.0;

        expect(function() {
            polygon.update(context, frameState);
        }).toThrowDeveloperError();
    });

    it('throws when rendered without a material', function() {
        polygon = createPolygon();
        polygon.material = undefined;

        expect(function() {
            render(frameState, polygon);
        }).toThrowDeveloperError();
    });
}, 'WebGL');
