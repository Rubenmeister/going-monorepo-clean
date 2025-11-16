import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

// Un tipo simple para 'type-hinting'
export type UUID = string;

// Un namespace/objeto para las funciones de utilidad
export const UUID = {
  generate: (): UUID => {
    return uuidv4();
  },
  isValid: (id: string): boolean => {
    return uuidValidate(id);
  }
};