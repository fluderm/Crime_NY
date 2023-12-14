(function() {
    var csvUrl = "https://raw.githubusercontent.com/fluderm/Crime_NY/main/data/Index_Crimes_by_County_and_Agency__Beginning_1990.csv";

    // Load the data from the CSV file
    d3.csv(csvUrl).then(function(data) {

      // Set up the initial dimensions and data
      var width = 600;
      var height = 400;
      var margin = { top: 20, right: 20, bottom: 30, left: 40 };

      var title = d3.select("div#plot")
      .append("h1")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("font-weight","bold")
      .text("Bar charts for crimes in NY counties across years");

      var svg = d3.select("div#plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Extract unique counties and years
      var counties = d3.set(data.map(function(d) { return d.County; })).values();
      var years = d3.set(data.map(function(d) { return d.Year; })).values();


      // Initial values for selected counties and year
      var selectedCounties = [counties[0]];
      var selectedYear = years[0];


    // Function to update the plot based on selected counties and year
    function updatePlot() {
      // Filter data based on selected counties and year
      var filteredData = data.filter(function(d) {
        return selectedCounties.includes(d.County) && d.Year === selectedYear;
      });

      // Remove existing plot elements
      svg.selectAll("*").remove();

      // Redraw the plot with the filtered data
      drawPlot(filteredData);
    }


    // Function to draw the plot with given data
    function drawPlot(data) {
      // Set up color scale for crimes
      var color = d3.scaleOrdinal()
        .domain(["Murder", "Rape","Robbery","Aggravated Assault", "Burglary","Larceny","Motor Vehicle Theft"])
        .range(["#1f78b4","#33a02c","#e31a1c","#ff7f00","#6a3d9a","#b15928","#a6cee3"]);

      // Set up scales and axes
      var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.County; }))
        .range([0, width])
        .padding(0.1);

      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d3.max(["Murder", "Rape","Robbery","Aggravated Assault", "Burglary","Larceny","Motor Vehicle Theft"].map(function(key) { return +d[key]; })); })])
        .range([height, 0]);

      var xAxis = d3.axisBottom(x);
      var yAxis = d3.axisLeft(y);

      // Add axes
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(0)")
        .style("text-anchor", "end");

      svg.append("g")
        .call(yAxis);

      // Add individual bars for each crime category
      ["Murder", "Rape", "Robbery", "Aggravated Assault", "Burglary", "Larceny", "Motor Vehicle Theft"].forEach(function(key, i) {
        svg.selectAll(".bar-" + key)
          .data(data)
          .enter().append("rect")
          .attr("class", "bar-" + key)
          .attr("x", function(d) { return x(d.County) + x.bandwidth() / 7 * i; })
          .attr("y", function(d) { return y(+d[key]); })
          .attr("height", function(d) { return height - y(+d[key]); })
          .attr("width", x.bandwidth() / 7)
          .attr("fill", color(key));
      });

      // Add legend
      var legend = svg.selectAll(".legend")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
        .attr("x", width)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

      legend.append("text")
        .attr("x", width - 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .text(function(d) { return d; });

    }


    updatePlot();

    // Event listener for dropdown changes
    document.addEventListener("change", function(event) {
      if (event.target.id === "countyDropdown") {
        // Get selected counties for multi-select dropdown
        selectedCounties = Array.from(event.target.options)
          .filter(option => option.selected)
          .map(option => option.value);
        updatePlot();
      }
    });


      var sliderContainer = d3.select("div#plot").append("div")
        .attr("id", "slider")
        .style("margin-top", "20px");

      //sliderContainer.append("label")
      //    .attr("for", "countyDropdown")
      //    .style("font-size", "10px")
      //    .text("Choose counties");

      var countyDropdown = sliderContainer.append("select")
        .attr("id", "countyDropdown")
        .attr("multiple", true)
        .selectAll("option")
        .data(counties)
        .enter()
        .append("option")
        .text(function(d) { return d; });

      // Create a slider for years
      var yearRange = sliderContainer.append("input")
          .attr("type", "range")
          .attr("id", "yearRange")
          .attr("min", d3.min(years))
          .attr("max", d3.max(years))
          .attr("value", selectedYear)
          .on("input", function() {
              selectedYear = this.value;
              updatePlot();
          });

      //sliderContainer.append("label")
      //    .attr("for", "yearRange")
      //    .style("font-size", "10px")
      //    .style("font-weight", "bold")
      //    .text("Choose year (1990-2022)");

      //var text1 = sliderContainer.append("text")
      //.attr("text-anchor", "middle")
      //.attr("font-size", 10)
      //.text("You can select several counties");

      //var text2 = sliderContainer.append("text")
      //.attr("text-anchor", "middle")
      //.attr("font-size", 10)
      //.attr("font-weight", "bold")
      //.text("years: 1990-2022");


    }).catch(function(error) {
    console.error("Error loading CSV: ", error);
    });
})();
