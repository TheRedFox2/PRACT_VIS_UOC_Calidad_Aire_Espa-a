// graficas_objetivos.js

d3.csv("../output/datos_uso_calidad_aire_2025.csv").then(datos => {
const datosAgrupadosG = d3.rollup(datos, 
        v => ({
            exceden: v.filter(d => parseFloat(d.I) > 1).length,
            cumplen: v.filter(d => parseFloat(d.I) <= 1).length
        }), 
        d => d["Protection Target"]
    );
    // 2. Aquí llamarías a tus funciones de dibujo
    dibujarDonut(datosAgrupadosG);
    const dataArray = Array.from(datosAgrupadosG.entries(), ([key, value]) => ({
        label: traducir(key),
        ...value
    }));

    const datosLimpios = dataArray.map(d => ({
        label: d.label,
        cumplen: Number(d.cumplen) || 0,
        exceden: Number(d.exceden) || 0
    }));

dibujarBarrasApiladas(datosLimpios);
});

function traducir(label) {
const traducciones = {
        "Health": "Salud",
        "Vegetation": "Vegetación"
    };
    return traducciones[label] || label;

}

function dibujarDonut(datosAgrupadosG) {
    console.log("Datos recibidos en Donut:", datosAgrupadosG)
    const svgG = d3.select("#donut-chart");
    const data = Array.from(datosAgrupadosG, ([key, value]) => ({ 
        label: key, 
        value: value.exceden + value.cumplen 
    }));

    const total = d3.sum(data, d => d.value);

    // 3. Configuración geométrica
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
       .attr("fill", (d, i) => d3.schemeCategory10[i])
       // HOVER DONUT
       .on("mouseover", function(event, d) {
            const porcentaje = ((d.data.value / total) * 100).toFixed(1);
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

    // 2. Crear las filas de la leyenda usando los datos
    data.forEach((d, i) => {
        const row = leyenda.append("g")
            .attr("transform", `translate(0, ${i * 45})`); // Espaciado vertical de 45px

        // Cuadrado de color
        row.append("rect")
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", d3.schemeCategory10[i]);

        // Texto de la leyenda
        row.append("text")
            .attr("x", 40)
            .attr("y", 18)
            .text(traducir(d.label))
            .style("font-size", "18px") // Tamaño grande
            .style("font-weight", "bold")
            .style("alignment-baseline", "middle");
    });


}

// Aseguramos que los valores sean números reales


function dibujarBarrasApiladas(data) {
    const svgG = d3.select("#bar-chart");
    svgG.selectAll("*").remove(); 

    const width = 900, height = 600;
    const margin = { top: 40, right: 100, bottom: 80, left: 60 };

    // Escala X: Para los grupos (nombres de etiquetas)
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.left, width - margin.right])
        .padding(0.6);

    // Escala Y: Para los valores acumulados
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cumplen + d.exceden)])
        .nice()
        .range([height - margin.bottom, margin.top]);
    // Eje X
    svgG.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .style("font-size", "16px"); 

    // Eje Y
    svgG.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .style("font-size", "16px"); 

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
        .on("mouseover", function(event, d) {
    // Calculamos el valor de esta sección y el total de la barra
    const valorActual = d[1] - d[0];
    const totalColumna = d.data.cumplen + d.data.exceden; // Total de la categoría
    const porcentaje = ((valorActual / totalColumna) * 100).toFixed(1);
    
    // Obtenemos qué categoría es (cumplen o exceden)
    const categoria = d3.select(this.parentNode).datum().key;

    d3.select("#tooltip")
        .style("display", "block")
        .html(`<b>Categoría:</b> ${categoria}<br>
               <b>Cantidad:</b> ${valorActual}<br>
               <b>Porcentaje:</b> ${porcentaje}%`);
               
    d3.select(this).attr("opacity", 0.7);
})
        .on("mousemove", event => tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"))
       .on("mouseout", function() {
           tooltip.style("display", "none");
           d3.select(this).style("opacity", 1);
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