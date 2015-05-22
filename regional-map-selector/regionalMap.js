import model = require("services/model");
import shell = require("viewmodels/shell");

export class RegionalMap {

    public chartId: string;

    public regions: KnockoutObservableArray<model.Region>;
    public regionLabel: KnockoutObservable<string>;
    public width: number;
    public height: number;

    public hasChildren: Array<string>;
    public centered;
    public g;

    public planeCenterX: number;
    public planeCenterY: number;
    public scale: number;

    constructor() {
        this.chartId = null;

        this.regions = ko.observableArray<model.Region>([]);
        this.regionLabel = null;

        this.width = 850;
        this.height = 850;

        this.hasChildren = [];
        this.centered = null;
        this.g = null;

        this.planeCenterX = this.width / 2;
        this.planeCenterY = this.height / 2;
        this.scale = 1;
    }

    public setData(chartId: string, regions: KnockoutObservableArray<model.Region>, regionalMapLabel: KnockoutObservable<string>) {
        this.chartId = chartId;
        this.regions(regions());
        this.regionLabel = regionalMapLabel;

        this.mapChildren();
    }

    public draw() {
        var self = this;

        var d3Chart = d3.select("#" + self.chartId);
        var svg = d3Chart.append("svg")
            .attr("width", self.width)
            .attr("height", self.height);
         
        // tooltip for hover over regions
        var tag = d3Chart.append("div")
            .attr("class", "tooltip top");
        tag.append("div").attr("class", "tooltip-arrow");
        tag.append("div").attr("class", "tooltip-inner");

        // map projection and path
        var projection = d3.geo.albers()
            .scale(600)
            .translate([self.width / 2, self.height / 2]);

        var path = d3.geo.path().projection(projection);

        // background is clickable
        svg.append("rect")
            .attr("class", "background")
            .attr("width", self.width)
            .attr("height", self.height)
            .on("click", function(d) { self.zoom(d, self, path); })
            .on("mouseover", function () { $("#" + self.chartId + " .tooltip").css("opacity", "0"); });

        self.g = svg.append("g");

       
        // stack backwards so countries hide provinces, etc.
        var level2 = self.g.append("g") //districts
            .attr("class", "level2")
            .attr("display", "none");
        var level1 = self.g.append("g") //provinces/states
            .attr("class", "level1")
            .attr("display", "none");
        var level0 = self.g.append("g") //countries
            .attr("class", "level0");
            //.attr("display", "none");

        for (var rr = 0; rr < self.regions().length; rr++) {
            var region = self.regions()[rr];
            if (region.vectorJsonUrl() != null) {
                if (region.placeType() == 12) {
                    this.renderShapeGroup(region, path, level0, 0); //countries
                }
                else if (region.placeType() == 8) {
                    this.renderShapeGroup(region, path, level1, 1); //provinces/states
                }
                else if (region.placeType() == 9) {
                    this.renderShapeGroup(region, path, level2, 2); //districts
                }
            }
        }
    }

    private renderShapeGroup(region: model.Region, path, svg, level: number) {
        var self = this;
        var colors = ["#f0f9e8", "#e0f3db", "#bae4bc", "#a8ddb5", "#7bccc4", "#43a2ca", "#0868ac"]; //blue-green scale
        //var colors = ["#b3de69", "#fdb462", "#80b1d3", "#fb8072", "#bebada", "#ffffb3", "#8dd3c7"]; //multicolor

        d3.json(region.vectorJsonUrl(), function (error, collection) {
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
                    .on("click", function (d) { self.zoom(d, self, path); })
                    .on("mouseover", function(d) { self.tooltip(d, path); });
            }
        });
    }

    private zoom(item, self, path) {
        var x, y, k;
        var $chart = $("#" + self.chartId);
        if (item) {
            if (self.centered !== item) {
                k = 1.75 * (item.level + 1);
                self.centered = item;
                
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
                self.g.selectAll("path")
                    .each(function(d) {
                        if (d.code == item.code.substr(0, item.code.length - 3)) {
                            self.centered = d;
                        }
                    });
            }

            var centroid = path.centroid(item);
            x = centroid[0];
            y = centroid[1];

            self.regionLabel(self.centered.name);

        } else {
            // background selected
            self.centered = null;
            x = self.width / 2;
            y = self.height / 2;
            k = 1;

            self.regionLabel("none");
        }

        // hide tooltip while transitioning
        $chart.find(".tooltip").css("opacity", "0");

        // add display properties to path elements
        self.g.selectAll("path")
            .classed("lowest", self.centered && function(d) {
                return self.checkLowest(d, self.centered);
            });

        self.g.selectAll("path")
            .classed("active", self.centered && function(d) {
                return self.checkActive(d, self.centered);
            });

        self.g.transition()
            .duration(750)
            .attr("transform", "translate(" + self.width / 2 + "," + self.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1 / k + "px");

        // set center point and current scale
        if (self.centered != null) {
            self.planeCenterX = x;
            self.planeCenterY = y;
            self.scale = k;
        } else {
            self.planeCenterX = self.width / 2;
            self.planeCenterY = self.height / 2;
            self.scale = 1;
        }
    }

     private checkLowest(d, item) {
        var self = this;
        if (d === item && self.hasChildren.indexOf(d.name) == -1) {
            return true;
        }
        return false;
     }

    private checkActive(d, item) {
        // keep all parents
        for (var cc = 0; cc <= item.level; cc++) {
            if (d.code == item.code.substr(0, item.code.length - (cc * 3))) { // only works if all codes are two letters
                return true;
            }
        }
        return false;
    }

    private tooltip(d, path) {
        var self = this;
        var centroid = path.centroid(d);
        var x = centroid[0];
        var y = centroid[1];

        // add name to tooltip
        var $chart = $("#" + self.chartId);
        var $tooltip = $chart.find(".tooltip");
        $tooltip.find(".tooltip-inner").html(d.name);

        // calculate offset
        var offsetX = $chart[0].offsetLeft - ($tooltip[0].offsetWidth / 2);
        var offsetY = $chart[0].offsetTop - $tooltip[0].offsetHeight;

        var xDist = x - self.planeCenterX;
        var yDist = y - self.planeCenterY;

        // position tooltip
        var transformX = (xDist * self.scale) + (self.height / 2);
        var transformY = (yDist * self.scale) + (self.width / 2);

        if (transformX < 0) transformX = 0;
        if (transformY < 0) transformY = 0;
        if (transformX > self.width) transformX = self.width;
        if (transformY > self.height) transformY = self.height;

        $tooltip.css("opacity", "1").css("top", transformY + offsetY).css("left", transformX + offsetX);
    }

    private mapChildren() {
        var self = this;

        for (var ii = 0; ii < self.regions().length; ii++) {
            var parentRegion = self.regions()[ii].parentRegion();
            if (parentRegion) {
                if (self.hasChildren.indexOf(parentRegion.name()) == -1 && parentRegion.placeType() != 9) { // if place type is not regional district
                    self.hasChildren.push(parentRegion.name());
                }
            }
        }
    }
}


export var regionalMap = new RegionalMap(); 