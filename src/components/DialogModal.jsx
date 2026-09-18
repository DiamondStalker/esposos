import React, { useEffect, useRef } from 'react';

// Wrapper reutilizable que usa <dialog> nativo con showModal(): foco atrapado,
// cierre con Escape y capa superior (top layer) sin gestionarlo a mano.
// El "clic afuera para cerrar" se implementa con un <button> real que cubre
// el diálogo (en vez de un onClick sobre el <dialog>, que no es interactivo),
// para que siga siendo accesible por teclado.
export default function DialogModal({
  titleId,
  ariaLabel,
  onClose,
  closeOnBackdropClick = false,
  className,
  children,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : ariaLabel}
    >
      {closeOnBackdropClick && (
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Cerrar"
          tabIndex={-1}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            padding: 0,
            margin: 0,
            background: 'transparent',
            cursor: 'default',
          }}
        />
      )}
      {children}
    </dialog>
  );
}
