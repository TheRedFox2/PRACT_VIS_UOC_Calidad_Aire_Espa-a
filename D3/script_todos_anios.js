const anios = ["2020", "2021", "2022", "2023", "2024", "2025"];
const promesas = [d3.json("../output/zonas_calidad_aire_espana_limpio.geojson")];
let datosPorAnio = {};
let geojsonGlobal = null;

// Botones selección año
const btnMenos = document.getElementById("btn-menos");
const btnMas = document.getElementById("btn-mas");
const labelAnio = document.getElementById("label-anio");


btnMenos.addEventListener("click", () => {
    let actual = parseInt(estado.anio);
    if (actual > 2020) actualizarAnio(actual - 1);
});

btnMas.addEventListener("click", () => {
    let actual = parseInt(estado.anio);
    if (actual < 2025) actualizarAnio(actual + 1);
});



// Añadimos cada CSV a la lista de promesas
anios.forEach(anio => {
    promesas.push(d3.csv(`../output/datos_uso_calidad_aire_${anio}.csv`));
});


Promise.all(promesas).then(resultados => {
    geojsonGlobal = resultados[0];
    console.log("Resultados completos del Promise.all:", resultados);
    
    // Mapeamos los resultados a nuestro objeto de datos
    anios.forEach((anio, index) => {
        datosPorAnio[anio] = resultados[index + 1];
    });

    // Primera carga
    btnMenos.disabled = true; 
    btnMas.disabled = (estado.anio == "2025");

    renderizarTodo();
});


function actualizarAnio(nuevoAnio) {
    estado.anio = nuevoAnio;
    labelAnio.textContent = estado.anio;
    
    // Habilitar/Deshabilitar botones
    btnMenos.disabled = (estado.anio == "2020");
    btnMas.disabled = (estado.anio == "2025");
    
    renderizarTodo();
}


// Variable de estado global
const estado = {
    anio: "2020",
    contaminante: "Promedio",
    contaminante_exc: "NO2",
    criterio: "peores"
};


 // === NUEVA LÓGICA DE BOTONES ===
d3.selectAll(".btnC").on("click.contaminantes", function() {
    // 1. UI: Manejo de clase active
    d3.selectAll(".btnC").classed("active", false);
    d3.select(this).classed("active", true);
    
    // 2. Ejecutar la actualización específica de este mapa
    estado.contaminante = d3.select(this).attr("data-valor");
    renderizarTodo();
});

d3.selectAll(".btnE").on("click.excedencia", function() {
    const datosParaEsteAnio = datosPorAnio[estado.anio];
    // 1. UI: Manejo de clase active (esto lo hacen ambos, no pasa nada)
    d3.selectAll(".btnE").classed("active", false);
    d3.select(this).classed("active", true);
    
    estado.contaminante_exc = d3.select(this).attr("data-valor");
    actualizarMapaExcedencia(estado.contaminante_exc, datosParaEsteAnio, geojsonGlobal);
});

d3.selectAll(".button").on("click.contaminantes", function() {
    // 1. UI: Manejo de clase active
    d3.selectAll(".btnC").classed("active", false);
    d3.select(this).classed("active", true);
    
    // 2. Ejecutar la actualización específica de este mapa
    estado.criterio = d3.select(this).attr("data-valor");
    renderizarTodo();
});

// Función maestra de refresco
function renderizarTodo() {
    // 1. Obtener los datos del año seleccionado
    let datosParaEsteAnio = datosPorAnio[estado.anio];

    console.log("Año actual en estado:", estado.anio);
    console.log("Tamaño original del array:", datosParaEsteAnio ? datosParaEsteAnio.length : "No hay datos");

    if (estado.anio === 2024) {
        console.log("Entrando en el IF de 2024...");
        const antes = datosParaEsteAnio.length;
        
        datosParaEsteAnio = datosParaEsteAnio.filter(d => d["AQ Zone Id"] !== "ZON_ES1416");
        
        const despues = datosParaEsteAnio.length;
        console.log("Filtro aplicado. Eliminados:", antes - despues);
        console.log("Nuevo tamaño:", despues);
    } else {
        console.log("No estamos en 2024, no se filtra nada.");
    }
    // 2. Actualizar el Mapa y el grafico
    actualizarMapa(estado.contaminante, datosParaEsteAnio, geojsonGlobal, estado.criterio);

    // Actualizar mapa excedencia
    actualizarMapaExcedencia(estado.contaminante_exc, datosParaEsteAnio, geojsonGlobal);

    // Actualizar Donut y Grafica

    const datosAgrupadosG = d3.rollup(datosParaEsteAnio, 
        v => ({
            exceden: v.filter(d => parseFloat(d.I) > 1).length,
            cumplen: v.filter(d => parseFloat(d.I) <= 1).length
        }), 
        d => d["Protection Target"]
    );
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

    const dataOrdenados = [...datosLimpios].sort((a, b) => {
        return ordenDeseado_ES.indexOf(a.label) - ordenDeseado_ES.indexOf(b.label);
    });

    dibujarBarrasApiladas(dataOrdenados);

    // Graficas evolutivas
    prepararDatosEvolucion();

}


// Evolución de la contaminación

async function prepararDatosEvolucion() {
    const archivos = [2020, 2021, 2022, 2023, 2024, 2025];
    let dataGlobal = [];
    let todosLosDatos = [];

    for (const anio of archivos) {
        const data = await d3.csv(`../output/datos_uso_calidad_aire_${anio}.csv`);
        
        // Calculamos promedios por archivo
        const promedioI = d3.mean(data, d => parseFloat(d.I));
        
        // Agrupamos por contaminante para tener múltiples líneas
        const porContaminante = d3.rollup(data, 
            v => d3.mean(v, d => parseFloat(d["Air Pollution Level"])), 
            d => d["Air Pollutant"]
        );

        dataGlobal.push({ anio, promedioI, contaminantes: porContaminante });
        todosLosDatos = todosLosDatos.concat(data);
    }
    dibujarEvolucionI(dataGlobal);

        const datosContaminantes = d3.rollup(todosLosDatos, 
    v => d3.mean(v, d => d["Air Pollution Level"]), 
    d => d.Year, 
    d => d["Air Pollutant"]
);

    let dataArray = Array.from(datosContaminantes, ([year, valores]) => ({
        year: year,
        valores: Object.fromEntries(valores) // Convertimos el rollup interno a un objeto simple
    }));

    // Normalizar datos
    const base2020 = dataArray.find(d => d.year === "2020")?.valores || {};
    dataArray = dataArray.map(d => ({
    year: d.year,
    valores: Object.fromEntries(
        Object.entries(d.valores).map(([contaminante, valor]) => [
            contaminante, 
            (valor / (base2020[contaminante] || 1)) * 100 
        ])
    )
}));

    dibujarLineasContaminantes(dataArray);

}


function dibujarEvolucionI(data) {
    const svg = d3.select("#line-chart");
    svg.selectAll("*").remove();

    const width = 800, height = 600;
    const margin = { top: 40, right: 60, bottom: 50, left: 60 };

    const x = d3.scalePoint()
        .domain(data.map(d => d.anio))
        .range([margin.left, width - margin.right]);

    // Usamos .nice() para que el eje sea más limpio
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.promedioI) * 1.2])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // 1. DIBUJAR GRID
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(- (width - margin.left - margin.right)).tickFormat(""))
        .style("stroke-dasharray", "3,3")
        .style("stroke", "#e0e0e0");

    svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""))
    .style("stroke-dasharray", "3,3")
    .style("stroke", "#e0e0e0");

    // La línea
    const linea = d3.line()
        .x(d => x(d.anio))
        .y(d => y(d.promedioI));

    // Dibujar la línea
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#2563eb") // Azul institucional
        .attr("stroke-width", 4)
        .attr("d", linea);

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Etiqueta del título en el gráfico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Tendencia histórica del Índice I")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    // 3. LEYENDA
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 150}, ${margin.top - 20})`);

    legend.append("line")
        .attr("x1", 0).attr("x2", 20)
        .attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 3);

    legend.append("text")
        .attr("x", 25).attr("y", 5)
        .text("Promedio Índice I")
        .style("font-size", "14px");
}


// Agrupamos los datos por año y por contaminante




function dibujarLineasContaminantes(data) {
    const svg = d3.select("#line-chart-contaminantes"); 
    svg.selectAll("*").remove(); // Limpiar antes de dibujar

    const width = 800, height = 600;
    const margin = { top: 40, right: 100, bottom: 50, left: 60 };

    // Escala X: Años
    const x = d3.scalePoint()
        .domain(data.map(d => d.year))
        .range([margin.left, width - margin.right]);

    // Escala Y: Debe ser el máximo valor encontrado entre todos los contaminantes
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(Object.values(d.valores)))])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const listaContaminantes = ["NO2", "O3", "PM10", "SO2"];

    // 1. DIBUJAR GRID
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(- (width - margin.left - margin.right)).tickFormat(""))
        .style("stroke-dasharray", "3,3")
        .style("stroke", "#e0e0e0");

    svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""))
    .style("stroke-dasharray", "3,3")
    .style("stroke", "#e0e0e0");


    // Dibujar cada línea
    listaContaminantes.forEach(c => {
        const linea = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.valores[c] || 0)); // Si falta un valor, usa 0

        svg.append("path")
            .datum(data)
            .attr("class", "linea-contaminante")
            .attr("fill", "none")
            .attr("stroke", color(c))
            .attr("stroke-width", 3)
            .attr("d", linea);
    });

    // Añadir Ejes
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));



// 2. LEYENDA INTEGRADA DINÁMICA
    const leyenda = svg.append("g").attr("transform", `translate(${width - 240}, ${margin.top})`);

    // Calcular el gran total para los porcentajes
    const granTotal = d3.sum(data, d => d3.sum(Object.values(d.valores)));

    listaContaminantes.forEach((c, i) => {
        const totalContaminante = d3.sum(data, d => d.valores[c] || 0);
        const porcentaje = ((totalContaminante / granTotal) * 100).toFixed(1);

        const fila = leyenda.append("g").attr("transform", `translate(0, ${i * 40})`);

        fila.append("rect").attr("width", 15).attr("x", 165).attr("height", 15).attr("fill", color(c));
        
        fila.append("text")
            .attr("x", 195).attr("y", 12)
            .text(`${c}`) 
            .style("font-size", "14px").style("alignment-baseline", "middle");
    });
}