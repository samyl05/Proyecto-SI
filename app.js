// Manejo interactivo de los botones y filtros de la interfaz
document.getElementById('filtroGrade').addEventListener('change', function(e) {
    const valorSeleccionado = e.target.value;
    document.getElementById('vistaFiltro').innerText = valorSeleccionado;
    console.log(`Filtrando BI por grado: ${valorSeleccionado}`);
});