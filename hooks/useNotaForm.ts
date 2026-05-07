import { useEffect, useState } from "react";
import {
  createNotaSchema,
  updateNotaSchema,
  type CreateNotaInput,
  type UpdateNotaInput,
} from "../schemas/nota.schema";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  defaultValues?: { titulo: string; contenido: string };
  onSubmit: (data: CreateNotaInput | UpdateNotaInput) => Promise<void>;
}

export const useNotaForm = ({ mode, defaultValues, onSubmit }: Props) => {
  const [titulo, setTitulo] = useState(defaultValues?.titulo ?? "");
  const [contenido, setContenido] = useState(defaultValues?.contenido ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultValues) {
      setTitulo(defaultValues.titulo);
      setContenido(defaultValues.contenido);
    }
  }, [defaultValues]);

  const handleSubmit = async () => {
    const schema = mode === "create" ? createNotaSchema : updateNotaSchema;
    const data =
      mode === "create" ? { titulo, contenido } : { titulo, contenido };

    const result = schema.safeParse(data);

    if (!result.success) {
      const flat = result.error.flatten();
      setErrores({
        titulo: flat.fieldErrors.titulo?.[0] ?? "",
        contenido: flat.fieldErrors.contenido?.[0] ?? "",
      });
      return;
    }

    setErrores({});
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    titulo,
    setTitulo,
    contenido,
    setContenido,
    errores,
    submitting,
    handleSubmit,
  };
};
