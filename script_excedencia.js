// script_excedencia.js

const widthE = 900;
const heightE = 600; 

const svgE = d3.select("#mapa-excedencia") 
  .append("svg")
  .attr("width", widthE)
  .attr("height", heightE);

svgE.append("rect")
  .attr("width", widthE)
  .attr("height", heightE)
  .attr("fill", "#add8e6");

const grupoMapaE = svgE.append("g").attr("class", "grupo-mapa-excedencia");
const tooltipE = d3.select("#tooltip");

const colorExcedenciaE = d3.scaleOrdinal()
  .domain(["No", "Yes"]) 
  .range(["#2ca25f", "#de2d26"]); 

const leyendaGE = svgE.append("g")
  .attr("class", "leyenda-excedencia")
  .attr("transform", `translate(${widthE - 200}, 30)`);

leyendaGE.append("text").attr("y", -10).attr("x", -10).style("font-weight", "bold").text("¿Excede normativa?");

const itemsE = [{text: "Cumple", color: "#2ca25f"}, {text: "Excede", color: "#de2d26"}];
itemsE.forEach((item, i) => {
    leyendaGE.append("rect").attr("y", i * 20).attr("x", 50).attr("width", 15).attr("height", 15).attr("fill", item.color);
    leyendaGE.append("text").attr("y", i * 20 + 12).attr("x", 70).text(item.text).style("font-size", "12px");
});



  function actualizarMapaExcedencia(contaminante, datosParaEsteAnio, geojsonGlobal) {
// A. Filtramos los datos completos por el contaminante seleccionado

// Comprobación de que llegan los datos
    if (!datosParaEsteAnio || datosParaEsteAnio.length === 0) {
        console.error("Los datos de excedencia están vacíos o undefined.");
        return;
    }
const datosFiltrados = datosParaEsteAnio.filter(d => d["Air Pollutant"] === contaminante);

// B. Creamos el mapa de datos 
const valoresPorZonaE = new Map(
  datosFiltrados.map(d => {

    
    const valorI = parseFloat(d["I"]); 
    

    return [
      d["AQ Zone Id"].trim().toUpperCase(),
      {
        excede: valorI > 1,
        valorI: valorI, 
        nombre: d["Geographical Name"]
      }
    ];
  })
);
    const featuresFiltradasE = geojsonGlobal.features.filter(f => {
      const zoneId = f.properties.ZoneId.trim().toUpperCase();
      return valoresPorZonaE.has(zoneId);
    });

    const projectionE = d3.geoMercator()
      .fitExtent([[20, 20], [widthE - 20, heightE - 20]], { type: "FeatureCollection", features: featuresFiltradasE });
    const pathE = d3.geoPath().projection(projectionE);

    const caminosE = grupoMapaE.selectAll(".zona-poligono-excedencia")
      .data(featuresFiltradasE, d => d.properties.ZoneId);

const paths = caminosE.join("path")
    .attr("class", "zona-poligono-excedencia");

// 2. Definimos los eventos en la selección 
paths
    .on("mouseover", function(event, d) {
        const zoneId = d.properties.ZoneId.trim().toUpperCase();
        const info = valoresPorZonaE.get(zoneId);
        if (!info) return; // Validación de seguridad
        tooltipE.style("display", "block")
            .html(`<b>Zona:</b> ${info.nombre}<br><b>¿Excede?:</b> ${info.excede ? "Sí" : "No"}`);
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
    })
    .on("mousemove", (event) => tooltipE.style("top", (event.pageY - 15) + "px").style("left", (event.pageX + 15) + "px"))
    .on("mouseout", function() {
        tooltipE.style("display", "none");
        d3.select(this).attr("stroke", "#333").attr("stroke-width", 0.3);
    });

// 3. Aplicamos la transición para los cambios visuales (color y forma)
paths.transition()
    .duration(400)
    .attr("d", pathE) 
    .attr("stroke", "#333")
    .attr("stroke-width", 0.3)
    .attr("fill", d => {
        const zoneId = d.properties.ZoneId.trim().toUpperCase();
        const info = valoresPorZonaE.get(zoneId);
        return info ? (info.excede ? "#de2d26" : "#2ca25f") : "#ccc";
    });
  }


  // === MANEJO DEL ZOOM ACTIVO ===
  const comportamientoZoomE = d3.zoom()
    .scaleExtent([1, 8]) // Límite de ampliación
    .translateExtent([[0, 0], [widthE, heightE]])
    .on("zoom", function(event) {
      
      grupoMapaE.attr("transform", event.transform);

    });

  svgE.call(comportamientoZoomE);
