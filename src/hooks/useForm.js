// frontend/src/hooks/useForm.js
import { useState, useCallback } from 'react';

/**
 * Hook pour la gestion d'un formulaire avec validation
 *
 * Usage :
 *   const form = useForm({
 *     initial: { name: '', email: '' },
 *     validate: (values) => ({ name: !values.name ? 'Requis' : null }),
 *   });
 *   form.values, form.errors, form.set('name', 'abc'), form.validate()
 */
export function useForm({ initial = {}, validate: validateFn = null } = {}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (touched[key]) {
      // Revalider si déjà touché
      if (validateFn) {
        const newErrors = validateFn({ ...values, [key]: value });
        setErrors(newErrors);
      }
    }
  }, [values, touched, validateFn]);

  const setMultiple = useCallback((patch) => {
    setValues((v) => ({ ...v, ...patch }));
  }, []);

  const setFieldTouched = useCallback((key) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const reset = useCallback((newValues = initial) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initial]);

  const validate = useCallback(() => {
    if (!validateFn) return true;
    const errs = validateFn(values);
    setErrors(errs);
    return !Object.values(errs).some((e) => e);
  }, [validateFn, values]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }, [validate, values]);

  return {
    values,
    errors,
    touched,
    submitting,
    set,
    setMultiple,
    setFieldTouched,
    reset,
    validate,
    handleSubmit,
  };
}