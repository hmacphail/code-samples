
// declare global vars
var width = 850,
    height = 850;

var chartId = "#chart-region-selector";

var hasChildren = [];
var centered = null;

var planeCenterX = width / 2;
var planeCenterY = height / 2;
var scale = 1;

// GeoJSON file arrays
var countries = ["canada", "usa", "mexico"];
var provinces = ["alberta", "britishcolumbia", "manitoba", "newbrunswick", "newfoundland", "northwestterritories", "novascotia", "nunavut", "ontario", "pei", "quebec", "saskatchewan", "yukon"];
var states = ["alabama", "alaska", "arizona", "arkansas", "california", "colorado", "conneticut", "delaware", "districtofcolumbia", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississipi", "missouri", "montana", "nebraska", "nevada", "newhampshire", "newjersey", "newmexico", "newyork", "northcarolina", "northdakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhodeisland", "southcarolina", "southdakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington", "westvirginia", "wisconsin", "wyoming"];
var districts = ["alberniclayoquot", "bulkleynechako", "capitaldistrict", "cariboo", "centralcoast", "centralkootenay", "centralokanagan", "columbiashuswap", "comoxvalley", "cowichanvalley", "districtnanaimo", "eastkootenay", "fraserfortgeorge", "fraservalley", "kitimatstikine", "kootenayboundary", "metrovancouver", "mountwaddington", "northernrockies", "northokanagan", "okanagansimilkameen", "peaceriver", "powellriver", "skeenaqueencharlotte", "squamishlillooet", "stikine", "strathcona", "sunshinecoast", "thompsonnicola"];

// d3 setup
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geo.albers()
    .scale(600)
    .translate([width, height]);

var d3Chart = d3.select(chartId);
var svg = d3Chart.append("svg")
    .attr("width", width)
    .attr("height", height);
 
// tooltip for hover over regions
var tag = d3Chart.append("div")
    .attr("class", "tooltip top");
tag.append("div").attr("class", "tooltip-arrow");
tag.append("div").attr("class", "tooltip-inner");

// map projection and path
var projection = d3.geo.albers()
    .scale(600)
    .translate([width / 2, height / 2]);

var path = d3.geo.path().projection(projection);

// background is clickable
svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", function(d) { zoom(d, self, path); })
    .on("mouseover", function () { $(chartId + " .tooltip").css("opacity", "0"); });

var g = svg.append("g");


// stack backwards so countries hide provinces, etc.
var level2 = g.append("g") //districts
    .attr("class", "level2")
    .attr("display", "none");
var level1 = g.append("g") //provinces/states
    .attr("class", "level1")
    .attr("display", "none");
var level0 = g.append("g") //countries
    .attr("class", "level0");

renderShapeGroup(countries, level0, 0);
renderShapeGroup(provinces, level1, 1);
renderShapeGroup(states, level1, 1);
renderShapeGroup(districts, level2, 2);


function renderShapeGroup(array, svg, level) {
	for (var rr = 0; rr < array.length; rr++) {
        renderShape(array[rr], path, svg, level);
	}
}

function renderShape(region, path, svg, level) {
    var colors = ["#f0f9e8", "#e0f3db", "#bae4bc", "#a8ddb5", "#7bccc4", "#43a2ca", "#0868ac"]; //blue-green scale
    //var colors = ["#b3de69", "#fdb462", "#80b1d3", "#fb8072", "#bebada", "#ffffb3", "#8dd3c7"]; //multicolor

    d3.json("mapshapes/" + region + ".json", function (error, collection) {
        if (error) {
            console.error(error);
        } else {
            collection["name"] = region.name();
            collection["level"] = level;
            collection["code"] = region.regionCode();

            svg.append("path")
                .datum(collection)
                .attr("d", path)
                .attr("id", region.regionCode())
                .attr("class", "region")
                .attr("fill", colors[Math.floor(Math.random() * 7)])
                .on("click", function (d) { zoom(d, self, path); })
                .on("mouseover", function(d) { tooltip(d, path); });
        }
    });
}

function zoom(item, self, path) {
    console.log(item);
    
    var x, y, k;
    var $chart = $(chartId);
    if (item) {
        if (centered !== item) {
            k = 1.75 * (item.level + 1);
            centered = item;
            
            // render next step down (because hidden on initial draw)
            $chart.find(".level" + (item.level + 1)).attr("display", "");
        } else {
            // go up one level only
            if (item.level == 0) {
                k = 1;
            } else {
                k = 1.75 * (item.level);
            }

            // find parent item
            g.selectAll("path")
                .each(function(d) {
                    if (d.code == item.code.substr(0, item.code.length - 3)) {
                        centered = d;
                    }
                });
        }

        var centroid = path.centroid(item);
        x = centroid[0];
        y = centroid[1];

        self.regionLabel(self.centered.name);

    } else {
        // background selected
        centered = null;
        x = width / 2;
        y = height / 2;
        k = 1;

        self.regionLabel("none");
    }

    // hide tooltip while transitioning
    $chart.find(".tooltip").css("opacity", "0");

    // add display properties to path elements
    g.selectAll("path")
        .classed("lowest", centered && function(d) {
            return checkLowest(d, centered);
        });

    g.selectAll("path")
        .classed("active", centered && function(d) {
            return checkActive(d, centered);
        });

    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1 / k + "px");

    // set center point and current scale
    if (centered != null) {
        planeCenterX = x;
        planeCenterY = y;
        scale = k;
    } else {
        planeCenterX = width / 2;
        planeCenterY = height / 2;
        scale = 1;
    }
}

function checkLowest(d, item) {
    if (d === item && hasChildren.indexOf(d.name) == -1) {
        return true;
    }
    return false;
}

function checkActive(d, item) {
    // keep all parents
    for (var cc = 0; cc <= item.level; cc++) {
        if (d.code == item.code.substr(0, item.code.length - (cc * 3))) { // only works if all codes are two letters
            return true;
        }
    }
    return false;
}

function tooltip(d, path) {
    var centroid = path.centroid(d);
    var x = centroid[0];
    var y = centroid[1];

    // add name to tooltip
    var $chart = $(chartId);
    var $tooltip = $chart.find(".tooltip");
    $tooltip.find(".tooltip-inner").html(d.name);

    // calculate offset
    var offsetX = $chart[0].offsetLeft - ($tooltip[0].offsetWidth / 2);
    var offsetY = $chart[0].offsetTop - $tooltip[0].offsetHeight;

    var xDist = x - planeCenterX;
    var yDist = y - planeCenterY;

    // position tooltip
    var transformX = (xDist * scale) + (height / 2);
    var transformY = (yDist * scale) + (width / 2);

    if (transformX < 0) transformX = 0;
    if (transformY < 0) transformY = 0;
    if (transformX > width) transformX = width;
    if (transformY > height) transformY = height;

    $tooltip.css("opacity", "1").css("top", transformY + offsetY).css("left", transformX + offsetX);
}
