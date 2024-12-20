const fs = require('fs');

/**
 * Carga un archivo JSON desde el disco.
 * Si el archivo no existe, retorna un objeto vacío.
 * @param {string} file - La ruta del archivo JSON.
 * @returns {Object} - El contenido del archivo JSON como un objeto.
 */
function loadJSON(file) {
  if (!fs.existsSync(file)) {
    console.warn(`El archivo ${file} no existe. Se devolverá un objeto vacío.`);
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    console.error(`Error al cargar el archivo JSON ${file}:`, error);
    return {};
  }
}

/**
 * Guarda datos en un archivo JSON en el disco.
 * Si el archivo no existe, lo crea.
 * @param {string} file - La ruta del archivo JSON.
 * @param {Object} data - Los datos que se guardarán en el archivo.
 */
function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Datos guardados correctamente en ${file}`);
  } catch (error) {
    console.error(`Error al guardar datos en ${file}:`, error);
  }
}

/**
 * Verifica si una clave existe en un objeto cargado de JSON.
 * @param {Object} jsonData - El objeto JSON cargado.
 * @param {string} key - La clave a verificar.
 * @returns {boolean} - `true` si la clave existe, `false` de lo contrario.
 */
function hasKey(jsonData, key) {
  return Object.prototype.hasOwnProperty.call(jsonData, key);
}

module.exports = { loadJSON, saveJSON, hasKey };