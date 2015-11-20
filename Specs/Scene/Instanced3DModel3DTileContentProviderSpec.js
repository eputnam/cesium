/*global defineSuite*/
defineSuite([
        'Scene/Instanced3DModel3DTileContentProvider',
        'Core/Cartesian3',
        'Core/defined',
        'Core/loadArrayBuffer',
        'Scene/Cesium3DTileContentState',
        'Scene/Cesium3DTileset',
        'Specs/createCanvas',
        'Specs/createScene',
        'Specs/pollToPromise'
    ], function(
        Instanced3DModel3DTileContentProvider,
        Cartesian3,
        defined,
        loadArrayBuffer,
        Cesium3DTileContentState,
        Cesium3DTileset,
        createCanvas,
        createScene,
        pollToPromise) {
    "use strict";

    var scene;

    beforeAll(function() {
        scene = createScene({
            canvas : createCanvas(64, 64)
        });
        //scene = createScene();
        scene.camera.setView({
            destination : Cartesian3.fromRadians(-1.31995, 0.69871, 100)
        });
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

    function verifyPixels() {
        // Check to see if any pixels are rendered
        var pixels = scene.renderForSpecs();
        var length = pixels / 4;
        for (var i = 0; i < length; ++i) {
            var r = pixels[i * 4 + 0];
            var g = pixels[i * 4 + 1];
            var b = pixels[i * 4 + 2];
            if ((r > 0) || (g > 0) || (b > 0)) {
                return true;
            }
        }
        return false;
    }

    function verifyRender(tileset) {
        tileset.show = false;
        expect(verifyPixels()).toEqual(false);
        tileset.show = true;
        expect(verifyPixels()).toEqual(true);
    }

    function loadTileset(url) {
        var tileset = scene.primitives.add(new Cesium3DTileset({
            url : url
        }));

        return pollToPromise(function() {
            // Render scene to progressively load the content
            scene.renderForSpecs();
            return tileset.ready && (tileset._root._content.state === Cesium3DTileContentState.READY);
        }).then(function() {
            return tileset;
        });
    }

    //function loadTile(url) {
    //    var tileset = {};
    //    var tile = {};
    //    var instancedTile = new Instanced3DModel3DTileContentProvider(tileset, tile, url);
    //    return loadArrayBuffer(url).then(function(arrayBuffer) {
    //        instancedTile.initialize(arrayBuffer);
    //        instancedTile.update(tileset, scene.frameState);
    //    });
    //}

    function loadTileExpectError(url) {
        var tileset = {};
        var tile = {};
        var instancedTile = new Instanced3DModel3DTileContentProvider(tileset, tile, url);
        return loadArrayBuffer(url).then(function(arrayBuffer) {
            expect(function() {
                instancedTile.initialize(arrayBuffer);
                instancedTile.update(tileset, scene.frameState);
            }).toThrowDeveloperError();
        });
    }

    it('throws with invalid magic', function() {
        return loadTileExpectError('./Data/Tiles3D/instancedInvalidMagic/instancedInvalidMagic.i3dm');
    });

    it('throws with invalid format', function() {
        return loadTileExpectError('./Data/Tiles3D/instancedInvalidGltfFormat/instancedInvalidGltfFormat.i3dm');
    });

    it('throws with invalid version', function() {
        return loadTileExpectError('./Data/Tiles3D/instancedInvalidVersion/instancedInvalidVersion.i3dm');
    });

    it('throws with invalid url', function() {
        //return loadTileExpectError('./Data/Tiles3D/instancedInvalidUrl/instancedInvalidUrl.i3dm');
        // TODO : don't know how to test this because it's inside a runtime error inside asynchronous model code
    });

    it('throws with empty gltf', function() {
        return loadTileExpectError('./Data/Tiles3D/instancedEmptyGltfEmbedded/instancedEmptyGltfEmbedded.i3dm');
    });

    it('throws with empty url', function() {
        //return loadTileExpectError('./Data/Tiles3D/instancedEmptyGltfExternal/instancedEmptyGltfExternal.i3dm');
        // TODO : don't know how to test this because it's inside a runtime error inside asynchronous model code
    });

    //it('loads with no instances, but does not become ready', function() {
    //    var url = './Data/Tiles3D/instancedNoInstances/instancedNoInstances.i3dm';
    //    return loadTile(url).then(function(tileset) {
    //        expect(tileset._root.content._modelInstanceCollection.length).toEqual(0);
    //    });
    //});

    it('renders with embedded gltf', function() {
        var url = './Data/Tiles3D/instancedGltfEmbedded/';
        return loadTileset(url).then(verifyRender);
    });

    it('renders with external gltf', function() {
        var url = './Data/Tiles3D/instancedGltfExternal/';
        return loadTileset(url).then(verifyRender);
    });

    it('renders with batch table', function() {
        var url = './Data/Tiles3D/instancedWithBatchTable/';
        return loadTileset(url).then(verifyRender);
    });

    it('renders without batch table', function() {
        var url = './Data/Tiles3D/instancedWithoutBatchTable/';
        return loadTileset(url).then(verifyRender);
    });

    // TODO : checks
    // * Batch table too small
    // *

});
