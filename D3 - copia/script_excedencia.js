// script_excedencia.js

const widthE = 800;
const heightE = 600; // Ajustado a la altura real del SVG

const svgE = d3.select("#mapa-excedencia") // Asegúrate de tener este ID en el HTML
  .append("svg")
  .attr("width", widthE)
  .attr("height", heightE);

// Fondo del mapa
svgE.append("rect")
  .attr("width", widthE)
  .attr("height", heightE)
  .attr("fill", "#add8e6");

const grupoMapaE = svgE.append("g").attr("class", "grupo-mapa-excedencia");
const tooltipE = d3.select("#tooltip");

// Escala categórica
const colorExcedenciaE = d3.scaleOrdinal()
  .domain(["No", "Yes"]) 
  .range(["#2ca25f", "#de2d26"]); 

// Leyenda Estática
const leyendaGE = svgE.append("g")
  .attr("class", "leyenda-excedencia")
  .attr("transform", `translate(${widthE - 200}, 30)`);

leyendaGE.append("text").attr("y", -10).attr("x", 40).style("font-weight", "bold").text("¿Excede normativa?");

const itemsE = [{text: "Cumple", color: "#2ca25f"}, {text: "Excede", color: "#de2d26"}];
itemsE.forEach((item, i) => {
    leyendaGE.append("rect").attr("y", i * 20).attr("width", 15).attr("height", 15).attr("fill", item.color);
    leyendaGE.append("text").attr("y", i * 20 + 12).attr("x", 20).text(item.text).style("font-size", "12px");
});

Promise.all([
  d3.json("../output/zonas_calidad_aire_espana_limpio.geojson"),
  d3.csv("../output/datos_uso_calidad_aire_2025.csv")
]).then(([geojsonE, datosCompletosE]) => {

  function actualizarMapaExcedencia(contaminante) {
// A. Filtramos los datos completos por el contaminante seleccionado
const datosFiltrados = datosCompletosE.filter(d => d["Air Pollutant"] === contaminante);

// B. Creamos el mapa de datos (Map) usando la lógica de umbral (I > 1)
const valoresPorZonaE = new Map(
  datosFiltrados.map(d => {
    // 1. Convertimos el valor de la columna que contiene tu índice a número
    // Asegúrate de que el nombre "IndiceI" sea igual al que aparece en tu CSV
    const valorI = parseFloat(d["I"]); 
    
    // 2. Definimos 'excede' como un booleano (true si > 1, false si <= 1)
    return [
      d["AQ Zone Id"].trim().toUpperCase(),
      {
        excede: valorI > 1,
        valorI: valorI, // Guardamos el valor por si quieres mostrarlo en el tooltip
        nombre: d["Geographical Name"]
      }
    ];
  })
);
    const featuresFiltradasE = geojsonE.features.filter(f => {
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

// 2. Definimos los eventos en la selección (NO en la transición)
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
    .attr("d", pathE) // Esto anima el cambio de forma si la proyección cambia
    .attr("stroke", "#333")
    .attr("stroke-width", 0.3)
    .attr("fill", d => {
        const zoneId = d.properties.ZoneId.trim().toUpperCase();
        const info = valoresPorZonaE.get(zoneId);
        return info ? (info.excede ? "#de2d26" : "#2ca25f") : "#ccc";
    });
  }

  actualizarMapaExcedencia("NO2");


d3.selectAll(".btnE").on("click.excedencia", function() {
    // 1. UI: Manejo de clase active (esto lo hacen ambos, no pasa nada)
    d3.selectAll(".btnE").classed("active", false);
    d3.select(this).classed("active", true);
    
    // 2. Ejecutar la actualización específica de este mapa
    const contaminante = d3.select(this).attr("data-valor");
    actualizarMapaExcedencia(contaminante); 
});
  // === MANEJO DEL ZOOM ACTIVO ===
  const comportamientoZoomE = d3.zoom()
    .scaleExtent([1, 8]) // Límite de ampliación
    .translateExtent([[0, 0], [widthE, heightE]])
    .on("zoom", function(event) {
      // Aplica la matriz de transformación solo al grupo interno de los polígonos
      grupoMapaE.attr("transform", event.transform);

    });

  svgE.call(comportamientoZoomE);
});


