/*globals define, WebGMEGlobal*/
/*jshint browser: true*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Thu May 11 2017 10:42:38 GMT-0700 (PDT).
 */

define([
    'text!./HFSM.html',
    './Dialog/Dialog',
    './Simulator/Simulator',
    'bower/cytoscape/dist/cytoscape.min',
    'bower/cytoscape-edgehandles/cytoscape-edgehandles',
    'bower/cytoscape-context-menus/cytoscape-context-menus',
    'bower/cytoscape-cose-bilkent/cytoscape-cose-bilkent',
    'bower/mustache.js/mustache.min',
    'text!./style2.css',
    'q',
    'css!bower/cytoscape-context-menus/cytoscape-context-menus.css',
    'css!./styles/HFSMVizWidget.css'], function (
	HFSMHtml,
	Dialog,
	Simulator,
	cytoscape,
	edgehandles,
	cyContext,
	coseBilkent,
	mustache,
	styleText,
	Q) {
	'use strict';

	cytoscape.use( edgehandles, _.debounce.bind( _ ), _.throttle.bind( _ ) );
	cytoscape.use( cyContext, $ );
	cytoscape.use( coseBilkent );
	//cytoscape.use( cyPopper, Popper );

	var hideTypes = ['Internal Transition'];

	var HFSMVizWidget,
            WIDGET_CLASS = 'h-f-s-m-viz';

	HFSMVizWidget = function (logger, container, client) {
            this._logger = logger.fork('Widget');

            this._el = container;

	    this._client = client;

            // set widget class
            this._el.addClass(WIDGET_CLASS);
            this._el.append(HFSMHtml);
	    this._cy_container = this._el.find('#cy');

            this._initialize();

            this._logger.debug('ctor finished');
	};

	HFSMVizWidget.prototype._initialize = function () {
            var width = this._el.width(),
		height = this._el.height(),
		self = this;
	    
	    // NODE RELATED DATA
            this.nodes = {};
	    this.hiddenNodes = {};
	    this.dependencies = {
		'nodes': {},
		'edges': {}
	    };
	    this.waitingNodes = {};

	    // LAYOUT RELATED DATA
            this._handle = this._el.find('#hfsmVizHandle');
            this._left = this._el.find('#hfsmVizLeft');
            this._right = this._el.find('#hfsmVizRight');

            this._left.css('width', '19.5%');
            this._right.css('width', '80%');

	    // SIMULATOR
	    this._simulator = new Simulator();
	    this._simulator.initialize( this._left, this.nodes, this._client );

	    // DRAGGING INFO
            this.isDragging = false;

            this._handle.mousedown(function(e) {
		self.isDragging = true;
		e.preventDefault();
            });
            this._containerTag = '#HFSM_VIZ_DIV';
            this._container = this._el.find(this._containerTag).first();
            this._container.mouseup(function() {
		self.isDragging = false;
		self._cy.resize();
            }).mousemove(function(e) {
		if (self.isDragging) {
                    var selector = $(self._el).find(self._containerTag);
		    var mousePosX = e.pageX;
                    if (self._fullScreen) {
			// now we're at the top of the document :)
			selector = $(document).find(self._containerTag).first();
                    }
		    else {
			// convert x position as needed
			// get offset from split panel
			mousePosX -= $(self._el).find(self._containerTag).parents('.panel-base-wh').parent().position().left;
			// get offset from west panel
			mousePosX -= $('.ui-layout-pane-center').position().left;
			//var selector = self._fullScreen ? self._containerTag : '.ui-layout-pane-center';
		    }
                    var maxWidth = selector.width();
                    var handlePercent = 0.5;
                    var minX = 0;
                    var maxX = selector.width() + minX;
                    var leftWidth = mousePosX - minX;
                    var leftPercent = Math.max(10, (leftWidth / maxWidth) * 100);
                    var rightPercent = Math.max(10, 100 - leftPercent - handlePercent);
                    leftPercent = 100 - rightPercent - handlePercent;
                    self._left.css('width', leftPercent + '%');
                    self._right.css('width', rightPercent + '%');
		}
            });

	    /*
	    var DOMURL = window.URL || window.webkitURL || window;
	    var img = new Image();
	    var svg = new Blob([data], {type: 'image/svg+xml'});
	    var url = DOMURL.createObjectURL(svg);
	    */

	    this._cytoscape_options = {
		container: this._cy_container,
		//style: styleText,
		style: styleText, //+ 'node { background-image: '+url + ';}',
		// interaction options:
		minZoom: 1e-50,
		maxZoom: 1e50,
		zoomingEnabled: true,
		userZoomingEnabled: true,
		panningEnabled: true,
		userPanningEnabled: true,
		boxSelectionEnabled: false,
		selectionType: 'single',
		touchTapThreshold: 8,
		desktopTapThreshold: 4,
		autolock: false,
		autoungrabify: false,
		autounselectify: false,

		// rendering options:
		headless: false,
		styleEnabled: true,
		hideEdgesOnViewport: false,
		hideLabelsOnViewport: false,
		textureOnViewport: false,
		motionBlur: false,
		motionBlurOpacity: 0.2,
		wheelSensitivity: 1,
		pixelRatio: 'auto',
	    };

	    var self = this;

	    this._layout_options = {
		'name': 'cose-bilkent',
		// Called on `layoutready`
		ready: function () {
		},
		// Called on `layoutstop`
		stop: function () {
		},
		// Whether to fit the network view after when done
		fit: true,
		// Padding on fit
		padding: 10,
		// Whether to enable incremental mode
		randomize: true,
		// Node repulsion (non overlapping) multiplier
		nodeRepulsion: 5500, // 4500
		// Ideal edge (non nested) length
		idealEdgeLength: 100,   // 50
		// Divisor to compute edge forces
		edgeElasticity: 0.45,
		// Nesting factor (multiplier) to compute ideal edge length for nested edges
		nestingFactor: 0.1,
		// Gravity force (constant)
		gravity: 0.1,  // 0.25
		// Maximum number of iterations to perform
		numIter: 2500,
		// For enabling tiling
		tile: false,   // true
		// Type of layout animation. The option set is {'during', 'end', false}
		animate: 'end',
		// Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
		tilingPaddingVertical: 10,
		// Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
		tilingPaddingHorizontal: 10,
		// Gravity range (constant) for compounds
		gravityRangeCompound: 1.5,
		// Gravity force (constant) for compounds
		gravityCompound: 1.0,
		// Gravity range (constant)
		gravityRange: 3.8
	    };
	    this._cytoscape_options.layout = self._layout_options;
	    this._cy = cytoscape(self._cytoscape_options);

	    // the default values of each option are outlined below:
	    var defaults = {
		preview: true, // whether to show added edges preview before releasing selection
		stackOrder: 4, // Controls stack order of edgehandles canvas element by setting it's z-index
		handleSize: 5, // the size of the edge handle put on nodes
		handleHitThreshold: 1, // a threshold for hit detection that makes it easier to grab the handle
		handleIcon: false, // an image to put on the handle
		handleColor: '#00235b', //  the colour of the handle and the line drawn from it
		handleLineType: 'ghost', // can be 'ghost' for real edge, 'straight' for a straight line, or 'draw' for a draw-as-you-go line
		handleLineWidth: 1, // width of handle line in pixels
		handleOutlineColor: '#ff0000', // the colour of the handle outline
		handleOutlineWidth: 1, // the width of the handle outline in pixels
		handleNodes: function( node ) { //'node', // selector/filter function
		    var desc = self.nodes[node.id()];
		    return self.isValidSource( desc );
		},
		handlePosition: 'middle top', // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
		hoverDelay: 150, // time spend over a target node before it is considered a target selection
		cxt: false, // whether cxt events trigger edgehandles (useful on touch)
		enabled: true, // whether to start the plugin in the enabled state
		toggleOffOnLeave: true, // whether an edge is cancelled by leaving a node (true), or whether you need to go over again to cancel (false; allows multiple edges in one pass)
		edgeType: function( sourceNode, targetNode ) {
		    // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
		    // returning null/undefined means an edge can't be added between the two nodes
		    var srcDesc = self.nodes[sourceNode.id()];
		    var dstDesc = self.nodes[targetNode.id()];
		    var isValid = self.validEdge( srcDesc, dstDesc );
		    if (isValid)
			return 'flat';
		    else
			return null;
		},
		loopAllowed: function( node ) {
		    // for the specified node, return whether edges from itself to itself are allowed
		    var desc = self.nodes[node.id()];
		    return self.validEdgeLoop( desc );
		},
		nodeLoopOffset: -50, // offset for edgeType: 'node' loops
		nodeParams: function( sourceNode, targetNode ) {
		    // for edges between the specified source and target
		    // return element object to be passed to cy.add() for intermediary node
		    return {};
		},
		edgeParams: function( sourceNode, targetNode, i ) {
		    // for edges between the specified source and target
		    // return element object to be passed to cy.add() for edge
		    // NB: i indicates edge index in case of edgeType: 'node'
		    return {};
		},
		start: function( sourceNode ) {
		    // fired when edgehandles interaction starts (drag on handle)
		},
		complete: function( sourceNode, targetNodes, addedEntities ) {
		    // fired when edgehandles is done and entities are added
		    if (sourceNode && targetNodes && addedEntities)
			self.draggedEdge( sourceNode, targetNodes[0], addedEntities[0] );
		},
		stop: function( sourceNode ) {
		    // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
		}, 
		cancel: function( sourceNode, renderedPosition, invalidTarget ){
		    // fired when edgehandles are cancelled ( incomplete - nothing has been added ) - renderedPosition is where the edgehandle was released, invalidTarget is
		    // a collection on which the handle was released, but which for other reasons (loopAllowed | edgeType) is an invalid target
		}
	    };

	    // EDGE HANDLES
	    this._cy.edgehandles( defaults );

	    // CONTEXT MENUS
	    var options = {
		// List of initial menu items
		menuItems: [
		    {
			id: 'toggleCollapse',
			content: '(Un-)Show Children',
			tooltipText: 'Toggle the display of children.',
			selector: 'node',
			onClickFunction: function ( e ) {
			    //var node = this;
			    var node = e.target;
			    if (node == self._cy) { }
			    else
				self.toggleShowChildren( node );
			},
			coreAsWell: false,
			hasTrailingDivider: true, // Whether the item will have a trailing divider
		    },
		    {
			id: 'newChild',
			content: 'Add child...',
			tooltipText: 'Create a new state, internal transition, etc.',
			selector: 'node',
			coreAsWell: true,
			onClickFunction: function ( e ) {
			    var node = e.target;
			    if (node == self._cy) { }
			    else {
				var dialog = new Dialog();
				dialog.initialize( self.nodes[ node.id() ], self._client );
				dialog.show();
			    }
			},
			coreAsWell: false
		    },
		    {
			id: 'remove',
			content: 'remove',
			tooltipText: 'remove',
			selector: 'node, edge', 
			onClickFunction: function ( e ) { // The function to be executed on click
			    var node = e.target;
			    if (node == self._cy) { }
			    else
				self.deleteNode( node.id() );
			},
			coreAsWell: false // Whether core instance have this item on cxttap
		    },
		],
		// css classes that menu items will have
		menuItemClasses: [
		    // add class names to this list
		],
		// css classes that context menu will have
		contextMenuClasses: [
		    // add class names to this list
		]
	    };
	    var ctxMenuInstance = this._cy.contextMenus( options );

	    // layout such

	    var layoutPadding = 50;
	    var layoutDuration = 500;

	    function highlight( node ){
	    }

	    function clear(){
		self._simulator.hideStateInfo();
	    }

	    //self._cy.on('add', _.debounce(self.reLayout.bind(self), 250));
	    self.debouncedReLayout = _.debounce(self.reLayout.bind(self), 250);
	    
	    self._cy.on('select', 'node, edge', function(e){
		var node = this;
		if (node.id()) {
		    WebGMEGlobal.State.registerActiveSelection([node.id()]);
		}
		highlight( node );
		self._simulator.displayStateInfo( node.id() );
	    });
	    
	    self._cy.on('cxttap', 'node', function(e) {
	    });

	    // UNSELECT ON NODES AND EDGES

	    self._cy.on('unselect', 'node, edge', function(e){
		var node = this;
		clear();
	    });

	    // LAYOUT AND RESET BUTTONS

	    self._el.find('#re_layout').on('click', function(){
		self.reLayout();
	    });
	    
	    self._el.find('#reset').on('click', function(){
		self._cy.animate({
		    fit: {
			eles: self._cy.elements(),
			padding: layoutPadding
		    },
		    duration: layoutDuration
		});
	    });
	};

	/* * * * * * * * Graph Creation Functions  * * * * * * * */


	HFSMVizWidget.prototype.checkDependencies = function(desc) {
	    var self = this;
	    // dependencies will always be either parentId (nodes & edges) or connection (edges)
	    var deps = [];
	    if (desc.parentId && !self.nodes[desc.parentId]) {
		deps.push(desc.parentId);
	    }
	    if (desc.isConnection) {
		if (!self.nodes[desc.src])
		    deps.push(desc.src);
		if (!self.nodes[desc.dst])
		    deps.push(desc.dst);
	    }
	    var depsMet = (deps.length == 0);
	    if (!depsMet) {
		if (desc.isConnection)
		    self.dependencies.edges[desc.id] = deps;
		else 
		    self.dependencies.nodes[desc.id] = deps;
		self.waitingNodes[desc.id] = desc;
		if (self.nodes[desc.id])
		    delete self.nodes[desc.id];
	    }
	    return depsMet;
	};

	HFSMVizWidget.prototype.updateDependencies = function() {
	    var self = this;
	    var nodePaths = Object.keys(self.dependencies.nodes);
	    var edgePaths = Object.keys(self.dependencies.edges);
	    // create any nodes whose depenencies are fulfilled now
	    nodePaths.map(function(nodePath) {
		var depPaths = self.dependencies.nodes[nodePath];
		if (depPaths && depPaths.length > 0) {
		    depPaths = depPaths.filter(function(objPath) { return self.nodes[objPath] == undefined; });
		    if (!depPaths.length) {
			var desc = self.waitingNodes[nodePath];
			delete self.waitingNodes[nodePath];
			delete self.dependencies.nodes[nodePath];
			self.createNode(desc);
		    }
		    else {
			self.dependencies.nodes[nodePath] = depPaths;
		    }
		}
		else {
		    delete self.dependencies.nodes[nodePath];
		}
	    });
	    // Create any edges whose dependencies are fulfilled now
	    edgePaths.map(function(edgePath) {
		var depPaths = self.dependencies.edges[edgePath];
		if (depPaths && depPaths.length > 0) {
		    depPaths = depPaths.filter(function(objPath) { return self.nodes[objPath] == undefined; });
		    if (!depPaths.length) {
			var connDesc = self.waitingNodes[edgePath];
			delete self.waitingNodes[edgePath];
			delete self.dependencies.edges[edgePath];
			self.createEdge(connDesc);
		    }
		    else {
			self.dependencies.edges[edgePath] = depPaths;
		    }
		}
		else {
		    delete self.dependencies.edges[edgePath];
		}
	    });
	};

        HFSMVizWidget.prototype.reLayout = function() {
            var self = this;
            var layout = self._cy.layout(self._layout_options);
	    layout.run();
	    //self._cy.nodes().qtip({ content: 'hi', position: { my: 'top center', at: 'bottom center' } })
        };

	HFSMVizWidget.prototype.getDescData = function(desc) {
	    var self = this;
	    var data = {};
	    if (desc.isConnection) {
		var from = self.nodes[desc.src];
		var to = self.nodes[desc.dst];
		if (from && to) {
		    data = {
			id: desc.id,
			type: desc.type,
			interaction: desc.type,
			source: from.id,
			target: to.id,
			name: desc.name,
			// source-label
			// target-label
			label: desc.text
		    };
		}
	    }
	    else {
		data = {
		    id: desc.id,
		    parent: desc.parentId,
		    type: desc.type,
		    NodeType: desc.type,
		    name: desc.name,
		    label: desc.name,
		};
	    }
	    return data;
	};

	HFSMVizWidget.prototype.isHidden = function(desc) {
	    return hideTypes.indexOf( desc.type ) > -1;
	};

	HFSMVizWidget.prototype.createEdge = function(desc) {
	    var self = this;
	    if (desc && desc.src && desc.dst) {
		var data = self.getDescData(desc);
		if (data) {
		    if (!self.isHidden( desc )) {
			self._cy.add({
			    group: 'edges',
			    data: data,
			    
			});
		    }
		    self.nodes[desc.id] = desc;
		    self.updateDependencies();
		}
	    }
	};

	HFSMVizWidget.prototype.createNode = function(desc) {
	    var self = this;
	    var data = self.getDescData(desc);
	    if (!self.isHidden(desc)) {
		var node = {
		    group: 'nodes',
		    data: data
		};
		self._cy.add(node);
	    }
	    self.nodes[desc.id] = desc;
	    self.updateDependencies();
	    self.debouncedReLayout();
	};
	
	// Adding/Removing/Updating items
	HFSMVizWidget.prototype.addNode = function (desc) {
	    var self = this;
            if (desc) {
		var depsMet = self.checkDependencies(desc);
		// Add node to a table of nodes
		if (desc.isConnection) {  // if this is an edge
		    if (depsMet) { // ready to make edge
			self.createEdge(desc);
		    }
		}
		else {
		    if (depsMet) { // ready to make node
			self.createNode(desc);
		    }
		}
		self._simulator.update( );
	    }
	};

	HFSMVizWidget.prototype.removeNode = function (gmeId) {
	    // TODO: need to have this take into account hidden nodes!
	    var self = this;
	    var idTag = gmeId.replace(/\//gm, "\\/");
            var desc = self.nodes[gmeId];
	    if (desc) {
		if (!desc.isConnection) {
		    delete self.dependencies.nodes[gmeId];
		    if (!self.isHidden( desc ) ) {
			self._cy.$('#'+idTag).neighborhood().forEach(function(ele) {
			    if (ele && ele.isEdge()) {
				var edgeId = ele.data( 'id' );
				var edgeDesc = self.nodes[edgeId];
				self.checkDependencies(edgeDesc);
			    }
			});
		    }
		}
		else {
		    delete self.dependencies.edges[gmeId];
		}
		delete self.nodes[gmeId];
		delete self.waitingNodes[gmeId];
		if (!self.isHidden( desc ))
		    self._cy.remove("#" + idTag);
		self.updateDependencies();
		self._simulator.update( );
	    }
	};

	HFSMVizWidget.prototype.updateNode = function (desc) {
	    var self = this;
	    // TODO: need to have this take into account hidden nodes!
            if (desc) {
		var oldDesc = this.nodes[desc.id];
		if (oldDesc) {
		    var idTag = desc.id.replace(/\//gm, "\\/");
		    if (desc.isConnection) {
			if (desc.src != oldDesc.src || desc.dst != oldDesc.dst) {
			    this._cy.remove('#' + idTag);
			    self.checkDependencies( desc );
			    self.updateDependencies();
			}
			else {
			    this._cy.$('#'+idTag).data( this.getDescData(desc) );
			}
		    }
		    else {
			this._cy.$('#'+idTag).data( this.getDescData(desc) );
		    }
		}
		this.nodes[desc.id] = desc;
		self._simulator.update( );
            }
	};

	/* * * * * * * * Context Menu Functions    * * * * * * * */

	HFSMVizWidget.prototype.deleteNode = function( nodeId ) {
	    var self = this;
	    self._client.deleteNode( nodeId, "Removing " + nodeId );
	};

	HFSMVizWidget.prototype.getHiddenChildren = function( node ) {
	    var self = this;
	    return self.hiddenNodes[node.id()];
	};

	HFSMVizWidget.prototype.hasHiddenChildren = function( node ) {
	    var self = this;
	    return self.getHiddenChildren(node) != null;
	};

	HFSMVizWidget.prototype.isCompoundNode = function( node ) {
	    var self = this;
	    return node.isParent() || self.hasHiddenChildren( node );
	};

	HFSMVizWidget.prototype.toggleShowChildren = function ( node ) {
	    var self = this;
	    var hidden = self.getHiddenChildren( node );
	    if (node.isParent()) {
		// currently true, disable show children
		var children, descendants, edges;
		children = node.children();
		if (self.hiddenNodes[node.id()]) {
		    descendants = self.hiddenNodes[node.id()].nodes;
		    edges = self.hiddenNodes[node.id()].edges;
		}
		else {
		    descendants = node.descendants();
		    edges = descendants.connectedEdges();
		}
		self._cy.remove(edges);
		self._cy.remove(descendants);
		self.hiddenNodes[node.id()] = {
		    nodes: descendants,
		    edges: edges,
		};
	    }
	    else if (hidden && hidden.nodes && hidden.edges) {
		// currently false, reenable show children
		hidden.nodes.restore();
		hidden.edges.restore();
		delete self.hiddenNodes[node.id()];
	    }
	};

	/* * * * * * * * Edge Creation Functions   * * * * * * * */

	HFSMVizWidget.prototype.draggedEdge = function( cySrc, cyDst, cyEdge ) {
	    var self = this;
	    var srcDesc = self.nodes[cySrc.id()];
	    var dstDesc = self.nodes[cyDst.id()];
	    var srcParentId = srcDesc.parentId;
	    var newEdgePath = self.createNewEdge( srcParentId, srcDesc, dstDesc );
	    cyEdge.remove();
	};

	HFSMVizWidget.prototype.createNewEdge = function( parentId, src, dst ) {
	    var self = this;
	    var client = self._client;
	    // should be META:External Transition
	    var edgeMetaId = '/615025579/318746662'; // need to not hardcode the edgeId
	    var childCreationParams = {
		parentId: parentId,
		baseId: edgeMetaId,
	    };

            client.startTransaction();

	    var msg = 'Creating External Transition between ' + src.id + ' and '+dst.id;
	    var newEdgePath = client.createChild( childCreationParams, msg);
	    if (newEdgePath) {
		msg = 'Setting src pointer for ' + newEdgePath + ' to ' + src.id;
		client.setPointer( newEdgePath, 'src', src.id, msg );
		msg = 'Setting dst pointer for ' + newEdgePath + ' to ' + dst.id;
		client.setPointer( newEdgePath, 'dst', dst.id, msg );
	    }

            client.completeTransaction();

	    return newEdgePath;
	};

	HFSMVizWidget.prototype.isValidSource = function( desc ) {
	    var self = this;
	    if (desc.type == 'End State')
		return false;
	    else if (desc.type == 'Deep History Pseudostate')
		return false;
	    else if (desc.type == 'Shallow History Pseudostate')
		return false;
	    else if (desc.type == 'Task')
		return false;
	    else if (desc.type == 'Timer')
		return false;
	    else if (desc.type == 'Initial') {
		// if initial already has transition, don't allow more
		var initialEdges = self._simulator.getEdgesFromNode( desc.id );
		if (initialEdges.length)
		    return false;
	    }
	    return true;
	};

	HFSMVizWidget.prototype.validEdgeLoop = function( desc ) {
	    var self = this;
	    if (desc.type == 'Initial' ||
		desc.type == 'End State' ||
		desc.type == 'Deep History Pseudostate' ||
		desc.type == 'Shallow History Pseudostate' ||
		desc.type == 'Choice Pseudostate')
		return false;
	    else
		return true;
	};

	HFSMVizWidget.prototype.validEdge = function( srcDesc, dstDesc ) {
	    var self = this;
	    var valid = true;
	    var srcType = srcDesc.type;
	    var dstType = dstDesc.type;
	    if (dstType == 'Initial')
		valid = false;
	    else if (dstType == 'Task')
		valid = false;
	    else if (dstType == 'Timer')
		valid = false;
	    else if (srcType == 'End State')
		valid = false;
	    else if (srcType == 'Deep History Pseudostate')
		valid = false;
	    else if (srcType == 'Shallow History Pseudostate')
		valid = false;
	    else if (srcType == 'Initial') {
		if (dstType == 'Deep History Pseudostate' ||
		    dstType == 'Shallow History Pseudostate')
		    valid = false;
	    }
	    else if (srcDesc.parentId == dstDesc.id)
		valid = false;
	    return valid;
	};

	/* * * * * * * * Visualizer event handlers * * * * * * * */

	HFSMVizWidget.prototype.onWidgetContainerResize = function (width, height) {
	    this._cy.resize();
	};

	HFSMVizWidget.prototype.onNodeClick = function (/*id*/) {
            // This currently changes the active node to the given id and
            // this is overridden in the controller.
	};

	HFSMVizWidget.prototype.onBackgroundDblClick = function () {
	};

	/* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
	HFSMVizWidget.prototype.destroy = function () {
	};

	HFSMVizWidget.prototype.onActivate = function () {
	};

	HFSMVizWidget.prototype.onDeactivate = function () {
	};

	return HFSMVizWidget;
    });
