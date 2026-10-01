import { firmarContratoIngreso, desfirmarContratoIngreso, firmarCompraventaIngreso, desfirmarCompraventaIngreso } from "@/lib/api";
import { ResumenContrato } from "./contrato-resumen";
import { ContratoFormulario } from "./contrato-formulario";
import { ResumenCompraventa } from "./compraventa-resumen";
import { CompraventaFormulario } from "./compraventa-formulario";

// Qué contrato firma cada modalidad: cómo se resume, con qué formulario se
// carga y contra qué endpoint se firma. El legajo no pregunta por la modalidad:
// usa lo que diga esta tabla.

const CONSIGNACION = {
  Resumen: ResumenContrato,
  Formulario: ContratoFormulario,
  firmar: firmarContratoIngreso,
  desfirmar: desfirmarContratoIngreso,
};

const COMPRAVENTA = {
  Resumen: ResumenCompraventa,
  Formulario: CompraventaFormulario,
  firmar: firmarCompraventaIngreso,
  desfirmar: desfirmarCompraventaIngreso,
};

export const CONTRATOS = { consignacion: CONSIGNACION, compra: COMPRAVENTA, permuta: COMPRAVENTA };
