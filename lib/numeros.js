// Números enteros (precios y kilómetros) que se ven con puntos de miles
// mientras se tipean, pero que se guardan como la tira de dígitos de siempre.

// "1000000" → "1.000.000". Solo para mostrar.
export const conPuntosDeMiles = (digitos) => String(digitos ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Lo que escribió el usuario, sin nada que no sea dígito: "1.000.0005" → "10000005".
export const soloDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

// El valor que llega al campo: el estado del formulario (ya en dígitos) o un
// número que vino de la base. Si trae decimales ("12500000.5") se redondea en
// vez de pegar los centavos a los enteros.
export const aDigitos = (valor) => {
  const crudo = String(valor ?? "");
  return /^\d+\.\d+$/.test(crudo) ? String(Math.round(Number(crudo))) : soloDigitos(crudo);
};
