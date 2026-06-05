// graficas_objetivos.js

function traducir(label) {
const traducciones = {
        "Health": "Salud",
        "Vegetation": "Vegetación"
    };
    return traducciones[label] || label;

}


const ordenDeseado = ["Health", "Vegetation"];
const ordenDeseado_ES = ["Salud", "Vegetación"];

const colorScale = d3.scaleOrdinal()
    .domain(["Health", "Vegetation"])
    .range(["#1f77b4", "#ff7f0e"]);
    
function dibujarDonut(datosAgrupadosG) {

    const svgG = d3.select("#donut-chart");
    svgG.selectAll("*").remove();
    const data = Array.from(datosAgrupadosG, ([key, value]) => ({ 
        label: key, 
        value: value.exceden + value.cumplen,

        cumplen: value.cumplen, 
        exceden: value.exceden
    }));


    data.sort((a, b) => {
    return ordenDeseado.indexOf(a.label) - ordenDeseado.indexOf(b.label);
});

    const total = d3.sum(data, d => d.value);

    const width = 800; 
    const height = 600;
    const radius = Math.min(width, height) / 2;

    const g = svgG.append("g")
        .attr("transform", `translate(200, 200)`);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(80).outerRadius(150);
    

    g.selectAll("path")
       .data(pie(data))
       .join("path")
       .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))    
       // HOVER DONUT
       .on("mouseover", function(event, d) {
            const porcentaje = ((d.data.value / total) * 100).toFixed(2);
       d3.select(this).style("opacity", 0.7)
            d3.select("#tooltip")
                .style("display", "block")
                .html(`<b>Objetivo:</b> ${traducir(d.data.label)}<br><b>Porcentaje:</b> ${porcentaje}%`);
        })
       .on("mousemove", event => tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"))
       .on("mouseout", function() {
           tooltip.style("display", "none");
           d3.select(this).style("opacity", 1);
       });

    const leyenda = svgG.append("g")
    .attr("transform", "translate(500, 200)");

    data.forEach((d, i) => {
        const row = leyenda.append("g")
            .attr("transform", `translate(0, ${i * 45})`); 

        const cumplen = Number(d.cumplen) || 0;
        const exceden = Number(d.exceden) || 0;
        const totalElemento = cumplen + exceden;


        const totalGlobal = data.reduce((acc, curr) => acc + curr.cumplen + curr.exceden, 0);
        const porcentaje = ((totalElemento / totalGlobal) * 100).toFixed(2);


        row.append("rect")
            .attr("width", 25)
            .attr("x", -25)
            .attr("height", 25)
            .attr("fill", colorScale(d.label));

        row.append("text")
            .attr("x", 1)
            .attr("y", 18)
            .text(traducir(d.label))
            .style("font-size", "20px") 
            .style("font-weight", "bold")
            .style("alignment-baseline", "middle");

        row.append("text")
            .attr("x", 120) 
            .attr("y", 18)
            .text(`Total: ${totalElemento} | ${porcentaje}%`)
            .style("font-size", "18px")
            .style("fill", "#555") 
            .style("alignment-baseline", "middle");
    });


}




function dibujarBarrasApiladas(data) {
    console.log(ordenDeseado_ES)
    const svgG = d3.select("#bar-chart");
    svgG.selectAll("*").remove(); 



    console.log(ordenDeseado)

    const width = 1000, height = 700;
    const margin = { top: 40, right: 100, bottom: 80, left: 60 };

    // Escala X
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.left, width - margin.right])
        .padding(0.6);

    // Escala Y
    const y = d3.scaleLinear()
        .domain([0, 5500])
        .nice()
        .range([height - margin.bottom, margin.top]);
    // Eje X
    svgG.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .style("font-size", "16px"); 

    // Eje Y
    svgG.append("g")
        .attr("class", "grid") 
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .tickSize(-(width - margin.left - margin.right))
        )
        .style("stroke-dasharray", "3,3") 
        .style("stroke", "#ddd"); 
        const stack = d3.stack().keys(["cumplen", "exceden"]);
        const series = stack(data);


    // Seleccionamos las series
    svgG.selectAll("g.serie")
        .data(series)
        .join("g")
        .attr("fill", d => d.key === "exceden" ? "#de2d26" : "#2ca25f")
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.label))
        .attr("y", d => y(d[1]))        
        .attr("height", d => y(d[0]) - y(d[1])) 
        .attr("width", x.bandwidth())
        .style("opacity", 1)
        .on("mouseover", function(event, d) {
            
            const valorActual = d[1] - d[0];
            const totalColumna = d.data.cumplen + d.data.exceden; 
            const porcentaje = ((valorActual / totalColumna) * 100).toFixed(1);
            
            const categoria = d3.select(this.parentNode).datum().key;
            
            d3.select("#tooltip")
                .style("display", "block")
                .html(`<b>Categoría:</b> ${categoria}<br>
                    <b>Cantidad:</b> ${valorActual}<br>
                    <b>Porcentaje:</b> ${porcentaje}%`);
                    
            d3.select(this).style("opacity", 0.7);
})
        .on("mousemove", event => tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"))
       .on("mouseout", function(event) {

        svgG.selectAll("rect").style("opacity", 1);
            tooltip.style("display", "none");
       });

    // Leyenda integrada
    const legend = svgG.append("g")
        .attr("transform", `translate(${width - 80}, ${margin.top})`);

    ["Cumplen", "Exceden"].forEach((text, i) => {
        legend.append("rect").attr("y", i * 20).attr("width", 12).attr("height", 12)
            .attr("fill", i === 0 ? "#2ca25f" : "#de2d26");
        legend.append("text").attr("x", 15).attr("y", i * 20 + 10).text(text).style("font-size", "12px");
    });

    }