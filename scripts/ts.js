(function() {
    var csvUrl = "https://raw.githubusercontent.com/fluderm/Crime_NY/main/data/crime_NY_d3.csv";

    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    var valueline = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.value); })
        .curve(d3.curveLinear);

    var svg1 = d3.select("svg#svg1")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg1.append("text")
        .attr("class", "x axis-label")
        .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom - 10) + ")")
        .style("text-anchor", "middle")
        .text("Year");

    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    var selectedColumn = "Index.Total";
    var selectedCounties = [];

    // default start and end years
    var startYear = 1990;
    var endYear = 2022;

    // year dropdowns:
    for (var year = 1990; year <= 2022; year++) {
        d3.select("#startYear").append("option").text(year).attr("value", year);
        d3.select("#endYear").append("option").text(year).attr("value", year);
    }

    // default year values
    d3.select("#startYear").property("value", startYear);
    d3.select("#endYear").property("value", endYear);



    d3.csv(csvUrl).then(function(allData) {
        var processedData = {};
        allData.forEach(function(d) {
            var county = d.County;
            var year = new Date(d.Year, 0);
            if (!processedData[county]) {
                processedData[county] = [];
            }
            processedData[county].push({ year: year, ...d });
        });

        var counties = Object.keys(processedData);
        var selectCounty = d3.select("#countySelect");

        selectCounty.selectAll("option")
            .data(counties)
            .enter()
            .append("option")
            .text(function(d) { return d; })
            .attr("value", function(d) { return d; });

        selectCounty.on("change", function() {
            selectedCounties = Array.from(this.selectedOptions, option => option.value);
            updateGraph(selectedCounties, selectedColumn, startYear, endYear);
        });

        d3.select("#columnSelect").on("change", function() {
            selectedColumn = this.value;
            updateGraph(selectedCounties, selectedColumn, startYear, endYear);
            updateYAxisLabel(selectedColumn);
        });

        colorScale.domain(counties);
        x.domain(d3.extent(allData, function(d) { return new Date(d.Year, 0); })).nice();
        y.domain([0, d3.max(allData, function(d) { return +d[selectedColumn]; })]).nice();

        svg1.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        svg1.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        updateGraph([], selectedColumn, startYear, endYear);
        updateYAxisLabel(selectedColumn);

        function updateGraph(selectedCounties, selectedColumn, startYear, endYear) {
            // filter:
            var filteredDataByCounty = selectedCounties.map(function(county) {
                return {
                    county: county,
                    data: processedData[county].filter(function(d) {
                        var year = d.year.getFullYear();
                        return year >= startYear && year <= endYear;
                    }).map(d => ({ ...d, value: +d[selectedColumn] }))
                };
            });

            // x-domain based on selected years
            if (startYear !== undefined && endYear !== undefined && startYear <= endYear) {
                x.domain([new Date(startYear, 0, 1), new Date(endYear, 11, 31)]);
            } else {
                x.domain([new Date(1990, 0, 1), new Date(2022, 11, 31)]);
            }
            svg1.select(".x.axis").transition().duration(1000).call(d3.axisBottom(x));

            // old:
            // x.domain([new Date(startYear, 0), new Date(endYear, 11, 31)]).nice();
            // svg1.select(".x.axis").transition().duration(1000).call(d3.axisBottom(x));

            // Clear:
            svg1.selectAll(".line").remove();
            svg1.selectAll("circle").remove();
            svg1.selectAll(".legend").remove();

            if (filteredDataByCounty.length === 0) {
                return;
            }

            var yMax = d3.max(filteredDataByCounty, function(countyData) {
                return d3.max(countyData.data, function(d) { return d.value; });
            });
            y.domain([0, yMax]).nice();
            svg1.select(".y.axis").transition().duration(1000).call(d3.axisLeft(y));

            valueline.y(function(d) { return y(d.value); });

            var lines = svg1.selectAll(".line")
                .data(filteredDataByCounty, function(d) { return d.county; });

            lines.enter()
                .append("path")
                .attr("class", "line")
                .merge(lines)
                .style("stroke", function(d) { return colorScale(d.county); })
                .attr("fill", "none")
                .attr("stroke-width", 2)
                .attr("d", function(d) { return valueline(d.data); })
                .attr("clip-path", "url(#clip)");

            lines.exit().remove();

            var circles = svg1.selectAll("circle")
                .data(filteredDataByCounty.flatMap(d => d.data.map(point => ({ ...point, county: d.county }))), function(d) {
                    return d.county + d.year;
                });

            circles.enter()
                .append("circle")
                .merge(circles)
                .attr("cx", function(d) { return x(d.year); })
                .attr("cy", function(d) { return y(d.value); })
                .attr("r", 3)
                .style("fill", function(d) {
                    var circleColor = colorScale(d.county);
                    console.log("Circle Color for", d.county, "is", circleColor);
                    return circleColor;
                });

            circles.exit().remove();

            var legend = svg1.selectAll(".legend")
                .data(filteredDataByCounty, function(d) { return d.county; });

            var legendEnter = legend.enter().append("g")
                .attr("class", "legend");

            legendEnter.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function(d) { return colorScale(d.county); });

            legendEnter.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d.county; });

            legendEnter.merge(legend)
                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
        }

        function updateYAxisLabel(selectedColumn) {
            // change y-axis label
            var yAxisLabel = columnSelectToLabel(selectedColumn);
            svg1.select(".y.axis-label").remove();
            svg1.append("text")
                .attr("class", "y axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(yAxisLabel);
        }

        function columnSelectToLabel(column) {
            // map columnSelect value to a readable label
            switch (column) {
                case "Index.Total": return "Total Crime Incidents per 1,000 Population";
                case "Violent.Total": return "Total Violent Incidents per 1,000 Population";
                case "Murder": return "Murder Incidents per 1,000 Population";
                case "Rape": return "Rape Incidents per 1,000 Population";
                case "Robbery": return "Robbery Incidents per 1,000 Population";
                case "Aggravated.Assault": return "Aggravated Assault Incidents per 1,000 Population";
                case "Property.Total": return "Total Property Incidents per 1,000 Population";
                case "Burglary": return "Burglary Incidents per 1,000 Population";
                case "Larceny": return "Larceny Incidents per 1,000 Population";
                case "Motor.Vehicle.Theft": return "Motor Vehicle Theft Incidents per 1,000 Population";
                default: return column;
            }
        }

        // Event listeners for year selection
        d3.select("#startYear").on("change", function() {
            startYear = parseInt(this.value);
            updateGraph(selectedCounties, selectedColumn, startYear, endYear);
        });

        d3.select("#endYear").on("change", function() {
            endYear = parseInt(this.value);
            updateGraph(selectedCounties, selectedColumn, startYear, endYear);
        });

    }).catch(function(error) {
        console.error("Error loading CSV: ", error);
    });
})();
