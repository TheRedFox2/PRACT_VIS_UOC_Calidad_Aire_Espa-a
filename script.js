const width = 800;
const height = 800;

const svg = d3.select("#mapa")
  .append("svg")
  .attr("width", width)
  .attr("height", height);


// Poner color de fondo fijo al inicio
svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#add8e6");

const grupoMapa = svg.append("g").attr("class", "grupo-mapa");
const tooltip = d3.select("#tooltip");


  // Escala de color base (Invertida: Verde limpio, Rojo contaminado)
  const color = d3.scaleLinear();

  // === CONFIGURACIÓN ESTÁTICA DE LA LEYENDA ===
  const leyendaG = svg.append("g")
    .attr("class", "leyenda")
    .attr("transform", `translate(${width - 220}, 30)`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  leyendaG.append("rect")
    .attr("width", 180)
    .attr("height", 15)
    .style("fill", "url(#linear-gradient)");

  const textoMin = leyendaG.append("text").attr("y", 30).attr("x", 0).style("text-anchor", "start");
  const textoMax = leyendaG.append("text").attr("y", 30).attr("x", 180).style("text-anchor", "end");
  const tituloLeyenda = leyendaG.append("text").attr("y", -8).attr("x", 90).style("text-anchor", "middle").style("font-weight", "bold").style("font-family", "sans-serif").style("font-size", "12px");


  // 🌟 FUNCIÓN MAESTRA: Se ejecuta cada vez que cambia el contaminante
  function actualizarMapa(contaminanteSeleccionado, datosParaEsteAnio, geojsonGlobal, criterio = "peores") {
    
// A. Filtrar o agrupar los datos
    let datosFiltrados = [];
    if (contaminanteSeleccionado === "Promedio") {
      const grupos = d3.group(datosParaEsteAnio, d => d["AQ Zone Id"].trim().toUpperCase());
      datosFiltrados = Array.from(grupos, ([id, registros]) => ({
        "AQ Zone Id": id,
        "I": d3.mean(registros, d => +d.I),
        "Geographical Name": registros[0]["Geographical Name"] ? registros[0]["Geographical Name"].trim() : "Promedio Zona"
      }));
    } else {
      datosFiltrados = datosParaEsteAnio.filter(d => d["Air Pollutant"] === contaminanteSeleccionado);
    }

    // B. Crear el diccionario SIEMPRE con la misma estructura
    const valoresPorZona = new Map(
      datosFiltrados.map(d => [
        d["AQ Zone Id"] ? d["AQ Zone Id"].trim().toUpperCase() : "", 
        {
          valor: +d.I,
          // 🌟 Aquí está la clave: usamos 'Geographical Name' que definimos arriba
          nombre: d["Geographical Name"] ? d["Geographical Name"].trim() : "Nombre no disponible"
        }
      ])
    );

    // C. Filtrar el GeoJSON para quedarnos solo con lo que se mide en este contaminante
    const featuresFiltradas = geojsonGlobal.features.filter(f => {
      const zoneId = f.properties.ZoneId ? f.properties.ZoneId.trim().toUpperCase() : "";
      return valoresPorZona.has(zoneId); 
    });
    

    // D. Ajustar la proyección a la geometría que ha sobrevivido
    const projection = d3.geoMercator()
      .fitExtent([[20, 20], [width - 20, height - 20]], {
        type: "FeatureCollection",
        features: featuresFiltradas 
      });

    const path = d3.geoPath().projection(projection);

    // E. Calcular los límites mínimos y máximos reales de este contaminante específico
    const valoresI = datosFiltrados.map(d => +d.I).filter(v => !isNaN(v));
    const minI = d3.min(valoresI) || 0;
    const maxI = d3.max(valoresI) || 10;

    color.domain([maxI,  minI + 1.0, minI])
    .range(["#de2d26", "#fec44f",  "#2ca25f",]);; // Mantenemos tu inversión para que verde sea el menor valor

    // F. Actualizar los números y textos de la leyenda
    tituloLeyenda.text(`Índice I (${contaminanteSeleccionado})`);
    textoMin.text(minI.toFixed(1));
    textoMax.text(maxI.toFixed(1));
    leyendaG.selectAll(".marca-uno").remove();

    // Solo dibujamos el indicador si el 1 está dentro del rango actual de datos
    if (minI <= 1.0 && maxI >= 1.0) {
      // Calculamos la posición X (entre 0 y 180 píxeles) usando interpolación lineal
      const porcentajeUno = (1.0 - minI) / (maxI - minI);
      const posicionXUno = porcentajeUno * 180;

      // Creamos un grupo contenedor para la línea y el texto del "1"
      const marcaUnoG = leyendaG.append("g")
        .attr("class", "marca-uno")
        .attr("transform", `translate(${posicionXUno}, 0)`);

      // Línea vertical que corta la barra de la leyenda
      marcaUnoG.append("line")
        .attr("y1", 0)
        .attr("y2", 15) // Altura de la barra
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2,2"); // Línea discontinua elegante

      // Texto "1.0" abajo de la línea
      marcaUnoG.append("text")
        .attr("x", 8) // Alineado con el Min y Max
        .attr("y", 15) // Alineado con el Min y Max
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .style("font-size", "11px")
        .text("1.0");
    }

    // Refrescar el degradado cromático de la barra de la leyenda
    const numParadas = 10;
    const arrayParadas = d3.range(numParadas).map(i => i / (numParadas - 1));
    linearGradient.selectAll("stop").remove();
    linearGradient.selectAll("stop")
      .data(arrayParadas)
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => color(minI + d * (maxI - minI)));

// G. DIBUJAR LOS POLÍGONOS DENTRO DEL CONTENEDOR DEL ZOOM
    const caminos = grupoMapa.selectAll(".zona-poligono")
      .data(featuresFiltradas, d => d.properties.ZoneId);

    caminos.join(
      enter => enter.append("path")
        .attr("class", "zona-poligono")
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.3)
        .call(enter => enter.transition().duration(400)
          .attr("fill", d => {
            const zoneId = d.properties.ZoneId ? d.properties.ZoneId.trim().toUpperCase() : "";
            const dataZona = valoresPorZona.get(zoneId);
            return dataZona ? color(dataZona.valor) : "#ccc"; // Gris si no tiene datos
          })),
      update => update
        .call(update => update.transition().duration(400)
          .attr("d", path)
          .attr("fill", d => {
            const zoneId = d.properties.ZoneId ? d.properties.ZoneId.trim().toUpperCase() : "";
            const dataZona = valoresPorZona.get(zoneId);
            return dataZona ? color(dataZona.valor) : "#ccc";
          })),
      exit => exit.remove()
    );

    // H. GESTIÓN DE EVENTOS DEL RATÓN (HOVER Y TOOLTIP)
    grupoMapa.selectAll(".zona-poligono")
      .on("mouseover", function(event, d) {
        const zoneId = d.properties.ZoneId ? d.properties.ZoneId.trim() : "Sin ID";
        const dataZona = valoresPorZona.get(zoneId.toUpperCase());
        
        // Si no está en el CSV, mostramos el nombre genérico del GeoJSON si existe
        const nombreGeografico = dataZona ? dataZona.nombre : (d.properties.Name || "Zona sin datos asignados");
        const valorI = dataZona ? dataZona.valor : undefined;
        const textoValor = valorI !== undefined && !isNaN(valorI) ? valorI.toFixed(2) : "Sin datos";

        // Resaltar barra correspondiente en el gráfico
        d3.selectAll(".barra")
        .filter(b => b["AQ Zone Id"] === zoneId)
        .attr("fill", "pink");

        tooltip.style("display", "block")
          .html(`
            <b>ID Zona:</b> ${zoneId}<br>
            <b>Nombre:</b> ${nombreGeografico}<br>
            <b>Índice I:</b> ${textoValor}
          `);
          
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 1.2);
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 15) + "px")
               .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
        d3.select(this)
          .attr("stroke", "#333")
          .attr("stroke-width", 0.3);

          // Restaurar color barra
        d3.selectAll(".barra")
        .attr("fill", b => color(b.I));
      });
    const datosParaGrafico = Array.from(valoresPorZona, ([id, obj]) => ({
        "AQ Zone Id": id,
        "I": obj.valor,
        "Geographical Name": obj.nombre
    }));

    actualizarGrafico(datosParaGrafico, criterio);
  }



  // === MANEJO DEL ZOOM ACTIVO ===
  const comportamientoZoom = d3.zoom()
    .scaleExtent([1, 8]) // Límite de ampliación
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", function(event) {
      // Aplica la matriz de transformación solo al grupo interno de los polígonos
      grupoMapa.attr("transform", event.transform);

    });

  svg.call(comportamientoZoom);


  // Variable global para el SVG del gráfico
const svgGrafico = d3.select("#grafico-barras")
    .append("svg").attr("width", 1100).attr("height", 880);

function actualizarGrafico(datosParaEsteAnio, criterio = "peores") {
    svgGrafico.selectAll("*").remove();
 // Lógica de ordenación dinámica
    let top;
    if (criterio === 'peores') {
        top = datosParaEsteAnio.sort((a, b) => b.I - a.I).slice(0, 50);
    } else {
        top = datosParaEsteAnio.sort((a, b) => a.I - b.I).slice(0, 50);
    }

    const margin = {top: 20, right: 0, bottom: 80, left: 290}; // Espacio para nombres
    const width = 850 - margin.left - margin.right;
    const height = 750 - margin.top - margin.bottom;

    const g = svgGrafico.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const y = d3.scaleBand().domain(top.map(d => d["Geographical Name"])).range([0, height]).padding(0.2);
    const x = d3.scaleLinear().domain([0, d3.max(top, d => d.I)]).range([0, width]);

    // Añadir Ejes
    g.append("g").call(d3.axisLeft(y));
    g.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));

// 1. Seleccionamos y hacemos el join
const barras = g.selectAll(".barra")
    .data(top, d => d["AQ Zone Id"]);

// 2. Definimos la selección "enter" y "update" combinada
const nuevasBarras = barras.join(
    enter => enter.append("rect")
        .attr("class", "barra")
        .attr("y", d => y(d["Geographical Name"]))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", d => color(d.I))
        .attr("pointer-events", "all") 
);

// 3. Definimos los eventos sobre la selección antes de la transición
nuevasBarras
    .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
            .html(`<b>Zona:</b> ${d["Geographical Name"]}<br><b>Valor I:</b> ${d.I.toFixed(2)}`);
        
        d3.select(this).attr("fill", "pink");
        d3.selectAll(".zona-poligono")
            .filter(p => p.properties.ZoneId.trim().toUpperCase() === d["AQ Zone Id"])
            .attr("stroke", "#000").attr("stroke-width", 2);
    })
    .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 15) + "px").style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", function(event, d) {
        tooltip.style("display", "none");
        d3.select(this).attr("fill", d => color(d.I));
        d3.selectAll(".zona-poligono").attr("stroke", "#333").attr("stroke-width", 0.3);
    });

// 4. Aplicamos la transición (esto no afectará a los eventos ya ligados)
nuevasBarras.transition()
    .duration(400)
    .attr("y", d => y(d["Geographical Name"]))
    .attr("width", d => x(d.I));
}


  // === CARGA INICIAL POR DEFECTO ===
  // actualizarMapa("Promedio");
