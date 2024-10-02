const countyURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const educationURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const canvas = d3.select("#canvas");
const tooltip = d3.select("#tooltip");

Promise.all([d3.json(countyURL), d3.json(educationURL)])
    .then((data) => drawMap(data[0], data[1]))
    .catch((err) => console.error("Error al cargar los datos: ", err));

function drawMap(countyData, educationData) {
    
    // draw legend
    const percentages = educationData.map((item) => item.bachelorsOrHigher);
    const minPercentage = d3.min(percentages)
    const maxPercentage = d3.max(percentages)
    
    const color = d3
        .scaleThreshold()
        .domain(d3.range(minPercentage, maxPercentage, (maxPercentage - minPercentage) / 8))
        .range(d3.schemeGreens[8]);
        
    const x = d3
        .scaleLinear()
        .domain([minPercentage, maxPercentage])
        .rangeRound([600, 860]);
        
    const g = canvas
        .append("g")
        .attr("class", "key")
        .attr("id", "legend")
        .attr("transform", "translate(0,40)")
    
    g.selectAll("rect")
        .data(color.range().map((d) => {
            d = color.invertExtent(d);
            if (d[0] === null) {
                d[0] = x.domain()[0];
            }
            if (d[1] === null) {
                d[1] = x.domain()[1];
            }
            return d;
        }))
        .enter()
        .append("rect")
        .attr("x",  (d) => x(d[0]))
        .attr("height", 8)
        .attr("width", (d) => d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null))
        .attr("fill", (d) => color(d[0]))
        
    g.call(d3.axisBottom(x).tickSize(13).tickFormat(x => `${Math.round(x)}%`).tickValues(color.domain()))
    g.select(".domain").remove()

    // draw counties
    canvas
        .selectAll("path")
        .data(topojson.feature(countyData, countyData.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath())
        .attr("class", "county")
        .attr("data-fips", (d) => d.id)
        .attr("data-education", (d) => {
            const county = educationData.find((item) => item.fips === d.id);
            return county.bachelorsOrHigher;
        })
        .attr("fill", (d) => {
            const county = educationData.find((item) => item.fips === d.id);
            return color(county.bachelorsOrHigher);
        })
        .on("mouseover", (e, d) => {
            const county = educationData.find((item) => item.fips === d.id);
            tooltip
                .html(`${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%`)
                .attr("data-education", county.bachelorsOrHigher)
                .style("left", e.pageX + 10 + "px")
                .style("top", e.pageY - 28 + "px")
                .style("opacity", 0.9)
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
    
    // draw states outline
    canvas
        .append("path")
        .datum(topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b))
        .attr("class", "states")
        .attr("d", d3.geoPath());
}
