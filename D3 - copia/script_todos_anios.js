const anios = ["2020", "2021", "2022", "2023", "2024", "2025"];
const promesas = [d3.json("../output/zonas_calidad_aire_espana_limpio.geojson")];

// Añadimos cada CSV a la lista de promesas
anios.forEach(anio => {
    promesas.push(d3.csv(`../output/datos_uso_calidad_aire_${anio}.csv`));
});

Promise.all(promesas).then(resultados => {
    const geojson = resultados[0];
    const datosPorAnio = {};
    
    // Mapeamos los resultados a nuestro objeto de datos
    anios.forEach((anio, index) => {
        datosPorAnio[anio] = resultados[index + 1];
    });

    // Ahora inicializas tus listeners:
    d3.select("#slider-anio").on("input", function() {
        estado.anio = this.value;
        d3.select("#valor-anio").text(estado.anio);
        renderizarTodo(); 
    });
});


// Variable de estado global
const estado = {
    anio: "2020",
    contaminante: "Promedio"
};

// Función maestra de refresco
function renderizarTodo() {
    // 1. Obtener los datos del año seleccionado
    const datosParaEsteAnio = datosPorAnio[estado.anio];
    
    // 2. Actualizar el Mapa
    actualizarMapa(estado.contaminante, datosParaEsteAnio);
    
    // 3. Actualizar el Gráfico
    // (Asegúrate de que actualizarGrafico reciba los datos filtrados)
    actualizarGrafico(datosParaEsteAnio, estado.contaminante);
}





